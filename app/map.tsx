"use client"

import { supabase } from "@/lib/supabase"
import type { Movie } from "@/types"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
}

const GENRE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Action: "flash-outline",
  Adventure: "compass-outline",
  Animation: "color-wand-outline",
  Comedy: "happy-outline",
  Crime: "lock-closed-outline",
  Documentary: "film-outline",
  Drama: "book-outline",
  Family: "people-outline",
  Fantasy: "sparkles-outline",
  History: "hourglass-outline",
  Horror: "skull-outline",
  Music: "musical-notes-outline",
  Mystery: "help-circle-outline",
  Romance: "heart-outline",
  "Science Fiction": "planet-outline",
  "TV Movie": "tv-outline",
  Thriller: "pulse-outline",
  War: "shield-outline",
  Western: "trail-sign-outline",
}

const NODE_LAYOUT = [
  { x: 16, y: 18 },
  { x: 74, y: 24 },
  { x: 22, y: 62 },
  { x: 76, y: 68 },
]

const RANK_COLORS = ["#facc15", "#cbd5e1", "#f59e0b", "#64748b"]

function getGenreName(id: number) {
  return GENRE_MAP[id] ?? "Unknown"
}

function getGenreIcon(name: string): keyof typeof Ionicons.glyphMap {
  return GENRE_ICONS[name] ?? "film-outline"
}

function describeGenre(id: number) {
  const name = getGenreName(id)
  const descriptors: Record<string, string> = {
    Action: "High energy, edge-of-your-seat choices.",
    Adventure: "Big journeys and bold discoveries.",
    Animation: "Playful stories with heart.",
    Comedy: "Pure laughter and feel-good moments.",
    Crime: "Dark twists and clever mysteries.",
    Documentary: "Real stories with real emotion.",
    Drama: "Deep characters and emotional stakes.",
    Family: "Warm, shared movie moments.",
    Fantasy: "Magical worlds and imagination.",
    History: "Epic tales inspired by the past.",
    Horror: "Nighttime chills and suspense.",
    Music: "Rhythm-driven film journeys.",
    Mystery: "Clever puzzles and surprising reveals.",
    Romance: "Heartfelt connections and sparks.",
    "Science Fiction": "Futuristic thrills and wonder.",
    "TV Movie": "Comforting stories for cozy nights.",
    Thriller: "Tension, twists, and pulse-pounding pacing.",
    War: "Courage, conflict, and dramatic stakes.",
    Western: "Wide horizons and rugged adventure.",
  }
  return descriptors[name] ?? "A unique path in your movie tastes."
}

// Builds an SVG path string connecting node centers, in 0-100 viewBox units —
// matches NODE_LAYOUT's percentage coordinates 1:1, no pixel measurement needed.
function buildPathD(points: { x: number; y: number }[]) {
  if (points.length === 0) return ""
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
}

const PLACEHOLDER_NODES = [
  { id: 10749, name: "Romance", description: "Heartfelt date night vibes.", movies: [] as Movie[], position: NODE_LAYOUT[0], color: "#fb7185", count: 0 },
  { id: 35, name: "Comedy", description: "Laughs and fun picks.", movies: [] as Movie[], position: NODE_LAYOUT[1], color: "#fbbf24", count: 0 },
  { id: 14, name: "Fantasy", description: "Escapes into worlds.", movies: [] as Movie[], position: NODE_LAYOUT[2], color: "#8b5cf6", count: 0 },
  { id: 53, name: "Thriller", description: "Tension and surprises.", movies: [] as Movie[], position: NODE_LAYOUT[3], color: "#38bdf8", count: 0 },
]

