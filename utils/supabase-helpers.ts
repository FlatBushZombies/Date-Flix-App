import { supabase } from "@/lib/supabase"
import type { Movie, SupabaseUser, SupabaseMatch, Invitation, SwipeSession, AppNotification } from "@/types"

// User Management
export const syncUserWithSupabase = async (clerkUser: any) => {
  console.log("[v0] Syncing user with Supabase:", clerkUser.id)

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: clerkUser.id,
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        username: clerkUser.username,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        image_url: clerkUser.imageUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "clerk_id",
      },
    )
    .select()
    .single()

  if (error) {
    console.error("[v0] Error syncing user:", error)
    return null
  }

  console.log("[v0] User synced successfully:", data.id)
  return data as SupabaseUser
}

// Swipe Management
export const saveSwipe = async (userId: string, movieId: number, liked: boolean, movieData: Movie) => {
  console.log("[v0] Attempting to save swipe:", { userId, movieId, liked })

  // First ensure user exists in Supabase
  const { data: userExists } = await supabase.from("users").select("id").eq("id", userId).single()

  if (!userExists) {
    console.error("[v0] User not found in Supabase:", userId)
    return null
  }

  console.log("[v0] User exists, saving swipe...")

  const { data, error } = await supabase
    .from("swipes")
    .insert({
      user_id: userId,
      movie_id: movieId,
      liked,
      movie_data: movieData,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error saving swipe:", JSON.stringify(error))
    console.error("[v0] Full error object:", error)
    return null
  }

  console.log("[v0] Swipe saved successfully:", data.id)

  // Check for matches if liked
  if (liked) {
    await checkForMatch(userId, movieId, movieData)
  }

  return data
}

// Match Detection
export const checkForMatch = async (userId: string, movieId: number, movieData: Movie) => {
  // Get active swipe sessions for this user
  const { data: sessions } = await supabase
    .from("swipe_sessions")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("is_active", true)

  if (!sessions || sessions.length === 0) return null

  // Check each session partner
  for (const session of sessions) {
    const partnerId = session.user1_id === userId ? session.user2_id : session.user1_id

    // Check if partner also liked this movie
    const { data: partnerSwipe } = await supabase
      .from("swipes")
      .select("*")
      .eq("user_id", partnerId)
      .eq("movie_id", movieId)
      .eq("liked", true)
      .single()

    if (partnerSwipe) {
      // Create match
      const { data: match, error } = await supabase
        .from("matches")
        .insert({
          movie_id: movieId,
          user1_id: userId,
          user2_id: partnerId,
          movie_data: movieData,
        })
        .select()
        .single()

      if (!error) {
        // Create notifications for both users (best-effort)
        await Promise.allSettled([
          createNotification(userId, {
            type: "movie_matched",
            title: "It's a match! 💞",
            body: `You both liked "${movieData.title}".`,
            data: { movieId, matchId: match.id, partnerId },
          }),
          createNotification(partnerId, {
            type: "movie_matched",
            title: "It's a match! 💞",
            body: `You both liked "${movieData.title}".`,
            data: { movieId, matchId: match.id, partnerId: userId },
          }),
        ])
        return match
      }
    }
  }

  return null
}

// Get User Matches
export const getUserMatches = async (userId: string) => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      user1:users!matches_user1_id_fkey(*),
      user2:users!matches_user2_id_fkey(*)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("matched_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching matches:", error)
    return []
  }

  return data as (SupabaseMatch & { user1: SupabaseUser; user2: SupabaseUser })[]
}

// Invitation Management
export const createInvitation = async (senderId: string, recipientEmail?: string) => {
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      sender_id: senderId,
      recipient_email: recipientEmail,
      invite_code: inviteCode,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating invitation:", error)
    return null
  }

  return data as Invitation
}

