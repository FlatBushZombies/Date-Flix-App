import { buildTasteEnginePrompt, type FeedbackEntry } from "@/lib/tasteEnginePrompt"
import { supabase } from "@/lib/supabase"
import type { Movie } from "@/types"
import {
  getRecommendationFeedback,
  getTasteProfile,
  saveRecommendationFeedback,
  saveTasteProfile,
  type FeedbackRow,
  type TasteProfileRow,
} from "@/utils/supabase-helpers"
import { searchMovieByTitle } from "@/utils/tmdb"
import { useCallback, useEffect, useState } from "react"

export interface TasteRecommendation {
  title: string
  year: number | null
  reason: string
  matchScore: number
  tmdb: Movie | null
  rating: "liked" | "disliked" | null
}

const LOADING_MESSAGES = [
  "Reading your taste...",
  "Cross-referencing your picks...",
  "Consulting the film critics...",
  "Ranking your matches...",
]

// Same shape as hooks/useMoviePlanner.ts (state, loading, error, generate) —
// this is the "For You" tab's equivalent, calling the same super-function
// Gemini proxy with a different prompt.
export function useTasteEngine(userId: string | undefined) {
  const [profile, setProfile] = useState<TasteProfileRow | null | undefined>(undefined) // undefined = not loaded yet
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [recommendations, setRecommendations] = useState<TasteRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([getTasteProfile(userId), getRecommendationFeedback(userId)]).then(([p, f]) => {
      if (cancelled) return
      setProfile(p)
      setFeedback(f)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const runGeneration = useCallback(
    async (activeProfile: TasteProfileRow, pastFeedback: FeedbackRow[]) => {
      setLoading(true)
      setError(null)

      let idx = 0
      const interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length
        setLoadingMessage(LOADING_MESSAGES[idx])
      }, 1200)

      try {
        const feedbackEntries: FeedbackEntry[] = pastFeedback.map((f) => ({
          movieTitle: f.movie_title,
          liked: f.liked,
        }))
        const prompt = buildTasteEnginePrompt(
          { genres: activeProfile.genres, vibe: activeProfile.vibe, seedMovies: activeProfile.seed_movies },
          feedbackEntries,
        )

        const { data, error: fnError } = await supabase.functions.invoke("super-function", { body: { prompt } })
        if (fnError) throw new Error(fnError.message)

        const rawList: any[] = Array.isArray(data?.recommendations) ? data.recommendations : []
        const enriched: TasteRecommendation[] = await Promise.all(
          rawList.slice(0, 6).map(async (m) => {
            let tmdb: Movie | null = null
            try {
              tmdb = await searchMovieByTitle(String(m.title ?? ""), m.year)
            } catch {
              tmdb = null
            }
            return {
              title: String(m.title ?? "Untitled"),
              year: typeof m.year === "number" ? m.year : null,
              reason: String(m.reason ?? ""),
              matchScore: Math.min(100, Math.max(0, Number(m.matchScore) || 75)),
              tmdb,
              rating: null,
            }
          }),
        )
        setRecommendations(enriched)
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong. Please try again.")
      } finally {
        clearInterval(interval)
        setLoading(false)
      }
    },
    [],
  )

  // A returning user with an already-saved profile (from a previous
  // session) should land straight on results, not the onboarding — this
  // generates the first batch for them automatically, once, the moment
  // their profile finishes loading.
  useEffect(() => {
    if (profile && recommendations.length === 0 && !loading && !error) {
      runGeneration(profile, feedback)
    }
    // Deliberately only reacts to the profile finishing its initial load —
    // refresh()/rate() manage recommendations after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const submitOnboarding = useCallback(
    async (genres: string[], vibe: string | null, seedMovies: TasteProfileRow["seed_movies"]) => {
      if (!userId) return
      const saved = await saveTasteProfile(userId, genres, vibe, seedMovies)
      if (!saved) {
        setError("Couldn't save your taste profile. Please try again.")
        return
      }
      // Setting profile here is enough — the effect above picks up the
      // change and runs generation, so there's exactly one code path that
      // ever kicks off a generation from a profile change (avoids a
      // double-fire race between this call and the effect).
      setProfile(saved)
    },
    [userId],
  )

  const refresh = useCallback(async () => {
    if (!profile) return
    await runGeneration(profile, feedback)
  }, [profile, feedback, runGeneration])

  const rate = useCallback(
    async (rec: TasteRecommendation, liked: boolean) => {
      if (!userId) return
      setRecommendations((prev) =>
        prev.map((r) => (r.title === rec.title ? { ...r, rating: liked ? "liked" : "disliked" } : r)),
      )
      const ok = await saveRecommendationFeedback(userId, rec.title, rec.year, liked)
      if (ok) {
        setFeedback((prev) => [
          { id: `local-${Date.now()}`, user_id: userId, movie_title: rec.title, movie_year: rec.year, liked, created_at: new Date().toISOString() },
          ...prev,
        ])
      }
    },
    [userId],
  )

  const retake = useCallback(() => {
    setProfile(null)
    setRecommendations([])
    setError(null)
  }, [])

  return {
    profile,
    hasProfile: profile === undefined ? undefined : !!profile,
    feedback,
    recommendations,
    loading,
    loadingMessage,
    error,
    submitOnboarding,
    refresh,
    rate,
    retake,
  }
}
