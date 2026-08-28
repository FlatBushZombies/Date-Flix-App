"use client"

import { View, Text, ScrollView, Image, TouchableOpacity, Share, StyleSheet, Dimensions, ActivityIndicator, Modal, Linking } from "react-native"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-expo"
import { useToast } from "@/components/Toast/ToastProvider"
import { withAffiliateTag } from "@/utils/affiliateLinks"
import { EmptyState as IllustratedEmptyState } from "@/components/EmptyState"
import { EmptyState } from "@/components/ui/EmptyState"
import { Ionicons } from "@expo/vector-icons"
import { CloudOff } from "lucide-react-native"
import { getUserMatches, syncUserWithSupabase } from "@/utils/supabase-helpers"
import { STREAMING_PLATFORMS, getWatchUrl } from "@/lib/streaming"
import type { SupabaseMatch, SupabaseUser } from "@/types"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated"

const { width } = Dimensions.get("window")

export default function MatchScreen() {
  const { user } = useUser()
  const toast = useToast()
  const [matches, setMatches] = useState<(SupabaseMatch & { user1: SupabaseUser; user2: SupabaseUser })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [streamingModalVisible, setStreamingModalVisible] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<{ title: string; id: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadMatches()
    }
  }, [user])

  const loadMatches = async () => {
    if (!user) return

    setLoadError(false)
    try {
      await syncUserWithSupabase(user)
      const data = await getUserMatches(user.id)
      if (data === null) {
        setLoadError(true)
      } else {
        setMatches(data)
      }
    } catch (error) {
      console.error("[v0] Error loading matches:", error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStreaming = (movieTitle: string, matchId: string) => {
    setSelectedMovie({ title: movieTitle, id: matchId })
    setStreamingModalVisible(true)
  }

  const handleSelectPlatform = async (platform: typeof STREAMING_PLATFORMS[0]) => {
    if (!selectedMovie) return

    const url = withAffiliateTag(platform.name, getWatchUrl(platform.name, selectedMovie.title))

    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        toast.error("Unable to Open", `Could not open ${platform.name}. Please make sure the app is installed.`)
      }
    } catch (error) {
      toast.error("Error", "Failed to open streaming platform")
    }
    
    setStreamingModalVisible(false)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Matches</Text>
        </View>

        <EmptyState
          icon={<CloudOff size={40} color="#ef4444" strokeWidth={1.6} />}
          title="Couldn't Load Matches"
          description="Something went wrong reaching the server. Check your connection and try again."
          actionLabel="Retry"
          onAction={loadMatches}
          tintColor="#ef4444"
        />
      </View>
    )
  }

  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Matches</Text>
          <Text style={styles.headerSubtitle}>Movies you and your friends both loved</Text>
        </View>

        <IllustratedEmptyState
          title="No Matches Yet"
          description="Invite friends and start swiping together to find movies you both love!"
        />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} {matches.length === 1 ? "movie" : "movies"} matched
        </Text>
      </View>

      {/* Matches Grid */}
      <View style={styles.matchesContainer}>
        {matches.map((match, index) => {
          const partner = match.user1_id === user?.id ? match.user2 : match.user1
          const movieData = match.movie_data as any

          return (
            <Animated.View 
              key={match.id} 
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.matchCard}
            >
              {/* Movie Poster */}
              <View style={styles.posterContainer}>
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w500${movieData?.poster_path}` }}
                  style={styles.poster}
                  resizeMode="cover"
                />
                
                {/* Gradient Overlay */}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.posterOverlay}
                />

                {/* Match Badge */}
                <View style={styles.matchBadge}>
                  <LinearGradient
                    colors={["#ec4899", "#f472b6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.matchBadgeGradient}
                  >
                    <Image
                      source={require("@/assets/icons/love.png")}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.matchBadgeText}>Match!</Text>
                  </LinearGradient>
                </View>

                {/* Watched Indicator */}
                {match.watched && (
                  <View style={styles.watchedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={styles.watchedText}>Watched</Text>
                  </View>
                )}

                {/* Rating Badge */}
                {movieData?.vote_average && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.ratingText}>{movieData.vote_average.toFixed(1)}</Text>
                  </View>
                )}
              </View>

              {/* Movie Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.movieTitle} numberOfLines={2}>{movieData?.title}</Text>
                
                {movieData?.release_date && (
                  <Text style={styles.movieYear}>
                    {new Date(movieData.release_date).getFullYear()}
                  </Text>
                )}

                {/* Partner Info */}
                <View style={styles.partnerContainer}>
                  <View style={styles.partnerInfo}>
                    <View style={styles.partnerAvatar}>
                      {partner.image_url ? (
                        <Image source={{ uri: partner.image_url }} style={styles.partnerAvatarImage} />
                      ) : (
                        <LinearGradient
                          colors={["#fce7f3", "#fbcfe8"]}
                          style={styles.partnerAvatarPlaceholder}
                        >
                          <Text style={styles.partnerAvatarInitial}>
                            {partner.first_name?.[0] || "?"}
                          </Text>
                        </LinearGradient>
                      )}
                    </View>
                    <View>
                      <Text style={styles.matchedWithLabel}>Matched with</Text>
                      <Text style={styles.partnerName}>
                        {partner.first_name || partner.username || "Friend"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.matchDate}>
                    {new Date(match.matched_at).toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric" 
                    })}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.watchButton}
                    onPress={() => handleOpenStreaming(movieData?.title || "Movie", match.id)}
                  >
                    <LinearGradient
                      colors={["#8B5CF6", "#A855F7"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.watchButtonGradient}
                    >
                      <Ionicons name="play" size={18} color="#fff" />
                      <Text style={styles.watchButtonText}>Watch</Text>
                      <View style={styles.watchButtonDivider} />
                      <Ionicons name="chevron-down" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => {
                      Share.share({
                        message: `Let's watch ${movieData?.title} together!`,
                      })
                    }}
                  >
                    <Ionicons name="share-social" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )
        })}
      </View>

      {/* Streaming Platform Modal */}
      <Modal
        visible={streamingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setStreamingModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStreamingModalVisible(false)}
        >
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.streamingModalContainer}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Modal Header */}
              <View style={styles.streamingModalHeader}>
                <View style={styles.streamingModalHandle} />
                <Text style={styles.streamingModalTitle}>Where to Watch</Text>
                <Text style={styles.streamingModalSubtitle}>
                  {selectedMovie?.title}
                </Text>
              </View>

              {/* Platform Grid */}
              <View style={styles.platformGrid}>
                {STREAMING_PLATFORMS.map((platform, index) => {
                  const { IconComponent } = platform
                  return (
                    <Animated.View
                      key={platform.name}
                      entering={FadeInDown.delay(index * 50).springify()}
                    >
                      <TouchableOpacity
                        style={styles.platformCard}
                        onPress={() => handleSelectPlatform(platform)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open in ${platform.name}`}
                      >
                        <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                          <IconComponent size={28} />
                        </View>
                        <Text style={styles.platformName}>{platform.name}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )
                })}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setStreamingModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfeff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ecfeff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  },
  matchesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  posterContainer: {
    position: "relative",
    height: 200,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  posterOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  matchBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  matchBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  matchBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  watchedBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  watchedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ratingBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  infoContainer: {
    padding: 20,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  partnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  partnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  partnerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  partnerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  partnerAvatarInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ec4899",
  },
  matchedWithLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  matchDate: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  watchButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  watchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  watchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  watchButtonDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },
  // Streaming Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  streamingModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
  },
  streamingModalHeader: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  streamingModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    marginBottom: 20,
  },
  streamingModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  streamingModalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  platformCard: {
    width: (width - 64) / 4,
    alignItems: "center",
    paddingVertical: 12,
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  platformName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  cancelButton: {
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
  },
})