export const acceptInvitation = async (inviteCode: string, userId: string) => {
  // Get invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "pending")
    .single()

  if (fetchError || !invitation) {
    return { success: false, error: "Invalid or expired invitation" }
  }

  // Check expiry
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await supabase.from("invitations").update({ status: "expired" }).eq("id", invitation.id)
    return { success: false, error: "Invitation has expired" }
  }

  // Update invitation
  const { error: updateError } = await supabase
    .from("invitations")
    .update({
      recipient_id: userId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id)

  if (updateError) {
    return { success: false, error: "Failed to accept invitation" }
  }

  // Create swipe session
  const { data: session, error: sessionError } = await supabase
    .from("swipe_sessions")
    .insert({
      user1_id: invitation.sender_id,
      user2_id: userId,
      is_active: true,
    })
    .select()
    .single()

  if (sessionError) {
    return { success: false, error: "Failed to create session" }
  }

  // Notify the sender that someone joined (best-effort)
  await Promise.allSettled([
    createNotification(invitation.sender_id, {
      type: "session_joined",
      title: "Someone joined your session",
      body: "Your friend joined your swipe session. Start swiping together!",
      data: { sessionId: session.id, userId },
    }),
    createNotification(userId, {
      type: "session_joined",
      title: "Session joined",
      body: "You're now swiping together. Good luck matching!",
      data: { sessionId: session.id, userId: invitation.sender_id },
    }),
  ])

  return { success: true, session }
}

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[v0] Error fetching notifications:", error)
    return []
  }

  return data as AppNotification[]
}

export const getUnreadNotificationCount = async (userId: string) => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null)

  if (error) {
    console.error("[v0] Error counting notifications:", error)
    return 0
  }

  return count || 0
}

export const markAllNotificationsRead = async (userId: string) => {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)

  if (error) {
    console.error("[v0] Error marking notifications read:", error)
    return false
  }
  return true
}

export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)

  if (error) {
    console.error("[v0] Error marking notification read:", error)
    return false
  }
  return true
}

export const createNotification = async (
  userId: string,
  payload: Pick<AppNotification, "type" | "title" | "body" | "data">,
) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating notification:", error)
    return null
  }
  return data as AppNotification
}

export const getUserInvitations = async (userId: string) => {
  const { data, error } = await supabase
    .from("invitations")
    .select(`
      *,
      sender:users!invitations_sender_id_fkey(*)
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching invitations:", error)
    return []
  }

  return data as (Invitation & { sender: SupabaseUser })[]
}

// Get Active Swipe Sessions
export const getActiveSwipeSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from("swipe_sessions")
    .select(`
      *,
      user1:users!swipe_sessions_user1_id_fkey(*),
      user2:users!swipe_sessions_user2_id_fkey(*)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching sessions:", error)
    return []
  }

  return data as (SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]
}

// Get User Stats
export const getUserStats = async (userId: string) => {
  const [swipesResult, matchesResult, sessionsResult] = await Promise.all([
    supabase.from("swipes").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    supabase
      .from("swipe_sessions")
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq("is_active", true),
  ])

  return {
    totalSwipes: swipesResult.count || 0,
    totalMatches: matchesResult.count || 0,
    activeSessions: sessionsResult.count || 0,
  }
}

// ==================== DEBATE SESSION FUNCTIONS ====================

import type { DebateSession, AIVerdict } from "@/types"

