"use client"

import { EmptyState as IllustratedEmptyState } from "@/components/EmptyState"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Movie } from "@/types"
import { getWatchlist, removeFromWatchlist } from "@/utils/supabase-helpers"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { CloudOff } from "lucide-react-native"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

const { width } = Dimensions.get("window")
const COLS = 2
const GAP = 14
const H_PADDING = 20
const POSTER_WIDTH = (width - H_PADDING * 2 - GAP * (COLS - 1)) / COLS
const POSTER_HEIGHT = POSTER_WIDTH * 1.5

const C = {
  bg: "#ffffff",
  surface: "#f9fafb",
  surfaceHigh: "#f3f4f6",
  border: "#e5e7eb",
  cyan: "#06b6d4",
  text: "#111827",
  textMuted: "#6b7280",
  textSub: "#9ca3af",
}

interface WatchlistRow {
  movie_id: number
  movie_data: Movie
  created_at: string
}

export default function WatchlistScreen() {
  const router = useRouter()
  const { user } = useUser()
  const [rows, setRows] = useState<WatchlistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (user) load()
  }, [user])

  const load = async () => {
    if (!user) return
    setLoadError(false)
    try {
      const data = await getWatchlist(user.id)
      if (data === null) {
        setLoadError(true)
      } else {
        setRows(data as WatchlistRow[])
      }
    } catch (error) {
      console.error("[v0] Error loading watchlist:", error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (movieId: number) => {
    if (!user) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRemovingId(movieId)
    const previous = rows
    setRows((prev) => prev.filter((r) => r.movie_id !== movieId))
    const ok = await removeFromWatchlist(user.id, movieId)
    if (!ok) setRows(previous) // revert on failure
    setRemovingId(null)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={C.cyan} />
        <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "600", color: C.textMuted }}>
          Loading watchlist…
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 44, height: 44, borderRadius: 22,
            alignItems: "center", justifyContent: "center",
            backgroundColor: C.surfaceHigh,
            borderWidth: 1, borderColor: C.border,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: C.text }}>Shared Watchlist</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            {rows.length === 0 ? "Nothing saved yet" : `${rows.length} ${rows.length === 1 ? "movie" : "movies"} saved`}
          </Text>
        </View>
      </View>

      {loadError ? (
        <EmptyState
          icon={<CloudOff size={40} color="#ef4444" strokeWidth={1.6} />}
          title="Couldn't Load Watchlist"
          description="Something went wrong reaching the server. Check your connection and try again."
          actionLabel="Retry"
          onAction={load}
          tintColor="#ef4444"
        />
      ) : rows.length === 0 ? (
        <IllustratedEmptyState
          title="No Saved Movies"
          description="Save movies while planning a movie night and they'll show up here for you and your partner."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
            {rows.map((row, i) => {
              const movie = row.movie_data
              return (
                <Animated.View
                  key={row.movie_id}
                  entering={FadeInDown.delay(Math.min(i, 8) * 60).springify()}
                  style={{ width: POSTER_WIDTH }}
                >
                  <View style={{ borderRadius: 18, overflow: "hidden", backgroundColor: C.surfaceHigh }}>
                    <Image
                      source={{ uri: movie?.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : undefined }}
                      style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT }}
                      resizeMode="cover"
                    />

                    {movie?.vote_average ? (
                      <View style={{
                        position: "absolute", top: 8, left: 8,
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
                      }}>
                        <Ionicons name="star" size={11} color="#fbbf24" />
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{movie.vote_average.toFixed(1)}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => handleRemove(row.movie_id)}
                      disabled={removingId === row.movie_id}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${movie?.title ?? "movie"} from watchlist`}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Ionicons name="bookmark" size={15} color={C.cyan} />
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginTop: 8 }} numberOfLines={2}>
                    {movie?.title ?? "Untitled"}
                  </Text>
                  {movie?.release_date ? (
                    <Text style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                      {new Date(movie.release_date).getFullYear()}
                    </Text>
                  ) : null}
                </Animated.View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
