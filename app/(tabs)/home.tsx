import { View, Text, TouchableOpacity, Dimensions, Image, StyleSheet } from "react-native"
import { useState, useEffect } from "react"
import { MovieCard } from "@/components/MovieCard"
import { fetchTrendingMovies } from "@/utils/tmdb"
import type { Movie } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"
import { useRouter } from "expo-router"
import { useUser } from "@clerk/clerk-expo"

const { width } = Dimensions.get("window")

export default function SwipeScreen() {
  const router = useRouter()
  const { user } = useUser()

  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = async () => {
    try {
      const data = await fetchTrendingMovies()
      setMovies(data)
    } catch (error) {
      console.error("Failed to load movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      if (Math.random() > 0.7) {
        router.push({
          pathname: "/match",
          params: { movieId: String(movies[currentIndex].id) },
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

  const currentMovie = movies[currentIndex]

  if (!currentMovie && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No more movies!</Text>

        <TouchableOpacity onPress={loadMovies} style={styles.loadMoreButton}>
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={22} color="#0891b2" />
            )}
          </View>

          <View>
            <Text style={styles.welcomeLabel}>Welcome</Text>
            <Text style={styles.welcomeName}>{user?.firstName ?? "You"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {movies
          .slice(currentIndex, currentIndex + 2)
          .reverse()
          .map((movie, index) => (
            <Animated.View
              key={movie.id}
              entering={FadeIn.duration(250)}
              style={[
                styles.cardWrapper,
                {
                  zIndex: index === 1 ? 2 : 1,
                  opacity: index === 1 ? 1 : 0.85,
                  transform: [
                    { scale: index === 1 ? 1 : 0.96 },
                    { translateY: index === 1 ? 0 : 12 },
                  ],
                },
              ]}
            >
              <MovieCard
                movie={movie}
                onSwipe={index === 1 ? handleSwipe : undefined}
              />
            </Animated.View>
          ))}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => handleSwipe("left")}
          style={styles.dislikeButton}
        >
          <Ionicons name="close" size={32} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUndo}
          disabled={currentIndex === 0}
          style={[styles.undoButton, currentIndex === 0 && styles.undoButtonDisabled]}
        >
          <Ionicons name="arrow-undo" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSwipe("right")}
          style={styles.likeButton}
        >
          <Ionicons name="heart" size={36} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfeff",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#ecfeff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  loadMoreButton: {
    backgroundColor: "#22d3ee",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: "#0e7490",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loadMoreButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  headerContainer: {
    paddingTop: 64,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#bae6fd",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  welcomeLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cardWrapper: {
    position: "absolute",
    width: width - 40,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 20,
    paddingBottom: 128,
    paddingHorizontal: 24,
  },
  dislikeButton: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  undoButtonDisabled: {
    opacity: 0.5,
  },
  likeButton: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0e7490",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
})
