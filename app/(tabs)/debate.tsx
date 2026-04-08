"use client"

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated"
import {
  createDebateSession,
  sendDebateInviteEmail,
  joinDebateSession,
  submitDebatePreferences,
  getDebateSessionByCode,
  saveDebateVerdict,
  syncUserWithSupabase,
} from "@/utils/supabase-helpers"
import { settleDebateWithAI as callAI, isAIConfigured } from "@/utils/ai-service"
import type { DebateSession } from "@/types"

const { height } = Dimensions.get("window")

// ─── Shared sub-components ──────────────────────────────────────────────────

/** Reusable screen header with back button */
function ScreenHeader({
  onBack,
  title,
  right,
}: {
  onBack: () => void
  title: string
  right?: React.ReactNode
}) {
  return (
    <View className="flex-row items-center justify-between pt-16 pb-4 px-5">
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#374151" />
      </TouchableOpacity>
      <Text className="text-[17px] font-bold text-[#1a0a0f] tracking-tight">{title}</Text>
      {right ?? <View className="w-10" />}
    </View>
  )
}

/** Pink-gradient primary CTA button */
function PrimaryButton({
  onPress,
  disabled,
  loading,
  colors,
  children,
}: {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  colors: [string, string]
  children: React.ReactNode
}) {
  return (
    <TouchableOpacity
      className="rounded-[18px] overflow-hidden"
      style={
        disabled
          ? undefined
          : {
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 5,
            }
      }
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 17,
          paddingHorizontal: 24,
          gap: 10,
        }}
      >
        {loading ? <ActivityIndicator color="#fff" size="small" /> : children}
      </LinearGradient>
    </TouchableOpacity>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function DebateSettlerScreen() {
  const { user } = useUser()

  const [activeSession, setActiveSession] = useState<DebateSession | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [partnerEmail, setPartnerEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "create" | "join" | "session">("home")
  const [myPreferences, setMyPreferences] = useState("")
  const [isSettling, setIsSettling] = useState(false)
  const [showVerdictModal, setShowVerdictModal] = useState(false)

  // Animations
  const heartScale = useSharedValue(1)
  const floatY = useSharedValue(0)
  const pulseOpacity = useSharedValue(0.5)

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    )
    floatY.value = withRepeat(
      withSequence(withTiming(-8, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1,
      true
    )
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 1500 }), withTiming(0.3, { duration: 1500 })),
      -1,
      true
    )
  }, [])

  useEffect(() => {
    if (user) syncUserWithSupabase(user)
  }, [user])

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }))
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }))
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }))

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateSession = async () => {
    if (!user || !partnerEmail.trim()) {
      Alert.alert("Email Required", "Please enter your partner's email address")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(partnerEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address")
      return
    }
    setIsLoading(true)
    try {
      const session = await createDebateSession(user.id, partnerEmail)
      if (session) {
        const inviteResult = await sendDebateInviteEmail(
          user.firstName || "Your partner",
          partnerEmail,
          session.code
        )
        setActiveSession(session)
        setCurrentView("session")
        if (inviteResult.sent) {
          Alert.alert(
            "Invite Sent!",
            `We've sent an invite to ${partnerEmail}. They'll receive a code to join your debate.`
          )
        } else {
          const extraMessage =
            inviteResult.reason === "domain_verification_required" ||
            inviteResult.reason === "from_domain_not_verified"
              ? "\n\nEmail sending is still in Resend test mode. Verify a sending domain and set INVITE_FROM_EMAIL in your Supabase Edge Function secrets to send to real recipients."
              : inviteResult.reason === "missing_provider_config"
              ? "\n\nEmail sending is not configured on the server yet."
              : ""
          Alert.alert(
            "Session Created!",
            `Share this code with your partner: ${session.code}\n\nThey can enter it in the app to join your debate.${extraMessage}`,
            [
              { text: "Copy Code", onPress: () => copyToClipboard(session.code) },
              { text: "OK" },
            ]
          )
        }
      }
    } catch {
      Alert.alert("Error", "Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      const Clipboard = await import("expo-clipboard")
      await Clipboard.setStringAsync(code)
      Alert.alert("Copied!", "Code copied to clipboard")
    } catch {
      Alert.alert("Code", code)
    }
  }

  const handleJoinSession = async () => {
    if (!user || !joinCode.trim()) {
      Alert.alert("Code Required", "Please enter the invite code")
      return
    }
    setIsLoading(true)
    try {
      const result = await joinDebateSession(joinCode.trim(), user.id)
      if (result.success && result.session) {
        setActiveSession(result.session)
        setCurrentView("session")
      } else {
        Alert.alert("Error", result.error || "Failed to join session")
      }
    } catch {
      Alert.alert("Error", "Failed to join session. Please check the code.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPreferences = async () => {
    if (!activeSession || !user || !myPreferences.trim()) {
      Alert.alert("Tell us more", "Please describe what kind of movie you're in the mood for")
      return
    }
    setIsLoading(true)
    try {
      const isHost = activeSession.host_id === user.id
      const updated = await submitDebatePreferences(
        activeSession.id,
        user.id,
        myPreferences,
        isHost
      )
      if (updated) {
        setActiveSession(updated)
        if (
          updated.status === "settling" ||
          (updated.host_preferences && updated.partner_preferences)
        ) {
          await settleDebate(updated)
        }
      }
    } catch {
      Alert.alert("Error", "Failed to submit preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const settleDebate = async (session: DebateSession) => {
    if (!session.host_preferences || !session.partner_preferences) {
      Alert.alert("Not Ready", "Both partners need to submit their preferences first.")
      return
    }
    setIsSettling(true)
    try {
      if (!isAIConfigured()) {
        Alert.alert(
          "AI Not Configured",
          "Set a Gemini API key in your Supabase Edge Function secrets as GEMINI_API_KEY, then redeploy the function. Avoid using EXPO_PUBLIC_GEMINI_API_KEY in the app.",
          [{ text: "OK" }]
        )
        setIsSettling(false)
        return
      }
      const result = await callAI(session.host_preferences, session.partner_preferences)
      if (result.success && result.verdict) {
        const updated = await saveDebateVerdict(session.id, result.verdict)
        if (updated) {
          setActiveSession(updated)
          setShowVerdictModal(true)
        }
      } else {
        Alert.alert(
          "AI Error",
          result.error || "Couldn't get a recommendation. Please try again.",
          [{ text: "Retry", onPress: () => settleDebate(session) }, { text: "Cancel" }]
        )
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "AI couldn't settle the debate. Please try again.")
    } finally {
      setIsSettling(false)
    }
  }

  const refreshSession = async () => {
    if (!activeSession) return
    const updated = await getDebateSessionByCode(activeSession.code)
    if (updated) {
      setActiveSession(updated)
      if (
        updated.host_preferences &&
        updated.partner_preferences &&
        updated.status !== "settled" &&
        !isSettling
      ) {
        await settleDebate(updated)
      }
    }
  }

  useEffect(() => {
    if (activeSession && activeSession.status === "waiting") {
      const interval = setInterval(refreshSession, 5000)
      return () => clearInterval(interval)
    }
  }, [activeSession])

  const resetSession = () => {
    setActiveSession(null)
    setJoinCode("")
    setPartnerEmail("")
    setMyPreferences("")
    setCurrentView("home")
    setShowVerdictModal(false)
  }

  // ── Screens ──────────────────────────────────────────────────────────────────

  const renderHomeScreen = () => (
    <ScrollView
      className="flex-1 bg-[#fff9fb]"
      contentContainerClassName="pb-12"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        className="items-center pt-[88px] px-6 pb-6"
      >
        {/* Pulse glow */}
        <Animated.View
          style={[pulseStyle, { top: 56 }]}
          className="absolute w-[220px] h-[220px] rounded-full bg-pink-400/[0.12]"
        />

        {/* Floating icon */}
        <Animated.View style={floatStyle} className="relative mb-7">
          <LinearGradient
            colors={["#ec4899", "#f472b6", "#fb7185"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 10,
            }}
          >
            <Animated.View style={heartStyle}>
              <Ionicons name="heart" size={48} color="#fff" />
            </Animated.View>
          </LinearGradient>
          {/* Film badge */}
          <View
            className="absolute -bottom-0.5 -right-0.5 w-[34px] h-[34px] rounded-full bg-white items-center justify-center border-[1.5px] border-pink-100"
            style={{
              elevation: 3,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="film" size={18} color="#ec4899" />
          </View>
        </Animated.View>

        <Text className="text-[30px] font-extrabold text-[#1a0a0f] mb-2.5 text-center tracking-tight">
          Date Night Debate
        </Text>
        <Text className="text-[15px] text-gray-500 text-center leading-[22px] px-4">
          Can't agree on a movie? Let AI find the perfect film for both of you
        </Text>
      </Animated.View>

      {/* ── Couple illustration ── */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        className="items-center py-5"
      >
        <View className="flex-row items-center mb-2.5">
          {/* Left avatar */}
          <View
            className="w-[54px] h-[54px] rounded-full overflow-hidden border-[2.5px] border-white"
            style={{
              elevation: 4,
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
            }}
          >
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
            ) : (
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                className="flex-1 items-center justify-center"
              >
                <Ionicons name="person" size={24} color="#fff" />
              </LinearGradient>
            )}
          </View>

          {/* Heart connector */}
          <View
            className="w-7 h-7 rounded-full bg-white items-center justify-center -mx-2.5 z-10 border border-pink-100"
            style={{
              elevation: 3,
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
            }}
          >
            <Ionicons name="heart" size={14} color="#ec4899" />
          </View>

          {/* Right avatar */}
          <View
            className="w-[54px] h-[54px] rounded-full overflow-hidden border-[2.5px] border-white"
            style={{
              elevation: 4,
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
            }}
          >
            <LinearGradient
              colors={["#ec4899", "#f472b6"]}
              className="flex-1 items-center justify-center"
            >
              <Ionicons name="person" size={24} color="#fff" />
            </LinearGradient>
          </View>
        </View>
        <Text className="text-[13px] font-semibold text-pink-500">You + Your Person</Text>
      </Animated.View>

      {/* ── Action buttons ── */}
      <Animated.View entering={FadeInDown.delay(300).springify()} className="px-6 pt-2">
        <PrimaryButton onPress={() => setCurrentView("create")} colors={["#ec4899", "#db2777"]}>
          <Ionicons name="mail" size={20} color="#fff" />
          <Text className="text-white text-[16px] font-bold">Invite Your Partner</Text>
        </PrimaryButton>

        {/* Divider */}
        <View className="flex-row items-center my-5">
          <View className="flex-1 h-[0.5px] bg-gray-200" />
          <Text className="mx-3.5 text-[13px] font-medium text-gray-400">or</Text>
          <View className="flex-1 h-[0.5px] bg-gray-200" />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center py-[17px] bg-white rounded-[18px] border-[1.5px] border-pink-300 gap-x-2.5"
          onPress={() => setCurrentView("join")}
          activeOpacity={0.85}
        >
          <Ionicons name="enter-outline" size={20} color="#ec4899" />
          <Text className="text-pink-500 text-[16px] font-bold">I Have a Code</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── How it works ── */}
      <Animated.View entering={FadeInDown.delay(400).springify()} className="px-6 pt-9">
        <Text className="text-[18px] font-extrabold text-[#1a0a0f] mb-4 tracking-tight">
          How It Works
        </Text>

        {[
          {
            icon: "mail-outline",
            title: "Send an Invite",
            desc: "Enter your partner's email to invite them",
            gradientColors: ["#fce7f3", "#fdf2f8"] as [string, string],
            iconColor: "#ec4899",
          },
          {
            icon: "chatbubble-ellipses-outline",
            title: "Share Your Mood",
            desc: "Both describe what you're feeling tonight",
            gradientColors: ["#f3e8ff", "#faf5ff"] as [string, string],
            iconColor: "#8B5CF6",
          },
          {
            icon: "sparkles",
            title: "AI Magic",
            desc: "Our AI finds a movie you'll both love",
            gradientColors: ["#e0f2fe", "#f0f9ff"] as [string, string],
            iconColor: "#0ea5e9",
          },
        ].map((step, index) => (
          <View
            key={index}
            className="flex-row items-center bg-white rounded-2xl mb-2.5 px-4 py-3.5 gap-x-3.5 border border-pink-50"
            style={{
              elevation: 1,
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
            }}
          >
            <LinearGradient
              colors={step.gradientColors}
              className="w-11 h-11 rounded-[13px] items-center justify-center shrink-0"
            >
              <Ionicons name={step.icon as any} size={20} color={step.iconColor} />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-[#1a0a0f] mb-0.5">{step.title}</Text>
              <Text className="text-[13px] text-gray-400 leading-[18px]">{step.desc}</Text>
            </View>
            <View className="w-6 h-6 rounded-full bg-pink-100 items-center justify-center shrink-0">
              <Text className="text-[12px] font-bold text-pink-500">{index + 1}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  )

  const renderCreateScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#fff9fb]"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader onBack={() => setCurrentView("home")} title="Invite Your Partner" />

        {/* Illustration */}
        <Animated.View entering={FadeInDown.delay(100)} className="items-center py-8 px-6">
          <LinearGradient
            colors={["#fce7f3", "#fdf2f8"]}
            className="w-[108px] h-[108px] rounded-full items-center justify-center mb-5"
          >
            <Ionicons name="mail" size={48} color="#ec4899" />
          </LinearGradient>
          <Text className="text-[15px] text-gray-500 text-center px-6 leading-[22px]">
            We'll send them a beautiful invite email with a code to join your debate
          </Text>
        </Animated.View>

        {/* Email input */}
        <Animated.View entering={FadeInDown.delay(200)} className="px-6">
          <Text className="text-[13px] font-semibold text-gray-700 mb-2">Partner's Email</Text>
          <View className="flex-row items-center bg-white rounded-[14px] border-[1.5px] border-pink-300 px-3.5">
            <Ionicons name="heart-outline" size={18} color="#ec4899" style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 py-3.5 text-[15px] text-[#1a0a0f]"
              placeholder="love@example.com"
              placeholderTextColor="#c4b5c0"
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </Animated.View>

        {/* Send button */}
        <Animated.View entering={FadeInDown.delay(300)} className="px-6 pt-7">
          <PrimaryButton
            onPress={handleCreateSession}
            disabled={!partnerEmail.trim()}
            loading={isLoading}
            colors={partnerEmail.trim() ? ["#ec4899", "#db2777"] : ["#e5e7eb", "#d1d5db"]}
          >
            <Ionicons name="send" size={18} color={partnerEmail.trim() ? "#fff" : "#9ca3af"} />
            <Text
              className={`text-[16px] font-bold ${
                partnerEmail.trim() ? "text-white" : "text-gray-400"
              }`}
            >
              Send Invite
            </Text>
          </PrimaryButton>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  const renderJoinScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#fff9fb]"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader onBack={() => setCurrentView("home")} title="Join Debate" />

        {/* Illustration */}
        <Animated.View entering={FadeInDown.delay(100)} className="items-center py-8 px-6">
          <LinearGradient
            colors={["#f3e8ff", "#faf5ff"]}
            className="w-[108px] h-[108px] rounded-full items-center justify-center mb-5"
          >
            <Ionicons name="ticket" size={48} color="#8B5CF6" />
          </LinearGradient>
          <Text className="text-[15px] text-gray-500 text-center px-6 leading-[22px]">
            Enter the 6-digit code from your partner's invite
          </Text>
        </Animated.View>

        {/* Code input */}
        <Animated.View entering={FadeInDown.delay(200)} className="px-6">
          <Text className="text-[13px] font-semibold text-gray-700 mb-2">Invite Code</Text>
          <TextInput
            className="bg-white rounded-2xl border-2 border-violet-200 py-[18px] px-7 text-[26px] font-extrabold text-[#1a0a0f] text-center w-full"
            style={{ letterSpacing: 10 }}
            placeholder="ABC123"
            placeholderTextColor="#c4b5d4"
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Text className="mt-2 text-xs text-[#c4b5d4] text-center">
            {joinCode.length}/6 characters
          </Text>
        </Animated.View>

        {/* Join button */}
        <Animated.View entering={FadeInDown.delay(300)} className="px-6 pt-7">
          <PrimaryButton
            onPress={handleJoinSession}
            disabled={joinCode.length !== 6}
            loading={isLoading}
            colors={joinCode.length === 6 ? ["#8B5CF6", "#7C3AED"] : ["#e5e7eb", "#d1d5db"]}
          >
            <Ionicons
              name="enter"
              size={18}
              color={joinCode.length === 6 ? "#fff" : "#9ca3af"}
            />
            <Text
              className={`text-[16px] font-bold ${
                joinCode.length === 6 ? "text-white" : "text-gray-400"
              }`}
            >
              Join Debate
            </Text>
          </PrimaryButton>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  const renderSessionScreen = () => {
    if (!activeSession) return null

    const isHost = activeSession.host_id === user?.id
    const myPrefsSubmitted = isHost
      ? !!activeSession.host_preferences
      : !!activeSession.partner_preferences
    const partnerPrefsSubmitted = isHost
      ? !!activeSession.partner_preferences
      : !!activeSession.host_preferences
    const partnerJoined = !!activeSession.partner_id

    const host = activeSession.host
    const partner = activeSession.partner
    const hostReady =
      (isHost && myPrefsSubmitted) || (!isHost && !!activeSession.host_preferences)

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-[#fff9fb]"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12"
          showsVerticalScrollIndicator={false}
        >
          {/* Session header */}
          <View className="flex-row items-center justify-between pt-16 pb-4 px-5">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={resetSession}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>

            <View className="flex-row items-center bg-pink-50 px-3.5 py-[7px] rounded-full border border-pink-200">
              <Ionicons name="key-outline" size={12} color="#ec4899" style={{ marginRight: 4 }} />
              <Text
                className="text-[13px] font-extrabold text-pink-500"
                style={{ letterSpacing: 2.5 }}
              >
                {activeSession.code}
              </Text>
            </View>

            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={refreshSession}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* ── Participants ── */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="flex-row items-center justify-center px-4 py-7 gap-x-2"
          >
            {/* Host card */}
            <View className="flex-1 items-center gap-y-2">
              <View className="relative">
                {host?.image_url ? (
                  <Image
                    source={{ uri: host.image_url }}
                    className="w-[68px] h-[68px] rounded-full"
                  />
                ) : (
                  <LinearGradient
                    colors={["#8B5CF6", "#7C3AED"]}
                    className="w-[68px] h-[68px] rounded-full items-center justify-center"
                  >
                    <Text className="text-[26px] font-bold text-white">
                      {host?.first_name?.[0] || "?"}
                    </Text>
                  </LinearGradient>
                )}
                <View
                  className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#fff9fb]"
                  style={{
                    backgroundColor:
                      isHost && myPrefsSubmitted ? "#22c55e" : "#fbbf24",
                  }}
                />
              </View>
              <Text className="text-[15px] font-bold text-[#1a0a0f]">
                {isHost ? "You" : host?.first_name || "Partner"}
              </Text>
              <View
                className={`px-2.5 py-1 rounded-full ${
                  hostReady ? "bg-green-100" : "bg-amber-50"
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    hostReady ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {hostReady ? "Ready ✓" : "Thinking…"}
                </Text>
              </View>
            </View>

            {/* VS heart */}
            <View className="px-1 items-center justify-center">
              <Animated.View
                style={heartStyle}
                className="w-11 h-11 rounded-full bg-pink-100 items-center justify-center"
              >
                <Ionicons name="heart" size={24} color="#ec4899" />
              </Animated.View>
            </View>

            {/* Partner card */}
            <View className="flex-1 items-center gap-y-2">
              {partnerJoined ? (
                <>
                  <View className="relative">
                    {partner?.image_url ? (
                      <Image
                        source={{ uri: partner.image_url }}
                        className="w-[68px] h-[68px] rounded-full"
                      />
                    ) : (
                      <LinearGradient
                        colors={["#ec4899", "#f472b6"]}
                        className="w-[68px] h-[68px] rounded-full items-center justify-center"
                      >
                        <Text className="text-[26px] font-bold text-white">
                          {partner?.first_name?.[0] || "?"}
                        </Text>
                      </LinearGradient>
                    )}
                    <View
                      className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#fff9fb]"
                      style={{
                        backgroundColor: partnerPrefsSubmitted ? "#22c55e" : "#fbbf24",
                      }}
                    />
                  </View>
                  <Text className="text-[15px] font-bold text-[#1a0a0f]">
                    {!isHost ? "You" : partner?.first_name || "Partner"}
                  </Text>
                  <View
                    className={`px-2.5 py-1 rounded-full ${
                      partnerPrefsSubmitted ? "bg-green-100" : "bg-amber-50"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-semibold ${
                        partnerPrefsSubmitted ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {partnerPrefsSubmitted ? "Ready ✓" : "Thinking…"}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="w-[68px] h-[68px] rounded-full bg-pink-50 items-center justify-center border-2 border-dashed border-pink-200">
                    <ActivityIndicator color="#ec4899" size="small" />
                  </View>
                  <Text className="text-[15px] font-bold text-[#1a0a0f]">Waiting...</Text>
                  <View className="px-2.5 py-1 rounded-full bg-amber-50">
                    <Text className="text-[11px] font-semibold text-amber-700">Invite sent</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* Waiting banner */}
          {!partnerJoined && (
            <Animated.View
              entering={FadeIn}
              className="flex-row items-center mx-6 py-3 px-4 rounded-[14px] bg-amber-50 border border-amber-200 gap-x-2.5"
            >
              <Ionicons name="time-outline" size={16} color="#d97706" />
              <Text className="flex-1 text-[13px] text-amber-900 leading-[18px]">
                Waiting for your partner to join with code{" "}
                <Text className="font-extrabold text-amber-700">{activeSession.code}</Text>
              </Text>
            </Animated.View>
          )}

          {/* Preferences input */}
          {partnerJoined && !myPrefsSubmitted && (
            <Animated.View entering={FadeInDown.delay(200)} className="px-6 pt-7">
              <Text className="text-[19px] font-extrabold text-[#1a0a0f] mb-1.5 tracking-tight">
                What are you in the mood for?
              </Text>
              <Text className="text-[13px] text-gray-400 mb-4 leading-[19px]">
                Describe your perfect movie tonight - genre, mood, length, anything!
              </Text>
              <TextInput
                className="bg-white rounded-2xl border-[1.5px] border-pink-300 p-3.5 text-[15px] text-[#1a0a0f] min-h-[116px] mb-5"
                style={{ textAlignVertical: "top", lineHeight: 22 }}
                placeholder="e.g., Something romantic but not too cheesy, maybe with a bit of humor..."
                placeholderTextColor="#c4b5c0"
                value={myPreferences}
                onChangeText={setMyPreferences}
                multiline
                numberOfLines={4}
              />
              <PrimaryButton
                onPress={handleSubmitPreferences}
                disabled={!myPreferences.trim()}
                loading={isLoading}
                colors={
                  myPreferences.trim() ? ["#ec4899", "#db2777"] : ["#e5e7eb", "#d1d5db"]
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={myPreferences.trim() ? "#fff" : "#9ca3af"}
                />
                <Text
                  className={`text-[16px] font-bold ${
                    myPreferences.trim() ? "text-white" : "text-gray-400"
                  }`}
                >
                  Submit My Mood
                </Text>
              </PrimaryButton>
            </Animated.View>
          )}

          {/* Waiting for partner prefs */}
          {myPrefsSubmitted && !partnerPrefsSubmitted && (
            <Animated.View entering={FadeIn} className="items-center px-6 py-[52px]">
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-5">
                <Ionicons name="checkmark" size={28} color="#16a34a" />
              </View>
              <Text className="text-[19px] font-bold text-[#1a0a0f] mb-2">You're all set!</Text>
              <Text className="text-[14px] text-gray-400 text-center leading-5">
                Waiting for your partner to share their mood...
              </Text>
              <ActivityIndicator color="#ec4899" style={{ marginTop: 20 }} />
            </Animated.View>
          )}

          {/* Settling animation */}
          {isSettling && (
            <Animated.View entering={FadeIn} className="px-6 py-6">
              <View className="items-center py-12 rounded-3xl bg-[#fff0f7] border border-pink-100">
                <Animated.View style={heartStyle}>
                  <Ionicons name="sparkles" size={44} color="#ec4899" />
                </Animated.View>
                <Text className="text-[18px] font-bold text-[#1a0a0f] mt-[18px] mb-1.5">
                  Finding Your Perfect Movie...
                </Text>
                <Text className="text-[14px] text-gray-400">
                  Our AI is analyzing both your preferences
                </Text>
                <ActivityIndicator color="#ec4899" style={{ marginTop: 20 }} />
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* ── Verdict Modal ── */}
        <Modal
          visible={showVerdictModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowVerdictModal(false)}
        >
          <View className="flex-1 bg-black/55 justify-end">
            <Animated.View
              entering={FadeInDown.springify()}
              className="bg-white rounded-t-[28px] px-6 pt-3 pb-11"
              style={{ maxHeight: height * 0.87 }}
            >
              {/* Drag handle */}
              <View className="w-9 h-1 rounded-full bg-gray-200 self-center mb-5" />

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal header */}
                <View className="items-center mb-6">
                  <LinearGradient
                    colors={["#ec4899", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-[68px] h-[68px] rounded-full items-center justify-center mb-3.5"
                    style={{
                      elevation: 6,
                      shadowColor: "#ec4899",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                    }}
                  >
                    <Ionicons name="heart" size={28} color="#fff" />
                  </LinearGradient>
                  <Text className="text-[22px] font-extrabold text-[#1a0a0f] tracking-tight">
                    Perfect Match Found!
                  </Text>
                </View>

                {activeSession.ai_verdict && (
                  <>
                    {/* Main recommendation */}
                    <LinearGradient
                      colors={["#fdf2f8", "#fce7f3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="rounded-[20px] p-6 items-center mb-5"
                    >
                      <Text
                        className="text-[11px] font-bold text-pink-500 mb-2.5"
                        style={{ textTransform: "uppercase", letterSpacing: 1.5 }}
                      >
                        Tonight's Pick
                      </Text>
                      <Text className="text-[26px] font-black text-[#1a0a0f] text-center mb-4 tracking-tight">
                        {activeSession.ai_verdict.recommendation}
                      </Text>
                      <View className="flex-row items-baseline gap-x-1.5 bg-pink-500/10 px-4 py-2 rounded-full">
                        <Text className="text-[22px] font-extrabold text-pink-600">
                          {activeSession.ai_verdict.compatibilityScore}%
                        </Text>
                        <Text className="text-[13px] font-medium text-pink-900">
                          compatibility
                        </Text>
                      </View>
                    </LinearGradient>

                    {/* Reasoning */}
                    <View className="mb-4">
                      <Text className="text-[15px] text-gray-600 leading-6 text-center">
                        {activeSession.ai_verdict.reasoning}
                      </Text>
                    </View>

                    {/* Couple insight */}
                    <View className="flex-row items-start bg-violet-50 p-3.5 rounded-[14px] mb-6 gap-x-2.5 border border-violet-200">
                      <View className="w-7 h-7 rounded-full bg-violet-100 items-center justify-center shrink-0 mt-0.5">
                        <Ionicons name="sparkles" size={16} color="#7c3aed" />
                      </View>
                      <Text className="flex-1 text-[13px] text-violet-700 italic leading-[19px]">
                        {activeSession.ai_verdict.coupleInsight}
                      </Text>
                    </View>

                    {/* Alternatives */}
                    <View className="mb-6">
                      <Text className="text-[15px] font-bold text-[#1a0a0f] mb-3">
                        Other Great Options
                      </Text>
                      {activeSession.ai_verdict.movieSuggestions.slice(1).map((movie, index) => (
                        <View
                          key={index}
                          className="flex-row items-start bg-gray-50 p-3.5 rounded-[14px] mb-2 gap-x-3 border border-gray-100"
                        >
                          <View className="w-[26px] h-[26px] rounded-full bg-pink-100 items-center justify-center shrink-0 mt-0.5">
                            <Text className="text-[12px] font-bold text-pink-500">
                              {index + 2}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-[14px] font-bold text-[#1a0a0f] mb-0.5">
                              {movie.title}
                            </Text>
                            <Text className="text-[12px] text-gray-400 leading-[17px]">
                              {movie.reason}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Verdict actions */}
                <View className="gap-y-2.5">
                  <PrimaryButton
                    onPress={() => {
                      setShowVerdictModal(false)
                      Alert.alert(
                        "Enjoy Your Movie Night!",
                        "Head to the Discover tab to find where to watch your movie."
                      )
                    }}
                    colors={["#ec4899", "#db2777"]}
                  >
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text className="text-white text-[16px] font-bold">Let's Watch!</Text>
                  </PrimaryButton>

                  <TouchableOpacity
                    className="py-[15px] items-center justify-center rounded-[18px] border-[1.5px] border-pink-300 bg-transparent"
                    onPress={resetSession}
                    activeOpacity={0.7}
                  >
                    <Text className="text-pink-500 text-[15px] font-semibold">
                      Start New Debate
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    )
  }

  switch (currentView) {
    case "create":
      return renderCreateScreen()
    case "join":
      return renderJoinScreen()
    case "session":
      return renderSessionScreen()
    default:
      return renderHomeScreen()
  }
}