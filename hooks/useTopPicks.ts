import { supabase } from "@/lib/supabase"
import type { Movie } from "@/types"
import { getNewMovies } from "@/utils/tmdb"
import { useUser } from "@clerk/clerk-expo"
import { useCallback, useEffect, useMemo, useState } from "react"

export interface TopPick {
  movieId: number
  movie: Movie
  upvoteCount: number
}

export function useTopPicks() {
  const { user } = useUser()
  const [newMovies, setNewMovies] = useState<Movie[]>([])
  const [topPicks, setTopPicks] = useState<TopPick[]>([])
  const [upvotedIds, setUpvotedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const loadNewMovies = useCallback(async () => {
    const movies = await getNewMovies()
    setNewMovies(movies)
  }, [])

  const loadTopPicks = useCallback(async () => {
    const { data, error } = await supabase
      .from("top_upvoted_movies")
      .select("movie_id, movie_data, upvote_count")

    if (error) {
      console.error("Top picks fetch error:", error)
      return
    }

    setTopPicks(
      (data ?? [])
        .filter((row) => row.movie_data)
        .map((row) => ({
          movieId: row.movie_id,
          movie: row.movie_data as Movie,
          upvoteCount: row.upvote_count,
        })),
    )
  }, [])

  const loadMyUpvotes = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from("movie_upvotes")
      .select("movie_id")
      .eq("user_id", user.id)

    if (error) {
      console.error("My upvotes fetch error:", error)
      return
    }

    setUpvotedIds(new Set((data ?? []).map((row) => row.movie_id)))
  }, [user?.id])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      await Promise.all([loadNewMovies(), loadTopPicks(), loadMyUpvotes()])
    } catch (error) {
      console.error("Top Picks load error:", error)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [loadNewMovies, loadTopPicks, loadMyUpvotes])

  useEffect(() => {
    loadAll()
  }, [user?.id])

  // Keeps the Top 10 leaderboard live — refetches whenever anyone's vote changes.
  useEffect(() => {
    const channel = supabase
      .channel("movie_upvotes:leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movie_upvotes" },
        () => {
          loadTopPicks()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadTopPicks])

  const toggleUpvote = useCallback(
    async (movie: Movie) => {
      if (!user?.id) return

      const alreadyUpvoted = upvotedIds.has(movie.id)

      // Optimistic — the leaderboard also self-corrects via the realtime
      // subscription above once the write lands.
      setUpvotedIds((prev) => {
        const next = new Set(prev)
        if (alreadyUpvoted) {
          next.delete(movie.id)
        } else {
          next.add(movie.id)
        }
        return next
      })

      if (alreadyUpvoted) {
        const { error } = await supabase
          .from("movie_upvotes")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movie.id)

        if (error) {
          console.error("Remove upvote error:", error)
          setUpvotedIds((prev) => new Set(prev).add(movie.id))
        }
      } else {
        const { error } = await supabase.from("movie_upvotes").insert({
          user_id: user.id,
          movie_id: movie.id,
          movie_data: movie,
        })

        if (error) {
          console.error("Add upvote error:", error)
          setUpvotedIds((prev) => {
            const next = new Set(prev)
            next.delete(movie.id)
            return next
          })
        }
      }
    },
    [user?.id, upvotedIds],
  )

  const isEmpty = useMemo(() => newMovies.length === 0 && topPicks.length === 0, [newMovies, topPicks])

  return {
    newMovies,
    topPicks,
    upvotedIds,
    loading,
    fetchError,
    isEmpty,
    toggleUpvote,
    refresh: loadAll,
  }
}
