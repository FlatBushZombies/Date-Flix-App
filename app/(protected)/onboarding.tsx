import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
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

const { width, height } = Dimensions.get("window")

const SCREENS = [
  {
    id: 1,
    headline: "Never argue about\nwhat to watch again",
    subtext: "Swipe movies together and instantly discover what you both love.",
    micro: "Takes 30 seconds to start",
    cta: "Start Matching",
    icon: "heart-circle",
    gradient: ["#0e1117", "#1a1c2e"] as const,
    accent: "#ec4899",
    illustration: "film",
  },
  {
    id: 2,
    headline: "Simple. Fun.\nInstant.",
    bullets: [
      { icon: "heart", color: "#ec4899", text: "Swipe right if you like it" },
      { icon: "close-circle", color: "#6b7280", text: "Skip what you don't" },
      { icon: "film", color: "#8B5CF6", text: "When you both like the same movie... it's a match" },
    ],
    subtext: "No lists. No debates. Just vibes.",
    cta: "Got it",
    gradient: ["#0e1117", "#1a1c2e"] as const,
    accent: "#8B5CF6",
  },
  {
    id: 3,
    headline: "Movies are better\ntogether",
    subtext: "Invite a friend and start matching in real time\n\u2014 or \u2014\ngo solo and discover new favorites",
    ctaPrimary: "Invite a Friend",
    ctaSecondary: "Start Solo",
    gradient: ["#0e1117", "#1a1c2e"] as const,
    accent: "#06b6d4",
  },
  {
    id: 4,
    headline: "Make it a nightly\nritual",
    bullets: [
      { icon: "flame", color: "#f97316", text: "Daily match streaks" },
      { icon: "compass", color: "#06b6d4", text: "Personalized picks" },
      { icon: "people", color: "#ec4899", text: "Watch with friends anytime" },
    ],
    cta: "Let's Go",
    gradient: ["#0e1117", "#1a1c2e"] as const,
    accent: "#f97316",
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

  return (
    <LinearGradient colors={[...screen.gradient]} style={styles.container}>
      {/* Skip Button */}
      {currentScreen < SCREENS.length - 1 && (
        <Animated.View entering={FadeIn.delay(600)} style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Content */}
      <Animated.View
        key={currentScreen}
        entering={SlideInRight.duration(400).springify()}
        exiting={SlideOutLeft.duration(300)}
        style={styles.content}
      >
        {/* Large Icon / Illustration Area */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.illustrationArea}>
          {currentScreen === 0 && (
            <View style={styles.illustrationCluster}>
              <View style={[styles.floatingCard, styles.floatingCard1]}>
                <LinearGradient colors={["#1f2937", "#111827"]} style={styles.miniCard}>
                  <View style={styles.miniPosterPlaceholder}>
                    <Ionicons name="film-outline" size={32} color="#374151" />
                  </View>
                  <View style={styles.likeStamp}>
                    <Ionicons name="heart" size={18} color="#ec4899" />
                  </View>
                </LinearGradient>
              </View>
              <View style={[styles.floatingCard, styles.floatingCard2]}>
                <LinearGradient colors={["#1f2937", "#111827"]} style={styles.miniCard}>
                  <View style={styles.miniPosterPlaceholder}>
                    <Ionicons name="videocam-outline" size={32} color="#374151" />
                  </View>
                  <View style={styles.likeStamp}>
                    <Ionicons name="heart" size={18} color="#ec4899" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.matchBurst}>
                <LinearGradient colors={["#ec4899", "#f472b6"]} style={styles.matchBurstInner}>
                  <Ionicons name="heart" size={36} color="#fff" />
                </LinearGradient>
              </View>
            </View>
          )}

          {currentScreen === 1 && (
            <View style={styles.howItWorksIllustration}>
              <View style={styles.swipeDemo}>
                <View style={[styles.demoCard, styles.demoCardLeft]}>
                  <Ionicons name="close" size={40} color="#6b7280" />
                </View>
                <View style={[styles.demoCard, styles.demoCardCenter]}>
                  <LinearGradient colors={["#1f2937", "#111827"]} style={styles.demoCardInner}>
                    <Ionicons name="film" size={40} color="#8B5CF6" />
                  </LinearGradient>
                </View>
                <View style={[styles.demoCard, styles.demoCardRight]}>
                  <Ionicons name="heart" size={40} color="#ec4899" />
                </View>
              </View>
            </View>
          )}

          {currentScreen === 2 && (
            <View style={styles.socialIllustration}>
              <View style={styles.avatarGroup}>
                <View style={[styles.avatarBubble, { backgroundColor: "#06b6d4" }]}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
                <View style={styles.connectionLine} />
                <View style={[styles.avatarBubble, { backgroundColor: "#ec4899" }]}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
              </View>
              <View style={styles.matchIndicator}>
                <Ionicons name="film" size={24} color="#fff" />
              </View>
            </View>
          )}

          {currentScreen === 3 && (
            <View style={styles.ritualIllustration}>
              <View style={styles.streakContainer}>
                {[1, 2, 3, 4, 5].map((day) => (
                  <View key={day} style={styles.streakDay}>
                    <LinearGradient
                      colors={day <= 3 ? ["#f97316", "#fb923c"] : ["#1f2937", "#374151"]}
                      style={styles.streakDayInner}
                    >
                      <Ionicons name="flame" size={20} color={day <= 3 ? "#fff" : "#4b5563"} />
                    </LinearGradient>
                    <Text style={[styles.streakDayText, day <= 3 && styles.streakDayTextActive]}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Animated.Text entering={FadeInUp.delay(200).springify()} style={[styles.headline, { color: "#fff" }]}>
            {screen.headline}
          </Animated.Text>

          {/* Bullets */}
          {"bullets" in screen && screen.bullets && (
            <View style={styles.bulletsContainer}>
              {screen.bullets.map((bullet, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(300 + index * 100).springify()}
                  style={styles.bulletRow}
                >
                  <View style={[styles.bulletIcon, { backgroundColor: `${bullet.color}20` }]}>
                    <Ionicons name={bullet.icon as any} size={18} color={bullet.color} />
                  </View>
                  <Text style={styles.bulletText}>{bullet.text}</Text>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Subtext */}
          {"subtext" in screen && screen.subtext && (
            <Animated.Text entering={FadeInDown.delay(350).springify()} style={styles.subtext}>
              {screen.subtext}
            </Animated.Text>
          )}

          {/* Micro copy */}
          {"micro" in screen && screen.micro && (
            <Animated.Text entering={FadeIn.delay(500)} style={styles.microText}>
              {screen.micro}
            </Animated.Text>
          )}
        </View>
      </Animated.View>

      {/* Bottom Area */}
      <View style={styles.bottomArea}>
        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {SCREENS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentScreen
                  ? [styles.dotActive, { backgroundColor: screen.accent }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTAs */}
        {currentScreen === 2 ? (
          <View style={styles.dualButtons}>
            <Animated.View style={[styles.primaryButtonWrapper, animatedButtonStyle]}>
              <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleNext}
                style={styles.ctaButtonOuter}
              >
                <LinearGradient
                  colors={["#06b6d4", "#0891b2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaButton}
                >
                  <Ionicons name="people" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.ctaText}>{screen.ctaPrimary}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={completeOnboarding} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{screen.ctaSecondary}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={[styles.primaryButtonWrapper, animatedButtonStyle]}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleNext}
              style={styles.ctaButtonOuter}
            >
              <LinearGradient
                colors={
                  currentScreen === 0
                    ? ["#ec4899", "#f472b6"]
                    : currentScreen === 1
                    ? ["#8B5CF6", "#A855F7"]
                    : ["#f97316", "#fb923c"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>{screen.cta}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingTop: 100,
  },
  illustrationArea: {
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.3,
    marginBottom: 32,
  },
  illustrationCluster: {
    width: 220,
    height: 200,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingCard: {
    position: "absolute",
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCard1: {
    left: 0,
    top: 10,
    transform: [{ rotate: "-8deg" }],
  },
  floatingCard2: {
    right: 0,
    top: 10,
    transform: [{ rotate: "8deg" }],
  },
  miniCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  miniPosterPlaceholder: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  likeStamp: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  matchBurst: {
    position: "absolute",
    zIndex: 10,
    bottom: 20,
  },
  matchBurstInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  howItWorksIllustration: {
    alignItems: "center",
    justifyContent: "center",
  },
  swipeDemo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  demoCard: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  demoCardLeft: {
    backgroundColor: "rgba(107,114,128,0.15)",
  },
  demoCardCenter: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: "hidden",
  },
  demoCardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  demoCardRight: {
    backgroundColor: "rgba(236,72,153,0.15)",
  },
  socialIllustration: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  connectionLine: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
  },
  matchIndicator: {
    marginTop: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(139,92,246,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.5)",
  },
  ritualIllustration: {
    alignItems: "center",
    justifyContent: "center",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  streakDay: {
    alignItems: "center",
    gap: 8,
  },
  streakDayInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  streakDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  streakDayTextActive: {
    color: "#f97316",
  },
  textContent: {
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  bulletsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    flex: 1,
    lineHeight: 22,
  },
  subtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 24,
    marginBottom: 12,
  },
  microText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
  bottomArea: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 24,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 32,
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dualButtons: {
    gap: 12,
  },
  primaryButtonWrapper: {
    width: "100%",
  },
  ctaButtonOuter: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 20,
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "700",
  },
})