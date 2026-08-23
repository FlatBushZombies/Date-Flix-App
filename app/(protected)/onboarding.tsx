import { View, Text, TouchableOpacity, Dimensions, ScrollView, Pressable } from "react-native"
import { useEffect, useState } from "react"
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
  ShieldCheckIcon as ShieldSolid,
  CheckIcon as CheckSolid,
} from "react-native-heroicons/solid"
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"

const { width, height } = Dimensions.get("window")

// Ease-out used for every press / on-screen transition below — the same
// curve the animate-expo recipes use for UI motion.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)

// ─── Design tokens ────────────────────────────────────────────────────────────
// Copies the reference design's structure (gray diagonal backdrop, white pill
// cards, dark selector carousel, pill CTA with an arrow badge) — only the
// accent color and all copy stay ours.
const T = {
  // Backgrounds
  bg:        "#e9e9e6",   // page background — flat warm gray (was pure white)
  wedge:     "#f5f5f3",   // lighter diagonal panel behind the header/hero
  surface:   "#ffffff",   // contrast surface — cards, icon boxes, back button
  dark:      "#18181c",   // dark selector card (genres carousel)
  // Borders
  borderLo:  "rgba(17,17,23,0.06)",
  borderMid: "rgba(17,17,23,0.10)",
  track:     "rgba(17,17,23,0.10)",
  // Text
  textPrimary:   "#15151c",
  textSecondary: "rgba(21,21,28,0.56)",
  textTertiary:  "rgba(21,21,28,0.36)",
  // Accent — single colour used everywhere, ours (not the reference's)
  accent:    "#ec4899",
  accentBg:  "rgba(236,72,153,0.12)",
  accentRim: "rgba(236,72,153,0.28)",
  // Type scale
  headingSize: 32,
  headingWeight: "800" as const,
  headingLine: 39,
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
    subtext: "From action-packed blockbusters to cozy rom-coms, we've got it all covered. Tap the ones you love.",
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

// Diagonal two-tone backdrop — the reference design's signature panel behind
// the header and hero content. Purely decorative, so it never intercepts touches.
function DiagonalBackdrop() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", backgroundColor: T.bg }}>
      <View
        style={{
          position: "absolute",
          width: width * 1.9,
          height: height * 0.85,
          top: -height * 0.22,
          left: -width * 0.55,
          backgroundColor: T.wedge,
          transform: [{ rotate: "-9deg" }],
        }}
      />
    </View>
  )
}

// Solid pill CTA — label left, circular arrow badge right. Matches the
// reference button shape; disabled state lightens the fill instead of
// swapping in a different color.
function CTAButton({
  label,
  onPress,
  onPressIn,
  onPressOut,
  animStyle,
  icon,
}: {
  label: string
  onPress: () => void
  onPressIn: () => void
  onPressOut: () => void
  animStyle: object
  icon?: React.ReactNode
}) {
  return (
    <Animated.View style={[{ width: "100%" }, animStyle]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          width: "100%",
          height: 60,
          borderRadius: 30,
          backgroundColor: T.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 26,
          paddingRight: 8,
          shadowColor: T.accent,
          shadowOpacity: 0.32,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {icon}
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.1 }}>
            {label}
          </Text>
        </View>
        <View
          style={{
            width: 44, height: 44, borderRadius: 22,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.22)",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
          }}
        >
          <ArrowRightIcon size={19} color="#fff" strokeWidth={2.4} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Ghost / secondary button — solid white pill, floats on the gray backdrop
function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: "100%",
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 30,
        backgroundColor: T.surface,
        shadowColor: "#1a1a2e",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700", color: T.textPrimary }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// Card row — the reference design's white option pill
function RowCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 18,
        gap: 14,
        borderRadius: 22,
        backgroundColor: T.surface,
        borderWidth: 1,
        borderColor: T.borderLo,
        shadowColor: "#1a1a2e",
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        ...style,
      }}
    >
      {children}
    </View>
  )
}

