"use client"

import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import { useState, useEffect } from "react"
import { MovieCard } from "@/components/MovieCard"
import { fetchTrendingMovies } from "@/utils/tmdb"
import type { Movie } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"
import { useRouter } from "expo-router"

const { width } = Dimensions.get("window")

export default function SwipeScreen() {
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = async () => {
    try {
      setLoading(true)
      const data = await fetchTrendingMovies()
      setMovies(data)
      setCurrentIndex(0)
    } catch (error) {
      console.error("Failed to load movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      const isMatch = Math.random() > 0.7
      if (isMatch) {
        router.push({
          pathname: "/match",
          params: { movieId: movies[currentIndex].id },
        })
      }
    }

    setCurrentIndex((prev) => prev + 1)

    if (currentIndex >= movies.length - 3) {
      loadMovies()
    }
  }

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  /** -------------------- LOADING STATE -------------------- */
  if (loading) {
    return (
      <View className="flex-1 bg-cyan-50 justify-center items-center">
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text className="mt-4 text-base text-gray-700 font-semibold">
          Finding movies for your date…
        </Text>
      </View>
    )
  }

  const currentMovie = movies[currentIndex]

  /** -------------------- EMPTY STATE -------------------- */
  if (!currentMovie) {
    return (
      <View className="flex-1 bg-cyan-50 justify-center items-center px-10">
        <Ionicons name="film-outline" size={64} color="#22d3ee" />
        <Text className="text-2xl font-extrabold text-gray-900 mt-4">
          No more movies
        </Text>
        <Text className="text-center text-gray-600 mt-2">
          You’ve swiped through all available picks.
        </Text>

        <TouchableOpacity
          onPress={loadMovies}
          className="mt-6 bg-cyan-400 px-8 py-4 rounded-2xl shadow-lg"
        >
          <Text className="text-white font-bold text-base">Load More</Text>
        </TouchableOpacity>
      </View>
    )
  }

  /** -------------------- MAIN UI -------------------- */
  return (
    <View className="flex-1 bg-cyan-50">
      {/* Header */}
      <View className="pt-16 px-6 flex-row justify-between items-center">
        <Text className="text-3xl font-extrabold text-gray-900">Dateflix</Text>

        <View className="flex-row items-center gap-2 bg-green-100 px-3 py-2 rounded-full">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs text-green-700 font-bold">Sarah</Text>
        </View>
      </View>

      {/* Card Stack */}
      <View className="flex-1 justify-center items-center px-5">
        {movies
          .slice(currentIndex, currentIndex + 2)
          .reverse()
          .map((movie, index) => (
            <Animated.View
              key={movie.id}
              entering={FadeIn.delay(index * 100)}
              style={{
                position: "absolute",
                width: width - 40,
                zIndex: index === 1 ? 2 : 1,
                opacity: index === 1 ? 1 : 0.85,
                transform: [
                  { scale: index === 1 ? 1 : 0.96 },
                  { translateY: index === 1 ? 0 : 10 },
                ],
              }}
            >
              <MovieCard
                movie={movie}
                onSwipe={index === 1 ? handleSwipe : undefined}
              />
            </Animated.View>
          ))}
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-center items-center gap-5 pb-32 px-6">
        <TouchableOpacity
          onPress={() => handleSwipe("left")}
          className="w-16 h-16 rounded-full justify-center items-center bg-white shadow-lg"
        >
          <Ionicons name="close" size={32} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUndo}
          disabled={currentIndex === 0}
          className={`w-12 h-12 rounded-full justify-center items-center bg-white shadow-md ${
            currentIndex === 0 ? "opacity-40" : ""
          }`}
        >
          <Ionicons name="arrow-undo" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSwipe("right")}
          className="w-20 h-20 rounded-full justify-center items-center bg-cyan-400 shadow-xl"
        >
          <Ionicons name="heart" size={36} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}
