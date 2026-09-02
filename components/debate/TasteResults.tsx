import type { TasteRecommendation } from "@/hooks/useTasteEngine"
import type { FeedbackRow, TasteProfileRow } from "@/utils/supabase-helpers"
import { searchMovieByTitle } from "@/utils/tmdb"
import { Flame, RefreshCw, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react-native"
import { useEffect, useState } from "react"
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

const RED = "#E50914"
const BG = "#fffafa"
const CARD = "#ffffff"
const CARD_BORDER = "#eceaea"
const TEXT_PRIMARY = "#14121A"
const TEXT_MUTED = "#6b7280"
const TEXT_FAINT = "#9a969e"
const FILL_SUBTLE = "#f3f4f6"

function MatchRing({ score, size = 44 }: { score: number; size?: number }) {
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100)

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={RED}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          rotation={-90}
          origin={[size / 2, size / 2]}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: TEXT_PRIMARY }}>{score}%</Text>
      </View>
    </View>
  )
}

function RecommendationCard({
  rec,
  onLike,
  onDislike,
}: {
  rec: TasteRecommendation
  onLike: () => void
  onDislike: () => void
}) {
  const posterUri = rec.tmdb?.poster_path ? `https://image.tmdb.org/t/p/w342${rec.tmdb.poster_path}` : null
  const rated = rec.rating !== null

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      layout={Layout.springify()}
      style={{
        flexDirection: "row",
        backgroundColor: CARD,
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        opacity: rated ? 0.55 : 1,
      }}
    >
      <View style={{ width: 64, height: 92, borderRadius: 12, overflow: "hidden", backgroundColor: "#eee" }}>
        {posterUri && <Image source={{ uri: posterUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />}
      </View>

      <View style={{ flex: 1, marginLeft: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "800", color: TEXT_PRIMARY }}>
              {rec.title}
            </Text>
            {rec.year && <Text style={{ fontSize: 11, color: TEXT_FAINT, marginTop: 1 }}>{rec.year}</Text>}
          </View>
          <MatchRing score={rec.matchScore} />
        </View>

        <Text numberOfLines={2} style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 16, marginTop: 4 }}>
          {rec.reason}
        </Text>

        {!rated ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={onDislike}
              activeOpacity={0.8}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                backgroundColor: FILL_SUBTLE,
              }}
            >
              <ThumbsDown size={13} color={TEXT_MUTED} />
              <Text style={{ fontSize: 11.5, fontWeight: "700", color: TEXT_MUTED }}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onLike}
              activeOpacity={0.8}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                backgroundColor: RED,
              }}
            >
              <ThumbsUp size={13} color="#fff" />
              <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#fff" }}>Love it</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 11, fontWeight: "700", color: rec.rating === "liked" ? "#16a34a" : TEXT_FAINT, marginTop: 8 }}>
            {rec.rating === "liked" ? "✓ Added to your taste" : "Noted — won't suggest this again"}
          </Text>
        )}
      </View>
    </Animated.View>
  )
}

// Longest run of "liked" ratings counting back from the most recent
// (feedback is already sorted newest-first) — a small gamification touch
// this tracker has and a one-shot planner never could, since it has no
// concept of history across sessions.
function currentStreak(feedback: FeedbackRow[]): number {
  let n = 0
  for (const f of feedback) {
    if (!f.liked) break
    n++
  }
  return n
}

