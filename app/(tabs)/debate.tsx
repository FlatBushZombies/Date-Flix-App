"use client"

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
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
  getUserDebateSessions,
  saveDebateVerdict,
  syncUserWithSupabase,
} from "@/utils/supabase-helpers"
import { settleDebateWithAI as callAI, isAIConfigured, getAIProviderName } from "@/utils/ai-service"
import type { DebateSession, AIVerdict } from "@/types"

const { width, height } = Dimensions.get("window")

export default function DebateSettlerScreen() {
  const { user } = useUser()

  // Session state
  const [activeSession, setActiveSession] = useState<DebateSession | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [partnerEmail, setPartnerEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // UI state
  const [currentView, setCurrentView] = useState<"home" | "create" | "join" | "session">("home")
  const [myPreferences, setMyPreferences] = useState("")
  const [isSettling, setIsSettling] = useState(false)
  const [showVerdictModal, setShowVerdictModal] = useState(false)

  // Animations
  const heartScale = useSharedValue(1)
  const floatY = useSharedValue(0)
  const pulseOpacity = useSharedValue(0.5)

  useEffect(() => {
    // Heart pulse animation
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    )

    // Float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    )

    // Pulse glow
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    )
  }, [])

  useEffect(() => {
    if (user) {
      syncUserWithSupabase(user)
    }
  }, [user])

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }))

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  // Create new debate session
  const handleCreateSession = async () => {
    if (!user || !partnerEmail.trim()) {
      Alert.alert("Email Required", "Please enter your partner's email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(partnerEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      const session = await createDebateSession(user.id, partnerEmail)

      if (session) {
        // Try to send email invite via Supabase Edge Function
        const emailSent = await sendDebateInviteEmail(
          user.firstName || "Your partner",
          partnerEmail,
          session.code
        )

        setActiveSession(session)
        setCurrentView("session")
        
        // Show appropriate message based on email status
        if (emailSent) {
          Alert.alert(
            "Invite Sent!",
            `We've sent an invite to ${partnerEmail}. They'll receive a code to join your debate.`
          )
        } else {
          // Fallback - show code for manual sharing
          Alert.alert(
            "Session Created!",
            `Share this code with your partner: ${session.code}\n\nThey can enter it in the app to join your debate.`,
            [
              { text: "Copy Code", onPress: () => copyToClipboard(session.code) },
              { text: "OK" }
            ]
          )
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Copy code to clipboard
  const copyToClipboard = async (code: string) => {
    try {
      const Clipboard = await import("expo-clipboard")
      await Clipboard.setStringAsync(code)
      Alert.alert("Copied!", "Code copied to clipboard")
    } catch {
      Alert.alert("Code", code)
    }
  }

  // Join existing session
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
    } catch (error) {
      Alert.alert("Error", "Failed to join session. Please check the code.")
    } finally {
      setIsLoading(false)
    }
  }

  // Submit preferences
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

        // If both ready, trigger AI settlement
        if (updated.status === "settling" || (updated.host_preferences && updated.partner_preferences)) {
          await settleDebate(updated)
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit preferences")
    } finally {
      setIsLoading(false)
    }
  }

  // AI Settlement using configured provider (Gemini, Groq, or Puter)
  const settleDebate = async (session: DebateSession) => {
    if (!session.host_preferences || !session.partner_preferences) {
      Alert.alert("Not Ready", "Both partners need to submit their preferences first.")
      return
    }

    setIsSettling(true)

    try {
      // Check if AI is configured
      if (!isAIConfigured()) {
        Alert.alert(
          "AI Not Configured",
          "Please add your FREE Gemini API key:\n\n1. Go to aistudio.google.com/apikey\n2. Create a key\n3. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file",
          [{ text: "OK" }]
        )
        setIsSettling(false)
        return
      }

      // Call the AI service
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

  // Refresh session
  const refreshSession = async () => {
    if (!activeSession) return

    const updated = await getDebateSessionByCode(activeSession.code)
    if (updated) {
      setActiveSession(updated)

      // Check if both preferences are in and we should settle
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

  // Poll for partner joining
  useEffect(() => {
    if (activeSession && activeSession.status === "waiting") {
      const interval = setInterval(refreshSession, 5000)
      return () => clearInterval(interval)
    }
  }, [activeSession])

  // Reset everything
  const resetSession = () => {
    setActiveSession(null)
    setJoinCode("")
    setPartnerEmail("")
    setMyPreferences("")
    setCurrentView("home")
    setShowVerdictModal(false)
  }

  // ===================== RENDER FUNCTIONS =====================

  // Home screen - choosing create or join
  const renderHomeScreen = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
        {/* Animated Hearts Background */}
        <Animated.View style={[styles.pulseGlow, pulseStyle]} />

        <Animated.View style={[styles.heroIconContainer, floatStyle]}>
          <LinearGradient
            colors={["#ec4899", "#f472b6", "#fb7185"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIconGradient}
          >
            <Animated.View style={heartStyle}>
              <Ionicons name="heart" size={48} color="#fff" />
            </Animated.View>
          </LinearGradient>
          <View style={styles.filmIconOverlay}>
            <Ionicons name="film" size={20} color="#ec4899" />
          </View>
        </Animated.View>

        <Text style={styles.heroTitle}>Date Night Debate</Text>
        <Text style={styles.heroSubtitle}>
          Can't agree on a movie? Let AI find the perfect film for both of you
        </Text>
      </Animated.View>

      {/* Couple Illustration */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.coupleIllustration}>
        <View style={styles.coupleAvatarContainer}>
          <View style={styles.coupleAvatar}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
              </LinearGradient>
            )}
          </View>
          <View style={styles.heartConnector}>
            <Ionicons name="heart" size={16} color="#ec4899" />
          </View>
          <View style={styles.coupleAvatar}>
            <LinearGradient colors={["#ec4899", "#f472b6"]} style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#fff" />
            </LinearGradient>
          </View>
        </View>
        <Text style={styles.coupleText}>You + Your Person</Text>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actionsContainer}>
        {/* Create Session */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentView("create")}>
          <LinearGradient
            colors={["#ec4899", "#db2777"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Ionicons name="mail" size={22} color="#fff" />
            <Text style={styles.primaryButtonText}>Invite Your Partner</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join Session */}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentView("join")}>
          <Ionicons name="enter-outline" size={22} color="#ec4899" />
          <Text style={styles.secondaryButtonText}>I Have a Code</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* How It Works */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.stepsSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        {[
          {
            icon: "mail-outline",
            title: "Send an Invite",
            desc: "Enter your partner's email to invite them",
          },
          {
            icon: "chatbubble-ellipses-outline",
            title: "Share Your Mood",
            desc: "Both describe what you're feeling tonight",
          },
          {
            icon: "sparkles",
            title: "AI Magic",
            desc: "Our AI finds a movie you'll both love",
          },
        ].map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <LinearGradient
                colors={["#fce7f3", "#fbcfe8"]}
                style={styles.stepIconBg}
              >
                <Ionicons name={step.icon as any} size={22} color="#ec4899" />
              </LinearGradient>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  )

  // Create session screen
  const renderCreateScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView("home")}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Invite Your Partner</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Illustration */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.createIllustration}>
          <LinearGradient colors={["#fce7f3", "#fff"]} style={styles.illustrationBg}>
            <Ionicons name="mail" size={56} color="#ec4899" />
          </LinearGradient>
          <Text style={styles.illustrationText}>
            We'll send them a beautiful invite email with a code to join your debate
          </Text>
        </Animated.View>

        {/* Email Input */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
          <Text style={styles.inputLabel}>Partner's Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="heart-outline" size={20} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="love@example.com"
              placeholderTextColor="#9ca3af"
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </Animated.View>

        {/* Send Button */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.primaryButton, !partnerEmail.trim() && styles.buttonDisabled]}
            onPress={handleCreateSession}
            disabled={!partnerEmail.trim() || isLoading}
          >
            <LinearGradient
              colors={partnerEmail.trim() ? ["#ec4899", "#db2777"] : ["#d1d5db", "#9ca3af"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Send Invite</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  // Join session screen
  const renderJoinScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView("home")}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Join Debate</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Illustration */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.createIllustration}>
          <LinearGradient colors={["#f3e8ff", "#fff"]} style={styles.illustrationBg}>
            <Ionicons name="ticket" size={56} color="#8B5CF6" />
          </LinearGradient>
          <Text style={styles.illustrationText}>
            Enter the 6-digit code from your partner's invite
          </Text>
        </Animated.View>

        {/* Code Input */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
          <Text style={styles.inputLabel}>Invite Code</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="ABC123"
              placeholderTextColor="#9ca3af"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />
          </View>
        </Animated.View>

        {/* Join Button */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.primaryButton, joinCode.length !== 6 && styles.buttonDisabled]}
            onPress={handleJoinSession}
            disabled={joinCode.length !== 6 || isLoading}
          >
            <LinearGradient
              colors={joinCode.length === 6 ? ["#8B5CF6", "#7C3AED"] : ["#d1d5db", "#9ca3af"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="enter" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Join Debate</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  // Active session screen
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

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.screenHeader}>
            <TouchableOpacity style={styles.backButton} onPress={resetSession}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.sessionCodeBadge}>
              <Text style={styles.sessionCodeText}>{activeSession.code}</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshSession}>
              <Ionicons name="refresh" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Participants */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.participantsSection}>
            <View style={styles.participantCard}>
              <View style={styles.participantAvatar}>
                {host?.image_url ? (
                  <Image source={{ uri: host.image_url }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {host?.first_name?.[0] || "?"}
                    </Text>
                  </LinearGradient>
                )}
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isHost && myPrefsSubmitted ? "#22c55e" : "#fbbf24" },
                  ]}
                />
              </View>
              <Text style={styles.participantName}>
                {isHost ? "You" : host?.first_name || "Partner"}
              </Text>
              <Text style={styles.participantStatus}>
                {(isHost && myPrefsSubmitted) || (!isHost && activeSession.host_preferences)
                  ? "Ready"
                  : "Thinking..."}
              </Text>
            </View>

            <View style={styles.vsContainer}>
              <Animated.View style={heartStyle}>
                <Ionicons name="heart" size={28} color="#ec4899" />
              </Animated.View>
            </View>

            <View style={styles.participantCard}>
              {partnerJoined ? (
                <>
                  <View style={styles.participantAvatar}>
                    {partner?.image_url ? (
                      <Image source={{ uri: partner.image_url }} style={styles.avatarImage} />
                    ) : (
                      <LinearGradient
                        colors={["#ec4899", "#f472b6"]}
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.avatarInitial}>
                          {partner?.first_name?.[0] || "?"}
                        </Text>
                      </LinearGradient>
                    )}
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: partnerPrefsSubmitted ? "#22c55e" : "#fbbf24" },
                      ]}
                    />
                  </View>
                  <Text style={styles.participantName}>
                    {!isHost ? "You" : partner?.first_name || "Partner"}
                  </Text>
                  <Text style={styles.participantStatus}>
                    {partnerPrefsSubmitted ? "Ready" : "Thinking..."}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.participantAvatar}>
                    <View style={styles.waitingAvatar}>
                      <ActivityIndicator color="#ec4899" />
                    </View>
                  </View>
                  <Text style={styles.participantName}>Waiting...</Text>
                  <Text style={styles.participantStatus}>Invite sent</Text>
                </>
              )}
            </View>
          </Animated.View>

          {/* Status Message */}
          {!partnerJoined && (
            <Animated.View entering={FadeIn} style={styles.waitingMessage}>
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
              <Text style={styles.waitingText}>
                Waiting for your partner to join with code{" "}
                <Text style={styles.codeHighlight}>{activeSession.code}</Text>
              </Text>
            </Animated.View>
          )}

          {/* Preferences Input */}
          {partnerJoined && !myPrefsSubmitted && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.preferencesSection}>
              <Text style={styles.preferencesTitle}>What are you in the mood for?</Text>
              <Text style={styles.preferencesSubtitle}>
                Describe your perfect movie tonight - genre, mood, length, anything!
              </Text>

              <TextInput
                style={styles.preferencesInput}
                placeholder="e.g., Something romantic but not too cheesy, maybe with a bit of humor..."
                placeholderTextColor="#9ca3af"
                value={myPreferences}
                onChangeText={setMyPreferences}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.primaryButton, !myPreferences.trim() && styles.buttonDisabled]}
                onPress={handleSubmitPreferences}
                disabled={!myPreferences.trim() || isLoading}
              >
                <LinearGradient
                  colors={myPreferences.trim() ? ["#ec4899", "#db2777"] : ["#d1d5db", "#9ca3af"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Submit My Mood</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Waiting for Partner Preferences */}
          {myPrefsSubmitted && !partnerPrefsSubmitted && (
            <Animated.View entering={FadeIn} style={styles.waitingPrefsSection}>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
              </View>
              <Text style={styles.waitingPrefsTitle}>You're all set!</Text>
              <Text style={styles.waitingPrefsText}>
                Waiting for your partner to share their mood...
              </Text>
              <ActivityIndicator color="#ec4899" style={{ marginTop: 16 }} />
            </Animated.View>
          )}

          {/* Settling Animation */}
          {isSettling && (
            <Animated.View entering={FadeIn} style={styles.settlingSection}>
              <LinearGradient
                colors={["#fce7f3", "#fff"]}
                style={styles.settlingContainer}
              >
                <Animated.View style={heartStyle}>
                  <Ionicons name="sparkles" size={48} color="#ec4899" />
                </Animated.View>
                <Text style={styles.settlingTitle}>Finding Your Perfect Movie...</Text>
                <Text style={styles.settlingText}>
                  Our AI is analyzing both your preferences
                </Text>
                <ActivityIndicator color="#ec4899" style={{ marginTop: 20 }} />
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>

        {/* Verdict Modal */}
        <Modal
          visible={showVerdictModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowVerdictModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.springify()} style={styles.verdictModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.verdictHeader}>
                  <LinearGradient
                    colors={["#ec4899", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.verdictIconContainer}
                  >
                    <Ionicons name="heart" size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.verdictTitle}>Perfect Match Found!</Text>
                </View>

                {activeSession.ai_verdict && (
                  <>
                    {/* Main Recommendation */}
                    <View style={styles.mainRecommendation}>
                      <Text style={styles.recommendationLabel}>Tonight's Pick</Text>
                      <Text style={styles.recommendationTitle}>
                        {activeSession.ai_verdict.recommendation}
                      </Text>
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Compatibility</Text>
                        <Text style={styles.scoreValue}>
                          {activeSession.ai_verdict.compatibilityScore}%
                        </Text>
                      </View>
                    </View>

                    {/* Reasoning */}
                    <View style={styles.reasoningSection}>
                      <Text style={styles.reasoningText}>
                        {activeSession.ai_verdict.reasoning}
                      </Text>
                    </View>

                    {/* Couple Insight */}
                    <View style={styles.insightSection}>
                      <Ionicons name="sparkles" size={18} color="#ec4899" />
                      <Text style={styles.insightText}>
                        {activeSession.ai_verdict.coupleInsight}
                      </Text>
                    </View>

                    {/* Alternatives */}
                    <View style={styles.alternativesSection}>
                      <Text style={styles.alternativesTitle}>Other Great Options</Text>
                      {activeSession.ai_verdict.movieSuggestions.slice(1).map((movie, index) => (
                        <View key={index} style={styles.alternativeItem}>
                          <Text style={styles.alternativeTitle}>{movie.title}</Text>
                          <Text style={styles.alternativeReason}>{movie.reason}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Actions */}
                <View style={styles.verdictActions}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setShowVerdictModal(false)
                      // Could navigate to discover or search
                      Alert.alert(
                        "Enjoy Your Movie Night!",
                        "Head to the Discover tab to find where to watch your movie."
                      )
                    }}
                  >
                    <LinearGradient
                      colors={["#ec4899", "#db2777"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryButtonGradient}
                    >
                      <Ionicons name="play-circle" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Let's Watch!</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={resetSession}>
                    <Text style={styles.secondaryButtonText}>Start New Debate</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    )
  }

  // Main render
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff9fb",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pulseGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    top: 60,
  },
  heroIconContainer: {
    position: "relative",
    marginBottom: 24,
  },
  heroIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  filmIconOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Couple Illustration
  coupleIllustration: {
    alignItems: "center",
    paddingVertical: 24,
  },
  coupleAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  coupleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartConnector: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: -8,
    zIndex: 1,
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  coupleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ec4899",
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    backgroundColor: "#fdf2f8",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fbcfe8",
    gap: 10,
  },
  secondaryButtonText: {
    color: "#ec4899",
    fontSize: 17,
    fontWeight: "700",
  },

  // Steps Section
  stepsSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepIconContainer: {
    marginRight: 16,
  },
  stepIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: "#6b7280",
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f3e8ff",
  },

  // Screen Header
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },

  // Create Screen
  createIllustration: {
    alignItems: "center",
    paddingVertical: 32,
  },
  illustrationBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  illustrationText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  inputSection: {
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  codeInputContainer: {
    alignItems: "center",
  },
  codeInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e9d5ff",
    paddingVertical: 20,
    paddingHorizontal: 32,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 8,
    color: "#1f2937",
    textAlign: "center",
    width: "100%",
  },
  submitSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // Session Screen
  sessionCodeBadge: {
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  sessionCodeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ec4899",
    letterSpacing: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  // Participants
  participantsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  participantCard: {
    alignItems: "center",
    flex: 1,
  },
  participantAvatar: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#fff9fb",
  },
  waitingAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fdf2f8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fbcfe8",
    borderStyle: "dashed",
  },
  participantName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  participantStatus: {
    fontSize: 13,
    color: "#6b7280",
  },
  vsContainer: {
    paddingHorizontal: 8,
  },

  // Waiting Message
  waitingMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef3c7",
    marginHorizontal: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
  },
  waitingText: {
    fontSize: 14,
    color: "#92400e",
  },
  codeHighlight: {
    fontWeight: "800",
    color: "#b45309",
  },

  // Preferences
  preferencesSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  preferencesTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  preferencesInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
    minHeight: 120,
    marginBottom: 24,
    textAlignVertical: "top",
  },

  // Waiting Prefs
  waitingPrefsSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  checkmark: {
    marginBottom: 16,
  },
  waitingPrefsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  waitingPrefsText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },

  // Settling
  settlingSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  settlingContainer: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 24,
  },
  settlingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 20,
    marginBottom: 8,
  },
  settlingText: {
    fontSize: 15,
    color: "#6b7280",
  },

  // Verdict Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  verdictModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.85,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  verdictHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  verdictIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  verdictTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f2937",
  },
  mainRecommendation: {
    backgroundColor: "#fdf2f8",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ec4899",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ec4899",
  },
  reasoningSection: {
    marginBottom: 20,
  },
  reasoningText: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
    textAlign: "center",
  },
  insightSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f3e8ff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: "#7c3aed",
    fontStyle: "italic",
    lineHeight: 20,
  },
  alternativesSection: {
    marginBottom: 24,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  alternativeItem: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  alternativeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  alternativeReason: {
    fontSize: 13,
    color: "#6b7280",
  },
  verdictActions: {
    gap: 12,
  },
})
