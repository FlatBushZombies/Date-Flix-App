// TypeScript type definitions for Dateflix

export interface Movie {
  id: number
  title: string
  poster_path: string
  backdrop_path: string
  overview: string
  vote_average: number
  release_date: string
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
  vote_count: number
}

export interface MovieDetails extends Movie {
  genres: Genre[]
  runtime: number
  budget: number
  revenue: number
  status: string
  tagline: string
  production_companies: ProductionCompany[]
  spoken_languages: SpokenLanguage[]
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface User {
  id: string
  email: string
  partnerId?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  genres: number[]
  minRating: number
  releaseYearMin?: number
  releaseYearMax?: number
}

export interface Swipe {
  id: string
  userId: string
  movieId: number
  liked: boolean
  timestamp: number
}

export interface Match {
  id: string
  movieId: number
  user1Id: string
  user2Id: string
  matchedAt: number
  watched: boolean
}

export interface SwipeAction {
  type: "LIKE" | "PASS"
  movieId: number
  movie: Movie
}
