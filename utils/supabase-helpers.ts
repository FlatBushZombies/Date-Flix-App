import { supabase } from "@/lib/supabase"
import type {
  AppNotification,
  Invitation,
  Movie,
  SessionStreak,
  StreakEvaluation,
  SupabaseMatch,
  SupabaseUser,
  SwipeSession,
} from "@/types"
import { getUserPushToken, sendPushNotification } from "@/utils/notifications"
import { STREAK_MILESTONES, streakEventCopy } from "@/utils/streakCopy"

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

  // Evaluate couple streaks for every active session this user is part of —
  // a pass still counts as "showing up today", so this runs regardless of `liked`.
  const streakEvaluations: { sessionId: string; evaluation: StreakEvaluation }[] = []
  try {
    const sessions = await getActiveSwipeSessions(userId)
    for (const session of sessions) {
      const evaluation = await refreshSessionStreak(session)
      streakEvaluations.push({ sessionId: session.id, evaluation })
    }
  } catch (streakError) {
    console.error("[v0] Error evaluating session streak:", streakError)
  }

  return { ...data, streakEvaluations }
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
// Returns null on fetch failure (distinct from a genuinely empty match list)
// so callers can show a real error state instead of a false "no matches" one.
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
    return null
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

// Returns null on fetch failure (distinct from a genuinely empty inbox) so
// the UI can show a real error state instead of a false "all caught up" one.
export const getNotifications = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[v0] Error fetching notifications:", error)
    return null
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

  // Send push notification if user has a push token
  try {
    const pushToken = await getUserPushToken(userId)
    if (pushToken) {
      await sendPushNotification(pushToken, payload.title, payload.body, payload.data)
    }
  } catch (pushError) {
    console.error("[v0] Error sending push notification:", pushError)
    // Don't fail the whole operation if push notification fails
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

// Delete a swipe session
export const deleteSwipeSession = async (sessionId: string) => {
  try {
    const { error } = await supabase
      .from("swipe_sessions")
      .delete()
      .eq("id", sessionId)

    if (error) {
      console.error("[v0] Error deleting session:", error)
      throw new Error("Failed to delete session")
    }

    console.log("[v0] Successfully deleted swipe session:", sessionId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete session failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// ==================== STREAKS ====================
// A streak tracks consecutive calendar days on which BOTH partners of a
// swipe_session swiped (like or pass — showing up is what counts).

const todayUTC = () => new Date().toISOString().slice(0, 10)

const addDaysUTC = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const hasSwipedOn = async (userId: string, dateStr: string) => {
  const start = `${dateStr}T00:00:00.000Z`
  const end = `${addDaysUTC(dateStr, 1)}T00:00:00.000Z`
  const { count } = await supabase
    .from("swipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start)
    .lt("created_at", end)
  return (count || 0) > 0
}

const getOrCreateSessionStreak = async (sessionId: string): Promise<SessionStreak> => {
  const { data } = await supabase
    .from("session_streaks")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle()

  if (data) return data as SessionStreak

  const { data: created, error } = await supabase
    .from("session_streaks")
    .insert({ session_id: sessionId })
    .select()
    .single()

  if (error) {
    // Row may have been created concurrently by the partner's client — re-read.
    const { data: existing } = await supabase
      .from("session_streaks")
      .select("*")
      .eq("session_id", sessionId)
      .single()
    return existing as SessionStreak
  }

  return created as SessionStreak
}

// Grants one free Streak Freeze per calendar month (caps at 1 — not stackable).
// Runs before evaluation so a freeze is available the moment a new month starts,
// even if the couple hasn't swiped yet.
const applyMonthlyFreezeRefresh = async (streakRow: SessionStreak): Promise<SessionStreak> => {
  const currentMonth = todayUTC().slice(0, 7)
  const refreshedMonth = streakRow.freeze_refreshed_at?.slice(0, 7)
  if (refreshedMonth === currentMonth) return streakRow

  const { data } = await supabase
    .from("session_streaks")
    .update({
      freeze_available: 1,
      freeze_refreshed_at: todayUTC(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", streakRow.id)
    .select()
    .single()

  return (data as SessionStreak | null) ?? { ...streakRow, freeze_available: 1, freeze_refreshed_at: todayUTC() }
}

// Client-computed, best-effort — same tradeoff as checkForMatch. A rare
// double-fire from near-simultaneous swipes just means a duplicate
// notification, not a correctness bug (only two users share a session).
export const evaluateSessionStreak = async (
  sessionId: string,
  user1Id: string,
  user2Id: string,
): Promise<StreakEvaluation> => {
  let streakRow = await getOrCreateSessionStreak(sessionId)
  streakRow = await applyMonthlyFreezeRefresh(streakRow)
  const today = todayUTC()
  const yesterday = addDaysUTC(today, -1)

  const [user1SwipedToday, user2SwipedToday] = await Promise.all([
    hasSwipedOn(user1Id, today),
    hasSwipedOn(user2Id, today),
  ])

  const bothActiveToday = user1SwipedToday && user2SwipedToday

  if (bothActiveToday) {
    if (streakRow.last_both_active_date === today) {
      return {
        currentStreak: streakRow.current_streak,
        longestStreak: streakRow.longest_streak,
        event: "none",
        freezeAvailable: streakRow.freeze_available,
        user1SwipedToday,
        user2SwipedToday,
      }
    }

    const newStreak = streakRow.last_both_active_date === yesterday ? streakRow.current_streak + 1 : 1
    const newLongest = Math.max(streakRow.longest_streak, newStreak)

    await supabase
      .from("session_streaks")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_both_active_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", streakRow.id)

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      event: (STREAK_MILESTONES as readonly number[]).includes(newStreak) ? "milestone" : "increment",
      freezeAvailable: streakRow.freeze_available,
      user1SwipedToday,
      user2SwipedToday,
    }
  }

  if (
    streakRow.last_both_active_date &&
    streakRow.last_both_active_date < yesterday &&
    streakRow.current_streak > 0
  ) {
    // A free Streak Freeze covers the missed day instead of resetting to 0.
    if (streakRow.freeze_available > 0) {
      const { data } = await supabase
        .from("session_streaks")
        .update({
          freeze_available: streakRow.freeze_available - 1,
          last_both_active_date: yesterday,
          updated_at: new Date().toISOString(),
        })
        .eq("id", streakRow.id)
        .select()
        .single()

      return {
        currentStreak: streakRow.current_streak,
        longestStreak: streakRow.longest_streak,
        event: "frozen",
        freezeAvailable: (data as SessionStreak | null)?.freeze_available ?? streakRow.freeze_available - 1,
        user1SwipedToday,
        user2SwipedToday,
      }
    }

    const previousStreak = streakRow.current_streak
    await supabase
      .from("session_streaks")
      .update({ current_streak: 0, updated_at: new Date().toISOString() })
      .eq("id", streakRow.id)

    return {
      currentStreak: 0,
      longestStreak: streakRow.longest_streak,
      event: "broken",
      previousStreak,
      freezeAvailable: streakRow.freeze_available,
      user1SwipedToday,
      user2SwipedToday,
    }
  }

  return {
    currentStreak: streakRow.current_streak,
    longestStreak: streakRow.longest_streak,
    event: "none",
    freezeAvailable: streakRow.freeze_available,
    user1SwipedToday,
    user2SwipedToday,
  }
}

// Last N days of shared activity for a session, oldest first — powers the streak modal's day strip.
export const getSessionActivityStrip = async (
  user1Id: string,
  user2Id: string,
  days = 7,
): Promise<{ date: string; bothActive: boolean }[]> => {
  const today = todayUTC()
  const dates = Array.from({ length: days }, (_, i) => addDaysUTC(today, -(days - 1 - i)))

  return Promise.all(
    dates.map(async (date) => {
      const [a, b] = await Promise.all([hasSwipedOn(user1Id, date), hasSwipedOn(user2Id, date)])
      return { date, bothActive: a && b }
    }),
  )
}

export const getSessionStreak = async (sessionId: string): Promise<SessionStreak | null> => {
  const { data, error } = await supabase
    .from("session_streaks")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error fetching session streak:", error)
    return null
  }
  return data as SessionStreak | null
}

const notifyStreakEvent = async (
  session: SwipeSession & { user1: SupabaseUser; user2: SupabaseUser },
  evaluation: StreakEvaluation,
) => {
  if (evaluation.event === "none") return

  const day = evaluation.event === "broken" ? evaluation.previousStreak ?? 0 : evaluation.currentStreak
  const notificationType =
    evaluation.event === "broken"
      ? "streak_lost"
      : evaluation.event === "frozen"
        ? "streak_frozen"
        : evaluation.event === "milestone"
          ? "streak_milestone"
          : "streak_increment"

  const user1Name = session.user1.first_name || session.user1.username || "your partner"
  const user2Name = session.user2.first_name || session.user2.username || "your partner"

  const copyForUser1 = streakEventCopy(evaluation.event, day, user2Name)
  const copyForUser2 = streakEventCopy(evaluation.event, day, user1Name)

  await Promise.allSettled([
    createNotification(session.user1_id, {
      type: notificationType,
      title: copyForUser1.title,
      body: copyForUser1.body,
      data: { sessionId: session.id, streak: day },
    }),
    createNotification(session.user2_id, {
      type: notificationType,
      title: copyForUser2.title,
      body: copyForUser2.body,
      data: { sessionId: session.id, streak: day },
    }),
  ])
}

// Evaluate + notify in one call — used both right after a swipe (via saveSwipe)
// and opportunistically on app open, so an overnight-broken streak is still caught.
export const refreshSessionStreak = async (
  session: SwipeSession & { user1: SupabaseUser; user2: SupabaseUser },
): Promise<StreakEvaluation> => {
  const evaluation = await evaluateSessionStreak(session.id, session.user1_id, session.user2_id)
  if (evaluation.event !== "none") {
    await notifyStreakEvent(session, evaluation)
  }
  return evaluation
}

// Get User Stats
export const getUserStats = async (userId: string) => {
  const [swipesResult, matchesResult, sessionsResult, activeSessions] = await Promise.all([
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
    getActiveSwipeSessions(userId),
  ])

  const streaks = await Promise.all(activeSessions.map((s) => getSessionStreak(s.id)))
  const currentStreak = streaks.reduce((max, s) => Math.max(max, s?.current_streak ?? 0), 0)
  const longestStreak = streaks.reduce((max, s) => Math.max(max, s?.longest_streak ?? 0), 0)

  return {
    totalSwipes: swipesResult.count || 0,
    totalMatches: matchesResult.count || 0,
    activeSessions: sessionsResult.count || 0,
    currentStreak,
    longestStreak,
  }
}

// ==================== DEBATE SESSION FUNCTIONS ====================

import type { AIVerdict, DebateSession } from "@/types"

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

export type DebateInviteEmailResult = {
  sent: boolean
  provider?: 'resend'
  mode?: 'test' | 'production'
  reason?:
    | 'missing_fields'
    | 'missing_provider_config'
    | 'domain_verification_required'
    | 'from_domain_not_verified'
    | 'provider_error'
  error?: string
  action?: string
  emailId?: string
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
    return {
      sent: false,
      reason: "provider_error",
      error: error.message,
    } satisfies DebateInviteEmailResult
  }

  if (!data || typeof data !== "object") {
    return {
      sent: false,
      reason: "provider_error",
      error: "Unexpected invite response",
    } satisfies DebateInviteEmailResult
  }

  return data as DebateInviteEmailResult
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

// ==================== AI USAGE (visible monthly counter, no cap enforced) ====================

const currentMonthKey = () => new Date().toISOString().slice(0, 7) // "YYYY-MM"

// Read-only: resolves the display count without writing, so opening the debate
// screen never generates a write. A stale stored month just reads as 0.
export const getAiSettlementUsage = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from("users")
    .select("monthly_ai_settlements, ai_usage_month")
    .eq("id", userId)
    .single()

  if (error || !data) return 0
  return data.ai_usage_month === currentMonthKey() ? data.monthly_ai_settlements ?? 0 : 0
}

// Call once per successful AI debate settlement. Resets the counter on a new month.
export const incrementAiSettlementUsage = async (userId: string): Promise<number> => {
  const month = currentMonthKey()
  const { data: user } = await supabase
    .from("users")
    .select("monthly_ai_settlements, ai_usage_month")
    .eq("id", userId)
    .single()

  const nextCount = user?.ai_usage_month === month ? (user.monthly_ai_settlements ?? 0) + 1 : 1

  const { error } = await supabase
    .from("users")
    .update({ monthly_ai_settlements: nextCount, ai_usage_month: month })
    .eq("id", userId)

  if (error) {
    console.error("[v0] Error incrementing AI usage:", error)
    return user?.ai_usage_month === month ? user.monthly_ai_settlements ?? 0 : 0
  }

  return nextCount
}

// ==================== ACCOUNT DELETION ====================

export const deleteUserAccount = async (userId: string) => {
  console.log("[v0] Starting account deletion for user:", userId)

  try {
    // Delete in order to avoid foreign key constraints
    // 1. Delete notifications (references user_id)
    const { error: notificationsError } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)

    if (notificationsError) {
      console.error("[v0] Error deleting notifications:", notificationsError)
      throw new Error("Failed to delete notifications")
    }

    // 2. Delete swipes (references user_id)
    const { error: swipesError } = await supabase
      .from("swipes")
      .delete()
      .eq("user_id", userId)

    if (swipesError) {
      console.error("[v0] Error deleting swipes:", swipesError)
      throw new Error("Failed to delete swipes")
    }

    // 3. Delete matches (references user1_id and user2_id)
    const { error: matchesError } = await supabase
      .from("matches")
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (matchesError) {
      console.error("[v0] Error deleting matches:", matchesError)
      throw new Error("Failed to delete matches")
    }

    // 4. Delete invitations (references sender_id and recipient_id)
    const { error: invitationsError } = await supabase
      .from("invitations")
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)

    if (invitationsError) {
      console.error("[v0] Error deleting invitations:", invitationsError)
      throw new Error("Failed to delete invitations")
    }

    // 5. Delete swipe sessions (references user1_id and user2_id)
    const { error: sessionsError } = await supabase
      .from("swipe_sessions")
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (sessionsError) {
      console.error("[v0] Error deleting swipe sessions:", sessionsError)
      throw new Error("Failed to delete swipe sessions")
    }

    // 6. Delete debate sessions (references host_id and partner_id)
    const { error: debateError } = await supabase
      .from("debate_sessions")
      .delete()
      .or(`host_id.eq.${userId},partner_id.eq.${userId}`)

    if (debateError) {
      console.error("[v0] Error deleting debate sessions:", debateError)
      throw new Error("Failed to delete debate sessions")
    }

    // 7. Finally, delete the user record
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (userError) {
      console.error("[v0] Error deleting user:", userError)
      throw new Error("Failed to delete user record")
    }

    console.log("[v0] Successfully deleted all user data for:", userId)
    return { success: true }

  } catch (error) {
    console.error("[v0] Account deletion failed:", error)
    throw error
  }
}
