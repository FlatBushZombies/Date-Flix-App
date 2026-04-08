"use client"

import { View, Text, ScrollView, Image, TouchableOpacity, Share, Alert, StyleSheet, Dimensions, ActivityIndicator, Modal, Linking } from "react-native"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { getUserMatches, syncUserWithSupabase } from "@/utils/supabase-helpers"
import type { SupabaseMatch, SupabaseUser } from "@/types"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated"
import Svg, { Path, Rect, Circle, G, Polygon, Text as SvgText } from "react-native-svg"

const { width } = Dimensions.get("window")

// --- Brand SVG Icons ---

const NetflixIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 6.854.398-2.296-6.987-3.924-11.945-5.894-18.715l5.52 18.715h6.922L8.044 0H5.398zm8.2 0v9.03l4.34 11.58 4.32-11.58V0H13.6z"
      fill="white"
    />
    <Path
      d="M5.398 0v.006C3.108 6.577 1.166 12.092 0 17.587v6.01c1.854-.08 3.708-.174 5.404-.174V0H5.398z"
      fill="white"
    />
  </Svg>
)

const PrimeVideoIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.127 9.725l-.008.021c-.434 1.181-.898 2.354-1.395 3.514l2.854-.001c-.447-1.183-.948-2.358-1.451-3.534zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.952 16.691l-.635-1.778H8.39l-.65 1.784-2.007-.003 4.08-10.34 2.351-.002 4.437 10.339h-1.649z"
      fill="white"
    />
  </Svg>
)

const DisneyPlusIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.37 5.57c-.26-.04-.52-.06-.78-.06-3.34 0-6.04 2.7-6.04 6.04 0 2.84 1.96 5.22 4.6 5.86-.14-.63-.22-1.29-.22-1.96 0-4.28 2.62-7.89 6.16-9.53-.51-.19-1.05-.31-1.61-.35H11.37zm3.98-.23c-.06 0-.12.01-.18.01 2.35 1.58 3.91 4.24 3.91 7.26 0 1.41-.34 2.74-.93 3.92.24.02.49.03.74.03 3.34 0 6.04-2.7 6.04-6.04 0-2.74-1.83-5.07-4.34-5.82-.36-.1-.73-.17-1.12-.2-.37-.05-.74-.07-1.12-.07v-.09zm-5.88 6.21c0 4.59 2.11 8.39 4.89 8.88.24.04.48.06.73.06 3.65 0 6.61-3.98 6.61-8.88 0-.55-.04-1.08-.12-1.6-1.07 3.19-3.47 5.45-6.44 5.45-1.61 0-3.07-.6-4.17-1.59-.3-.26-.57-.56-.82-.88-.45-.63-.68-1.4-.68-2.44zm1.1-1.19c0 1.24.33 2.2.97 2.83.55.55 1.31.86 2.2.86 2.44 0 4.43-2.59 4.43-5.78 0-.34-.02-.67-.07-.99-1.51.9-2.61 2.58-2.61 4.52 0 .14.01.28.02.42-.36.08-.73.12-1.12.12-1.57 0-2.95-.72-3.82-1.98z"
      fill="white"
    />
  </Svg>
)

const MaxIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6l3 12h2L6 9l3 9h2l3-9-2 9h2l3-12h-3l-2.5 8L10 6H7L4.5 14 3 6H3z"
      fill="white"
    />
  </Svg>
)

const HuluIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 3v8.3c.8-.8 1.9-1.3 3.2-1.3 2.7 0 4.3 1.7 4.3 4.5V21h-3.5v-6c0-1.2-.6-1.9-1.7-1.9-1.1 0-1.8.8-1.8 1.9v6H3.5V3H6.5zm8 7.2h3.5V21H14.5V10.2z"
      fill="white"
    />
  </Svg>
)

const AppleTVIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.73M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="white"
    />
  </Svg>
)

const PeacockIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Peacock feathers as simplified colored wedges */}
    <Path d="M12 12 L12 3 Q12.5 7 16 8 Z" fill="#E8222C" />
    <Path d="M12 12 L16 8 Q18 11 17 14 Z" fill="#F5A623" />
    <Path d="M12 12 L17 14 Q15 17 12 17 Z" fill="#4CAF50" />
    <Path d="M12 12 L12 17 Q9 17 7 14 Z" fill="#2196F3" />
    <Path d="M12 12 L7 14 Q6 11 8 8 Z" fill="#9C27B0" />
    <Path d="M12 12 L8 8 Q11.5 7 12 3 Z" fill="#00BCD4" />
    <Circle cx="12" cy="12" r="2" fill="white" />
  </Svg>
)

const ParamountIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Mountain peak */}
    <Path
      d="M12 3L6.5 12H8.5L12 6.5L15.5 12H17.5L12 3Z"
      fill="white"
    />
    {/* Stars arc */}
    <Path
      d="M5 7.5 Q12 2 19 7.5"
      stroke="white"
      strokeWidth="0.4"
      fill="none"
      strokeDasharray="1 1.5"
    />
    {/* Base bar */}
    <Rect x="4" y="13" width="16" height="1.5" rx="0.75" fill="white" />
    {/* P+ text area */}
    <Path
      d="M9 15.5 Q9 18.5 12 19.5 Q15 18.5 15 15.5"
      stroke="white"
      strokeWidth="0.8"
      fill="none"
    />
  </Svg>
)

// Streaming platforms configuration
const STREAMING_PLATFORMS = [
  {
    id: "netflix",
    name: "Netflix",
    color: "#E50914",
    IconComponent: NetflixIcon,
    searchUrl: (title: string) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "prime",
    name: "Prime Video",
    color: "#00A8E1",
    IconComponent: PrimeVideoIcon,
    searchUrl: (title: string) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
  },
  {
    id: "disney",
    name: "Disney+",
    color: "#113CCF",
    IconComponent: DisneyPlusIcon,
    searchUrl: (title: string) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "hbo",
    name: "Max",
    color: "#5822B4",
    IconComponent: MaxIcon,
    searchUrl: (title: string) => `https://play.max.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "hulu",
    name: "Hulu",
    color: "#1CE783",
    IconComponent: HuluIcon,
    searchUrl: (title: string) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "apple",
    name: "Apple TV+",
    color: "#1C1C1E",
    IconComponent: AppleTVIcon,
    searchUrl: (title: string) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  },
  {
    id: "peacock",
    name: "Peacock",
    color: "#1B1B1B",
    IconComponent: PeacockIcon,
    searchUrl: (title: string) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "paramount",
    name: "Paramount+",
    color: "#0064FF",
    IconComponent: ParamountIcon,
    searchUrl: (title: string) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}`,
  },
]

export default function MatchScreen() {
  const { user } = useUser()
  const [matches, setMatches] = useState<(SupabaseMatch & { user1: SupabaseUser; user2: SupabaseUser })[]>([])
  const [loading, setLoading] = useState(true)
  const [streamingModalVisible, setStreamingModalVisible] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<{ title: string; id: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadMatches()
    }
  }, [user])

  const loadMatches = async () => {
    if (!user) return

    try {
      await syncUserWithSupabase(user)
      const data = await getUserMatches(user.id)
      setMatches(data)
    } catch (error) {
      console.error("[v0] Error loading matches:", error)
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
    
    const url = platform.searchUrl(selectedMovie.title)
    
    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        Alert.alert("Unable to Open", `Could not open ${platform.name}. Please make sure the app is installed.`)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open streaming platform")
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

  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Matches</Text>
          <Text style={styles.headerSubtitle}>Movies you and your friends both loved</Text>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#fce7f3", "#fbcfe8"]}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="heart-outline" size={64} color="#ec4899" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptySubtitle}>
            Invite friends and start swiping together to find movies you both love!
          </Text>
        </View>
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
                    <Ionicons name="heart" size={14} color="#fff" />
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
                      key={platform.id}
                      entering={FadeInDown.delay(index * 50).springify()}
                    >
                      <TouchableOpacity
                        style={styles.platformCard}
                        onPress={() => handleSelectPlatform(platform)}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
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