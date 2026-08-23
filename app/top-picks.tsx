import { useToast } from "@/components/Toast/ToastProvider"
import { EmptyState } from "@/components/ui/EmptyState"
import { color, radius, shadow } from "@/constants/theme"
import { useTopPicks, type TopPick } from "@/hooks/useTopPicks"
import { sendToStreamingApp } from "@/lib/tvCast"
import type { Movie } from "@/types"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { UpvoteIcon } from "@/components/icons/UpvoteIcon"
import { ChevronLeft, CloudOff, Film, Star, Tv } from "lucide-react-native"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

const POSTER_WIDTH = 132

// Shared press-feedback curve — quick and quiet, matches the app's toast/press recipe.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)

const RANK_STYLES = [
  { bg: "#facc15", fg: "#3f2c00" }, // gold
  { bg: "#cbd5e1", fg: "#1e293b" }, // silver
  { bg: "#f0a868", fg: "#3f2200" }, // bronze
]

function posterUri(path: string | null | undefined, size: "w342" | "w500" = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined
}

export default function TopPicksScreen() {
  const router = useRouter()
  const toast = useToast()
  const [sendingToTv, setSendingToTv] = useState(false)
  const {
    newMovies,
    topPicks,
    upvotedIds,
    loading,
    fetchError,
    isEmpty,
    toggleUpvote,
    refresh,
  } = useTopPicks()

  // Sends everyone's #1 upvoted pick to the TV. There's no video to cast
  // directly — this opens the title in a streaming app/web search, which has
  // its own Cast/AirPlay button once it's open (see lib/tvCast).
  const handleWatchOnTv = async () => {
    const favorite = topPicks[0]
    if (!favorite || sendingToTv) return

    setSendingToTv(true)
    try {
      const result = await sendToStreamingApp("", favorite.movie.title)
      if (result === "app") {
        toast.success("Sent to TV", `Opened ${favorite.movie.title}. Tap Cast or AirPlay to send it to your TV.`)
      } else {
        toast.info("Opened in browser", `Search results for "${favorite.movie.title}" opened — cast from there.`)
      }
    } catch {
      toast.error("Couldn't connect", "Failed to open the top pick. Check your connection and try again.")
    } finally {
      setSendingToTv(false)
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={color.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Top Picks</Text>
            <Text style={styles.heading}>What's worth watching</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {loading ? (
            <View style={{ marginTop: 96, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={color.info} />
            </View>
          ) : fetchError ? (
            <EmptyState
              icon={<CloudOff size={36} color={color.error} strokeWidth={1.6} />}
              title="Couldn't load Top Picks"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refresh}
              tintColor={color.error}
            />
          ) : isEmpty ? (
            <EmptyState
              icon={<Film size={36} color={color.textTertiary} strokeWidth={1.6} />}
              title="Nothing here yet"
              description="New releases will show up here as soon as they're available."
              tintColor={color.textTertiary}
            />
          ) : (
            <>
              {/* ── New Releases ── */}
              <View style={{ marginTop: 28 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.eyebrow}>New Releases</Text>
                  <Text style={styles.sectionTitle}>Fresh in theaters</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingRight: 4 }}
                  style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
                >
                  {newMovies.slice(0, 20).map((movie, index) => (
                    <NewMovieCard
                      key={movie.id}
                      movie={movie}
                      index={index}
                      upvoted={upvotedIds.has(movie.id)}
                      onToggleUpvote={() => toggleUpvote(movie)}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* ── Top 10 ── */}
              <View style={styles.topCard}>
                <View style={styles.topCardHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Top 10 Upvoted</Text>
                    <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Everyone's favorites</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    <LiveBadge />
                    {topPicks.length > 0 && (
                      <TouchableOpacity
                        onPress={handleWatchOnTv}
                        disabled={sendingToTv}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={`Watch ${topPicks[0].movie.title} on TV`}
                        style={[styles.watchTvBtn, sendingToTv && { opacity: 0.6 }]}
                      >
                        {sendingToTv ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Tv size={13} color="#ffffff" />
                        )}
                        <Text style={styles.watchTvBtnText}>
                          {sendingToTv ? "Connecting…" : "Watch on TV"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {topPicks.length === 0 ? (
                  <View style={{ padding: 24, alignItems: "center" }}>
                    <Text style={{ color: color.textSecondary, fontSize: 13, textAlign: "center" }}>
                      Be the first to upvote a movie above.
                    </Text>
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                    {topPicks.map((pick, index) => (
                      <TopPickRow
                        key={pick.movieId}
                        pick={pick}
                        rank={index + 1}
                        isLast={index === topPicks.length - 1}
                        upvoted={upvotedIds.has(pick.movieId)}
                        onToggleUpvote={() => toggleUpvote(pick.movie)}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function LiveBadge() {
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [])

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ scale: 0.85 + pulse.value * 0.3 }],
  }))

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, dotStyle]} />
      <Text style={styles.liveText}>Live</Text>
    </View>
  )
}

function NewMovieCard({
  movie,
  index,
  upvoted,
  onToggleUpvote,
}: {
  movie: Movie
  index: number
  upvoted: boolean
  onToggleUpvote: () => void
}) {
  const heartScale = useSharedValue(1)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    heartScale.value = withSequence(
      withTiming(1.25, { duration: 120, easing: EASE_OUT }),
      withTiming(1, { duration: 140, easing: EASE_OUT }),
    )
    onToggleUpvote()
  }

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }))

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <Animated.View
      entering={FadeInRight.delay(Math.min(index, 8) * 60).duration(320)}
      style={{ width: POSTER_WIDTH }}
    >
      <View style={styles.posterWrap}>
        <Image
          source={{ uri: posterUri(movie.poster_path) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {movie.vote_average > 0 && (
          <View style={styles.ratingPill}>
            <Star size={10} color="#facc15" fill="#facc15" />
            <Text style={styles.ratingPillText}>{movie.vote_average.toFixed(1)}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={upvoted ? `Remove upvote from ${movie.title}` : `Upvote ${movie.title}`}
          style={[styles.posterHeartBtn, upvoted && styles.posterHeartBtnActive]}
        >
          <Animated.View style={heartStyle}>
            <UpvoteIcon size={15} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Text numberOfLines={1} style={styles.posterTitle}>
        {movie.title}
      </Text>
      {year && <Text style={styles.posterYear}>{year}</Text>}
    </Animated.View>
  )
}

function TopPickRow({
  pick,
  rank,
  isLast,
  upvoted,
  onToggleUpvote,
}: {
  pick: TopPick
  rank: number
  isLast: boolean
  upvoted: boolean
  onToggleUpvote: () => void
}) {
  const medal = RANK_STYLES[rank - 1]
  const year = pick.movie.release_date ? new Date(pick.movie.release_date).getFullYear() : null
  const heartScale = useSharedValue(1)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    heartScale.value = withSequence(
      withTiming(1.2, { duration: 110, easing: EASE_OUT }),
      withTiming(1, { duration: 140, easing: EASE_OUT }),
    )
    onToggleUpvote()
  }

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }))

  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 40).duration(280)}
      style={[styles.rankRow, !isLast && styles.rankRowDivider]}
    >
      <View style={[styles.rankBadge, { backgroundColor: medal ? medal.bg : color.surfaceHigh }]}>
        <Text style={[styles.rankBadgeText, { color: medal ? medal.fg : color.textTertiary }]}>{rank}</Text>
      </View>

      <View style={styles.rankThumb}>
        <Image
          source={{ uri: posterUri(pick.movie.poster_path, "w342") }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.rankTitle}>
          {pick.movie.title}
        </Text>
        <Text style={styles.rankMeta}>
          {year ?? "—"} · {pick.upvoteCount} upvote{pick.upvoteCount === 1 ? "" : "s"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={upvoted ? `Remove upvote from ${pick.movie.title}` : `Upvote ${pick.movie.title}`}
        style={[styles.rankHeartBtn, upvoted && styles.rankHeartBtnActive]}
      >
        <Animated.View style={heartStyle}>
          <UpvoteIcon size={15} color={upvoted ? "#ffffff" : color.accentPink} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surfaceHigh,
    borderWidth: 1,
    borderColor: color.border,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: color.textSecondary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: color.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: color.textPrimary,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.success,
  },
  liveText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  watchTvBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: color.textPrimary,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  watchTvBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  posterWrap: {
    width: POSTER_WIDTH,
    height: POSTER_WIDTH * 1.5,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: color.surfaceHigh,
  },
  ratingPill: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  posterHeartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  posterHeartBtnActive: {
    backgroundColor: color.accentPink,
  },
  posterTitle: {
    color: color.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 8,
  },
  posterYear: {
    color: color.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  topCard: {
    marginTop: 36,
    borderRadius: 32,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
    ...shadow.md,
  },
  topCardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rankRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: color.surfaceHigh,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  rankThumb: {
    width: 44,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: color.surfaceHigh,
    marginRight: 12,
  },
  rankTitle: {
    color: color.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  rankMeta: {
    color: color.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  rankHeartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    backgroundColor: color.surfaceHigh,
    borderWidth: 1,
    borderColor: color.border,
  },
  rankHeartBtnActive: {
    backgroundColor: color.accentPink,
    borderColor: color.accentPink,
  },
})
