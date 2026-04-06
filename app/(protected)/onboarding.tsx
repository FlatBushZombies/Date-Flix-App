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
      { icon: "heart", color: "#ec4899", title: "Swipe Right", text: "Love it? Add it to your matches" },
      { icon: "sparkles", color: "#8B5CF6", title: "It's a Match!", text: "When you both swipe right, it's movie time" },
    ],
    cta: "Next",
    accent: "#8B5CF6",
  },
  {
    id: 3,
    type: "features",
    headline: "Packed with\nSmart Features",
    features: [
      { icon: "analytics", color: "#06b6d4", title: "AI-Powered Recommendations", text: "Our algorithm learns your taste and suggests movies you'll both enjoy" },
      { icon: "notifications", color: "#f97316", title: "Real-Time Notifications", text: "Get instant alerts when you have a new match" },
      { icon: "globe", color: "#10b981", title: "Streaming Info", text: "See where each movie is available to watch" },
      { icon: "star", color: "#eab308", title: "Ratings & Reviews", text: "IMDB, Rotten Tomatoes, and Metacritic scores" },
    ],
    cta: "Continue",
    accent: "#06b6d4",
  },
  {
    id: 4,
    type: "social",
    headline: "Better Together",
    subtext: "Connect with your partner, friends, or family to start matching movies in real-time.",
    options: [
      { icon: "people", color: "#06b6d4", title: "Match with Partner", text: "Sync up and swipe together" },
      { icon: "person-add", color: "#8B5CF6", title: "Invite Friends", text: "Create group sessions" },
      { icon: "person", color: "#ec4899", title: "Go Solo", text: "Discover new favorites alone" },
    ],
    cta: "Continue",
    accent: "#06b6d4",
  },
  {
    id: 5,
    type: "genres",
    headline: "Every Genre,\nEvery Mood",
    subtext: "From action-packed blockbusters to cozy rom-coms, we've got it all covered.",
    genres: [
      { name: "Action", emoji: "💥", color: "#ef4444" },
      { name: "Comedy", emoji: "😂", color: "#f97316" },
      { name: "Drama", emoji: "🎭", color: "#8B5CF6" },
      { name: "Horror", emoji: "👻", color: "#6b7280" },
      { name: "Romance", emoji: "💕", color: "#ec4899" },
      { name: "Sci-Fi", emoji: "🚀", color: "#06b6d4" },
      { name: "Thriller", emoji: "🔪", color: "#dc2626" },
      { name: "Animation", emoji: "✨", color: "#10b981" },
    ],
    cta: "Almost There",
    accent: "#10b981",
  },
  {
    id: 6,
    type: "streaks",
    headline: "Make It a\nNightly Ritual",
    subtext: "Build habits, earn rewards, and never miss movie night again.",
    rewards: [
      { icon: "flame", color: "#f97316", title: "Daily Streaks", text: "Keep your matching streak alive" },
      { icon: "trophy", color: "#eab308", title: "Achievements", text: "Unlock badges and rewards" },
      { icon: "compass", color: "#06b6d4", title: "Personalized Picks", text: "Better recommendations over time" },
    ],
    cta: "Next",
    accent: "#f97316",
  },
  {
    id: 7,
    type: "privacy",
    headline: "Your Privacy\nMatters",
    subtext: "We take your data seriously. Here's what you should know:",
    privacyPoints: [
      { icon: "lock-closed", color: "#10b981", text: "Your watch history stays private" },
      { icon: "shield-checkmark", color: "#06b6d4", text: "End-to-end encrypted data" },
      { icon: "eye-off", color: "#8B5CF6", text: "No ads, no data selling" },
      { icon: "trash", color: "#ec4899", text: "Delete your data anytime" },
    ],
    cta: "I Understand",
    accent: "#10b981",
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
      { text: "We've discovered so many great movies together.", author: "Mike T." },
    ],
  },
]

// ─── Icon helpers ────────────────────────────────────────────────────────────

function StepIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "hand-left") return <HandRaisedIcon {...p} />
  if (name === "heart") return <HeartIcon {...p} />
  return <SparklesIcon {...p} />
}

function FeatureIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "analytics") return <ChartBarIcon {...p} />
  if (name === "notifications") return <BellIcon {...p} />
  if (name === "globe") return <GlobeAltIcon {...p} />
  if (name === "star") return <StarIcon {...p} />
  return <SparklesIcon {...p} />
}

function OptionIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "people") return <UserGroupIcon {...p} />
  if (name === "person-add") return <UserPlusIcon {...p} />
  return <UserIcon {...p} />
}

function RewardIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "flame") return <FireIcon {...p} />
  if (name === "trophy") return <TrophyIcon {...p} />
  return <MapIcon {...p} />
}

function PrivacyIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 1.8 as number }
  if (name === "lock-closed") return <LockClosedIcon {...p} />
  if (name === "shield-checkmark") return <ShieldCheckIcon {...p} />
  if (name === "eye-off") return <EyeSlashIcon {...p} />
  return <TrashIcon {...p} />
}

// ─── Shared button components ─────────────────────────────────────────────────

function CTAButton({
  label,
  accent,
  accentLight,
  onPress,
  onPressIn,
  onPressOut,
  animStyle,
  iconLeft,
  iconRight,
}: {
  label: string
  accent: string
  accentLight: string
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
        activeOpacity={0.9}
        style={{
          width: "100%",
          borderRadius: 20,
          overflow: "hidden",
          shadowColor: accent,
          shadowOpacity: 0.5,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={[accent, accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 22,
            gap: 10,
          }}
        >
          {iconLeft}
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.2 }}>
            {label}
          </Text>
          {iconRight}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 22,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.14)",
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: "700", color: "rgba(255,255,255,0.55)" }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Row card — shared across howItWorks / social / streaks ──────────────────

function RowCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 18,
        gap: 16,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      {children}
    </View>
  )
}

function IconBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}20`,
        flexShrink: 0,
      }}
    >
      {children}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(0)
  const screen = SCREENS[currentScreen]

  const scale = useSharedValue(1)
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => { scale.value = withSpring(0.97) }
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

  const accentLight = adjustColor(screen.accent)

  // ── Per-screen content — flex:1 + justifyContent:"center" fills the gap ──
  const renderContent = () => {
    switch (screen.type) {

      case "hero":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 28 }}>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: "center" }}>
              <View style={{ width: 230, height: 185, position: "relative", alignItems: "center", justifyContent: "center" }}>
                {/* Left card */}
                <View style={{ position: "absolute", left: 0, top: 8, width: 98, height: 140, borderRadius: 20, overflow: "hidden", transform: [{ rotate: "-10deg" }], shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
                  <LinearGradient colors={["#1e2235", "#0f1120"]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 50, height: 74, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                      <FilmIcon size={32} color="#2d3654" strokeWidth={1.5} />
                    </View>
                    <View style={{ position: "absolute", bottom: 10, right: 10 }}>
                      <HeartSolid size={18} color="#ec4899" />
                    </View>
                  </LinearGradient>
                </View>
                {/* Right card */}
                <View style={{ position: "absolute", right: 0, top: 8, width: 98, height: 140, borderRadius: 20, overflow: "hidden", transform: [{ rotate: "10deg" }], shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
                  <LinearGradient colors={["#1e2235", "#0f1120"]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 50, height: 74, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                      <VideoCameraIcon size={32} color="#2d3654" strokeWidth={1.5} />
                    </View>
                    <View style={{ position: "absolute", bottom: 10, right: 10 }}>
                      <HeartSolid size={18} color="#ec4899" />
                    </View>
                  </LinearGradient>
                </View>
                {/* Centre heart */}
                <View style={{ position: "absolute", bottom: 0, zIndex: 10, shadowColor: "#ec4899", shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 12 }}>
                  <LinearGradient colors={["#ec4899", "#f472b6"]} style={{ width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" }}>
                    <HeartSolid size={38} color="#fff" />
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>

            {"stats" in screen && screen.stats && (
              <Animated.View
                entering={FadeInUp.delay(300)}
                style={{ flexDirection: "row", justifyContent: "space-around", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
              >
                {screen.stats.map((stat, i) => (
                  <View key={i} style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 26, fontWeight: "900", color: screen.accent }}>{stat.value}</Text>
                    <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>{stat.label}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )

      case "howItWorks":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 14 }}>
            {"steps" in screen && screen.steps && screen.steps.map((step, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(200 + i * 140).springify()}>
                <RowCard>
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: `${step.color}25` }}>
                    <Text style={{ fontSize: 13, fontWeight: "900", color: step.color }}>{i + 1}</Text>
                  </View>
                  <IconBox color={step.color}>
                    <StepIcon name={step.icon} size={26} color={step.color} />
                  </IconBox>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 }}>{step.title}</Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 20 }}>{step.text}</Text>
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
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 8, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {"features" in screen && screen.features && screen.features.map((feature, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(150 + i * 100).springify()}>
                <RowCard style={{ backgroundColor: `${feature.color}0D` }}>
                  <IconBox color={feature.color}>
                    <FeatureIcon name={feature.icon} size={26} color={feature.color} />
                  </IconBox>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4 }}>{feature.title}</Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 20 }}>{feature.text}</Text>
                  </View>
                </RowCard>
              </Animated.View>
            ))}
          </ScrollView>
        )

      case "social":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 22 }}>
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center", gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#06b6d4", shadowColor: "#06b6d4", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
                  <UserIcon size={30} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={{ width: 48, height: 2, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }} />
                <View style={{ width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#ec4899", shadowColor: "#ec4899", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
                  <UserIcon size={30} color="#fff" strokeWidth={1.8} />
                </View>
              </View>
              <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(139,92,246,0.4)", backgroundColor: "rgba(139,92,246,0.18)" }}>
                <FilmIcon size={24} color="#fff" strokeWidth={1.8} />
              </View>
            </Animated.View>

            {"options" in screen && screen.options && (
              <View style={{ gap: 12 }}>
                {screen.options.map((option, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(300 + i * 100).springify()}>
                    <RowCard>
                      <IconBox color={option.color}>
                        <OptionIcon name={option.icon} size={24} color={option.color} />
                      </IconBox>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4 }}>{option.title}</Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{option.text}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
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
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {screen.genres.map((genre, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(100 + i * 50).springify()}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 8, borderRadius: 18, backgroundColor: `${genre.color}18`, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
                      <Text style={{ fontSize: 20 }}>{genre.emoji}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: genre.color }}>{genre.name}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "streaks":
        return (
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 24 }}>
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const active = day <= 4
                  return (
                    <View key={day} style={{ alignItems: "center", gap: 6 }}>
                      <LinearGradient
                        colors={active ? ["#f97316", "#fb923c"] : ["#1a1f35", "#1e243d"]}
                        style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
                      >
                        <FireIcon size={18} color={active ? "#fff" : "#3d4560"} strokeWidth={1.8} />
                      </LinearGradient>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#f97316" : "#3d4560" }}>
                        {["M", "T", "W", "T", "F", "S", "S"][day - 1]}
                      </Text>
                    </View>
                  )
                })}
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 54, fontWeight: "900", color: "#f97316", letterSpacing: -2 }}>4</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.4)", marginTop: -6 }}>Day Streak!</Text>
              </View>
            </Animated.View>

            {"rewards" in screen && screen.rewards && (
              <View style={{ gap: 12 }}>
                {screen.rewards.map((reward, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(300 + i * 100).springify()}>
                    <RowCard>
                      <IconBox color={reward.color}>
                        <RewardIcon name={reward.icon} size={24} color={reward.color} />
                      </IconBox>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4 }}>{reward.title}</Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{reward.text}</Text>
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
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 24 }}>
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center" }}>
              <View style={{ width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1.5, borderColor: "rgba(16,185,129,0.3)", shadowColor: "#10b981", shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
                <ShieldSolid size={50} color="#10b981" />
              </View>
            </Animated.View>

            {"privacyPoints" in screen && screen.privacyPoints && (
              <View style={{ gap: 14 }}>
                {screen.privacyPoints.map((point, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(250 + i * 100).springify()}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: `${point.color}20`, flexShrink: 0 }}>
                        <PrivacyIcon name={point.icon} size={22} color={point.color} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "500", color: "rgba(255,255,255,0.7)", flex: 1, lineHeight: 22 }}>{point.text}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            <Animated.View entering={FadeIn.delay(600)} style={{ padding: 18, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 20 }}>
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
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 24 }}>
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: "center" }}>
              <View style={{ width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(236,72,153,0.15)", borderWidth: 1.5, borderColor: "rgba(236,72,153,0.3)", shadowColor: "#ec4899", shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
                <SparklesSolid size={50} color="#ec4899" />
              </View>
              {/* Confetti dots */}
              <View style={{ position: "absolute", top: -20, left: 0, right: 0, height: 100, overflow: "hidden" }}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={{ position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: ["#ec4899", "#8B5CF6", "#06b6d4", "#f97316", "#10b981", "#eab308"][i], left: 20 + i * 48, top: [12, 28, 8, 36, 20, 32][i] }} />
                ))}
              </View>
            </Animated.View>

            {"testimonials" in screen && screen.testimonials && (
              <View style={{ gap: 14 }}>
                {screen.testimonials.map((testimonial, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(300 + i * 150).springify()} style={{ padding: 20, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
                    <ChatBubbleLeftIcon size={18} color="rgba(255,255,255,0.25)" strokeWidth={1.8} />
                    <Text style={{ fontSize: 15, fontStyle: "italic", lineHeight: 23, marginTop: 10, color: "rgba(255,255,255,0.65)" }}>"{testimonial.text}"</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 10, color: "rgba(255,255,255,0.35)" }}>— {testimonial.author}</Text>
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
    <View style={{ flex: 1, backgroundColor: "#080b14" }}>
      <LinearGradient colors={["#080b14", "#0f1525"]} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, height: 108 }}>
          {currentScreen > 0 ? (
            <Animated.View entering={FadeIn}>
              <TouchableOpacity
                onPress={handleBack}
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}
              >
                <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={{ width: 44 }} />
          )}

          {currentScreen < SCREENS.length - 1 && (
            <Animated.View entering={FadeIn.delay(600)}>
              <TouchableOpacity
                onPress={handleSkip}
                style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.4)" }}>Skip</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* ── Animated slide — fills all space between header and bottom bar ── */}
        <Animated.View
          key={currentScreen}
          entering={SlideInRight.duration(380).springify()}
          exiting={SlideOutLeft.duration(280)}
          style={{ flex: 1 }}
        >
          {/* Fixed headline block */}
          <View style={{ paddingHorizontal: 28, paddingTop: 4, paddingBottom: 2 }}>
            <Animated.Text
              entering={FadeInUp.delay(100).springify()}
              style={{ fontSize: 34, fontWeight: "900", lineHeight: 42, letterSpacing: -0.5, color: "#fff", marginBottom: 10 }}
            >
              {screen.headline}
            </Animated.Text>

            {"subtext" in screen && screen.subtext && (
              <Animated.Text
                entering={FadeInDown.delay(200).springify()}
                style={{ fontSize: 15, lineHeight: 24, color: "rgba(255,255,255,0.5)" }}
              >
                {screen.subtext}
              </Animated.Text>
            )}

            {"micro" in screen && screen.micro && (
              <Animated.View entering={FadeIn.delay(400)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
                <UserGroupIcon size={14} color={screen.accent} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: screen.accent }}>{screen.micro}</Text>
              </Animated.View>
            )}
          </View>

          {/* Content — flex:1 fills remaining vertical space and centers items */}
          {renderContent()}
        </Animated.View>

        {/* ── Bottom bar — always anchored to bottom ── */}
        <View style={{ paddingHorizontal: 28, paddingBottom: 48, gap: 14 }}>
          {/* Progress */}
          <View style={{ gap: 8 }}>
            <View style={{ width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <View style={{ height: "100%", borderRadius: 2, width: `${((currentScreen + 1) / SCREENS.length) * 100}%`, backgroundColor: screen.accent }} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "500", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
              {currentScreen + 1} of {SCREENS.length}
            </Text>
          </View>

          {/* Buttons */}
          {isFinal ? (
            <View style={{ gap: 12 }}>
              <CTAButton
                label={"ctaPrimary" in screen ? (screen as any).ctaPrimary : ""}
                accent={screen.accent}
                accentLight={accentLight}
                onPress={handleNext}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                animStyle={animatedButtonStyle}
                iconLeft={<UserGroupIcon size={20} color="#fff" strokeWidth={2} />}
              />
              <GhostButton
                label={"ctaSecondary" in screen ? (screen as any).ctaSecondary : ""}
                onPress={completeOnboarding}
              />
            </View>
          ) : (
            <CTAButton
              label={"cta" in screen ? (screen as any).cta : ""}
              accent={screen.accent}
              accentLight={accentLight}
              onPress={handleNext}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              animStyle={animatedButtonStyle}
              iconRight={<ArrowRightIcon size={20} color="#fff" strokeWidth={2.5} />}
            />
          )}
        </View>

      </LinearGradient>
    </View>
  )
}

function adjustColor(color: string): string {
  const map: Record<string, string> = {
    "#ec4899": "#f472b6",
    "#8B5CF6": "#a78bfa",
    "#06b6d4": "#22d3ee",
    "#f97316": "#fb923c",
    "#10b981": "#34d399",
  }
  return map[color] || color
}