export default function MapScreen() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [swipes, setSwipes] = useState<Array<{ movie_data: Movie | null; liked: boolean }>>([])
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)

  const fetchJourney = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setFetchError(false)

    // Bounded — genre-frequency stats don't need a user's entire swipe history,
    // and an unbounded query only gets slower the longer someone uses the app.
    const { data, error } = await supabase
      .from("swipes")
      .select("movie_data, liked")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("Genre Journey fetch error:", error)
      setFetchError(true)
    } else {
      setSwipes(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJourney()
  }, [user?.id])

  const likedSwipes = useMemo(
    () => swipes.filter((swipe) => swipe.liked && swipe.movie_data),
    [swipes],
  )

  const genreStats = useMemo(() => {
    const counts = new Map<number, number>()
    likedSwipes.forEach((swipe) => {
      const movie = swipe.movie_data
      if (!movie) return
      movie.genre_ids.forEach((genreId) => {
        counts.set(genreId, (counts.get(genreId) ?? 0) + 1)
      })
    })
    return counts
  }, [likedSwipes])

  const moviesByGenre = useMemo(() => {
    const map = new Map<number, Movie[]>()
    likedSwipes.forEach((swipe) => {
      const movie = swipe.movie_data
      if (!movie) return
      movie.genre_ids.forEach((genreId) => {
        const existing = map.get(genreId) ?? []
        if (!existing.some((m) => m.id === movie.id)) {
          existing.push(movie)
          map.set(genreId, existing)
        }
      })
    })
    return map
  }, [likedSwipes])

  const genreJourney = useMemo(() => {
    return Array.from(genreStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([genreId, count], index) => ({
        id: genreId,
        count,
        name: getGenreName(genreId),
        description: describeGenre(genreId),
        movies: moviesByGenre.get(genreId) ?? [],
        position: NODE_LAYOUT[index],
        color: ["#38bdf8", "#f472b6", "#facc15", "#a855f7"][index % 4],
      }))
  }, [genreStats, moviesByGenre])

  const isEmptyJourney = genreJourney.length === 0
  // Always the array actually rendered on the map — real journey, or the
  // placeholder set. Selection is derived from this, not from genreJourney,
  // so tapping a node always does something, even before you have real data.
  const genreNodes = isEmptyJourney ? PLACEHOLDER_NODES : genreJourney

  useEffect(() => {
    if (genreNodes.length > 0 && selectedGenreId === null) {
      setSelectedGenreId(genreNodes[0].id)
    }
  }, [genreNodes, selectedGenreId])

  const selectedGenre = useMemo(
    () => genreNodes.find((genre) => genre.id === selectedGenreId) ?? genreNodes[0] ?? null,
    [genreNodes, selectedGenreId],
  )

  const journeySummary = useMemo(() => {
    if (fetchError) {
      return {
        explored: 0,
        movies: 0,
        next: "Couldn't load your journey — check your connection.",
      }
    }

    if (genreJourney.length === 0) {
      return {
        explored: 0,
        movies: likedSwipes.length,
        next: "Swipe more movies to reveal your genre journey.",
      }
    }

    const most = genreJourney[0]
    return {
      explored: genreJourney.length,
      movies: likedSwipes.length,
      next: `Next stop: ${most.name} and the genres around it`,
    }
  }, [fetchError, genreJourney, likedSwipes.length])

  const pathD = useMemo(() => buildPathD(genreNodes.map((n) => n.position)), [genreNodes])

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={["#020617", "#08111f", "#111827"]}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-14 px-5">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-2xl bg-white/10 justify-center items-center border border-white/10"
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={24} color="#f8fafc" />
            </TouchableOpacity>
            <View className="flex-1 mx-4">
              <Text className="text-xs uppercase text-slate-400 tracking-[1.6px]">Genre Journey</Text>
              <Text className="text-2xl font-extrabold text-white">Your cinematic path</Text>
            </View>
          </View>

          <View className="mt-8 rounded-[32px] bg-slate-900/90 border border-white/10 p-5 shadow-lg shadow-cyan-500/10">
            <View className="flex-row justify-between gap-3">
              <View className="flex-1 rounded-3xl bg-white/5 p-4">
                <Text className="text-slate-400 uppercase tracking-[1px] text-[10px]">Tracked movies</Text>
                <Text className="text-3xl font-bold text-white mt-3">{journeySummary.movies}</Text>
              </View>
              <View className="flex-1 rounded-3xl bg-white/5 p-4">
                <Text className="text-slate-400 uppercase tracking-[1px] text-[10px]">Taste nodes</Text>
                <Text className="text-3xl font-bold text-white mt-3">{journeySummary.explored}</Text>
              </View>
            </View>
            <Text className="text-slate-300 text-sm mt-4">{journeySummary.next}</Text>
          </View>

          <View className="mt-6 rounded-[32px] bg-slate-900/90 border border-white/10 overflow-hidden shadow-lg shadow-cyan-500/10">
            <View className="p-5 border-b border-white/10">
              <Text className="text-slate-300 uppercase tracking-[1px] text-[10px]">Journey map</Text>
              <Text className="text-xl font-bold text-white mt-3">Explore the genres shaping your watchlist</Text>
            </View>

            <View className="relative h-72 bg-slate-950/95">
              <LinearGradient
                colors={["rgba(56,189,248,0.06)", "transparent"]}
                style={{ position: "absolute", width: "100%", height: "100%" }}
              />

              {fetchError ? (
                <View className="flex-1 items-center justify-center px-8">
                  <Ionicons name="cloud-offline-outline" size={36} color="#64748b" />
                  <Text className="text-slate-300 font-semibold mt-3 text-center">Couldn't load your journey</Text>
                  <Text className="text-slate-500 text-xs text-center mt-1">
                    This isn't your real data — try again below.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Connecting path — makes this read as a journey, not floating dots */}
                  <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute" }}>
                    <Path d={pathD} stroke="rgba(148,163,184,0.35)" strokeWidth={0.5} strokeDasharray="1.5,2" fill="none" />
                  </Svg>

                  {genreNodes.map((node, index) => (
                    <GenreNode
                      key={node.id}
                      node={node}
                      rank={index + 1}
                      selected={selectedGenre?.id === node.id}
                      onPress={() => setSelectedGenreId(node.id)}
                    />
                  ))}
                </>
              )}
            </View>
          </View>

          <View className="mt-6 rounded-[32px] bg-slate-900/90 border border-white/10 p-5 shadow-lg shadow-slate-950/20">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-x-2">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 12,
                    backgroundColor: (selectedGenre?.color ?? "#38bdf8") + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={getGenreIcon(selectedGenre?.name ?? "")}
                    size={16}
                    color={selectedGenre?.color ?? "#38bdf8"}
                  />
                </View>
                <View>
                  <Text className="text-slate-300 uppercase tracking-[1px] text-[10px]">Current node</Text>
                  <Text className="text-xl font-bold text-white">{selectedGenre?.name ?? "Keep swiping"}</Text>
                </View>
              </View>
              <View className="rounded-3xl bg-white/5 px-4 py-2">
                <Text className="text-slate-200 text-xs uppercase">{selectedGenre ? `Top ${selectedGenre.movies.length}` : "Start"}</Text>
              </View>
            </View>
            <Text className="text-slate-300 text-sm leading-6">{selectedGenre?.description ?? "Your personalized genre journey appears once you like a handful of movies."}</Text>

            {loading ? (
              <View className="mt-6 items-center justify-center">
                <ActivityIndicator size="large" color="#38bdf8" />
              </View>
            ) : fetchError ? (
              <View className="mt-6 rounded-3xl bg-white/5 p-5 border border-white/10">
                <Text className="text-slate-200 font-semibold mb-2">Couldn't load your journey</Text>
                <Text className="text-slate-400 text-sm leading-6 mb-4">
                  Something went wrong reaching the server. Check your connection and try again.
                </Text>
                <TouchableOpacity
                  onPress={fetchJourney}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading your genre journey"
                  className="self-start flex-row items-center gap-x-2 bg-white rounded-2xl px-5 py-3"
                >
                  <Ionicons name="refresh" size={16} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-sm">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : isEmptyJourney ? (
              <View className="mt-6 rounded-3xl bg-white/5 p-5 border border-white/10">
                <Text className="text-slate-200 font-semibold mb-2">No journey yet</Text>
                <Text className="text-slate-400 text-sm leading-6 mb-4">
                  Swipe right on movies to start building your genre map. The more you like, the more refined your journey becomes.
                </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.85}
                  className="self-start flex-row items-center gap-x-2 bg-white rounded-2xl px-5 py-3"
                >
                  <Ionicons name="film-outline" size={16} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-sm">Start Swiping</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mt-6 space-y-4">
                {selectedGenre?.movies.slice(0, 3).map((movie) => (
                  <View key={movie.id} className="rounded-3xl bg-white/5 border border-white/10 p-4">
                    <Text className="text-white font-semibold">{movie.title}</Text>
                    <Text className="text-slate-400 text-xs mt-1">{getGenreName(selectedGenre.id)} · {new Date(movie.release_date).getFullYear()}</Text>
                  </View>
                ))}
                {selectedGenre && selectedGenre.movies.length === 0 && (
                  <Text className="text-slate-400 text-sm">Like more movies in this genre to populate your journey node with favorites.</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function GenreNode({
  node,
  rank,
  selected,
  onPress,
}: {
  node: { id: number; name: string; count: number; position: { x: number; y: number }; color: string }
  rank: number
  selected: boolean
  onPress: () => void
}) {
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = selected
      ? withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true)
      : 0
  }, [selected])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.18 }],
  }))

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        position: "absolute",
        left: `${node.position.x}%`,
        top: `${node.position.y}%`,
        transform: [{ translateX: -28 }, { translateY: -28 }],
      }}
    >
      {selected && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -8,
              left: -8,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: node.color,
            },
            glowStyle,
          ]}
        />
      )}

      <View
        style={{
          height: 64,
          width: 64,
          borderRadius: 32,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2,
          borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.2)",
          backgroundColor: node.color + "22",
        }}
      >
        <View
          style={{
            height: 32,
            width: 32,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.1)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name={getGenreIcon(node.name)} size={16} color="#ffffff" />
        </View>

        {/* Rank badge */}
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: RANK_COLORS[rank - 1] ?? "#64748b",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#020617",
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#0f172a" }}>{rank}</Text>
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          top: 64,
          left: 0,
          width: 128,
          marginLeft: -32,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 18,
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <Text style={{ fontSize: 11, letterSpacing: 0.5, color: "#94a3b8", textTransform: "uppercase" }}>{node.name}</Text>
        <Text style={{ fontSize: 12, color: "#ffffff", fontWeight: "700" }}>{node.count} likes</Text>
      </View>
    </TouchableOpacity>
  )
}
