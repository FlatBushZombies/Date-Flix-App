import { searchMovieByTitle } from "@/utils/tmdb"
import type { Movie } from "@/types"
import type { MovieResult } from "@/types/planner"
import { useEffect, useState } from "react"

export interface EnrichedMovie extends MovieResult {
  tmdb: Movie | null
}

// The AI planner returns text-only recommendations (title/year/genre/reason,
// no imagery). This resolves real poster/backdrop art per movie via TMDB
// search, best-effort — screens should render fine with `tmdb: null` too.
export function useEnrichedMovies(movies: MovieResult[] | undefined) {
  const [enriched, setEnriched] = useState<EnrichedMovie[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!movies || movies.length === 0) {
      setEnriched([])
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      movies.map(async (movie) => {
        try {
          const tmdb = await searchMovieByTitle(movie.title, movie.year)
          return { ...movie, tmdb }
        } catch {
          return { ...movie, tmdb: null }
        }
      }),
    ).then((results) => {
      if (!cancelled) {
        setEnriched(results)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [movies])

  return { movies: enriched, loading }
}