// Icon box — uses explicit rgba so hex-alpha shorthand (#color20) isn't needed.
// A border in the same colour (not just a tinted fill) keeps each swatch
// visually bounded instead of bleeding into the card behind it.
function IconBox({ color, children }: { color: string; children: React.ReactNode }) {
  const hex = color.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const bg = `rgba(${r},${g},${b},0.12)`
  const border = `rgba(${r},${g},${b},0.28)`
  return (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        flexShrink: 0,
      }}
    >
      {children}
    </View>
  )
}

// ─── Wake gate ─────────────────────────────────────────────────────────────────
// Mirrors the reference design's plain "tap to wake" interstitial: flat
// background, breathing icon with a radar pulse, tap anywhere to continue.
function WakeGate({ onWake }: { onWake: () => void }) {
  const breathe = useSharedValue(1)
  const ring = useSharedValue(0)
  const press = useSharedValue(1)

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: EASE_OUT }),
        withTiming(1, { duration: 900, easing: EASE_OUT }),
      ),
      -1,
      false,
    )
    ring.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false)
  }, [])

  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value * press.value }] }))
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring.value * 0.6 }],
    opacity: (1 - ring.value) * 0.35,
  }))

  const handlePress = () => {
    press.value = withSequence(
      withTiming(0.94, { duration: 90, easing: EASE_OUT }),
      withTiming(1, { duration: 160, easing: EASE_OUT }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onWake()
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Tap to begin"
      style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", gap: 22 }}
    >
      <View style={{ width: 140, height: 140, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[ringStyle, { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: T.accent }]} />
        <Animated.View
          style={[
            breatheStyle,
            {
              width: 96, height: 96, borderRadius: 48,
              alignItems: "center", justifyContent: "center",
              backgroundColor: T.accent,
              shadowColor: T.accent, shadowOpacity: 0.35, shadowRadius: 22,
              shadowOffset: { width: 0, height: 8 }, elevation: 10,
            },
          ]}
        >
          <HeartSolid size={42} color="#fff" />
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(200)} style={{ alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: T.textPrimary }}>Tap to begin</Text>
        <Text style={{ fontSize: 14, color: T.textSecondary }}>Let's find your perfect movie night</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500)}>
        <Ionicons name="hand-left-outline" size={22} color={T.textTertiary} />
      </Animated.View>
    </Pressable>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter()
  const [awake, setAwake] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(0)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Romance", "Comedy"])
  const screen = SCREENS[currentScreen]

  const scale = useSharedValue(1)
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // 120ms / ~3% scale — press feedback ceiling for something touched this often.
  const handlePressIn  = () => { scale.value = withTiming(0.97, { duration: 120, easing: EASE_OUT }) }
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 160, easing: EASE_OUT }) }

  const toggleGenre = (name: string) => {
    Haptics.selectionAsync()
    setSelectedGenres((prev) => (prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]))
  }

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

  if (!awake) {
    return <WakeGate onWake={() => setAwake(true)} />
  }

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
                  shadowColor: "#1a1a2e", shadowOpacity: 0.14, shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 }, elevation: 5,
                }}>
                  <View style={{ flex: 1, backgroundColor: T.wedge, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 50, height: 74, borderRadius: 12, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" }}>
                      <FilmIcon size={32} color="#d7d9e4" strokeWidth={1.5} />
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
                  shadowColor: "#1a1a2e", shadowOpacity: 0.14, shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 }, elevation: 5,
                }}>
                  <View style={{ flex: 1, backgroundColor: T.wedge, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 50, height: 74, borderRadius: 12, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" }}>
                      <VideoCameraIcon size={32} color="#d7d9e4" strokeWidth={1.5} />
                    </View>
                    <View style={{ position: "absolute", bottom: 10, right: 10 }}>
                      <HeartSolid size={18} color={T.accent} />
                    </View>
                  </View>
                </View>
                {/* Centre heart */}
                <View style={{
                  position: "absolute", bottom: 0, zIndex: 10,
                  shadowColor: T.accent, shadowOpacity: 0.35, shadowRadius: 18,
                  shadowOffset: { width: 0, height: 6 }, elevation: 10,
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
                  backgroundColor: T.surface,
                  borderRadius: 22,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: T.borderLo,
                  shadowColor: "#1a1a2e",
                  shadowOpacity: 0.06,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
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
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#06b6d4", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: T.wedge }}>
                  <UserIcon size={28} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={{ width: 40, height: 1.5, backgroundColor: T.borderMid }} />
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: T.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: T.wedge }}>
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
                    </RowCard>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "genres":
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
            {"genres" in screen && screen.genres && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 28, gap: 12 }}
              >
                {screen.genres.map((genre, i) => {
                  const isSelected = selectedGenres.includes(genre.name)
                  return (
                    <Animated.View key={i} entering={FadeInDown.delay(100 + i * 45).springify()}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => toggleGenre(genre.name)}
                        accessibilityRole="button"
                        accessibilityLabel={`${genre.name}${isSelected ? ", selected" : ""}`}
                        style={{
                          width: 108, height: 122, borderRadius: 22,
                          backgroundColor: T.dark,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? T.accent : "rgba(255,255,255,0.10)",
                          alignItems: "center", justifyContent: "center",
                          padding: 12,
                        }}
                      >
                        {isSelected && (
                          <View style={{
                            position: "absolute", top: 8, right: 8,
                            width: 20, height: 20, borderRadius: 10,
                            backgroundColor: T.accent, alignItems: "center", justifyContent: "center",
                          }}>
                            <CheckSolid size={11} color="#fff" />
                          </View>
                        )}
                        <Text style={{ fontSize: 28, marginBottom: 8 }}>{genre.emoji}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", textAlign: "center" }}>{genre.name}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )
                })}
              </ScrollView>
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
                        backgroundColor: active ? "#f97316" : T.surface,
                        borderWidth: 1,
                        borderColor: active ? "rgba(0,0,0,0.08)" : T.borderLo,
                      }}>
                        <FireIcon size={16} color={active ? "#fff" : "#c4c7d4"} strokeWidth={1.8} />
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
                      <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: T.surface, borderWidth: 1, borderColor: T.borderLo, flexShrink: 0 }}>
                        <PrivacyIcon name={point.icon} size={20} color={point.color} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "500", color: "rgba(21,21,28,0.78)", flex: 1, lineHeight: 22 }}>{point.text}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            <Animated.View entering={FadeIn.delay(580)} style={{
              padding: 16, borderRadius: 18,
              backgroundColor: T.surface,
              shadowColor: "#1a1a2e", shadowOpacity: 0.05, shadowRadius: 12,
              shadowOffset: { width: 0, height: 2 }, elevation: 1,
            }}>
              <Text style={{ fontSize: 13, color: T.textTertiary, textAlign: "center", lineHeight: 20 }}>
                By continuing, you agree to our{" "}
                <Text style={{ color: T.textSecondary, fontWeight: "600" }}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={{ color: T.textSecondary, fontWeight: "600" }}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          </View>
        )

      case "final":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 22 }}>
            {"testimonials" in screen && screen.testimonials && (
              <View style={{ gap: 12 }}>
                {screen.testimonials.map((testimonial, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(280 + i * 130).springify()} style={{
                    padding: 18, borderRadius: 20,
                    backgroundColor: T.surface,
                    shadowColor: "#1a1a2e", shadowOpacity: 0.06, shadowRadius: 14,
                    shadowOffset: { width: 0, height: 4 }, elevation: 2,
                  }}>
                    <ChatBubbleLeftIcon size={16} color={T.textTertiary} strokeWidth={1.8} />
                    <Text style={{ fontSize: 14, fontStyle: "italic", lineHeight: 22, marginTop: 9, color: "rgba(21,21,28,0.68)" }}>"{testimonial.text}"</Text>
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
  // Screens built around a centered illustration/carousel read the headline
  // centered too, so the whole screen reads as one aligned block instead of
  // a left-anchored title floating over centered content. List-driven
  // screens (howItWorks, features) keep their left-aligned reading flow.
  const isCentered = isFinal || ["hero", "social", "streaks", "privacy", "genres"].includes(screen.type)

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <DiagonalBackdrop />

      {/* ── Header ── */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 20,
        paddingTop: 58,
        height: 106,
      }}>
        {/* Back button or spacer */}
        {currentScreen > 0 ? (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                width: 44, height: 44, borderRadius: 22,
                alignItems: "center", justifyContent: "center",
                backgroundColor: T.surface,
              }}
            >
              <Ionicons name="chevron-back" size={20} color={T.textPrimary} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={{ width: 44 }} />
        )}

        {/* Slim progress bar */}
        <View style={{ flex: 1, height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: T.track }}>
          <View style={{ height: "100%", borderRadius: 3, width: `${((currentScreen + 1) / SCREENS.length) * 100}%`, backgroundColor: T.accent }} />
        </View>

        {/* Skip — kept minimal, no pill, so it doesn't fight the design */}
        {currentScreen < SCREENS.length - 1 && (
          <Animated.View entering={FadeIn.delay(400)}>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: T.textTertiary }}>Skip</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* ── Animated slide ── */}
      <Animated.View
        key={currentScreen}
        entering={SlideInRight.duration(340).springify()}
        exiting={SlideOutLeft.duration(260)}
        style={{ flex: 1 }}
      >
        {/* Success badge — final screen only, sits above the headline */}
        {isFinal && (
          <Animated.View
            entering={ZoomIn.delay(80).springify().damping(14)}
            style={{ alignItems: "center", paddingTop: 4, paddingBottom: 6 }}
          >
            <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
              {/* Confetti dots */}
              <View style={{ position: "absolute", top: -18, left: -30, right: -30, height: 110, overflow: "hidden" }}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={{
                    position: "absolute",
                    width: 7, height: 7, borderRadius: 3.5,
                    backgroundColor: [T.accent, "#8B5CF6", "#06b6d4", "#f97316", "#10b981", "#eab308"][i],
                    left: 12 + i * 34, top: [14, 30, 6, 38, 20, 32][i],
                    opacity: 0.6,
                  }} />
                ))}
              </View>
              <View style={{
                width: 96, height: 96, borderRadius: 48,
                alignItems: "center", justifyContent: "center",
                backgroundColor: T.accentBg,
                borderWidth: 1, borderColor: T.accentRim,
                shadowColor: T.accent, shadowOpacity: 0.22, shadowRadius: 22,
                shadowOffset: { width: 0, height: 8 }, elevation: 6,
              }}>
                <View style={{
                  width: 66, height: 66, borderRadius: 33,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: T.accent,
                }}>
                  <CheckSolid size={32} color="#fff" />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Headline block */}
        <View style={{ paddingHorizontal: 28, paddingTop: 2, paddingBottom: 2 }}>
          <Animated.Text
            entering={FadeInUp.delay(80).springify()}
            style={{
              fontSize: T.headingSize,
              fontWeight: T.headingWeight,
              lineHeight: T.headingLine,
              letterSpacing: -0.8,
              color: T.textPrimary,
              marginBottom: 10,
              textAlign: isCentered ? "center" : "left",
            }}
          >
            {screen.headline}
          </Animated.Text>

          {"subtext" in screen && screen.subtext && (
            <Animated.Text
              entering={FadeInDown.delay(180).springify()}
              style={{
                fontSize: T.bodySize,
                lineHeight: T.bodyLine,
                color: T.textSecondary,
                textAlign: isCentered ? "center" : "left",
              }}
            >
              {screen.subtext}
            </Animated.Text>
          )}

          {"micro" in screen && screen.micro && (
            <Animated.View entering={FadeIn.delay(360)} style={{ flexDirection: "row", alignItems: "center", justifyContent: isCentered ? "center" : "flex-start", gap: 6, marginTop: 10 }}>
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
        {isFinal ? (
          <View style={{ gap: 10 }}>
            <CTAButton
              label={"ctaPrimary" in screen ? (screen as any).ctaPrimary : ""}
              onPress={handleNext}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              animStyle={animatedButtonStyle}
              icon={<UserGroupIcon size={19} color="#fff" strokeWidth={2} />}
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
          />
        )}
      </View>

    </View>
  )
}
