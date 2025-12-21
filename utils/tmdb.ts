import type { Movie } from "@/types"

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

export async function fetchTrendingMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`)
    const raw = await response.text()

    if (!raw) return []

    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch (err) {
      console.error("Error parsing trending movies JSON:", err, raw)
      return []
    }

    if (typeof data === "object" && data && "results" in data && Array.isArray((data as any).results)) {
      return (data as any).results as Movie[]
    }

    return []
  } catch (error) {
    console.error("Error fetching trending movies:", error)
    return []
  }
}

export async function searchMovies(query: string): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`)
    const raw = await response.text()

    if (!raw) return []

    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch (err) {
      console.error("Error parsing search movies JSON:", err, raw)
      return []
    }

    if (typeof data === "object" && data && "results" in data && Array.isArray((data as any).results)) {
      return (data as any).results as Movie[]
    }

    return []
  } catch (error) {
    console.error("Error searching movies:", error)
    return []
  }
}

export async function getMovieDetails(movieId: number): Promise<Movie> {
  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`)
    const raw = await response.text()

    if (!raw) {
      throw new Error("Empty response from TMDB movie details")
    }

    try {
      return JSON.parse(raw) as Movie
    } catch (err) {
      console.error("Error parsing movie details JSON:", err, raw)
      throw err
    }
  } catch (error) {
    console.error("Error fetching movie details:", error)
    throw error
  }
}

export async function getPopularMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`)
    const raw = await response.text()

    if (!raw) return []

    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch (err) {
      console.error("Error parsing popular movies JSON:", err, raw)
      return []
    }

    if (typeof data === "object" && data && "results" in data && Array.isArray((data as any).results)) {
      return (data as any).results as Movie[]
    }

    return []
  } catch (error) {
    console.error("Error fetching popular movies:", error)
    return []
  }
}

export async function getMoviesByGenre(genreId: number): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}`)
    const raw = await response.text()

    if (!raw) return []

    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch (err) {
      console.error("Error parsing movies by genre JSON:", err, raw)
      return []
    }

    if (typeof data === "object" && data && "results" in data && Array.isArray((data as any).results)) {
      return (data as any).results as Movie[]
    }

    return []
  } catch (error) {
    console.error("Error fetching movies by genre:", error)
    return []
  }
}
