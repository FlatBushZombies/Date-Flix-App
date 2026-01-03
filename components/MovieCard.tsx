"use client"

import { View, Text, Image, Dimensions, StyleSheet } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { Movie } from "@/types"
import { useEffect } from "react"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3

interface MovieCardProps {
  movie: Movie
  onSwipe?: (direction: "left" | "right") => void
}

export function MovieCard({ movie, onSwipe }: MovieCardProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const isSwiped = useSharedValue(false)

  useEffect(() => {
    translateX.value = 0
    translateY.value = 0
    isSwiped.value = false
  }, [movie.id])

  const panGesture = Gesture.Pan()
    .enabled(!!onSwipe)
    .onChange((event) => {
      if (isSwiped.value) return
      translateX.value = event.translationX
      translateY.value = event.translationY
    })
    .onEnd((event) => {
      if (isSwiped.value) return

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        isSwiped.value = true
        const direction = event.translationX > 0 ? "right" : "left"

        translateX.value = withSpring(event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, {
          velocity: event.velocityX,
        })

        onSwipe && runOnJS(onSwipe)(direction)
      } else {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
      }
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-30, 30])}deg` },
    ],
  }))

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
  }))

  const nopeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          style={styles.posterImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />

        <Animated.View style={[styles.nopeOverlay, nopeOverlayStyle]} pointerEvents="none">
          <View style={styles.nopeLabel}>
            <Text style={styles.nopeLabelText}>NOPE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.likeOverlay, likeOverlayStyle]} pointerEvents="none">
          <View style={styles.likeLabel}>
            <Text style={styles.likeLabelText}>LIKE</Text>
          </View>
        </Animated.View>

        <View style={styles.infoCard}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>

          {movie.release_date && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{new Date(movie.release_date).getFullYear()}</Text>
            </View>
          )}

          {movie.vote_average > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}/10</Text>
            </View>
          )}

          <Text style={styles.overview} numberOfLines={3}>
            {movie.overview}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <View style={styles.passButton}>
            <Ionicons name="close" size={32} color="#ff6b6b" />
          </View>

          <View style={styles.likeButton}>
            <LinearGradient
              colors={["#ff6b6b", "#ff8e53", "#ffa94d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.likeButtonGradient}
            >
              <Ionicons name="heart" size={36} color="#ffffff" />
            </LinearGradient>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: "hidden",
  },

  posterImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },

  nopeOverlay: {
    position: "absolute",
    top: 40,
    left: 30,
    transform: [{ rotate: "-20deg" }],
  },

  nopeLabel: {
    borderWidth: 4,
    borderColor: "#ff6b6b",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  nopeLabelText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ff6b6b",
    letterSpacing: 2,
  },

  likeOverlay: {
    position: "absolute",
    top: 40,
    right: 30,
    transform: [{ rotate: "20deg" }],
  },

  likeLabel: {
    borderWidth: 4,
    borderColor: "#6ee7b7",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  likeLabelText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#6ee7b7",
    letterSpacing: 2,
  },

  infoCard: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  movieTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  metaText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  ratingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  overview: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },

  actionButtons: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },

  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  likeButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: "#ff8e53",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  likeButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
})
