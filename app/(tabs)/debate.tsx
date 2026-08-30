"use client"

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/clerk-expo"
import { LinearGradient } from "expo-linear-gradient"
import * as Sharing from "expo-sharing"
import { captureRef } from "react-native-view-shot"
import Svg, { Circle } from "react-native-svg"
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
  HeartIcon,
  EnvelopeIcon,
  TicketIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  SparklesIcon,
  ClockIcon,
  KeyIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  CheckIcon,
  ArrowRightEndOnRectangleIcon,
} from "react-native-heroicons/solid"
import {
  HeartIcon as HeartOutlineIcon,
  EnvelopeIcon as EnvelopeOutlineIcon,
  SparklesIcon as SparklesOutlineIcon,
  ShareIcon,
} from "react-native-heroicons/outline"
import {
  createDebateSession,
  sendDebateInviteEmail,
  joinDebateSession,
  submitDebatePreferences,
  getDebateSessionByCode,
  saveDebateVerdict,
  syncUserWithSupabase,
  getAiSettlementUsage,
  incrementAiSettlementUsage,
} from "@/utils/supabase-helpers"
import { settleDebateWithAI as callAI, isAIConfigured } from "@/utils/ai-service"
import type { DebateSession } from "@/types"
import { useToast } from "@/components/Toast/ToastProvider"
import { useConfirm } from "@/components/Confirm/ConfirmProvider"
import { CARD_HEIGHT, CARD_WIDTH, CompatibilityCard } from "@/components/CompatibilityCard"
import { shadow } from "@/constants/theme"
import { TasteOnboarding, type SeedMovie } from "@/components/debate/TasteOnboarding"
import { TasteResults } from "@/components/debate/TasteResults"
import { useTasteEngine } from "@/hooks/useTasteEngine"
import { Sparkles as SparklesLucide } from "lucide-react-native"

const { height } = Dimensions.get("window")

// ─── Premium Avatar with double gradient ring ────────────────────────────────
// Layers (inside → out):  avatar  →  white gap  →  gradient ring  →  soft glow

function PremiumAvatar({
  imageUrl,
  initials,
  size = 68,
  gradientColors,
  ringColors,
  statusColor,
}: {
  imageUrl?: string | null
  initials?: string
  size?: number
  gradientColors: [string, string]
  ringColors: [string, string, string]
  statusColor?: string
}) {
  const whiteRing = size + 4    // 2 px white gap on each side
  const gradientRing = size + 10 // 3 px gradient ring on each side
  const glowRing = gradientRing + 8

  return (
    <View style={{ width: glowRing, height: glowRing, alignItems: "center", justifyContent: "center" }}>
      {/* Soft ambient glow */}
      <LinearGradient
        colors={[ringColors[0] + "45", ringColors[2] + "10"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          width: glowRing,
          height: glowRing,
          borderRadius: glowRing / 2,
        }}
      />

      {/* Gradient ring */}
      <LinearGradient
        colors={ringColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: gradientRing,
          height: gradientRing,
          borderRadius: gradientRing / 2,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: ringColors[1],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* White separator gap */}
        <View
          style={{
            width: whiteRing,
            height: whiteRing,
            borderRadius: whiteRing / 2,
            backgroundColor: "#fffafa",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Avatar circle */}
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              overflow: "hidden",
            }}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <LinearGradient
                colors={gradientColors}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: size * 0.36, fontWeight: "800", color: "#fff" }}>
                  {initials || "?"}
                </Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Online / ready status dot */}
      {statusColor && (
        <View
          style={{
            position: "absolute",
            bottom: 5,
            right: 5,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: statusColor,
            borderWidth: 2.5,
            borderColor: "#fffafa",
          }}
        />
      )}
    </View>
  )
}

// ─── Compact circular score ring (compatibility %) ───────────────────────────

