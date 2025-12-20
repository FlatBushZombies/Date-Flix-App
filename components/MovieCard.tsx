import { View, Text, Image, Dimensions } from "react-native"
import { PanGestureHandler, type PanGestureHandlerGestureEvent } from "react-native-gesture-handler"
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import type { Movie } from "@/types"
import { Ionicons } from "@expo/vector-icons"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3

interface MovieCardProps {
  movie: Movie
  onSwipe?: (direction: "left" | "right") => void
}

export function MovieCard({ movie, onSwipe }: MovieCardProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const rotation = useSharedValue(Math.random() * 6 - 3)

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (event) => {
      translateX.value = event.translationX
      translateY.value = event.translationY
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "right" : "left"
        translateX.value = withSpring(event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, {
          velocity: event.velocityX,
        })
        if (onSwipe) {
          runOnJS(onSwipe)(direction)
        }
      } else {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
      }
    },
  })

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2], [-15, 0, 15])

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate + rotation.value}deg` },
      ],
      width: SCREEN_WIDTH - 40,
      height: SCREEN_HEIGHT * 0.65,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: "#1a202c",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    }
  })

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }))

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }))

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={!!onSwipe}>
      <Animated.View style={cardStyle}>
        <View style={{ width: SCREEN_WIDTH - 64, height: SCREEN_HEIGHT * 0.55 }}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          <Animated.View style={[likeOpacity]} className="absolute inset-0 bg-cyan-400/20 justify-center items-center">
            <View className="border-4 border-cyan-400 rounded-2xl p-5 items-center gap-2 -rotate-12">
              <Ionicons name="heart" size={40} color="#22d3ee" />
              <Text className="text-3xl font-extrabold text-white">LIKE</Text>
            </View>
          </Animated.View>

          <Animated.View style={[nopeOpacity]} className="absolute inset-0 bg-red-400/20 justify-center items-center">
            <View className="border-4 border-red-400 rounded-2xl p-5 items-center gap-2 rotate-12">
              <Ionicons name="close" size={40} color="#f87171" />
              <Text className="text-3xl font-extrabold text-white">NOPE</Text>
            </View>
          </Animated.View>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50%",
              justifyContent: "flex-end",
              padding: 24,
            }}
          >
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 32, fontWeight: "800", color: "#ffffff" }} numberOfLines={2}>
                {movie.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(255, 215, 0, 0.2)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                    {movie.vote_average.toFixed(1)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: "#a0aec0", fontWeight: "600" }}>
                  {new Date(movie.release_date).getFullYear()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        <View style={{ paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 14, color: "#a0aec0", lineHeight: 20 }} numberOfLines={3}>
            {movie.overview}
          </Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  )
}