// Generate unique debate code
const generateDebateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Create a new debate session
export const createDebateSession = async (hostId: string, partnerEmail: string) => {
  const code = generateDebateCode()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

  const { data, error } = await supabase
    .from("debate_sessions")
    .insert({
      code,
      host_id: hostId,
      partner_email: partnerEmail,
      status: "waiting",
      expires_at: expiresAt.toISOString(),
    })
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*)
    `)
    .single()

  if (error) {
    console.error("[v0] Error creating debate session:", error)
    return null
  }

  return data as DebateSession
}

// Send debate invite email via Supabase Edge Function
export const sendDebateInviteEmail = async (
  hostName: string,
  partnerEmail: string,
  debateCode: string
) => {
  // Use Supabase's built-in email or call an edge function
  const { data, error } = await supabase.functions.invoke("clever-task", {
    body: {
      to: partnerEmail,
      hostName,
      debateCode,
      subject: `${hostName} wants to settle a movie debate with you!`,
    },
  })

  if (error) {
    console.error("[v0] Error sending invite email:", error)
    return false
  }

  return !!(data && typeof data === "object" && "sent" in (data as any) && (data as any).sent === true)
}

// Join debate session with code
export const joinDebateSession = async (code: string, userId: string) => {
  // First, find the session
  const { data: session, error: fetchError } = await supabase
    .from("debate_sessions")
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*)
    `)
    .eq("code", code.toUpperCase())
    .single()

  if (fetchError || !session) {
    return { success: false, error: "Invalid code. Please check and try again." }
  }

  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    return { success: false, error: "This debate session has expired." }
  }

  // Check if already has a partner
  if (session.partner_id && session.partner_id !== userId) {
    return { success: false, error: "This session already has two participants." }
  }

  // Check if user is the host (can't join own session)
  if (session.host_id === userId) {
    return { success: false, error: "You can't join your own debate session!" }
  }

  // Update session with partner
  const { data: updatedSession, error: updateError } = await supabase
    .from("debate_sessions")
    .update({
      partner_id: userId,
      status: "both_joined",
    })
    .eq("id", session.id)
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*),
      partner:users!debate_sessions_partner_id_fkey(*)
    `)
    .single()

  if (updateError) {
    return { success: false, error: "Failed to join session." }
  }

  return { success: true, session: updatedSession as DebateSession }
}

// Get debate session by code
export const getDebateSessionByCode = async (code: string) => {
  const { data, error } = await supabase
    .from("debate_sessions")
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*),
      partner:users!debate_sessions_partner_id_fkey(*)
    `)
    .eq("code", code.toUpperCase())
    .single()

  if (error) {
    return null
  }

  return data as DebateSession
}

// Get user's active debate sessions
export const getUserDebateSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from("debate_sessions")
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*),
      partner:users!debate_sessions_partner_id_fkey(*)
    `)
    .or(`host_id.eq.${userId},partner_id.eq.${userId}`)
    .neq("status", "settled")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching debate sessions:", error)
    return []
  }

  return data as DebateSession[]
}

// Submit preferences for debate
export const submitDebatePreferences = async (
  sessionId: string,
  userId: string,
  preferences: string,
  isHost: boolean
) => {
  const updateField = isHost ? "host_preferences" : "partner_preferences"
  const newStatus = isHost ? "host_ready" : "partner_ready"

  // Get current session to check status
  const { data: current } = await supabase
    .from("debate_sessions")
    .select("status, host_preferences, partner_preferences")
    .eq("id", sessionId)
    .single()

  // Determine final status
  let finalStatus = newStatus
  if (current) {
    if (isHost && current.partner_preferences) {
      finalStatus = "settling"
    } else if (!isHost && current.host_preferences) {
      finalStatus = "settling"
    }
  }

  const { data, error } = await supabase
    .from("debate_sessions")
    .update({
      [updateField]: preferences,
      status: finalStatus,
    })
    .eq("id", sessionId)
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*),
      partner:users!debate_sessions_partner_id_fkey(*)
    `)
    .single()

  if (error) {
    console.error("[v0] Error submitting preferences:", error)
    return null
  }

  return data as DebateSession
}

// Save AI verdict
export const saveDebateVerdict = async (sessionId: string, verdict: AIVerdict) => {
  const { data, error } = await supabase
    .from("debate_sessions")
    .update({
      ai_verdict: verdict,
      status: "settled",
    })
    .eq("id", sessionId)
    .select(`
      *,
      host:users!debate_sessions_host_id_fkey(*),
      partner:users!debate_sessions_partner_id_fkey(*)
    `)
    .single()

  if (error) {
    console.error("[v0] Error saving verdict:", error)
    return null
  }

  return data as DebateSession
}
