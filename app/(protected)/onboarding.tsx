import { View, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
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

const { height } = Dimensions.get("window")

const SCREENS = [
  {
    id: 1,
    type: "hero",
    headline: "Never argue about\nwhat to watch again",
    subtext: "Swipe movies together and instantly discover what you both love. The perfect movie night starts here.",
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

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(0)
  const screen = SCREENS[currentScreen]

  const scale = useSharedValue(1)

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
  }

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_complete", "true")
    } catch {}
    router.replace("/(tabs)/home")
  }

  const handleNext = () => {
    if (currentScreen < SCREENS.length - 1) {
      setCurrentScreen((prev) => prev + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen((prev) => prev - 1)
    }
  }

  const renderContent = () => {
    switch (screen.type) {
      case "hero":
        return (
          <View className="flex-1 px-7">
            <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center justify-center mb-6" style={{ height: height * 0.25 }}>
              <View className="w-56 h-44 relative items-center justify-center">
                <View className="absolute left-0 top-2.5 w-[90px] h-[130px] rounded-2xl overflow-hidden shadow-lg" style={{ transform: [{ rotate: "-10deg" }] }}>
                  <LinearGradient colors={["#1f2937", "#111827"]} className="flex-1 rounded-2xl items-center justify-center">
                    <View className="w-12 h-[70px] rounded-lg bg-white/5 items-center justify-center">
                      <Ionicons name="film-outline" size={32} color="#374151" />
                    </View>
                    <View className="absolute bottom-2 right-2">
                      <Ionicons name="heart" size={18} color="#ec4899" />
                    </View>
                  </LinearGradient>
                </View>
                <View className="absolute right-0 top-2.5 w-[90px] h-[130px] rounded-2xl overflow-hidden shadow-lg" style={{ transform: [{ rotate: "10deg" }] }}>
                  <LinearGradient colors={["#1f2937", "#111827"]} className="flex-1 rounded-2xl items-center justify-center">
                    <View className="w-12 h-[70px] rounded-lg bg-white/5 items-center justify-center">
                      <Ionicons name="videocam-outline" size={32} color="#374151" />
                    </View>
                    <View className="absolute bottom-2 right-2">
                      <Ionicons name="heart" size={18} color="#ec4899" />
                    </View>
                  </LinearGradient>
                </View>
                <View className="absolute bottom-2.5 z-10">
                  <LinearGradient colors={["#ec4899", "#f472b6"]} className="w-16 h-16 rounded-full items-center justify-center shadow-lg">
                    <Ionicons name="heart" size={36} color="#fff" />
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>

            {"stats" in screen && screen.stats && (
              <Animated.View entering={FadeInUp.delay(300)} className="flex-row justify-around bg-white/5 rounded-2xl p-5 mt-4">
                {screen.stats.map((stat, index) => (
                  <View key={index} className="items-center">
                    <Text className="text-2xl font-black" style={{ color: screen.accent }}>{stat.value}</Text>
                    <Text className="text-xs text-white/40 mt-1 font-medium">{stat.label}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )

      case "howItWorks":
        return (
          <View className="flex-1 px-7">
            {"steps" in screen && screen.steps && (
              <View className="gap-3.5">
                {screen.steps.map((step, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(200 + index * 150).springify()}>
                    <LinearGradient colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]} className="flex-row items-center p-4 gap-3.5 rounded-2xl border border-white/5">
                      <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: `${step.color}20` }}>
                        <Text className="text-sm font-extrabold" style={{ color: step.color }}>{index + 1}</Text>
                      </View>
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: `${step.color}15` }}>
                        <Ionicons name={step.icon as any} size={28} color={step.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-white mb-0.5">{step.title}</Text>
                        <Text className="text-[13px] text-white/50 leading-[18px]">{step.text}</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "features":
        return (
          <ScrollView className="flex-1" contentContainerClassName="px-7 pb-5" showsVerticalScrollIndicator={false}>
            {"features" in screen && screen.features && (
              <View className="gap-3">
                {screen.features.map((feature, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(150 + index * 100).springify()}>
                    <LinearGradient colors={[`${feature.color}15`, `${feature.color}05`]} className="p-4 rounded-2xl border border-white/5">
                      <View className="w-11 h-11 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: `${feature.color}20` }}>
                        <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                      </View>
                      <Text className="text-base font-bold text-white mb-1">{feature.title}</Text>
                      <Text className="text-[13px] text-white/50 leading-[18px]">{feature.text}</Text>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        )

      case "social":
        return (
          <View className="flex-1 px-7">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center justify-center mb-8">
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full items-center justify-center shadow-lg" style={{ backgroundColor: "#06b6d4" }}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
                <View className="w-12 h-[3px] bg-white/10 rounded-sm" />
                <View className="w-16 h-16 rounded-full items-center justify-center shadow-lg" style={{ backgroundColor: "#ec4899" }}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
              </View>
              <View className="mt-4 w-12 h-12 rounded-full bg-purple-500/30 items-center justify-center border-2 border-purple-500/50">
                <Ionicons name="film" size={24} color="#fff" />
              </View>
            </Animated.View>

            {"options" in screen && screen.options && (
              <View className="gap-3">
                {screen.options.map((option, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(300 + index * 100).springify()} className="flex-row items-center bg-white/5 p-4 rounded-2xl gap-3.5 border border-white/5">
                    <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: `${option.color}20` }}>
                      <Ionicons name={option.icon as any} size={22} color={option.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-white mb-0.5">{option.title}</Text>
                      <Text className="text-[13px] text-white/45">{option.text}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "genres":
        return (
          <View className="flex-1 px-7">
            {"genres" in screen && screen.genres && (
              <View className="flex-row flex-wrap gap-2.5 justify-center">
                {screen.genres.map((genre, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(100 + index * 50).springify()}>
                    <LinearGradient colors={[`${genre.color}25`, `${genre.color}10`]} className="flex-row items-center px-4 py-3 gap-2 rounded-2xl border border-white/10">
                      <Text className="text-lg">{genre.emoji}</Text>
                      <Text className="text-sm font-bold" style={{ color: genre.color }}>{genre.name}</Text>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "streaks":
        return (
          <View className="flex-1 px-7">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-7">
              <View className="flex-row items-center gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <View key={day} className="items-center gap-1.5">
                    <LinearGradient colors={day <= 4 ? ["#f97316", "#fb923c"] : ["#1f2937", "#374151"]} className="w-10 h-10 rounded-xl items-center justify-center">
                      <Ionicons name="flame" size={18} color={day <= 4 ? "#fff" : "#4b5563"} />
                    </LinearGradient>
                    <Text className={`text-[11px] font-semibold ${day <= 4 ? "text-orange-500" : "text-gray-600"}`}>
                      {["M", "T", "W", "T", "F", "S", "S"][day - 1]}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="mt-5 items-center">
                <Text className="text-5xl font-black text-orange-500">4</Text>
                <Text className="text-sm font-semibold text-white/50 -mt-1">Day Streak!</Text>
              </View>
            </Animated.View>

            {"rewards" in screen && screen.rewards && (
              <View className="gap-3">
                {screen.rewards.map((reward, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(300 + index * 100).springify()} className="flex-row items-center bg-white/5 p-4 rounded-2xl gap-3.5 border border-white/5">
                    <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: `${reward.color}20` }}>
                      <Ionicons name={reward.icon as any} size={22} color={reward.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-white mb-0.5">{reward.title}</Text>
                      <Text className="text-[13px] text-white/45">{reward.text}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )

      case "privacy":
        return (
          <View className="flex-1 px-7">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-7">
              <LinearGradient colors={["#10b981", "#059669"]} className="w-[88px] h-[88px] rounded-3xl items-center justify-center shadow-lg">
                <Ionicons name="shield-checkmark" size={48} color="#fff" />
              </LinearGradient>
            </Animated.View>

            {"privacyPoints" in screen && screen.privacyPoints && (
              <View className="gap-3.5 mb-6">
                {screen.privacyPoints.map((point, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(250 + index * 100).springify()} className="flex-row items-center gap-3.5">
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${point.color}20` }}>
                      <Ionicons name={point.icon as any} size={18} color={point.color} />
                    </View>
                    <Text className="text-[15px] text-white/70 font-medium flex-1">{point.text}</Text>
                  </Animated.View>
                ))}
              </View>
            )}

            <Animated.View entering={FadeIn.delay(600)} className="bg-white/5 p-4 rounded-2xl">
              <Text className="text-[13px] text-white/40 text-center leading-5">
                By continuing, you agree to our{" "}
                <Text className="text-emerald-500 font-semibold">Terms of Service</Text> and{" "}
                <Text className="text-emerald-500 font-semibold">Privacy Policy</Text>
              </Text>
            </Animated.View>
          </View>
        )

      case "final":
        return (
          <View className="flex-1 px-7">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-7 relative">
              <LinearGradient colors={["#ec4899", "#f472b6"]} className="w-[88px] h-[88px] rounded-3xl items-center justify-center shadow-lg">
                <Ionicons name="sparkles" size={48} color="#fff" />
              </LinearGradient>
              <View className="absolute -top-5 left-0 right-0 h-24">
                {[...Array(6)].map((_, i) => (
                  <View
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ["#ec4899", "#8B5CF6", "#06b6d4", "#f97316", "#10b981", "#eab308"][i],
                      left: 20 + (i * 50),
                      top: Math.random() * 60,
                    }}
                  />
                ))}
              </View>
            </Animated.View>

            {"testimonials" in screen && screen.testimonials && (
              <View className="gap-3.5">
                {screen.testimonials.map((testimonial, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(300 + index * 150).springify()} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.3)" />
                    <Text className="text-[15px] text-white/70 italic leading-[22px] mt-2">"{testimonial.text}"</Text>
                    <Text className="text-[13px] text-white/40 font-semibold mt-2">— {testimonial.author}</Text>
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

  return (
    // Dark background on the wrapping View prevents any white flash during navigation
    <View style={{ flex: 1, backgroundColor: "#0a0c12" }}>
      <LinearGradient colors={["#0a0c12", "#161929"]} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-[60px] h-[100px]">
          {currentScreen > 0 ? (
            <Animated.View entering={FadeIn}>
              <TouchableOpacity onPress={handleBack} className="w-11 h-11 rounded-full bg-white/10 items-center justify-center">
                <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View className="w-11" />
          )}
          {currentScreen < SCREENS.length - 1 && (
            <Animated.View entering={FadeIn.delay(600)}>
              <TouchableOpacity onPress={handleSkip} className="px-4 py-2 rounded-2xl bg-white/10">
                <Text className="text-white/50 text-sm font-semibold">Skip</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Content */}
        <Animated.View
          key={currentScreen}
          entering={SlideInRight.duration(400).springify()}
          exiting={SlideOutLeft.duration(300)}
          className="flex-1 pt-2.5"
        >
          <View className="px-7 mb-6">
            <Animated.Text entering={FadeInUp.delay(100).springify()} className="text-[32px] font-black leading-10 tracking-tight text-white mb-3">
              {screen.headline}
            </Animated.Text>

            {"subtext" in screen && screen.subtext && (
              <Animated.Text entering={FadeInDown.delay(200).springify()} className="text-base text-white/55 leading-6 mb-2">
                {screen.subtext}
              </Animated.Text>
            )}

            {"micro" in screen && screen.micro && (
              <Animated.View entering={FadeIn.delay(400)} className="flex-row items-center gap-1.5 mt-2">
                <Ionicons name="people" size={14} color={screen.accent} />
                <Text className="text-[13px] font-semibold" style={{ color: screen.accent }}>{screen.micro}</Text>
              </Animated.View>
            )}
          </View>

          {renderContent()}
        </Animated.View>

        {/* Bottom Area */}
        <View className="px-7 pb-10 gap-5">
          <View className="items-center gap-2">
            <View className="w-full h-1 bg-white/10 rounded-sm overflow-hidden">
              <View className="h-full rounded-sm" style={{ width: `${((currentScreen + 1) / SCREENS.length) * 100}%`, backgroundColor: screen.accent }} />
            </View>
            <Text className="text-xs text-white/30 font-medium">{currentScreen + 1} of {SCREENS.length}</Text>
          </View>

          {screen.type === "final" ? (
            <View className="gap-3">
              <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleNext}
                  style={{ borderRadius: 50, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={["#ec4899", "#f472b6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      paddingHorizontal: 32,
                      borderRadius: 50,
                    }}
                  >
                    <Ionicons name="people" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text className="text-white text-[17px] font-extrabold tracking-wide">{"ctaPrimary" in screen ? screen.ctaPrimary : ""}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity
                onPress={completeOnboarding}
                style={{
                  alignItems: "center",
                  paddingVertical: 16,
                  borderRadius: 50,
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                <Text className="text-white/60 text-base font-bold">{"ctaSecondary" in screen ? screen.ctaSecondary : ""}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleNext}
                style={{ borderRadius: 50, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={[screen.accent, adjustColor(screen.accent)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 18,
                    paddingHorizontal: 32,
                    borderRadius: 50,
                  }}
                >
                  <Text className="text-white text-[17px] font-extrabold tracking-wide">{"cta" in screen ? screen.cta : ""}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </LinearGradient>
    </View>
  )
}

function adjustColor(color: string): string {
  const colorMap: { [key: string]: string } = {
    "#ec4899": "#f472b6",
    "#8B5CF6": "#A855F7",
    "#06b6d4": "#22d3ee",
    "#f97316": "#fb923c",
    "#10b981": "#34d399",
  }
  return colorMap[color] || color
}