import type { Movie } from "@/types"

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

export async function fetchTrendingMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`)
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error fetching trending movies:", error)
    throw error
  }
}

export async function searchMovies(query: string): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`)
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error searching movies:", error)
    throw error
  }
}

export async function getMovieDetails(movieId: number): Promise<Movie> {
  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching movie details:", error)
    throw error
  }
}

export async function getPopularMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`)
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error fetching popular movies:", error)
    throw error
  }
}

export async function getMoviesByGenre(genreId: number): Promise<Movie[]> {
  try {
    const response = await fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}`)
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error fetching movies by genre:", error)
    throw error
  }
}
