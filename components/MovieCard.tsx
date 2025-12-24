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

        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { velocity: event.velocityX }
        )

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
    ],
  }))

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }))

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Poster Image (original size) */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
            style={styles.image}
            resizeMode="cover"
          />

          
        </View>

        {/* Bottom Info Panel */}
        <View style={styles.infoPanel}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>
        </View>

        {/* Floating Actions */}
        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <Ionicons name="close" size={26} color="#f87171" />
          </View>

          <View style={[styles.actionButton, styles.likeButton]}>
            <Ionicons name="heart" size={28} color="#fff" />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 28,
    backgroundColor: "#f8fafc",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },

  imageContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.55, // ✅ matches original MovieCard proportions
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  infoPanel: {
    backgroundColor: "#ffffff",
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },

  actions: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },

  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },

  likeButton: {
    backgroundColor: "#22d3ee",
  },
})
