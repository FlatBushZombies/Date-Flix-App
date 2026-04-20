import { View, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import {
  FilmIcon,
  VideoCameraIcon,
  HeartIcon,
  HandRaisedIcon,
  SparklesIcon,
  ChartBarIcon,
  BellIcon,
  GlobeAltIcon,
  StarIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserIcon,
  FireIcon,
  TrophyIcon,
  MapIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  EyeSlashIcon,
  TrashIcon,
  ArrowRightIcon,
  ChatBubbleLeftIcon,
} from "react-native-heroicons/outline"
import {
  HeartIcon as HeartSolid,
  SparklesIcon as SparklesSolid,
  ShieldCheckIcon as ShieldSolid,
} from "react-native-heroicons/solid"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

// ─── Design tokens ────────────────────────────────────────────────────────────
// Single source of truth — one accent, one background family, consistent opacity scale
const T = {
  // Backgrounds
  bg:        "#07080f",   // deepest bg
  surface:   "#0e1018",   // card surface
  // Borders
  borderLo:  "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.13)",
  // Text
  textPrimary:   "#ffffff",
  textSecondary: "rgba(255,255,255,0.55)",
  textTertiary:  "rgba(255,255,255,0.30)",
  // Accent — single colour used everywhere
  accent:    "#ec4899",
  accentBg:  "rgba(236,72,153,0.12)",  // tinted surface
  accentRim: "rgba(236,72,153,0.28)",  // border on tinted surface
  // Type scale
  headingSize: 32,
  headingWeight: "700" as const,
  headingLine: 40,
  bodySize: 15,
  bodyLine: 24,
  labelSize: 11,
}

const SCREENS = [
  {
    id: 1,
    type: "hero",
    headline: "Never argue about\nwhat to watch again",
    subtext:
      "Swipe movies together and instantly discover what you both love. The perfect movie night starts here.",
    micro: "Join 2M+ couples finding their perfect match",
    cta: "Get Started",
    accent: "#ec4899",
    stats: [
      { value: "50K+", label: "Movies" },
      { value: "10M+", label: "Matches" },
      { value: "4.9", label: "Rating" },
    ],
  },
  {
    id: 2,
    type: "howItWorks",
    headline: "How It Works",
    subtext: "Three simple steps to movie night bliss",
    steps: [
      { icon: "hand-left", color: "#6b7280", title: "Swipe Left", text: "Not feeling it? Skip to the next one" },
      { icon: "heart",     color: "#ec4899", title: "Swipe Right", text: "Love it? Add it to your matches" },
      { icon: "sparkles",  color: "#8B5CF6", title: "It's a Match!", text: "When you both swipe right, it's movie time" },
    ],
    cta: "Next",
    accent: "#ec4899",
  },
  {
    id: 3,
    type: "features",
    headline: "Packed with\nSmart Features",
    features: [
      { icon: "analytics",      color: "#06b6d4", title: "AI-Powered Recommendations", text: "Our algorithm learns your taste and suggests movies you'll both enjoy" },
      { icon: "notifications",  color: "#ec4899", title: "Real-Time Notifications",    text: "Get instant alerts when you have a new match" },
      { icon: "globe",          color: "#10b981", title: "Streaming Info",             text: "See where each movie is available to watch" },
      { icon: "star",           color: "#eab308", title: "Ratings & Reviews",          text: "IMDB, Rotten Tomatoes, and Metacritic scores" },
    ],
    cta: "Continue",
    accent: "#ec4899",
  },
  {
    id: 4,
    type: "social",
    headline: "Better Together",
    subtext: "Connect with your partner, friends, or family to start matching movies in real-time.",
    options: [
      { icon: "people",      color: "#06b6d4", title: "Match with Partner", text: "Sync up and swipe together" },
      { icon: "person-add",  color: "#8B5CF6", title: "Invite Friends",     text: "Create group sessions" },
      { icon: "person",      color: "#ec4899", title: "Go Solo",            text: "Discover new favorites alone" },
    ],
    cta: "Continue",
    accent: "#ec4899",
  },
  {
    id: 5,
    type: "genres",
    headline: "Every Genre,\nEvery Mood",
    subtext: "From action-packed blockbusters to cozy rom-coms, we've got it all covered.",
    genres: [
      { name: "Action",    emoji: "💥", color: "#ef4444" },
      { name: "Comedy",    emoji: "😂", color: "#f97316" },
      { name: "Drama",     emoji: "🎭", color: "#8B5CF6" },
      { name: "Horror",    emoji: "👻", color: "#6b7280" },
      { name: "Romance",   emoji: "💕", color: "#ec4899" },
      { name: "Sci-Fi",    emoji: "🚀", color: "#06b6d4" },
      { name: "Thriller",  emoji: "🔪", color: "#dc2626" },
      { name: "Animation", emoji: "✨", color: "#10b981" },
    ],
    cta: "Almost There",
    accent: "#ec4899",
  },
  {
    id: 6,
    type: "streaks",
    headline: "Make It a\nNightly Ritual",
    subtext: "Build habits, earn rewards, and never miss movie night again.",
    rewards: [
      { icon: "flame",   color: "#f97316", title: "Daily Streaks",       text: "Keep your matching streak alive" },
      { icon: "trophy",  color: "#eab308", title: "Achievements",        text: "Unlock badges and rewards" },
      { icon: "compass", color: "#06b6d4", title: "Personalized Picks",  text: "Better recommendations over time" },
    ],
    cta: "Next",
    accent: "#ec4899",
  },
  {
    id: 7,
    type: "privacy",
    headline: "Your Privacy\nMatters",
    subtext: "We take your data seriously. Here's what you should know:",
    privacyPoints: [
      { icon: "lock-closed",      color: "#10b981", text: "Your watch history stays private" },
      { icon: "shield-checkmark", color: "#06b6d4", text: "End-to-end encrypted data" },
      { icon: "eye-off",          color: "#8B5CF6", text: "No ads, no data selling" },
      { icon: "trash",            color: "#ec4899", text: "Delete your data anytime" },
    ],
    cta: "I Understand",
    accent: "#ec4899",
  },
  {
    id: 8,
    type: "final",
    headline: "Ready to Find\nYour Perfect Movie?",
    subtext: "Start swiping and discover what you'll watch tonight.",
    ctaPrimary: "Invite a Friend",
    ctaSecondary: "Start Solo",
    accent: "#ec4899",
    testimonials: [
      { text: "Finally ended the 'what should we watch' debate!", author: "Sarah K." },
      { text: "We've discovered so many great movies together.",   author: "Mike T." },
    ],
  },
]

// ─── Icon helpers (unchanged) ──────────────────────────────────────────────────

function StepIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "hand-left") return <HandRaisedIcon {...p} />
  if (name === "heart")     return <HeartIcon {...p} />
  return <SparklesIcon {...p} />
}

function FeatureIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "analytics")     return <ChartBarIcon {...p} />
  if (name === "notifications") return <BellIcon {...p} />
  if (name === "globe")         return <GlobeAltIcon {...p} />
  if (name === "star")          return <StarIcon {...p} />
  return <SparklesIcon {...p} />
}

function OptionIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "people")      return <UserGroupIcon {...p} />
  if (name === "person-add")  return <UserPlusIcon {...p} />
  return <UserIcon {...p} />
}

function RewardIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "flame")  return <FireIcon {...p} />
  if (name === "trophy") return <TrophyIcon {...p} />
  return <MapIcon {...p} />
}

function PrivacyIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "lock-closed")      return <LockClosedIcon {...p} />
  if (name === "shield-checkmark") return <ShieldCheckIcon {...p} />
  if (name === "eye-off")          return <EyeSlashIcon {...p} />
  return <TrashIcon {...p} />
}

// ─── Shared UI primitives ──────────────────────────────────────────────────────

// Solid pill CTA — consistent accent colour, no per-screen gradient shift
function CTAButton({
  label,
  onPress,
  onPressIn,
  onPressOut,
  animStyle,
  iconLeft,
  iconRight,
}: {
  label: string
  onPress: () => void
  onPressIn: () => void
  onPressOut: () => void
  animStyle: object
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}) {
  return (
    <Animated.View style={[{ width: "100%" }, animStyle]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        activeOpacity={0.88}
        style={{
          width: "100%",
          height: 58,
          borderRadius: 18,
          backgroundColor: T.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          // Subtle glow — only on iOS (elevation on Android avoids artefact)
          shadowColor: T.accent,
          shadowOpacity: 0.38,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        {iconLeft}
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.1 }}>
          {label}
        </Text>
        {iconRight}
      </TouchableOpacity>
    </Animated.View>
  )
}

// Ghost button with a visible border
function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: "100%",
        height: 58,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: T.borderMid,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", color: T.textSecondary }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// Card row — crisp border, readable surface
function RowCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 14,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: T.borderLo,
        ...style,
      }}
    >
      {children}
    </View>
  )
}

