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
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75

interface MovieCardProps {
  movie: Movie
  onSwipe?: (direction: "left" | "right") => void
}

// Derive genre tags from vote_average and other fields (placeholder logic — replace with real genre data)
function getGenreTags(movie: Movie): string[] {
  const tags: string[] = []
  if (movie.vote_average >= 8) tags.push("⭐ Top Rated")
  if (movie.release_date) {
    const year = new Date(movie.release_date).getFullYear()
    if (year >= 2023) tags.push("🎬 New Release")
    else if (year < 2000) tags.push("🎞 Classic")
  }
  if (movie.vote_average > 0) tags.push(`${movie.vote_average.toFixed(1)} / 10`)
  return tags
}

export function MovieCard({ movie, onSwipe }: MovieCardProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const isSwiped = useSharedValue(false)
  const scale = useSharedValue(1)

  useEffect(() => {
    translateX.value = 0
    translateY.value = 0
    isSwiped.value = false
    scale.value = withSpring(1, { damping: 18, stiffness: 200 })
  }, [movie.id])

  const panGesture = Gesture.Pan()
    .enabled(!!onSwipe)
    .onBegin(() => {
      if (isSwiped.value) return
      scale.value = withTiming(1.02, { duration: 120, easing: Easing.out(Easing.quad) })
    })
    .onChange((event) => {
      if (isSwiped.value) return
      translateX.value = event.translationX
      translateY.value = event.translationY * 0.35
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

  const genreTags = getGenreTags(movie)
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          cardStyle,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 28,
            backgroundColor: "#111111",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.5,
            shadowRadius: 32,
            elevation: 20,
            overflow: "hidden",
          },
        ]}
      >
        {/* Full-bleed poster image */}
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Deep gradient overlay — darker at bottom for text legibility */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.15)",
            "rgba(0,0,0,0.65)",
            "rgba(0,0,0,0.92)",
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%" }}
          pointerEvents="none"
        />

        {/* Top bar — close + more */}
        <View style={{ position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center", alignItems: "center",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.2)"
          }}>
            <Ionicons name="close" size={18} color="#fff" />
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center", alignItems: "center",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.2)"
          }}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </View>
        </View>

        {/* NOPE stamp */}
        <Animated.View
          style={[nopeOverlayStyle, { position: "absolute", top: 44, left: 24 }]}
          pointerEvents="none"
        >
          <View style={{
            borderWidth: 3, borderColor: "#ff4d6d", borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 6,
            transform: [{ rotate: "-18deg" }]
          }}>
            <Text style={{ fontSize: 26, fontWeight: "900", color: "#ff4d6d", letterSpacing: 4 }}>NOPE</Text>
          </View>
        </Animated.View>

        {/* LIKE stamp */}
        <Animated.View
          style={[likeOverlayStyle, { position: "absolute", top: 44, right: 24 }]}
          pointerEvents="none"
        >
          <View style={{
            borderWidth: 3, borderColor: "#d4f576", borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 6,
            transform: [{ rotate: "18deg" }]
          }}>
            <Text style={{ fontSize: 26, fontWeight: "900", color: "#d4f576", letterSpacing: 4 }}>LIKE</Text>
          </View>
        </Animated.View>

        {/* Bottom info panel */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingBottom: 24, paddingTop: 16 }}>

          {/* Title + online dot */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
            <Text style={{
              fontSize: 28, fontWeight: "800", color: "#ffffff",
              letterSpacing: -0.5, flexShrink: 1
            }} numberOfLines={1}>
              {movie.title}
            </Text>
            {releaseYear && (
              <Text style={{ fontSize: 22, fontWeight: "300", color: "rgba(255,255,255,0.6)" }}>
                {releaseYear}
              </Text>
            )}
            {/* Online-style dot */}
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#4ade80", marginLeft: 2 }} />
          </View>

          {/* Badge tags row — styled like the app's colored pill tags */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {genreTags.map((tag, i) => {
              const colors = [
                { bg: "rgba(212,245,118,0.18)", border: "rgba(212,245,118,0.45)", text: "#d4f576" },
                { bg: "rgba(251,191,36,0.18)", border: "rgba(251,191,36,0.45)", text: "#fbbf24" },
                { bg: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.45)", text: "#c4b5fd" },
              ]
              const c = colors[i % colors.length]
              return (
                <View key={tag} style={{
                  backgroundColor: c.bg,
                  borderWidth: 1, borderColor: c.border,
                  borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: c.text }}>
                    {tag}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* Skills label */}
          {movie.overview && (
            <>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 7, textTransform: "uppercase" }}>
                Overview
              </Text>
              <Text style={{
                fontSize: 13.5, color: "rgba(255,255,255,0.7)",
                lineHeight: 19, marginBottom: 18
              }} numberOfLines={3}>
                {movie.overview}
              </Text>
            </>
          )}

          {/* Action buttons row — X, heart (yellow), chat */}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16 }}>

            {/* Pass button */}
            <Animated.View style={passButtonStyle}>
              <View style={{
                width: 58, height: 58, borderRadius: 29,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                justifyContent: "center", alignItems: "center",
              }}>
                <Ionicons name="close" size={26} color="#ff4d6d" />
              </View>
            </Animated.View>

            {/* Like button — gold/yellow gradient (matching $ button from image) */}
            <Animated.View style={likeButtonStyle}>
              <View style={{
                width: 70, height: 70, borderRadius: 35,
                backgroundColor: "#E8C547",
                justifyContent: "center", alignItems: "center",
                shadowColor: "#E8C547",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.55,
                shadowRadius: 18,
                elevation: 12,
              }}>
                <Ionicons name="heart" size={32} color="#111111" />
              </View>
            </Animated.View>

            {/* Chat / info button */}
            <View style={{
              width: 58, height: 58, borderRadius: 29,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
              justifyContent: "center", alignItems: "center",
            }}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}