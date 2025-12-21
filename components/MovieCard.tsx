import { View, Text, Image, Dimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import type { Movie } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import { useMemo } from "react"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3

interface MovieCardProps {
  movie: Movie
  onSwipe?: (direction: "left" | "right") => void
}

export function MovieCard({ movie, onSwipe }: MovieCardProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  const baseRotation = useMemo(() => Math.random() * 6 - 3, [])
  const rotation = useSharedValue(baseRotation)

  type PanGestureEvent = {
    translationX: number
    translationY: number
    velocityX: number
  }

  const panGesture = Gesture.Pan()
    .enabled(!!onSwipe)
    .onChange((event: PanGestureEvent) => {
      "worklet"
      translateX.value = event.translationX
      translateY.value = event.translationY
    })
    .onEnd((event: PanGestureEvent) => {
      "worklet"
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction: "left" | "right" = event.translationX > 0 ? "right" : "left"

        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { velocity: event.velocityX }
        )

        if (onSwipe) {
          runOnJS(onSwipe)(direction)
        }
      } else {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
      }
    })

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15]
    )

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

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }))

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={cardStyle}>
        <View
          style={{
            width: SCREEN_WIDTH - 64,
            height: SCREEN_HEIGHT * 0.55,
          }}
        >
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* LIKE */}
          <Animated.View
            style={[
              likeStyle,
              {
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(34,211,238,0.2)",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                borderWidth: 4,
                borderColor: "#22d3ee",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                transform: [{ rotate: "-12deg" }],
              }}
            >
              <Ionicons name="heart" size={40} color="#22d3ee" />
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#fff",
                }}
              >
                LIKE
              </Text>
            </View>
          </Animated.View>

          {/* NOPE */}
          <Animated.View
            style={[
              nopeStyle,
              {
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(248,113,113,0.2)",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                borderWidth: 4,
                borderColor: "#f87171",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                transform: [{ rotate: "12deg" }],
              }}
            >
              <Ionicons name="close" size={40} color="#f87171" />
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#fff",
                }}
              >
                NOPE
              </Text>
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
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#fff",
              }}
              numberOfLines={2}
            >
              {movie.title}
            </Text>
          </LinearGradient>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}