function TasteProfileStrip({ profile, onEdit }: { profile: TasteProfileRow; onEdit: () => void }) {
  return (
    <View
      style={{
        backgroundColor: CARD, borderRadius: 18, padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: CARD_BORDER,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: TEXT_FAINT, letterSpacing: 1, textTransform: "uppercase" }}>
          Your Taste Profile
        </Text>
        <TouchableOpacity onPress={onEdit} activeOpacity={0.8}>
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: RED }}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {profile.vibe && (
          <View style={{ backgroundColor: "rgba(229,9,20,0.08)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: RED, textTransform: "capitalize" }}>{profile.vibe}</Text>
          </View>
        )}
        {profile.genres.map((g) => (
          <View key={g} style={{ backgroundColor: FILL_SUBTLE, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: TEXT_MUTED, textTransform: "capitalize" }}>{g}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function StatsRow({ feedback }: { feedback: FeedbackRow[] }) {
  if (feedback.length === 0) return null
  const loved = feedback.filter((f) => f.liked).length
  const passed = feedback.length - loved
  const streak = currentStreak(feedback)

  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
      <StatPill label="Rated" value={String(feedback.length)} />
      <StatPill label="Loved" value={String(loved)} tint="#16a34a" />
      <StatPill label="Passed" value={String(passed)} />
      {streak >= 2 && (
        <View style={{
          flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
          backgroundColor: "rgba(229,9,20,0.08)", borderRadius: 14, paddingVertical: 10,
        }}>
          <Flame size={13} color={RED} />
          <Text style={{ fontSize: 13, fontWeight: "800", color: RED }}>{streak}</Text>
        </View>
      )}
    </View>
  )
}

function StatPill({ label, value, tint = TEXT_PRIMARY }: { label: string; value: string; tint?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 14, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: CARD_BORDER }}>
      <Text style={{ fontSize: 16, fontWeight: "800", color: tint }}>{value}</Text>
      <Text style={{ fontSize: 9.5, color: TEXT_FAINT, marginTop: 1 }}>{label}</Text>
    </View>
  )
}

interface LovedPoster {
  title: string
  posterPath: string | null
}

function LovedMoviesStrip({ feedback }: { feedback: FeedbackRow[] }) {
  const [posters, setPosters] = useState<LovedPoster[]>([])
  const loved = feedback.filter((f) => f.liked).slice(0, 10)

  useEffect(() => {
    if (loved.length === 0) return
    let cancelled = false
    Promise.all(
      loved.map(async (f) => {
        try {
          const tmdb = await searchMovieByTitle(f.movie_title, f.movie_year ?? undefined)
          return { title: f.movie_title, posterPath: tmdb?.poster_path ?? null }
        } catch {
          return { title: f.movie_title, posterPath: null }
        }
      }),
    ).then((results) => {
      if (!cancelled) setPosters(results)
    })
    return () => {
      cancelled = true
    }
    // Only re-run when the set of loved titles actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loved.map((f) => f.movie_title).join("|")])

  if (loved.length === 0) return null

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color: TEXT_PRIMARY, marginBottom: 10 }}>Movies You've Loved</Text>
      <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {posters.map((p, i) => (
          <View key={`${p.title}-${i}`} style={{ width: 64 }}>
            <View style={{ width: 64, height: 92, borderRadius: 10, overflow: "hidden", backgroundColor: "#eee" }}>
              {p.posterPath && (
                <Image source={{ uri: `https://image.tmdb.org/t/p/w185${p.posterPath}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              )}
            </View>
            <Text numberOfLines={1} style={{ fontSize: 9.5, color: TEXT_MUTED, marginTop: 3 }}>
              {p.title}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  )
}

interface TasteResultsProps {
  profile: TasteProfileRow | null | undefined
  feedback: FeedbackRow[]
  recommendations: TasteRecommendation[]
  loading: boolean
  loadingMessage: string
  error: string | null
  needsConsent: boolean
  onRate: (rec: TasteRecommendation, liked: boolean) => void
  onRefresh: () => void
  onRetake: () => void
  onEnableAI: () => void
}

// Card list — layout composition of poster thumb + title + circular match
// indicator + action row — recolored to match the app's shared light design
// language (white background, white cards, the app's primary red) instead of
// a screen-scoped dark theme. Distinct from Discover's one-shot planner: this
// screen tracks an evolving taste profile and a feedback history across
// sessions (profile strip, stats, streak, loved-movies history) instead of
// generating one throwaway plan and forgetting it.
export function TasteResults({ profile, feedback, recommendations, loading, loadingMessage, error, needsConsent, onRate, onRefresh, onRetake, onEnableAI }: TasteResultsProps) {
  const allRated = recommendations.length > 0 && recommendations.every((r) => r.rating !== null)

  if (loading && recommendations.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", padding: 40 }}>
        <ActivityIndicator color={RED} size="large" />
        <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700", marginTop: 16 }}>{loadingMessage}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: TEXT_PRIMARY }}>Picked For You</Text>
          <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Based on your taste profile</Text>
        </View>
        <TouchableOpacity
          onPress={onRetake}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: FILL_SUBTLE, alignItems: "center", justifyContent: "center" }}
        >
          <RotateCcw size={16} color={TEXT_MUTED} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {profile && <TasteProfileStrip profile={profile} onEdit={onRetake} />}
        <StatsRow feedback={feedback} />
        <LovedMoviesStrip feedback={feedback} />

        {needsConsent && (
          <Animated.View entering={FadeIn} style={{ padding: 16, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 16, gap: 10 }}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 13, lineHeight: 19 }}>
              Picks are generated by Google Gemini using the preferences you&apos;ve saved. Turn this on to see your recommendations.
            </Text>
            <TouchableOpacity
              onPress={onEnableAI}
              activeOpacity={0.85}
              style={{ alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: RED }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Enable AI Recommendations</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {error && !needsConsent && (
          <Animated.View entering={FadeIn} style={{ padding: 16, borderRadius: 16, backgroundColor: "rgba(229,9,20,0.08)", marginBottom: 16 }}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{error}</Text>
          </Animated.View>
        )}

        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.title}
            rec={rec}
            onLike={() => onRate(rec, true)}
            onDislike={() => onRate(rec, false)}
          />
        ))}

        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            paddingVertical: 15, borderRadius: 999, marginTop: 8,
            backgroundColor: allRated ? RED : FILL_SUBTLE,
            borderWidth: allRated ? 0 : 1,
            borderColor: "#e5e7eb",
          }}
        >
          {loading ? (
            <ActivityIndicator color={allRated ? "#fff" : TEXT_MUTED} size="small" />
          ) : (
            <RefreshCw size={15} color={allRated ? "#fff" : TEXT_MUTED} />
          )}
          <Text style={{ fontSize: 14, fontWeight: "700", color: allRated ? "#fff" : TEXT_MUTED }}>
            {allRated ? "Get New Recommendations" : "Refresh Recommendations"}
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  )
}
