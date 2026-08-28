import type { EnrichedMovie } from "@/hooks/useEnrichedMovies"
import type { TopPick } from "@/hooks/useTopPicks"
import type { Movie } from "@/types"
import type { CastableMovie } from "@/types/cast"

function tmdbImage(path: string | null | undefined, size: "w780" | "w1280" = "w1280") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}

// Collects the fields Duo App actually has for a TMDB-shaped Movie (top
// picks, new releases, swipe cards) into the receiver's metadata shape.
export function castableMovieFromTmdb(movie: Movie, subtitle?: string): CastableMovie {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  return {
    id: String(movie.id),
    title: movie.title,
    subtitle: subtitle ?? [year, movie.vote_average > 0 ? `★ ${movie.vote_average.toFixed(1)}` : null]
      .filter(Boolean)
      .join("  ·  "),
    overview: movie.overview,
    posterUrl: tmdbImage(movie.poster_path, "w780"),
    backdropUrl: tmdbImage(movie.backdrop_path, "w1280"),
  }
}

export function castableMovieFromTopPick(pick: TopPick): CastableMovie {
  return castableMovieFromTmdb(pick.movie, `${pick.upvoteCount} upvote${pick.upvoteCount === 1 ? "" : "s"}`)
}

// The AI planner's results are enriched with real TMDB art (see
// useEnrichedMovies) but keep their own title/year/streaming/rating text —
// prefer that over the raw TMDB fields since it's what the user is looking
// at on the Results screen.
export function castableMovieFromEnriched(movie: EnrichedMovie): CastableMovie {
  return {
    id: movie.tmdb ? String(movie.tmdb.id) : movie.title,
    title: movie.title,
    subtitle: [movie.streaming, movie.rating].filter(Boolean).join("  ·  "),
    overview: movie.tmdb?.overview?.trim() || movie.reason,
    posterUrl: tmdbImage(movie.tmdb?.poster_path, "w780"),
    backdropUrl: tmdbImage(movie.tmdb?.backdrop_path, "w1280"),
  }
}
