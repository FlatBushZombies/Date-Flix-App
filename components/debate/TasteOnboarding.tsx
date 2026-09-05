import type { Movie } from "@/types"
import { TASTE_GENRES, TASTE_VIBES } from "@/lib/tasteTaxonomy"
import { fetchTrendingMovies } from "@/utils/tmdb"
import { Check, Sparkles } from "lucide-react-native"
import { useEffect, useState } from "react"
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"

const RED = "#E50914"

const GENRE_EMOJI: Record<string, string> = {
  romance: "💕",
  thriller: "🔪",
  comedy: "😂",
  drama: "🎭",
  action: "💥",
  horror: "👻",
  "sci-fi": "🚀",
  documentary: "🎞️",
}

const GENRES = TASTE_GENRES.map((g) => ({ value: g.value, label: g.label, emoji: GENRE_EMOJI[g.value] }))
const VIBES = TASTE_VIBES.map((v) => ({ value: v.value, label: v.label }))

const MIN_SEEDS = 3

export interface SeedMovie {
  title: string
  year: number | null
  tmdb_id: number | null
  poster_path: string | null
}

interface TasteOnboardingProps {
  onSubmit: (genres: string[], vibe: string | null, seedMovies: SeedMovie[]) => void
}

function StepCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: "#18161c",
      }}
    >
      <Text style={{ fontSize: 11, color: RED, letterSpacing: 1.5, marginBottom: 8, fontWeight: "700" }}>{step}</Text>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#14121A", marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 13, color: "#4b5563", marginBottom: 24 }}>{subtitle}</Text>
      {children}
    </Animated.View>
  )
}

function ContinueButton({ enabled, label, onPress }: { enabled: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.9}
      style={{
        width: "100%",
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: "center",
        marginTop: 24,
        backgroundColor: enabled ? RED : "#eceaea",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "600", color: enabled ? "#fff" : "#9a969e" }}>{label}</Text>
    </TouchableOpacity>
  )
}

// 3-step "For You" onboarding: genres → vibe → a few movies you like. Same
// visual language as components/steps/Step1Genre.tsx (card, step label,
// chip grid, pill CTA) but in the app's actual primary red instead of that
// flow's own scoped accent.
export function TasteOnboarding({ onSubmit }: TasteOnboardingProps) {
  const [step, setStep] = useState(0)
  const [genres, setGenres] = useState<string[]>([])
  const [vibe, setVibe] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Movie[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [seedIds, setSeedIds] = useState<number[]>([])

  useEffect(() => {
    fetchTrendingMovies()
      .then(setCandidates)
      .finally(() => setLoadingCandidates(false))
  }, [])

  const toggleGenre = (v: string) => {
    setGenres((prev) => (prev.includes(v) ? prev.filter((g) => g !== v) : [...prev, v]))
  }

  const toggleSeed = (id: number) => {
    setSeedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSubmit = () => {
    const seedMovies: SeedMovie[] = candidates
      .filter((m) => seedIds.includes(m.id))
      .map((m) => ({
        title: m.title,
        year: m.release_date ? new Date(m.release_date).getFullYear() : null,
        tmdb_id: m.id,
        poster_path: m.poster_path ?? null,
      }))
    onSubmit(genres, vibe, seedMovies)
  }

  return (
    <View style={{ padding: 20 }}>
      {step === 0 && (
        <StepCard step="Step 1 of 3" title="What do you love?" subtitle="Pick a few genres — the more the better">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {GENRES.map((g) => {
              const selected = genres.includes(g.value)
              return (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => toggleGenre(g.value)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: selected ? "rgba(229,9,20,0.08)" : "#fff",
                    borderWidth: selected ? 2 : 1.5,
                    borderColor: selected ? RED : "#e5e5e5",
                  }}
                >
                  <Text style={{ fontSize: 15 }}>{g.emoji}</Text>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: selected ? RED : "#14121A" }}>{g.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <ContinueButton enabled={genres.length > 0} label="Continue →" onPress={() => setStep(1)} />
        </StepCard>
      )}

      {step === 1 && (
        <StepCard step="Step 2 of 3" title="What's the vibe?" subtitle="How do you want to feel watching it?">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {VIBES.map((v) => {
              const selected = vibe === v.value
              return (
                <TouchableOpacity
                  key={v.value}
                  onPress={() => setVibe(v.value)}
                  activeOpacity={0.85}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    borderRadius: 999,
                    backgroundColor: selected ? RED : "#fff",
                    borderWidth: selected ? 0 : 1.5,
                    borderColor: "#e5e5e5",
                  }}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: selected ? "#fff" : "#14121A" }}>{v.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <ContinueButton enabled={!!vibe} label="Continue →" onPress={() => setStep(2)} />
        </StepCard>
      )}

      {step === 2 && (
        <StepCard
          step="Step 3 of 3"
          title="Pick a few you love"
          subtitle={`Choose at least ${MIN_SEEDS} movies you already like`}
        >
          {loadingCandidates ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={RED} />
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {candidates.slice(0, 15).map((m) => {
                const selected = seedIds.includes(m.id)
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleSeed(m.id)}
                    activeOpacity={0.85}
                    style={{ width: "30%" }}
                  >
                    <View
                      style={{
                        aspectRatio: 2 / 3,
                        borderRadius: 14,
                        overflow: "hidden",
                        borderWidth: selected ? 3 : 0,
                        borderColor: RED,
                        backgroundColor: "#eee",
                      }}
                    >
                      {m.poster_path && (
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w342${m.poster_path}` }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      )}
                      {selected && (
                        <View
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: RED,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={13} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "600", color: "#14121A", marginTop: 4 }}>
                      {m.title}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
          <ContinueButton
            enabled={seedIds.length >= MIN_SEEDS}
            label={seedIds.length >= MIN_SEEDS ? "Find My Movies" : `Pick ${MIN_SEEDS - seedIds.length} more`}
            onPress={handleSubmit}
          />
        </StepCard>
      )}

      <Animated.View entering={FadeIn.delay(200)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
        <Sparkles size={13} color="#9a969e" />
        <Text style={{ fontSize: 12, color: "#9a969e" }}>Powered by Gemini AI</Text>
      </Animated.View>
    </View>
  )
}
