import { getWatchlist, removeFromWatchlist, saveToWatchlist } from "@/utils/supabase-helpers"
import type { Movie } from "@/types"
import { useEffect, useState } from "react"

// Tracks which movie IDs are saved, and exposes toggleSave for any "Save"
// button in the app. Backed by the `watchlist` table (scripts/008-watchlist.sql).
export function useWatchlist(userId?: string) {
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    if (!userId) return
    setLoading(true)
    const rows = await getWatchlist(userId)
    if (rows) setSavedIds(new Set(rows.map((r) => r.movie_id)))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [userId])

  const isSaved = (movieId: number) => savedIds.has(movieId)

  const toggleSave = async (movie: Movie) => {
    if (!userId) return false

    if (savedIds.has(movie.id)) {
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(movie.id)
        return next
      })
      const ok = await removeFromWatchlist(userId, movie.id)
      if (!ok) setSavedIds((prev) => new Set(prev).add(movie.id)) // revert on failure
      return !ok ? false : true
    }

    setSavedIds((prev) => new Set(prev).add(movie.id))
    const ok = await saveToWatchlist(userId, movie)
    if (!ok) {
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(movie.id)
        return next
      })
    }
    return ok
  }

  return { savedIds, isSaved, toggleSave, loading, refresh }
}
