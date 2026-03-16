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
  Share,
  Linking,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native"
import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from "react-native-reanimated"
import * as Clipboard from "expo-clipboard"

const { width, height } = Dimensions.get("window")

// Puter.js will be loaded dynamically for web
// For React Native, we'll use a WebView approach or REST API
const PUTER_API_BASE = "https://api.puter.com"

interface DebateParticipant {
  id: string
  name: string
  email: string
  avatar?: string
  moviePreferences: string[]
  joined: boolean
}

interface DebateSession {
  id: string
  code: string
  hostId: string
  participants: DebateParticipant[]
  status: "waiting" | "voting" | "settled"
  aiVerdict?: AIVerdict
  createdAt: Date
}

interface AIVerdict {
  recommendation: string
  reasoning: string
  compromiseOptions: string[]
  matchScore: number
  movieSuggestions: {
    title: string
    reason: string
    tmdbId?: number
  }[]
}

export default function DebateSettlerScreen() {
  const { user } = useUser()
  
  // Session state
  const [activeSession, setActiveSession] = useState<DebateSession | null>(null)
  const [sessionCode, setSessionCode] = useState("")
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  
  // Preferences state
  const [myPreferences, setMyPreferences] = useState("")
  const [partnerPreferences, setPartnerPreferences] = useState("")
  const [hasSubmittedPreferences, setHasSubmittedPreferences] = useState(false)
  
  // AI state
  const [isSettlingDebate, setIsSettlingDebate] = useState(false)
  const [aiVerdict, setAiVerdict] = useState<AIVerdict | null>(null)
  const [showVerdictModal, setShowVerdictModal] = useState(false)
  
  // Animation
  const pulseScale = useSharedValue(1)
  const rotateValue = useSharedValue(0)
  
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1000 }),
      -1,
      true
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // Generate unique session code
  const generateSessionCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Create a new debate session
  const createDebateSession = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to create a debate session")
      return
    }
    
    setIsCreatingSession(true)
    
    try {
      const code = generateSessionCode()
      const newSession: DebateSession = {
        id: `debate_${Date.now()}`,
        code,
        hostId: user.id,
        participants: [
          {
            id: user.id,
            name: user.firstName || "You",
            email: user.primaryEmailAddress?.emailAddress || "",
            avatar: user.imageUrl,
            moviePreferences: [],
            joined: true,
          },
        ],
        status: "waiting",
        createdAt: new Date(),
      }
      
      setActiveSession(newSession)
      setSessionCode(code)
      
      // Generate invite link
      const link = `moviematch://debate/join?code=${code}`
      setInviteLink(link)
      setShowInviteModal(true)
      
    } catch (error) {
      Alert.alert("Error", "Failed to create session. Please try again.")
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Join existing session
  const joinDebateSession = async (code: string) => {
    if (!user || !code.trim()) return
    
    setIsJoining(true)
    
    try {
      // In production, this would fetch from your backend
      // For now, simulate joining
      const newParticipant: DebateParticipant = {
        id: user.id,
        name: user.firstName || "Friend",
        email: user.primaryEmailAddress?.emailAddress || "",
        avatar: user.imageUrl,
        moviePreferences: [],
        joined: true,
      }
      
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          participants: [...activeSession.participants, newParticipant],
        })
      }
      
      Alert.alert("Joined!", "You've joined the debate session")
      
    } catch (error) {
      Alert.alert("Error", "Failed to join session. Check the code and try again.")
    } finally {
      setIsJoining(false)
    }
  }

  // Send email invite
  const sendEmailInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Email Required", "Please enter your friend's email")
      return
    }
    
    const subject = encodeURIComponent("Let's Settle Our Movie Debate!")
    const body = encodeURIComponent(
      `Hey! I want to find the perfect movie for us to watch together.\n\n` +
      `Join my MovieMatch debate session with this code: ${sessionCode}\n\n` +
      `Or click this link: ${inviteLink}\n\n` +
      `Let's let AI settle what we should watch!`
    )
    
    const emailUrl = `mailto:${inviteEmail}?subject=${subject}&body=${body}`
    
    try {
      await Linking.openURL(emailUrl)
      setInviteEmail("")
    } catch (error) {
      Alert.alert("Error", "Could not open email client")
    }
  }

  // Share invite link
  const shareInviteLink = async () => {
    try {
      await Share.share({
        message: `Join my MovieMatch debate! Use code: ${sessionCode}\n\nLet's find the perfect movie together!`,
      })
    } catch (error) {
      console.error("Share error:", error)
    }
  }

  // Copy code to clipboard
  const copyCode = async () => {
    await Clipboard.setStringAsync(sessionCode)
    Alert.alert("Copied!", "Session code copied to clipboard")
  }

  // Submit movie preferences
  const submitPreferences = () => {
    if (!myPreferences.trim()) {
      Alert.alert("Tell Us More", "Please describe what kind of movie you're in the mood for")
      return
    }
    
    setHasSubmittedPreferences(true)
    
    if (activeSession) {
      setActiveSession({
        ...activeSession,
        status: "voting",
      })
    }
  }

  // Settle the debate with AI (using Puter.js)
  const settleDebateWithAI = async () => {
    setIsSettlingDebate(true)
    
    try {
      // Build the prompt for AI
      const prompt = `You are a movie recommendation AI that helps friends decide what to watch together.

Person 1 wants: "${myPreferences}"
Person 2 wants: "${partnerPreferences || "something fun and engaging"}"

Based on these preferences, provide a JSON response with:
1. "recommendation": A single movie recommendation that would satisfy both
2. "reasoning": Why this movie works for both people (2-3 sentences)
3. "compromiseOptions": An array of 3 alternative movies they might both enjoy
4. "matchScore": A number 1-100 indicating how well this matches both preferences
5. "movieSuggestions": An array of 3 objects with "title" and "reason" for each suggestion

Respond ONLY with valid JSON, no markdown or explanation.`

      // Use Puter.js AI chat - this will prompt user to sign in with Puter
      // In React Native, we'll simulate this or use a WebView
      // For demonstration, using a mock response that shows the expected structure
      
      // In production with Puter.js (web):
      // const response = await puter.ai.chat(prompt, { model: 'gpt-5-nano' })
      
      // Simulated AI response (replace with actual Puter.js call in production)
      const mockResponse: AIVerdict = {
        recommendation: "Everything Everywhere All at Once",
        reasoning: "This film perfectly blends action, comedy, drama, and sci-fi elements. It has something for everyone - mind-bending visuals for sci-fi lovers, heartfelt family drama, and plenty of humor. It's the kind of movie that sparks conversation afterward.",
        compromiseOptions: [
          "Spider-Man: Across the Spider-Verse",
          "The Grand Budapest Hotel", 
          "Knives Out"
        ],
        matchScore: 87,
        movieSuggestions: [
          {
            title: "Everything Everywhere All at Once",
            reason: "Perfect blend of action, comedy, and heart that appeals to diverse tastes"
          },
          {
            title: "Spider-Man: Across the Spider-Verse",
            reason: "Visually stunning with universal appeal and emotional depth"
          },
          {
            title: "Knives Out",
            reason: "Clever mystery with humor that keeps everyone engaged"
          }
        ]
      }
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setAiVerdict(mockResponse)
      setShowVerdictModal(true)
      
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          status: "settled",
          aiVerdict: mockResponse,
        })
      }
      
    } catch (error) {
      Alert.alert("AI Error", "Failed to get AI recommendation. Please try again.")
    } finally {
      setIsSettlingDebate(false)
    }
  }

  // Reset session
  const resetSession = () => {
    setActiveSession(null)
    setSessionCode("")
    setInviteLink("")
    setMyPreferences("")
    setPartnerPreferences("")
    setHasSubmittedPreferences(false)
    setAiVerdict(null)
  }

  // Render initial state (no active session)
  if (!activeSession) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Debate Settler</Text>
          <Text style={styles.headerSubtitle}>
            Can't agree on a movie? Let AI find the perfect compromise
          </Text>
        </View>

        {/* Hero Illustration */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroContainer}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="people" size={40} color="#fff" />
              <View style={styles.heroIconDivider}>
                <Ionicons name="flash" size={24} color="#fbbf24" />
              </View>
              <Ionicons name="film" size={40} color="#fff" />
            </View>
            <Text style={styles.heroText}>AI-Powered Movie Mediator</Text>
          </LinearGradient>
        </Animated.View>

        {/* Create Session Button */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={createDebateSession}
            disabled={isCreatingSession}
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButtonGradient}
            >
              {isCreatingSession ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.createButtonText}>Start New Debate</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Join Session Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.joinSection}>
          <Text style={styles.joinTitle}>Have a code? Join a session</Text>
          
          <View style={styles.joinInputContainer}>
            <TextInput
              style={styles.joinInput}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#9ca3af"
              value={sessionCode}
              onChangeText={setSessionCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            
            <TouchableOpacity
              style={[styles.joinButton, !sessionCode.trim() && styles.joinButtonDisabled]}
              onPress={() => joinDebateSession(sessionCode)}
              disabled={!sessionCode.trim() || isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* How It Works */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          {[
            { icon: "link", title: "Create & Share", desc: "Generate a unique link and invite your friend" },
            { icon: "chatbubbles", title: "Share Preferences", desc: "Both describe what kind of movie you want" },
            { icon: "sparkles", title: "AI Settles It", desc: "Our AI finds the perfect movie for both of you" },
          ].map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepIconContainer}>
                <Ionicons name={step.icon as any} size={24} color="#8B5CF6" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    )
  }

  // Render active session
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Session Info */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={resetSession} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>Session: {activeSession.code}</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Movie Debate</Text>
      </View>

      {/* Participants */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.participantsCard}>
        <Text style={styles.participantsTitle}>Participants</Text>
        <View style={styles.participantsList}>
          {activeSession.participants.map((participant, index) => (
            <View key={participant.id} style={styles.participantItem}>
              <View style={styles.participantAvatar}>
                {participant.avatar ? (
                  <Image source={{ uri: participant.avatar }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={index === 0 ? ["#8B5CF6", "#7C3AED"] : ["#EC4899", "#F472B6"]}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarInitial}>
                      {participant.name[0].toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                {participant.joined && (
                  <View style={styles.onlineIndicator} />
                )}
              </View>
              <Text style={styles.participantName}>{participant.name}</Text>
            </View>
          ))}
          
          {activeSession.participants.length < 2 && (
            <TouchableOpacity 
              style={styles.addParticipantButton}
              onPress={() => setShowInviteModal(true)}
            >
              <View style={styles.addParticipantIcon}>
                <Ionicons name="add" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.addParticipantText}>Invite Friend</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Preferences Input */}
      {!hasSubmittedPreferences ? (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.preferencesCard}>
          <Text style={styles.preferencesTitle}>What are you in the mood for?</Text>
          <Text style={styles.preferencesSubtitle}>
            Describe your ideal movie night - genre, mood, pace, anything!
          </Text>
          
          <TextInput
            style={styles.preferencesInput}
            placeholder="e.g., Something thrilling with plot twists, not too long, maybe sci-fi..."
            placeholderTextColor="#9ca3af"
            value={myPreferences}
            onChangeText={setMyPreferences}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[styles.submitButton, !myPreferences.trim() && styles.submitButtonDisabled]}
            onPress={submitPreferences}
            disabled={!myPreferences.trim()}
          >
            <LinearGradient
              colors={myPreferences.trim() ? ["#8B5CF6", "#7C3AED"] : ["#d1d5db", "#9ca3af"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Submit My Preferences</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.preferencesSubmittedCard}>
          <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
          <Text style={styles.preferencesSubmittedText}>Your preferences submitted!</Text>
          <Text style={styles.preferencesPreview}>"{myPreferences}"</Text>
        </Animated.View>
      )}

      {/* Partner Preferences (for demo) */}
      {hasSubmittedPreferences && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.partnerPreferencesCard}>
          <Text style={styles.preferencesTitle}>Your friend's preferences</Text>
          <Text style={styles.preferencesSubtitle}>
            (In a real session, this would come from your friend)
          </Text>
          
          <TextInput
            style={styles.preferencesInput}
            placeholder="Enter what your friend wants to watch..."
            placeholderTextColor="#9ca3af"
            value={partnerPreferences}
            onChangeText={setPartnerPreferences}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Animated.View>
      )}

      {/* Settle Button */}
      {hasSubmittedPreferences && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.settleSection}>
          <Animated.View style={pulseStyle}>
            <TouchableOpacity
              style={styles.settleButton}
              onPress={settleDebateWithAI}
              disabled={isSettlingDebate}
            >
              <LinearGradient
                colors={["#EC4899", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settleButtonGradient}
              >
                {isSettlingDebate ? (
                  <>
                    <ActivityIndicator color="#fff" style={{ marginRight: 12 }} />
                    <Text style={styles.settleButtonText}>AI is thinking...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={24} color="#fff" />
                    <Text style={styles.settleButtonText}>Settle This Debate!</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.settleHint}>
            Powered by AI - You'll sign in with Puter to use your own AI credits
          </Text>
        </Animated.View>
      )}

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.inviteModalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inviteModalContent}>
              <LinearGradient
                colors={["#fce7f3", "#f3e8ff"]}
                style={styles.inviteIconContainer}
              >
                <Ionicons name="mail" size={40} color="#8B5CF6" />
              </LinearGradient>
              
              <Text style={styles.inviteModalTitle}>Invite Your Friend</Text>
              <Text style={styles.inviteModalSubtitle}>
                Share the code or send them an email invite
              </Text>

              {/* Session Code Display */}
              <View style={styles.codeDisplayContainer}>
                <Text style={styles.codeLabel}>Your Session Code</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{activeSession?.code || sessionCode}</Text>
                </View>
                <View style={styles.codeActions}>
                  <TouchableOpacity style={styles.codeActionButton} onPress={copyCode}>
                    <Ionicons name="copy-outline" size={18} color="#6b7280" />
                    <Text style={styles.codeActionText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.codeActionButton} onPress={shareInviteLink}>
                    <Ionicons name="share-outline" size={18} color="#6b7280" />
                    <Text style={styles.codeActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Email Invite */}
              <View style={styles.emailInviteSection}>
                <Text style={styles.emailLabel}>Or invite via email</Text>
                <View style={styles.emailInputContainer}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="friend@example.com"
                    placeholderTextColor="#9ca3af"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.sendEmailButton}
                    onPress={sendEmailInvite}
                  >
                    <LinearGradient
                      colors={["#8B5CF6", "#7C3AED"]}
                      style={styles.sendEmailGradient}
                    >
                      <Ionicons name="send" size={18} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* AI Verdict Modal */}
      <Modal
        visible={showVerdictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVerdictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.verdictModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
              </View>

              {aiVerdict && (
                <View style={styles.verdictContent}>
                  {/* Success Animation */}
                  <LinearGradient
                    colors={["#dcfce7", "#d1fae5"]}
                    style={styles.verdictSuccessIcon}
                  >
                    <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                  </LinearGradient>
                  
                  <Text style={styles.verdictTitle}>Debate Settled!</Text>
                  
                  {/* Match Score */}
                  <View style={styles.matchScoreContainer}>
                    <Text style={styles.matchScoreLabel}>Compatibility</Text>
                    <View style={styles.matchScoreBar}>
                      <LinearGradient
                        colors={["#8B5CF6", "#EC4899"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.matchScoreFill, { width: `${aiVerdict.matchScore}%` }]}
                      />
                    </View>
                    <Text style={styles.matchScoreValue}>{aiVerdict.matchScore}%</Text>
                  </View>

                  {/* Main Recommendation */}
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationLabel}>AI Recommends</Text>
                    <Text style={styles.recommendationTitle}>{aiVerdict.recommendation}</Text>
                    <Text style={styles.recommendationReason}>{aiVerdict.reasoning}</Text>
                  </View>

                  {/* Alternative Options */}
                  <View style={styles.alternativesSection}>
                    <Text style={styles.alternativesTitle}>Also Consider</Text>
                    {aiVerdict.movieSuggestions.map((movie, index) => (
                      <View key={index} style={styles.alternativeCard}>
                        <View style={styles.alternativeNumber}>
                          <Text style={styles.alternativeNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.alternativeContent}>
                          <Text style={styles.alternativeTitle}>{movie.title}</Text>
                          <Text style={styles.alternativeReason}>{movie.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.verdictActions}>
                    <TouchableOpacity
                      style={styles.watchNowButton}
                      onPress={() => {
                        setShowVerdictModal(false)
                        Alert.alert("Great Choice!", `Let's watch "${aiVerdict.recommendation}" together!`)
                      }}
                    >
                      <LinearGradient
                        colors={["#8B5CF6", "#7C3AED"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.watchNowGradient}
                      >
                        <Ionicons name="play" size={20} color="#fff" />
                        <Text style={styles.watchNowText}>Watch This One!</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.tryAgainButton}
                      onPress={() => {
                        setShowVerdictModal(false)
                        setAiVerdict(null)
                        setHasSubmittedPreferences(false)
                        setMyPreferences("")
                        setPartnerPreferences("")
                      }}
                    >
                      <Text style={styles.tryAgainText}>Try Different Preferences</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionBadge: {
    marginLeft: 12,
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  heroContainer: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  heroIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIconDivider: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
  },
  heroText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  actionSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  createButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  joinSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  joinTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
    textAlign: "center",
  },
  joinInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  joinInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 4,
    color: "#111827",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  joinButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  howItWorksSection: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3e8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7C3AED",
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3e8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: "#6b7280",
  },
  participantsCard: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  participantsList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  participantItem: {
    alignItems: "center",
  },
  participantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  participantName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  addParticipantButton: {
    alignItems: "center",
  },
  addParticipantIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  addParticipantText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  preferencesCard: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  preferencesInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 100,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  preferencesSubmittedCard: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  preferencesSubmittedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
    marginTop: 8,
  },
  preferencesPreview: {
    fontSize: 14,
    color: "#166534",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  partnerPreferencesCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  settleSection: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 40,
    alignItems: "center",
  },
  settleButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  settleButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 40,
    gap: 12,
  },
  settleButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  settleHint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  inviteModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
  },
  modalCloseButton: {
    position: "absolute",
    right: 20,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  inviteModalContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  inviteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  inviteModalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  inviteModalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  codeDisplayContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeBox: {
    backgroundColor: "#f3e8ff",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e9d5ff",
  },
  codeText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#7C3AED",
    letterSpacing: 6,
  },
  codeActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  codeActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    gap: 6,
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  emailInviteSection: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 24,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  emailInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  emailInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sendEmailButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  sendEmailGradient: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  verdictModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    maxHeight: height * 0.9,
  },
  verdictContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  verdictSuccessIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  verdictTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 24,
  },
  matchScoreContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  matchScoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchScoreBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  matchScoreFill: {
    height: "100%",
    borderRadius: 4,
  },
  matchScoreValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7C3AED",
    marginTop: 8,
  },
  recommendationCard: {
    width: "100%",
    backgroundColor: "#f3e8ff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recommendationTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  recommendationReason: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  alternativesSection: {
    width: "100%",
    marginBottom: 24,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  alternativeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  alternativeNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alternativeNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },
  alternativeContent: {
    flex: 1,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  alternativeReason: {
    fontSize: 13,
    color: "#6b7280",
  },
  verdictActions: {
    width: "100%",
    gap: 12,
  },
  watchNowButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  watchNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  watchNowText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  tryAgainButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  tryAgainText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
})
