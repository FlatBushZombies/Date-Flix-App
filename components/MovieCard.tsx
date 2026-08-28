"use client"

import type { Movie } from "@/types"
import { getMovieCredits, getMovieVideos } from "@/utils/tmdb"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState, type ReactNode } from "react"
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.22
const CARD_WIDTH = SCREEN_WIDTH - 40
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75

interface MovieCardProps {
  movie: Movie
  onSwipe?: (direction: "left" | "right") => void
  onSave?: (movie: Movie) => void
  onShare?: (movie: Movie) => void
  onTrailer?: (movie: Movie, youtubeKey: string) => void
  onWatchOnTv?: (movie: Movie) => void
  castingToTv?: boolean
}

// AI-powered mood analysis based on movie data
function analyzeMovieMood(movie: Movie): string[] {
  const moods: string[] = []

  // Rating-based moods
  if (movie.vote_average >= 8.5) moods.push("🎯 Masterpiece")
  else if (movie.vote_average >= 7.5) moods.push("⭐ Excellent")
  else if (movie.vote_average >= 6.5) moods.push("👍 Good")

  // Popularity-based trends
  if (movie.popularity > 100) moods.push("🔥 Trending")
  else if (movie.popularity > 50) moods.push("📈 Rising")

  // Release year analysis
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  if (year) {
    if (year >= 2023) moods.push("🆕 Fresh")
    else if (year >= 2010) moods.push("📽 Modern")
    else if (year >= 2000) moods.push("🎬 Contemporary")
    else if (year >= 1990) moods.push("📼 Classic")
    else moods.push("🎞 Timeless")
  }

  // Overview-based mood detection (simple keyword analysis)
  const overview = movie.overview?.toLowerCase() || ""
  if (overview.includes("love") || overview.includes("romance")) moods.push("💕 Romantic")
  if (overview.includes("action") || overview.includes("fight")) moods.push("💥 Action-Packed")
  if (overview.includes("comedy") || overview.includes("funny")) moods.push("😂 Hilarious")
  if (overview.includes("thriller") || overview.includes("suspense")) moods.push("🔪 Thrilling")
  if (overview.includes("horror") || overview.includes("scary")) moods.push("👻 Spooky")
  if (overview.includes("space") || overview.includes("sci-fi")) moods.push("🚀 Futuristic")

  return moods.slice(0, 4) // Limit to 4 mood tags
}

// Enhanced genre tags with AI insights
function getGenreTags(movie: Movie): string[] {
  const tags: string[] = []

  // Add mood analysis
  tags.push(...analyzeMovieMood(movie))

  // Add rating if not already covered by mood
  if (!tags.some(tag => tag.includes("⭐") || tag.includes("🎯") || tag.includes("👍"))) {
    tags.push(`${movie.vote_average.toFixed(1)} ⭐`)
  }

  return tags
}

