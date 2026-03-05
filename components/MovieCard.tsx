"use client"

import { View, Text, Image, Dimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  Easing,
} from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { Movie } from "@/types"
import { useEffect } from "react"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
const CARD_WIDTH = SCREEN_WIDTH - 40
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7

interface MovieCardProps {
  movie: Movie
  onSwipe?: (direction: "left" | "right") => void
}

export function MovieCard({ movie, onSwipe }: MovieCardProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const isSwiped = useSharedValue(false)
  const scale = useSharedValue(1)

  useEffect(() => {
    // Smooth entrance when card mounts
    translateX.value = 0
    translateY.value = 0
    isSwiped.value = false
    scale.value = withSpring(1, { damping: 18, stiffness: 200 })
  }, [movie.id])

  const panGesture = Gesture.Pan()
    .enabled(!!onSwipe)
    .onBegin(() => {
      if (isSwiped.value) return
      // Slight scale-up on grab for tactile feel
      scale.value = withTiming(1.02, { duration: 120, easing: Easing.out(Easing.quad) })
    })
    .onChange((event) => {
      if (isSwiped.value) return
      translateX.value = event.translationX
      translateY.value = event.translationY * 0.35 // Dampen vertical drag
    })
    .onEnd((event) => {
      if (isSwiped.value) return

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        isSwiped.value = true
        const direction = event.translationX > 0 ? "right" : "left"
        const targetX = direction === "right" ? SCREEN_WIDTH * 1.4 : -SCREEN_WIDTH * 1.4
        const targetY = translateY.value + event.velocityY * 0.1

        translateX.value = withSpring(targetX, {
          velocity: event.velocityX,
          damping: 28,
          stiffness: 180,
          mass: 0.8,
        })
        translateY.value = withSpring(targetY, {
          velocity: event.velocityY,
          damping: 30,
          stiffness: 160,
        })
        scale.value = withTiming(0.95, { duration: 200, easing: Easing.in(Easing.quad) })

        onSwipe && runOnJS(onSwipe)(direction)
      } else {
        // Snappy spring return
        translateX.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.7 })
        translateY.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.7 })
        scale.value = withSpring(1, { damping: 18, stiffness: 250 })
      }
    })

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-28, 0, 28],
      Extrapolate.CLAMP
    )
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
    }
  })

  // Smooth like overlay — fades in progressively
  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.6, 1],
      Extrapolate.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, SWIPE_THRESHOLD],
          [0.8, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }))

  // Smooth nope overlay
  const nopeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
      [1, 0.6, 0],
      Extrapolate.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [-SWIPE_THRESHOLD, 0],
          [1, 0.8],
          Extrapolate.CLAMP
        ),
      },
    ],
  }))

  // Action button pulse based on swipe direction
  const likeButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, SWIPE_THRESHOLD],
          [1, 1.2],
          Extrapolate.CLAMP
        ),
      },
    ],
  }))

  const passButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [-SWIPE_THRESHOLD, 0],
          [1.2, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }))

  // Info card slides up slightly on swipe
  const infoCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          Math.abs(translateX.value),
          [0, SWIPE_THRESHOLD],
          [0, -6],
          Extrapolate.CLAMP
        ),
      },
    ],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          cardStyle,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 24,
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10,
            overflow: "hidden",
          },
        ]}
      >
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          className="absolute w-full h-full"
          resizeMode="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          className="absolute bottom-0 left-0 right-0 h-1/2"
          pointerEvents="none"
        />

        {/* NOPE Label */}
        <Animated.View
          style={[nopeOverlayStyle, { position: "absolute", top: 40, left: 30, transform: [{ rotate: "-20deg" }] }]}
          pointerEvents="none"
        >
          <View className="border-4 border-red-400 rounded-lg px-4 py-2">
            <Text className="text-3xl font-black text-red-400 tracking-widest">NOPE</Text>
          </View>
        </Animated.View>

        {/* LIKE Label */}
        <Animated.View
          style={[likeOverlayStyle, { position: "absolute", top: 40, right: 30, transform: [{ rotate: "20deg" }] }]}
          pointerEvents="none"
        >
          <View className="border-4 border-emerald-300 rounded-lg px-4 py-2">
            <Text className="text-3xl font-black text-emerald-300 tracking-widest">LIKE</Text>
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          style={[
            infoCardStyle,
            {
              position: "absolute",
              bottom: 100,
              left: 20,
              right: 20,
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
            },
          ]}
        >
          <Text className="text-2xl font-extrabold text-slate-900 mb-2" numberOfLines={2}>
            {movie.title}
          </Text>

          {movie.release_date && (
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text className="text-sm text-slate-500 font-semibold">
                {new Date(movie.release_date).getFullYear()}
              </Text>
            </View>
          )}

          {movie.vote_average > 0 && (
            <View className="flex-row items-center gap-1.5 mb-2.5">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-base font-bold text-slate-900">
                {movie.vote_average.toFixed(1)}/10
              </Text>
            </View>
          )}

          <Text className="text-sm text-slate-500 leading-relaxed" numberOfLines={3}>
            {movie.overview}
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <View className="absolute bottom-5 left-0 right-0 flex-row justify-center items-center gap-5">
          <Animated.View style={passButtonStyle}>
            <View
              className="w-16 h-16 rounded-full bg-white justify-center items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}
            >
              <Ionicons name="close" size={32} color="#ff6b6b" />
            </View>
          </Animated.View>

          <Animated.View style={likeButtonStyle}>
            <View
              className="w-[72px] h-[72px] rounded-full"
              style={{ shadowColor: "#ff8e53", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
            >
              <LinearGradient
                colors={["#ff6b6b", "#ff8e53", "#ffa94d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-full rounded-full justify-center items-center"
              >
                <Ionicons name="heart" size={36} color="#ffffff" />
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}