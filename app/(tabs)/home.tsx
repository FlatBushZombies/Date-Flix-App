"use client"

import { View, Text, TouchableOpacity, Dimensions, Image, StyleSheet, Modal, Share, TextInput, Alert } from "react-native"
import { useState, useEffect } from "react"
import { MovieCard } from "@/components/MovieCard"
import { fetchTrendingMovies } from "@/utils/tmdb"
import type { Movie } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated"
import { useRouter } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import { saveSwipe, syncUserWithSupabase, createInvitation, acceptInvitation, getActiveSwipeSessions } from "@/utils/supabase-helpers"
import { LinearGradient } from "expo-linear-gradient"
import * as Clipboard from "expo-clipboard"
import type { SwipeSession, SupabaseUser } from "@/types"

const { width, height } = Dimensions.get("window")

export default function SwipeScreen() {
  const router = useRouter()
  const { user } = useUser()

  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userSynced, setUserSynced] = useState(false)
  
  // Invite modal state
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<"create" | "join">("create")
  const [activeSessions, setActiveSessions] = useState<(SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]>([])

  useEffect(() => {
    loadMovies()
  }, [])

  useEffect(() => {
    if (user && !userSynced) {
      syncUserWithSupabase(user).then(() => {
        setUserSynced(true)
        loadActiveSessions()
      })
    }
  }, [user, userSynced])

  const loadMovies = async () => {
    try {
      const data = await fetchTrendingMovies()
      setMovies(data)
    } catch (error) {
      console.error("Failed to load movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveSessions = async () => {
    if (!user) return
    const sessions = await getActiveSwipeSessions(user.id)
    setActiveSessions(sessions)
  }

  const handleCreateInvite = async () => {
    if (!user) return
    setIsCreatingInvite(true)
    
    const invitation = await createInvitation(user.id)
    if (invitation) {
      setInviteCode(invitation.invite_code)
    }
    
    setIsCreatingInvite(false)
  }

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on MovieMatch! Use my invite code: ${inviteCode}\n\nLet's find movies we both love!`,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode)
    Alert.alert("Copied!", "Invite code copied to clipboard")
  }

  const handleJoinSession = async () => {
    if (!user || !joinCode.trim()) return
    setIsJoining(true)
    
    const result = await acceptInvitation(joinCode.trim().toUpperCase(), user.id)
    
    if (result.success) {
      Alert.alert("Success!", "You've joined the swipe session. Start swiping to find matches!")
      setInviteModalVisible(false)
      setJoinCode("")
      loadActiveSessions()
    } else {
      Alert.alert("Error", result.error || "Failed to join session")
    }
    
    setIsJoining(false)
  }

  const handleSwipe = async (direction: "left" | "right") => {
    const currentMovie = movies[currentIndex]
    const liked = direction === "right"

    if (user && userSynced) {
      try {
        const result = await saveSwipe(user.id, currentMovie.id, liked, currentMovie)
        if (result) {
          // Check if this created a match (result would contain match info)
        }
      } catch (error) {
        console.error("[v0] Exception while saving swipe:", error)
      }
    }

    setCurrentIndex((prev) => prev + 1)

    if (currentIndex >= movies.length - 3) {
      loadMovies()
    }
  }

  const currentMovie = movies[currentIndex]

  if (!currentMovie && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No more movies!</Text>

        <TouchableOpacity onPress={loadMovies} style={styles.loadMoreButton}>
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={22} color="#0891b2" />
            )}
          </View>

          <View>
            <Text style={styles.welcomeLabel}>Welcome</Text>
            <Text style={styles.welcomeName}>{user?.firstName ?? "You"}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Invite Button */}
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => setInviteModalVisible(true)}
          >
            <LinearGradient
              colors={["#f472b6", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inviteButtonGradient}
            >
              <Ionicons name="people" size={18} color="#fff" />
              <Text style={styles.inviteButtonText}>Invite</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Sessions Indicator */}
      {activeSessions.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.activeSessionBanner}>
          <View style={styles.activeSessionDot} />
          <Text style={styles.activeSessionText}>
            Swiping with {activeSessions.length} {activeSessions.length === 1 ? "friend" : "friends"}
          </Text>
          <View style={styles.sessionAvatars}>
            {activeSessions.slice(0, 3).map((session, index) => {
              const partner = session.user1_id === user?.id ? session.user2 : session.user1
              return (
                <View key={session.id} style={[styles.sessionAvatar, { marginLeft: index > 0 ? -8 : 0 }]}>
                  {partner.image_url ? (
                    <Image source={{ uri: partner.image_url }} style={styles.sessionAvatarImage} />
                  ) : (
                    <View style={styles.sessionAvatarPlaceholder}>
                      <Text style={styles.sessionAvatarInitial}>
                        {partner.first_name?.[0] || "?"}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </Animated.View>
      )}

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {movies
          .slice(currentIndex, currentIndex + 2)
          .reverse()
          .map((movie, index) => (
            <Animated.View
              key={movie.id}
              entering={FadeIn.duration(250)}
              style={[
                styles.cardWrapper,
                {
                  zIndex: index === 1 ? 2 : 1,
                  opacity: index === 1 ? 1 : 0.85,
                  transform: [{ scale: index === 1 ? 1 : 0.96 }, { translateY: index === 1 ? 0 : 12 }],
                },
              ]}
            >
              <MovieCard movie={movie} onSwipe={index === 1 ? handleSwipe : undefined} />
            </Animated.View>
          ))}
      </View>

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setInviteModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Title */}
            <View style={styles.modalTitleContainer}>
              <LinearGradient
                colors={["#fce7f3", "#fbcfe8"]}
                style={styles.modalIconContainer}
              >
                <Ionicons name="heart-circle" size={32} color="#ec4899" />
              </LinearGradient>
              <Text style={styles.modalTitle}>Swipe Together</Text>
              <Text style={styles.modalSubtitle}>
                Invite friends to swipe and find movies you both love
              </Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "create" && styles.tabActive]}
                onPress={() => setActiveTab("create")}
              >
                <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
                  Create Invite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "join" && styles.tabActive]}
                onPress={() => setActiveTab("join")}
              >
                <Text style={[styles.tabText, activeTab === "join" && styles.tabTextActive]}>
                  Join Session
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === "create" ? (
              <View style={styles.tabContent}>
                {!inviteCode ? (
                  <TouchableOpacity
                    style={styles.createInviteButton}
                    onPress={handleCreateInvite}
                    disabled={isCreatingInvite}
                  >
                    <LinearGradient
                      colors={["#ec4899", "#f472b6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.createInviteGradient}
                    >
                      {isCreatingInvite ? (
                        <Text style={styles.createInviteText}>Creating...</Text>
                      ) : (
                        <>
                          <Ionicons name="add-circle" size={24} color="#fff" />
                          <Text style={styles.createInviteText}>Generate Invite Code</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inviteCodeContainer}>
                    <Text style={styles.inviteCodeLabel}>Your Invite Code</Text>
                    <View style={styles.inviteCodeBox}>
                      <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                    </View>
                    
                    <View style={styles.inviteActions}>
                      <TouchableOpacity style={styles.inviteActionButton} onPress={handleCopyCode}>
                        <Ionicons name="copy-outline" size={20} color="#6b7280" />
                        <Text style={styles.inviteActionText}>Copy</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.inviteActionButton, styles.shareButton]}
                        onPress={handleShareInvite}
                      >
                        <Ionicons name="share-social" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>Share</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inviteExpiry}>
                      Code expires in 7 days
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.tabContent}>
                <Text style={styles.joinLabel}>Enter Invite Code</Text>
                <TextInput
                  style={styles.joinInput}
                  placeholder="e.g. ABC123XY"
                  placeholderTextColor="#9ca3af"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                
                <TouchableOpacity
                  style={[styles.joinButton, !joinCode.trim() && styles.joinButtonDisabled]}
                  onPress={handleJoinSession}
                  disabled={!joinCode.trim() || isJoining}
                >
                  <LinearGradient
                    colors={joinCode.trim() ? ["#06b6d4", "#0891b2"] : ["#d1d5db", "#9ca3af"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.joinButtonGradient}
                  >
                    {isJoining ? (
                      <Text style={styles.joinButtonText}>Joining...</Text>
                    ) : (
                      <>
                        <Ionicons name="enter-outline" size={22} color="#fff" />
                        <Text style={styles.joinButtonText}>Join Session</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfeff",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#ecfeff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  loadMoreButton: {
    backgroundColor: "#22d3ee",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: "#0e7490",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loadMoreButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  headerContainer: {
    paddingTop: 64,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#bae6fd",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  welcomeLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  inviteButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  inviteButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  inviteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activeSessionBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeSessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 10,
  },
  activeSessionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  sessionAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  sessionAvatarImage: {
    width: "100%",
    height: "100%",
  },
  sessionAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fce7f3",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionAvatarInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ec4899",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardWrapper: {
    position: "absolute",
    width: width - 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    minHeight: height * 0.55,
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
  modalTitleContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#111827",
  },
  tabContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  createInviteButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createInviteGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  createInviteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  inviteCodeContainer: {
    alignItems: "center",
  },
  inviteCodeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  inviteCodeBox: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 4,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  inviteActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    gap: 8,
  },
  inviteActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  shareButton: {
    backgroundColor: "#ec4899",
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  inviteExpiry: {
    marginTop: 20,
    fontSize: 12,
    color: "#9ca3af",
  },
  joinLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  joinInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 4,
    color: "#111827",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  joinButton: {
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
})