export function MovieCard({ movie, onSwipe, onSave, onShare, onTrailer, onWatchOnTv, castingToTv }: MovieCardProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const isSwiped = useSharedValue(false)
  const scale = useSharedValue(1)
  const [cast, setCast] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  useEffect(() => {
    translateX.value = 0
    translateY.value = 0
    isSwiped.value = false
    scale.value = withSpring(1, { damping: 20, stiffness: 220 })
  }, [movie.id])

  // Loaded up front (not gated behind a tap) so cast and trailer are always
  // visible on the card, matching the rest of the card's "everything at a
  // glance" layout — no interaction needed to see what's there.
  useEffect(() => {
    let cancelled = false
    setCast([])
    setVideos([])
    setIsLoadingDetails(true)
    Promise.all([getMovieCredits(movie.id), getMovieVideos(movie.id)])
      .then(([creditsData, videosData]) => {
        if (cancelled) return
        if (creditsData?.cast) setCast(creditsData.cast.slice(0, 5))
        if (videosData?.results) {
          const trailers = videosData.results.filter(
            (v: any) => v.type === "Trailer" && v.site === "YouTube",
          )
          setVideos(trailers.slice(0, 1))
        }
      })
      .catch((error) => console.error("Error loading movie details:", error))
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false)
      })
    return () => {
      cancelled = true
    }
  }, [movie.id])

  // Mirrors the gesture's fly-off animation so tapping the Pass/Like buttons
  // looks the same as dragging the card off-screen.
  const triggerSwipe = (direction: "left" | "right") => {
    if (isSwiped.value) return
    isSwiped.value = true
    const targetX = direction === "right" ? SCREEN_WIDTH * 1.4 : -SCREEN_WIDTH * 1.4
    translateX.value = withSpring(targetX, { damping: 30, stiffness: 260, mass: 0.6 })
    translateY.value = withSpring(translateY.value, { damping: 30, stiffness: 220 })
    scale.value = withTiming(0.95, { duration: 120, easing: Easing.in(Easing.quad) })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSwipe && onSwipe(direction)
  }

  const panGesture = Gesture.Pan()
    .enabled(!!onSwipe)
    .maxPointers(1)
    .onBegin(() => {
      if (isSwiped.value) return
      scale.value = withTiming(1.01, { duration: 100, easing: Easing.out(Easing.quad) })
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
          damping: 30,
          stiffness: 260,
          mass: 0.6,
        })
        translateY.value = withSpring(targetY, {
          velocity: event.velocityY,
          damping: 30,
          stiffness: 220,
        })
        scale.value = withTiming(0.95, { duration: 120, easing: Easing.in(Easing.quad) })

        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
        onSwipe && runOnJS(onSwipe)(direction)
      } else {
        translateX.value = withSpring(0, { damping: 25, stiffness: 280, mass: 0.7 })
        translateY.value = withSpring(0, { damping: 25, stiffness: 280, mass: 0.7 })
        scale.value = withSpring(1, { damping: 20, stiffness: 250 })
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
  const [heroTag, ...restTags] = genreTags
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
          source={{ uri: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Deep gradient overlay — darker at bottom for text legibility */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.15)",
            "rgba(0,0,0,0.7)",
            "rgba(0,0,0,0.95)",
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "72%" }}
          pointerEvents="none"
        />

        {/* Top pills — hero mood tag + rating, at a glance, no interaction needed */}
        <View style={{ position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          {heroTag && (
            <View style={{
              backgroundColor: "rgba(20,18,22,0.75)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
              borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7,
            }}>
              <Text style={{ fontSize: 12.5, fontWeight: "800", color: "#fff" }}>{heroTag}</Text>
            </View>
          )}
          {movie.vote_average > 0 && (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: "rgba(20,18,22,0.75)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
            }}>
              <Ionicons name="star" size={12} color="#facc15" />
              <Text style={{ fontSize: 12.5, fontWeight: "800", color: "#fff" }}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* NOPE stamp */}
        <Animated.View
          style={[nopeOverlayStyle, { position: "absolute", top: 68, left: 24 }]}
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
          style={[likeOverlayStyle, { position: "absolute", top: 68, right: 24 }]}
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

        {/* Bottom info panel — everything about the movie visible up front,
            nothing hidden behind a tap-to-expand */}
        <ScrollView
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: CARD_HEIGHT * 0.8, paddingHorizontal: 22, paddingTop: 16 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Title + year */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 10, gap: 8 }}>
            <Text style={{
              fontSize: 27, fontWeight: "800", color: "#ffffff",
              letterSpacing: -0.5, flexShrink: 1
            }} numberOfLines={2}>
              {movie.title}
            </Text>
            {releaseYear && (
              <Text style={{ fontSize: 18, fontWeight: "300", color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>
                {releaseYear}
              </Text>
            )}
          </View>

          {/* Remaining mood/genre tags — hero tag already shown up top */}
          {restTags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {restTags.map((tag, i) => {
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
          )}

          {/* Overview — always fully visible, no expand needed */}
          {movie.overview && (
            <>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 7, textTransform: "uppercase" }}>
                Overview
              </Text>
              <Text style={{
                fontSize: 13.5, color: "rgba(255,255,255,0.75)",
                lineHeight: 19, marginBottom: 16
              }} numberOfLines={4}>
                {movie.overview}
              </Text>
            </>
          )}

          {/* Cast — loads automatically, always shown when available */}
          {(isLoadingDetails || cast.length > 0) && (
            <>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, marginBottom: 7, textTransform: "uppercase" }}>
                Cast
              </Text>
              {isLoadingDetails ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Loading cast...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {cast.slice(0, 3).map((actor, index) => (
                    <View key={actor.id || index} style={{ alignItems: "center", flex: 1 }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        justifyContent: "center", alignItems: "center",
                        marginBottom: 4
                      }}>
                        {actor.profile_path ? (
                          <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w185${actor.profile_path}` }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                          />
                        ) : (
                          <Image
                            source={require("@/assets/icons/user.png")}
                            style={{ width: 24, height: 24 }}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center" }} numberOfLines={2}>
                        {actor.name || 'Unknown'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* AI Insights */}
          {movie.vote_count > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 }}>
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                justifyContent: "center", alignItems: "center"
              }}>
                <Ionicons name="sparkles" size={12} color="#a855f7" />
              </View>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                {movie.popularity > 50 ? "High social buzz" : "Steady interest"} • {movie.vote_count.toLocaleString()} reviews
              </Text>
            </View>
          )}

          {/* Utility actions — save / share / cast / trailer, all clearly
              labeled in one row instead of floating unlabeled icons */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <UtilityPill
              icon={<Ionicons name="bookmark-outline" size={14} color="#fff" />}
              label="Save"
              onPress={() => onSave && onSave(movie)}
            />
            <UtilityPill
              icon={<Ionicons name="share-outline" size={14} color="#fff" />}
              label="Share"
              onPress={() => onShare && onShare(movie)}
            />
            {onWatchOnTv && (
              <UtilityPill
                icon={castingToTv ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="tv-outline" size={14} color="#fff" />}
                label={castingToTv ? "Casting…" : "Watch on TV"}
                onPress={() => !castingToTv && onWatchOnTv(movie)}
                disabled={castingToTv}
              />
            )}
            {videos.length > 0 && (
              <UtilityPill
                icon={<Ionicons name="play" size={14} color="#fff" />}
                label="Trailer"
                onPress={() => onTrailer && onTrailer(movie, videos[0].key)}
              />
            )}
          </View>

          {/* Pass / Like */}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24 }}>
            <Animated.View style={passButtonStyle}>
              <TouchableOpacity
                onPress={() => triggerSwipe("left")}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Pass on this movie"
                style={{
                  width: 58, height: 58, borderRadius: 29,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                  justifyContent: "center", alignItems: "center",
                }}>
                <Ionicons name="close" size={26} color="#ff4d6d" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={likeButtonStyle}>
              <TouchableOpacity
                onPress={() => triggerSwipe("right")}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Like this movie"
                style={{
                  width: 70, height: 70, borderRadius: 35,
                  backgroundColor: "#E8C547",
                  justifyContent: "center", alignItems: "center",
                  shadowColor: "#E8C547",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.55,
                  shadowRadius: 18,
                  elevation: 12,
                }}>
                <Image
                  source={require("@/assets/icons/love.png")}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  )
}

function UtilityPill({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: ReactNode
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{label}</Text>
    </TouchableOpacity>
  )
}