// Icon box — uses explicit rgba so hex-alpha shorthand (#color20) isn't needed
function IconBox({ color, children }: { color: string; children: React.ReactNode }) {
  // Convert a 6-digit hex to rgba at 15% opacity for RN compatibility
  const hex = color.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const bg = `rgba(${r},${g},${b},0.14)`
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        flexShrink: 0,
      }}
    >
      {children}
    </View>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(0)
  const screen = SCREENS[currentScreen]

  const scale = useSharedValue(1)
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn  = () => { scale.value = withSpring(0.97) }
  const handlePressOut = () => { scale.value = withSpring(1) }

  const completeOnboarding = async () => {
    try { await AsyncStorage.setItem("@onboarding_complete", "true") } catch {}
    router.replace("/(tabs)/home")
  }

  const handleNext = () => {
    if (currentScreen < SCREENS.length - 1) setCurrentScreen((p) => p + 1)
    else completeOnboarding()
  }
  const handleSkip = () => completeOnboarding()
  const handleBack = () => { if (currentScreen > 0) setCurrentScreen((p) => p - 1) }

  // ── Per-screen content ────────────────────────────────────────────────────
  const renderContent = () => {
    switch (screen.type) {

      case "hero":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 24 }}>
            {/* Illustration */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: "center" }}>
              <View style={{ width: 230, height: 185, position: "relative", alignItems: "center", justifyContent: "center" }}>
                {/* Left card */}
                <View style={{
                  position: "absolute", left: 0, top: 8,
                  width: 98, height: 140, borderRadius: 20, overflow: "hidden",
                  transform: [{ rotate: "-10deg" }],
                  shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 }, elevation: 8,
                }}>
                  <View style={{ flex: 1, backgroundColor: "#141726", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 50, height: 74, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}>
                      <FilmIcon size={32} color="#2d3654" strokeWidth={1.5} />
                    </View>
                    <View style={{ position: "absolute", bottom: 10, right: 10 }}>
                      <HeartSolid size={18} color={T.accent} />
                    </View>
                  </View>
                </View>
                {/* Right card */}
                <View style={{
                  position: "absolute", right: 0, top: 8,
                  width: 98, height: 140, borderRadius: 20, overflow: "hidden",
                  transform: [{ rotate: "10deg" }],
                  shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 }, elevation: 8,
                }}>
                  <View style={{ flex: 1, backgroundColor: "#141726", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 50, height: 74, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}>
                      <VideoCameraIcon size={32} color="#2d3654" strokeWidth={1.5} />
                    </View>
                    <View style={{ position: "absolute", bottom: 10, right: 10 }}>
                      <HeartSolid size={18} color={T.accent} />
                    </View>
                  </View>
                </View>
                {/* Centre heart */}
                <View style={{
                  position: "absolute", bottom: 0, zIndex: 10,
                  shadowColor: T.accent, shadowOpacity: 0.45, shadowRadius: 18,
                  shadowOffset: { width: 0, height: 4 }, elevation: 12,
                }}>
                  <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" }}>
                    <HeartSolid size={38} color="#fff" />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Stats row */}
            {"stats" in screen && screen.stats && (
              <Animated.View
                entering={FadeInUp.delay(300)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 18,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: T.borderLo,
                }}
              >
                {screen.stats.map((stat, i) => (
                  <View key={i} style={{ alignItems: "center", flex: 1 }}>
                    {i > 0 && (
                      <View style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 1, backgroundColor: T.borderLo }} />
                    )}
                    <Text style={{ fontSize: 24, fontWeight: "800", color: T.accent, letterSpacing: -0.5 }}>{stat.value}</Text>
                    <Text style={{ fontSize: T.labelSize, color: T.textTertiary, marginTop: 4, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" }}>{stat.label}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )

      case "howItWorks":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 12 }}>
            {"steps" in screen && screen.steps && screen.steps.map((step, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(200 + i * 120).springify()}>
                <RowCard>
                  {/* Step number */}
                  <View style={{
                    width: 26, height: 26, borderRadius: 13,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 1, borderColor: T.borderMid,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: T.textTertiary }}>{i + 1}</Text>
                  </View>
                  <IconBox color={step.color}>
                    <StepIcon name={step.icon} size={24} color={step.color} />
                  </IconBox>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: T.textPrimary, marginBottom: 3 }}>{step.title}</Text>
                    <Text style={{ fontSize: 13, color: T.textSecondary, lineHeight: 19 }}>{step.text}</Text>
                  </View>
                </RowCard>
              </Animated.View>
            ))}
          </View>
        )

      case "features":
        return (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 8, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {"features" in screen && screen.features && screen.features.map((feature, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(150 + i * 90).springify()}>
                <RowCard>
                  <IconBox color={feature.color}>
                    <FeatureIcon name={feature.icon} size={24} color={feature.color} />
                  </IconBox>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: T.textPrimary, marginBottom: 3 }}>{feature.title}</Text>
                    <Text style={{ fontSize: 13, color: T.textSecondary, lineHeight: 19 }}>{feature.text}</Text>
                  </View>
                </RowCard>
              </Animated.View>
            ))}
          </ScrollView>
        )

      case "social":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 20 }}>
            {/* Avatar pair illustration */}
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center", gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#06b6d4", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: T.bg }}>
                  <UserIcon size={28} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={{ width: 40, height: 1.5, backgroundColor: T.borderLo }} />
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: T.bg }}>
                  <UserIcon size={28} color="#fff" strokeWidth={1.8} />
                </View>
              </View>
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.12)" }}>
                <FilmIcon size={22} color="#a78bfa" strokeWidth={1.8} />
              </View>
            </Animated.View>

            {"options" in screen && screen.options && (
              <View style={{ gap: 10 }}>
                {screen.options.map((option, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(260 + i * 100).springify()}>
                    <RowCard>
                      <IconBox color={option.color}>
                        <OptionIcon name={option.icon} size={22} color={option.color} />
                      </IconBox>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: T.textPrimary, marginBottom: 3 }}>{option.title}</Text>
                        <Text style={{ fontSize: 13, color: T.textSecondary }}>{option.text}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={T.textTertiary} />
                    </RowCard>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "genres":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center" }}>
            {"genres" in screen && screen.genres && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
                {screen.genres.map((genre, i) => {
                  const hex = genre.color.replace("#", "")
                  const r = parseInt(hex.slice(0, 2), 16)
                  const g = parseInt(hex.slice(2, 4), 16)
                  const b = parseInt(hex.slice(4, 6), 16)
                  return (
                    <Animated.View key={i} entering={FadeInDown.delay(100 + i * 45).springify()}>
                      <View style={{
                        flexDirection: "row", alignItems: "center",
                        paddingHorizontal: 16, paddingVertical: 12, gap: 8,
                        borderRadius: 14,
                        backgroundColor: `rgba(${r},${g},${b},0.10)`,
                        borderWidth: 1,
                        borderColor: `rgba(${r},${g},${b},0.22)`,
                      }}>
                        <Text style={{ fontSize: 18 }}>{genre.emoji}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: genre.color }}>{genre.name}</Text>
                      </View>
                    </Animated.View>
                  )
                })}
              </View>
            )}
          </View>
        )

      case "streaks":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 22 }}>
            {/* Streak calendar */}
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center", gap: 14 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const active = day <= 4
                  return (
                    <View key={day} style={{ alignItems: "center", gap: 6 }}>
                      <View style={{
                        width: 38, height: 38, borderRadius: 12,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: active ? "#f97316" : "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: active ? "transparent" : T.borderLo,
                      }}>
                        <FireIcon size={16} color={active ? "#fff" : "#3d4560"} strokeWidth={1.8} />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#f97316" : T.textTertiary }}>
                        {["M", "T", "W", "T", "F", "S", "S"][day - 1]}
                      </Text>
                    </View>
                  )
                })}
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 52, fontWeight: "800", color: "#f97316", letterSpacing: -2 }}>4</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: T.textTertiary, marginTop: -4 }}>Day Streak!</Text>
              </View>
            </Animated.View>

            {"rewards" in screen && screen.rewards && (
              <View style={{ gap: 10 }}>
                {screen.rewards.map((reward, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(280 + i * 90).springify()}>
                    <RowCard>
                      <IconBox color={reward.color}>
                        <RewardIcon name={reward.icon} size={22} color={reward.color} />
                      </IconBox>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: T.textPrimary, marginBottom: 3 }}>{reward.title}</Text>
                        <Text style={{ fontSize: 13, color: T.textSecondary }}>{reward.text}</Text>
                      </View>
                    </RowCard>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "privacy":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 22 }}>
            {/* Shield icon */}
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center" }}>
              <View style={{
                width: 88, height: 88, borderRadius: 26,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(16,185,129,0.12)",
                borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
                shadowColor: "#10b981", shadowOpacity: 0.22, shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 }, elevation: 8,
              }}>
                <ShieldSolid size={46} color="#10b981" />
              </View>
            </Animated.View>

            {"privacyPoints" in screen && screen.privacyPoints && (
              <View style={{ gap: 12 }}>
                {screen.privacyPoints.map((point, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(230 + i * 90).springify()}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: T.borderLo, flexShrink: 0 }}>
                        <PrivacyIcon name={point.icon} size={20} color={point.color} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "500", color: "rgba(255,255,255,0.72)", flex: 1, lineHeight: 22 }}>{point.text}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            <Animated.View entering={FadeIn.delay(580)} style={{
              padding: 16, borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1, borderColor: T.borderLo,
            }}>
              <Text style={{ fontSize: 13, color: T.textTertiary, textAlign: "center", lineHeight: 20 }}>
                By continuing, you agree to our{" "}
                <Text style={{ color: "#10b981", fontWeight: "600" }}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={{ color: "#10b981", fontWeight: "600" }}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          </View>
        )

      case "final":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 22 }}>
            {/* Sparkle icon */}
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center" }}>
              <View style={{
                width: 88, height: 88, borderRadius: 26,
                alignItems: "center", justifyContent: "center",
                backgroundColor: T.accentBg,
                borderWidth: 1, borderColor: T.accentRim,
                shadowColor: T.accent, shadowOpacity: 0.28, shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 }, elevation: 8,
              }}>
                <SparklesSolid size={46} color={T.accent} />
              </View>
              {/* Confetti dots */}
              <View style={{ position: "absolute", top: -16, left: 0, right: 0, height: 90, overflow: "hidden" }}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={{
                    position: "absolute",
                    width: 7, height: 7, borderRadius: 3.5,
                    backgroundColor: [T.accent, "#8B5CF6", "#06b6d4", "#f97316", "#10b981", "#eab308"][i],
                    left: 20 + i * 48, top: [12, 28, 8, 36, 20, 32][i],
                    opacity: 0.7,
                  }} />
                ))}
              </View>
            </Animated.View>

            {"testimonials" in screen && screen.testimonials && (
              <View style={{ gap: 12 }}>
                {screen.testimonials.map((testimonial, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(280 + i * 130).springify()} style={{
                    padding: 18, borderRadius: 16,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1, borderColor: T.borderLo,
                  }}>
                    <ChatBubbleLeftIcon size={16} color={T.textTertiary} strokeWidth={1.8} />
                    <Text style={{ fontSize: 14, fontStyle: "italic", lineHeight: 22, marginTop: 9, color: "rgba(255,255,255,0.62)" }}>"{testimonial.text}"</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 9, color: T.textTertiary }}>— {testimonial.author}</Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      default:
        return null
    }
  }

  const isFinal = screen.type === "final"

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 58,
        height: 106,
      }}>
        {/* Back button or spacer */}
        {currentScreen > 0 ? (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 42, height: 42, borderRadius: 21,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1, borderColor: T.borderLo,
              }}
            >
              <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={{ width: 42 }} />
        )}

        {/* Progress pill — moved to header for cleaner bottom bar */}
        <Text style={{ fontSize: T.labelSize, fontWeight: "600", color: T.textTertiary, letterSpacing: 0.5 }}>
          {currentScreen + 1} / {SCREENS.length}
        </Text>

        {/* Skip */}
        {currentScreen < SCREENS.length - 1 ? (
          <Animated.View entering={FadeIn.delay(400)}>
            <TouchableOpacity
              onPress={handleSkip}
              style={{
                paddingHorizontal: 16, paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1, borderColor: T.borderLo,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: T.textTertiary }}>Skip</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* ── Animated slide ── */}
      <Animated.View
        key={currentScreen}
        entering={SlideInRight.duration(340).springify()}
        exiting={SlideOutLeft.duration(260)}
        style={{ flex: 1 }}
      >
        {/* Headline block */}
        <View style={{ paddingHorizontal: 28, paddingTop: 2, paddingBottom: 2 }}>
          <Animated.Text
            entering={FadeInUp.delay(80).springify()}
            style={{
              fontSize: T.headingSize,
              fontWeight: T.headingWeight,
              lineHeight: T.headingLine,
              letterSpacing: -0.6,
              color: T.textPrimary,
              marginBottom: 10,
            }}
          >
            {screen.headline}
          </Animated.Text>

          {"subtext" in screen && screen.subtext && (
            <Animated.Text
              entering={FadeInDown.delay(180).springify()}
              style={{ fontSize: T.bodySize, lineHeight: T.bodyLine, color: T.textSecondary }}
            >
              {screen.subtext}
            </Animated.Text>
          )}

          {"micro" in screen && screen.micro && (
            <Animated.View entering={FadeIn.delay(360)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <UserGroupIcon size={13} color={T.accent} strokeWidth={2} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: T.accent }}>{screen.micro}</Text>
            </Animated.View>
          )}
        </View>

        {/* Screen content */}
        {renderContent()}
      </Animated.View>

      {/* ── Bottom bar ── */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 46, gap: 10 }}>
        {/* Progress bar only — counter is now in the header */}
        <View style={{ width: "100%", height: 2.5, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
          <View style={{ height: "100%", borderRadius: 2, width: `${((currentScreen + 1) / SCREENS.length) * 100}%`, backgroundColor: T.accent }} />
        </View>

        {isFinal ? (
          <View style={{ gap: 10 }}>
            <CTAButton
              label={"ctaPrimary" in screen ? (screen as any).ctaPrimary : ""}
              onPress={handleNext}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              animStyle={animatedButtonStyle}
              iconLeft={<UserGroupIcon size={19} color="#fff" strokeWidth={2} />}
            />
            <GhostButton
              label={"ctaSecondary" in screen ? (screen as any).ctaSecondary : ""}
              onPress={completeOnboarding}
            />
          </View>
        ) : (
          <CTAButton
            label={"cta" in screen ? (screen as any).cta : ""}
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            animStyle={animatedButtonStyle}
            iconRight={<ArrowRightIcon size={19} color="#fff" strokeWidth={2.5} />}
          />
        )}
      </View>

    </View>
  )
}