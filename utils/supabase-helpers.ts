import { supabase } from "@/lib/supabase"
import type { Movie, SupabaseUser, SupabaseMatch, Invitation, SwipeSession } from "@/types"

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

  return { success: true, session }
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