function ScoreRing({
  score,
  size = 50,
  strokeWidth = 4.5,
}: {
  score: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score)) / 100
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          rotation={-90}
          origin={[size / 2, size / 2]}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: size * 0.24, fontWeight: "800", color: "#fff" }}>{score}%</Text>
      </View>
    </View>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
    <View className="flex-row items-center justify-between pt-3 pb-4 px-5">
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeftIcon size={18} color="#374151" />
      </TouchableOpacity>
      <Text className="text-[17px] font-bold text-[#1a0a0f] tracking-tight">{title}</Text>
      {right ?? <View className="w-10" />}
    </View>
  )
}

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
              shadowColor: "#E50914",
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DebateSettlerScreen() {
  const { user } = useUser()
  const toast = useToast()
  const confirm = useConfirm()

  const [activeTab, setActiveTab] = useState<"debate" | "tracker">("debate")
  const tasteEngine = useTasteEngine(user?.id)

  const [activeSession, setActiveSession] = useState<DebateSession | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [partnerEmail, setPartnerEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "create" | "join" | "session">("home")
  const [myPreferences, setMyPreferences] = useState("")
  const [isSettling, setIsSettling] = useState(false)
  const [showVerdictModal, setShowVerdictModal] = useState(false)
  const [isSharingCard, setIsSharingCard] = useState(false)
  const [aiSettlementsThisMonth, setAiSettlementsThisMonth] = useState(0)
  const compatibilityCardRef = useRef<View>(null)

  // Animations
  const heartScale = useSharedValue(1)

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    )
  }, [])

  useEffect(() => {
    if (user) syncUserWithSupabase(user)
    if (user) getAiSettlementUsage(user.id).then(setAiSettlementsThisMonth)
  }, [user])

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }))

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleCreateSession = async () => {
    if (!user || !partnerEmail.trim()) {
      toast.error("Email Required", "Please enter your partner's email address")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(partnerEmail)) {
      toast.error("Invalid Email", "Please enter a valid email address")
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
          toast.success(
            "Invite Sent!",
            `We've sent an invite to ${partnerEmail}. They'll receive a code to join your debate.`
          )
        } else {
          const extraMessage =
            inviteResult.reason === "domain_verification_required" ||
            inviteResult.reason === "from_domain_not_verified"
              ? " Email sending is still in Resend test mode. Verify a sending domain and set INVITE_FROM_EMAIL in your Supabase Edge Function secrets to send to real recipients."
              : inviteResult.reason === "missing_provider_config"
              ? " Email sending is not configured on the server yet."
              : ""
          confirm.show({
            title: "Session Created!",
            message: `Share this code with your partner: ${session.code}. They can enter it in the app to join your debate.${extraMessage}`,
            variant: "default",
            buttons: [
              { label: "Copy Code", style: "primary", onPress: () => copyToClipboard(session.code) },
              { label: "OK", style: "cancel" },
            ],
          })
        }
      }
    } catch {
      toast.error("Error", "Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      const Clipboard = await import("expo-clipboard")
      await Clipboard.setStringAsync(code)
      toast.success("Copied!", "Code copied to clipboard")
    } catch {
      confirm.show({ title: "Your Code", message: code, variant: "default" })
    }
  }

  const handleJoinSession = async () => {
    if (!user || !joinCode.trim()) {
      toast.error("Code Required", "Please enter the invite code")
      return
    }
    setIsLoading(true)
    try {
      const result = await joinDebateSession(joinCode.trim(), user.id)
      if (result.success && result.session) {
        setActiveSession(result.session)
        setCurrentView("session")
      } else {
        toast.error("Error", result.error || "Failed to join session")
      }
    } catch {
      toast.error("Error", "Failed to join session. Please check the code.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPreferences = async () => {
    if (!activeSession || !user || !myPreferences.trim()) {
      toast.info("Tell Us More", "Please describe what kind of movie you're in the mood for")
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
      toast.error("Error", "Failed to submit preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const settleDebate = async (session: DebateSession) => {
    if (!session.host_preferences || !session.partner_preferences) {
      toast.info("Not Ready", "Both partners need to submit their preferences first.")
      return
    }
    setIsSettling(true)
    try {
      if (!isAIConfigured()) {
        confirm.show({
          title: "AI Not Configured",
          message:
            "Set a Gemini API key in your Supabase Edge Function secrets as GEMINI_API_KEY, then redeploy the function. Avoid using EXPO_PUBLIC_GEMINI_API_KEY in the app.",
          variant: "warning",
        })
        setIsSettling(false)
        return
      }
      const result = await callAI(session.host_preferences, session.partner_preferences)
      if (result.success && result.verdict) {
        const updated = await saveDebateVerdict(session.id, result.verdict)
        if (updated) {
          setActiveSession(updated)
          setShowVerdictModal(true)
          if (user) incrementAiSettlementUsage(user.id).then(setAiSettlementsThisMonth)
        }
      } else {
        confirm.show({
          title: "AI Error",
          message: result.error || "Couldn't get a recommendation. Please try again.",
          variant: "warning",
          buttons: [
            { label: "Cancel", style: "cancel" },
            { label: "Retry", style: "primary", onPress: () => settleDebate(session) },
          ],
        })
      }
    } catch (error: any) {
      toast.error("Error", error.message || "AI couldn't settle the debate. Please try again.")
    } finally {
      setIsSettling(false)
    }
  }

  const handleShareCompatibilityCard = async () => {
    if (!compatibilityCardRef.current) return
    setIsSharingCard(true)
    try {
      const uri = await captureRef(compatibilityCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: CARD_WIDTH * 3,
        height: CARD_HEIGHT * 3,
      })
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your compatibility" })
      } else {
        toast.error("Sharing Unavailable", "Sharing isn't supported on this device.")
      }
    } catch {
      toast.error("Error", "Failed to generate the share card. Please try again.")
    } finally {
      setIsSharingCard(false)
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

  // ── Screens ───────────────────────────────────────────────────────────────────

  const renderHomeScreen = () => (
    <ScrollView
      className="flex-1 bg-[#fffafa]"
      contentContainerClassName="pb-12"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        className="items-center pt-3 px-6 pb-6"
      >
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          {/* Left avatar — current user */}
          <PremiumAvatar
            imageUrl={user?.imageUrl}
            initials={user?.firstName?.[0]}
            size={54}
            gradientColors={["#8B5CF6", "#7C3AED"]}
            ringColors={["#a78bfa", "#E50914", "#7C3AED"]}
          />

          {/* Heart connector */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderWidth: 1,
              borderColor: "#fee2e2",
              marginHorizontal: -8,
              shadowColor: "#E50914",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <HeartIcon size={13} color="#E50914" />
          </View>

          {/* Right avatar — partner placeholder */}
          <PremiumAvatar
            imageUrl={null}
            initials="?"
            size={54}
            gradientColors={["#E50914", "#FF3B47"]}
            ringColors={["#FF3B47", "#FF2D2D", "#E50914"]}
          />
        </View>
        <Text className="text-[13px] font-semibold text-red-500">You + Your Person</Text>
      </Animated.View>

      {/* ── Action buttons ── */}
      <Animated.View entering={FadeInDown.delay(300).springify()} className="px-6 pt-2">
        <PrimaryButton onPress={() => setCurrentView("create")} colors={["#E50914", "#B2070F"]}>
          <EnvelopeIcon size={20} color="#fff" />
          <Text className="text-white text-[16px] font-bold">Invite Your Partner</Text>
        </PrimaryButton>

        {/* Divider */}
        <View className="flex-row items-center my-5">
          <View className="flex-1 h-[0.5px] bg-gray-200" />
          <Text className="mx-3.5 text-[13px] font-medium text-gray-400">or</Text>
          <View className="flex-1 h-[0.5px] bg-gray-200" />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center py-[17px] bg-white rounded-[18px] border-[1.5px] border-red-300 gap-x-2.5"
          onPress={() => setCurrentView("join")}
          activeOpacity={0.85}
        >
          <ArrowRightEndOnRectangleIcon size={20} color="#E50914" />
          <Text className="text-red-500 text-[16px] font-bold">I Have a Code</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── How it works ── */}
      <Animated.View entering={FadeInDown.delay(400).springify()} className="px-6 pt-9">
        <Text className="text-[18px] font-extrabold text-[#1a0a0f] mb-4 tracking-tight">
          How It Works
        </Text>

        {[
          {
            icon: <EnvelopeOutlineIcon size={20} color="#E50914" />,
            title: "Send an Invite",
            desc: "Enter your partner's email to invite them",
            gradientColors: ["#fee2e2", "#fef2f2"] as [string, string],
          },
          {
            icon: <HeartOutlineIcon size={20} color="#8B5CF6" />,
            title: "Share Your Mood",
            desc: "Both describe what you're feeling tonight",
            gradientColors: ["#f3e8ff", "#faf5ff"] as [string, string],
          },
          {
            icon: <SparklesOutlineIcon size={20} color="#0ea5e9" />,
            title: "AI Magic",
            desc: "Our AI finds a movie you'll both love",
            gradientColors: ["#e0f2fe", "#f0f9ff"] as [string, string],
          },
        ].map((step, index) => (
          <View
            key={index}
            className="flex-row items-center bg-white rounded-2xl mb-2.5 px-4 py-3.5 gap-x-3.5 border border-red-50"
            style={{
              elevation: 1,
              shadowColor: "#E50914",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
            }}
          >
            <LinearGradient
              colors={step.gradientColors}
              className="w-11 h-11 rounded-[13px] items-center justify-center shrink-0"
            >
              {step.icon}
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-[#1a0a0f] mb-0.5">{step.title}</Text>
              <Text className="text-[13px] text-gray-400 leading-[18px]">{step.desc}</Text>
            </View>
            <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center shrink-0">
              <Text className="text-[12px] font-bold text-red-500">{index + 1}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  )

  const renderCreateScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#fffafa]"
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
            colors={["#fee2e2", "#fef2f2"]}
            className="w-[108px] h-[108px] rounded-full items-center justify-center mb-5"
          >
            <EnvelopeIcon size={48} color="#E50914" />
          </LinearGradient>
          <Text className="text-[15px] text-gray-500 text-center px-6 leading-[22px]">
            We'll send them a beautiful invite email with a code to join your debate
          </Text>
        </Animated.View>

        {/* Email input */}
        <Animated.View entering={FadeInDown.delay(200)} className="px-6">
          <Text className="text-[13px] font-semibold text-gray-700 mb-2">Partner's Email</Text>
          <View className="flex-row items-center bg-white rounded-[14px] border-[1.5px] border-red-300 px-3.5">
            <HeartOutlineIcon size={18} color="#E50914" style={{ marginRight: 10 }} />
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
            colors={partnerEmail.trim() ? ["#E50914", "#B2070F"] : ["#e5e7eb", "#d1d5db"]}
          >
            <PaperAirplaneIcon size={18} color={partnerEmail.trim() ? "#fff" : "#9ca3af"} />
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
      className="flex-1 bg-[#fffafa]"
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
            <TicketIcon size={48} color="#8B5CF6" />
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
            <ArrowRightEndOnRectangleIcon
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
        className="flex-1 bg-[#fffafa]"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12"
          showsVerticalScrollIndicator={false}
        >
          {/* Session header */}
          <View className="flex-row items-center justify-between pt-3 pb-4 px-5">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => {
                const hasResult = !!activeSession.ai_verdict
                if (!hasResult) {
                  resetSession()
                  return
                }
                confirm.show({
                  title: "Leave This Debate?",
                  message: "This will discard tonight's result. You'll lose this verdict for good.",
                  variant: "warning",
                  buttons: [
                    { label: "Cancel", style: "cancel" },
                    { label: "Leave", style: "destructive", onPress: resetSession },
                  ],
                })
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Close debate session"
            >
              <XMarkIcon size={20} color="#374151" />
            </TouchableOpacity>

            <View className="flex-row items-center bg-red-50 px-3.5 py-[7px] rounded-full border border-red-200">
              <KeyIcon size={12} color="#E50914" style={{ marginRight: 4 }} />
              <Text
                className="text-[13px] font-extrabold text-red-500"
                style={{ letterSpacing: 2.5 }}
              >
                {activeSession.code}
              </Text>
            </View>

            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Refresh session"
              onPress={refreshSession}
              activeOpacity={0.7}
            >
              <ArrowPathIcon size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* AI usage — visible, no cap enforced */}
          <View className="flex-row items-center justify-center gap-x-1.5 -mt-1 mb-1">
            <SparklesIcon size={11} color="#c4b5fd" />
            <Text className="text-[11px] font-semibold text-gray-400">
              {aiSettlementsThisMonth} AI settlement{aiSettlementsThisMonth === 1 ? "" : "s"} used this month
            </Text>
          </View>

          {/* ── Participants with premium avatar rings ── */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="flex-row items-center justify-center px-4 py-7 gap-x-2"
          >
            {/* Host card */}
            <View className="flex-1 items-center gap-y-2">
              <PremiumAvatar
                imageUrl={host?.image_url}
                initials={host?.first_name?.[0]}
                size={68}
                gradientColors={["#8B5CF6", "#7C3AED"]}
                ringColors={["#a78bfa", "#8B5CF6", "#6d28d9"]}
                statusColor={hostReady ? "#22c55e" : "#fbbf24"}
              />
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
                className="w-11 h-11 rounded-full bg-red-100 items-center justify-center"
              >
                <HeartIcon size={24} color="#E50914" />
              </Animated.View>
            </View>

            {/* Partner card */}
            <View className="flex-1 items-center gap-y-2">
              {partnerJoined ? (
                <>
                  <PremiumAvatar
                    imageUrl={partner?.image_url}
                    initials={partner?.first_name?.[0]}
                    size={68}
                    gradientColors={["#E50914", "#FF3B47"]}
                    ringColors={["#fca5a5", "#E50914", "#B2070F"]}
                    statusColor={partnerPrefsSubmitted ? "#22c55e" : "#fbbf24"}
                  />
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
                  {/* Waiting ghost avatar — dashed ring treatment */}
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LinearGradient
                      colors={["#fee2e2", "#fef2f2"]}
                      style={{
                        position: "absolute",
                        width: 88,
                        height: 88,
                        borderRadius: 44,
                        opacity: 0.7,
                      }}
                    />
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: "#fef2f2",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: "#fecaca",
                        borderStyle: "dashed",
                      }}
                    >
                      <ActivityIndicator color="#E50914" size="small" />
                    </View>
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
              <ClockIcon size={16} color="#d97706" />
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
                className="bg-white rounded-2xl border-[1.5px] border-red-300 p-3.5 text-[15px] text-[#1a0a0f] min-h-[116px] mb-5"
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
                  myPreferences.trim() ? ["#E50914", "#B2070F"] : ["#e5e7eb", "#d1d5db"]
                }
              >
                <CheckCircleIcon
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
                <CheckIcon size={28} color="#16a34a" />
              </View>
              <Text className="text-[19px] font-bold text-[#1a0a0f] mb-2">You're all set!</Text>
              <Text className="text-[14px] text-gray-400 text-center leading-5">
                Waiting for your partner to share their mood...
              </Text>
              <ActivityIndicator color="#E50914" style={{ marginTop: 20 }} />
            </Animated.View>
          )}

          {/* Settling animation */}
          {isSettling && (
            <Animated.View entering={FadeIn} className="px-6 py-6">
              <View className="items-center py-12 rounded-3xl bg-[#fef2f2] border border-red-100">
                <Animated.View style={heartStyle}>
                  <SparklesIcon size={44} color="#E50914" />
                </Animated.View>
                <Text className="text-[18px] font-bold text-[#1a0a0f] mt-[18px] mb-1.5">
                  Finding Your Perfect Movie...
                </Text>
                <Text className="text-[14px] text-gray-400">
                  Our AI is analyzing both your preferences
                </Text>
                <ActivityIndicator color="#E50914" style={{ marginTop: 20 }} />
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
          <TouchableOpacity
            className="flex-1 bg-black/55 justify-end"
            activeOpacity={1}
            onPress={() => setShowVerdictModal(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <TouchableOpacity activeOpacity={1}>
              <Animated.View
                entering={FadeInDown.springify()}
                className="rounded-t-[28px] overflow-hidden"
                style={{ maxHeight: height * 0.89 }}
              >
                <LinearGradient
                  colors={["#E50914", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingTop: 12, paddingBottom: 28, paddingHorizontal: 18 }}
                >
                  {/* Drag handle */}
                  <View className="w-9 h-1 rounded-full bg-white/35 self-center mb-4" />

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Top bar — headline + compatibility ring */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-x-2.5 flex-1 pr-3">
                        <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center">
                          <HeartIcon size={17} color="#fff" />
                        </View>
                        <Text
                          className="text-white text-[16px] font-extrabold tracking-tight flex-1"
                          numberOfLines={1}
                        >
                          Perfect Match Found!
                        </Text>
                      </View>
                      {activeSession.ai_verdict && (
                        <ScoreRing score={activeSession.ai_verdict.compatibilityScore} size={50} />
                      )}
                    </View>

                    {/* Participants — decorative, mirrors the two real players */}
                    <View className="flex-row items-center justify-center mb-5">
                      <View style={{ zIndex: 2 }}>
                        <PremiumAvatar
                          imageUrl={host?.image_url}
                          initials={host?.first_name?.[0]}
                          size={34}
                          gradientColors={["#8B5CF6", "#7C3AED"]}
                          ringColors={["#ffffff", "#ffffff", "#ffffff"]}
                        />
                      </View>
                      <View style={{ zIndex: 1, marginLeft: -14 }}>
                        <PremiumAvatar
                          imageUrl={partner?.image_url}
                          initials={partner?.first_name?.[0]}
                          size={34}
                          gradientColors={["#E50914", "#FF3B47"]}
                          ringColors={["#ffffff", "#ffffff", "#ffffff"]}
                        />
                      </View>
                    </View>

                    {activeSession.ai_verdict && (
                      <View className="bg-white rounded-[22px] px-5 pt-5 pb-4 mb-4" style={shadow.lg}>
                        <View className="self-start bg-red-50 px-3 py-1 rounded-full mb-3">
                          <Text
                            className="text-[10.5px] font-bold text-red-500"
                            style={{ textTransform: "uppercase", letterSpacing: 1.3 }}
                          >
                            Tonight's Pick
                          </Text>
                        </View>

                        <Text className="text-[23px] font-black text-[#1a0a0f] leading-7 tracking-tight mb-2.5">
                          {activeSession.ai_verdict.recommendation}
                        </Text>

                        <Text className="text-[14px] text-gray-500 leading-[20px] mb-3.5">
                          {activeSession.ai_verdict.reasoning}
                        </Text>

                        {/* Couple insight */}
                        <View className="flex-row items-start bg-violet-50 px-3 py-2.5 rounded-[12px] mb-4 gap-x-2">
                          <SparklesIcon size={14} color="#7c3aed" style={{ marginTop: 1 }} />
                          <Text className="flex-1 text-[12px] text-violet-700 italic leading-[17px]">
                            {activeSession.ai_verdict.coupleInsight}
                          </Text>
                        </View>

                        {/* Alternates — compact mini card-stack */}
                        <Text
                          className="text-[11px] font-bold text-gray-400 mb-2"
                          style={{ textTransform: "uppercase", letterSpacing: 1 }}
                        >
                          Other Great Options
                        </Text>
                        <View className="flex-row">
                          {activeSession.ai_verdict.movieSuggestions
                            .slice(1)
                            .map((movie: any, index: number) => (
                              <View
                                key={index}
                                className="flex-1 bg-gray-50 rounded-[14px] p-3 border border-gray-100"
                                style={{
                                  marginLeft: index === 0 ? 0 : -10,
                                  zIndex: index === 0 ? 2 : 1,
                                  transform: [{ rotate: index === 0 ? "-1.5deg" : "1.5deg" }],
                                  ...shadow.sm,
                                }}
                              >
                                <View className="w-5 h-5 rounded-full bg-red-100 items-center justify-center mb-1.5">
                                  <Text className="text-[10px] font-bold text-red-500">
                                    {index + 2}
                                  </Text>
                                </View>
                                <Text
                                  numberOfLines={1}
                                  className="text-[12.5px] font-bold text-[#1a0a0f] mb-0.5"
                                >
                                  {movie.title}
                                </Text>
                                <Text
                                  numberOfLines={2}
                                  className="text-[10.5px] text-gray-400 leading-[14px]"
                                >
                                  {movie.reason}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Verdict actions */}
                    <View className="gap-y-2.5">
                      <PrimaryButton
                        onPress={() => {
                          setShowVerdictModal(false)
                          toast.info(
                            "Enjoy Your Movie Night!",
                            "Head to the Discover tab to find where to watch your movie."
                          )
                        }}
                        colors={["#E50914", "#B2070F"]}
                      >
                        <PlayCircleIcon size={20} color="#fff" />
                        <Text className="text-white text-[16px] font-bold">Let's Watch!</Text>
                      </PrimaryButton>

                      {activeSession.ai_verdict && (
                        <TouchableOpacity
                          className="py-[15px] items-center justify-center rounded-[18px] border-[1.5px] border-white/40 bg-white/10 flex-row"
                          style={{ gap: 8 }}
                          onPress={handleShareCompatibilityCard}
                          disabled={isSharingCard}
                          activeOpacity={0.7}
                        >
                          {isSharingCard ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <ShareIcon size={17} color="#fff" />
                              <Text className="text-white text-[15px] font-semibold">
                                Share Compatibility
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        className="py-[13px] items-center justify-center"
                        onPress={() =>
                          confirm.show({
                            title: "Start New Debate?",
                            message: "This will discard tonight's result. You'll lose this verdict for good.",
                            variant: "warning",
                            buttons: [
                              { label: "Cancel", style: "cancel" },
                              { label: "Start New", style: "destructive", onPress: resetSession },
                            ],
                          })
                        }
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Start a new debate, discarding tonight's result"
                      >
                        <Text className="text-white/70 text-[14px] font-medium">
                          Start New Debate
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Off-screen render target for the shareable compatibility card */}
        {activeSession.ai_verdict && (
          <View style={{ position: "absolute", top: -9999, left: -9999 }}>
            <CompatibilityCard
              ref={compatibilityCardRef}
              host={activeSession.host}
              partner={activeSession.partner}
              verdict={activeSession.ai_verdict}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    )
  }

  const renderDebateTab = () => {
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

  const renderTrackerTab = () => {
    if (tasteEngine.hasProfile === undefined) {
      return (
        <View style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#E50914" size="large" />
        </View>
      )
    }
    if (!tasteEngine.hasProfile) {
      return (
        <ScrollView className="flex-1 bg-[#fffafa]" showsVerticalScrollIndicator={false}>
          <TasteOnboarding
            onSubmit={(genres, vibe, seedMovies: SeedMovie[]) => tasteEngine.submitOnboarding(genres, vibe, seedMovies)}
          />
        </ScrollView>
      )
    }
    return (
      <TasteResults
        profile={tasteEngine.profile}
        feedback={tasteEngine.feedback}
        recommendations={tasteEngine.recommendations}
        loading={tasteEngine.loading}
        loadingMessage={tasteEngine.loadingMessage}
        error={tasteEngine.error}
        onRate={tasteEngine.rate}
        onRefresh={tasteEngine.refresh}
        onRetake={tasteEngine.retake}
      />
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: activeTab === "tracker" ? "#0a0a0f" : "#fffafa" }}>
      {/* ── Tab switcher ── */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: activeTab === "tracker" ? "rgba(255,255,255,0.08)" : "#f3f4f6",
            borderRadius: 999,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("debate")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Debate tab"
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              paddingVertical: 10, borderRadius: 999,
              backgroundColor: activeTab === "debate" ? "#E50914" : "transparent",
            }}
          >
            <HeartIcon size={14} color={activeTab === "debate" ? "#fff" : "#9ca3af"} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === "debate" ? "#fff" : "#9ca3af" }}>
              Debate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("tracker")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Movie Tracker tab"
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              paddingVertical: 10, borderRadius: 999,
              backgroundColor: activeTab === "tracker" ? "#E50914" : "transparent",
            }}
          >
            <SparklesLucide size={14} color={activeTab === "tracker" ? "#fff" : "#9ca3af"} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === "tracker" ? "#fff" : "#9ca3af" }}>
              Movie Tracker
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "debate" ? renderDebateTab() : renderTrackerTab()}
      </View>
    </View>
  )
}