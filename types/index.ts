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

export interface SupabaseUser {
  id: string
  clerk_id: string
  email: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseSwipe {
  id: string
  user_id: string
  movie_id: number
  liked: boolean
  movie_data: Movie | null
  created_at: string
}

export interface SupabaseMatch {
  id: string
  movie_id: number
  user1_id: string
  user2_id: string
  movie_data: Movie | null
  watched: boolean
  matched_at: string
}

export interface Invitation {
  id: string
  sender_id: string
  recipient_id: string | null
  recipient_email: string | null
  status: "pending" | "accepted" | "declined" | "expired"
  invite_code: string
  expires_at: string | null
  created_at: string
  accepted_at: string | null
  sender?: SupabaseUser
}

export interface SwipeSession {
  id: string
  user1_id: string
  user2_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  user1?: SupabaseUser
  user2?: SupabaseUser
}
