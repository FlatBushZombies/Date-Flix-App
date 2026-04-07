"use client"

import { MessageBanner } from "@/components/MessageBanner"
import { MovieCard } from "@/components/MovieCard"
import { NotificationsModal } from "@/components/NotificationsModal"
import { useNotifications } from "@/hooks/useNotifications"
import type { Movie, SupabaseUser, SwipeSession } from "@/types"
import {
  acceptInvitation,
  createInvitation,
  getActiveSwipeSessions,
  saveSwipe,
  syncUserWithSupabase,
} from "@/utils/supabase-helpers"
import { fetchTrendingMovies } from "@/utils/tmdb"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Dimensions,
  Image,
  Modal,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { BellIcon } from "react-native-heroicons/outline"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"

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
  const [bannerVisible, setBannerVisible] = useState(false)
  const [bannerType, setBannerType] = useState<"success" | "error" | "info">("info")
  const [bannerTitle, setBannerTitle] = useState("")
  const [bannerMessage, setBannerMessage] = useState("")
  const [activeSessions, setActiveSessions] = useState<
    (SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]
  >([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const {
    items: notifications,
    unreadCount,
    loading: notificationsLoading,
    markAllRead,
    markRead,
  } = useNotifications(user?.id)

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
    if (invitation) setInviteCode(invitation.invite_code)
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

  const showBanner = (type: "success" | "error" | "info", title: string, message: string) => {
    setBannerType(type)
    setBannerTitle(title)
    setBannerMessage(message)
    setBannerVisible(true)
  }

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode)
    showBanner("success", "Copied!", "Invite code copied to clipboard")
  }

  const handleJoinSession = async () => {
    if (!user || !joinCode.trim()) return
    setIsJoining(true)
    const result = await acceptInvitation(joinCode.trim().toUpperCase(), user.id)
    if (result.success) {
      showBanner("success", "Success!", "You've joined the swipe session. Start swiping to find matches!")
      setInviteModalVisible(false)
      setJoinCode("")
      loadActiveSessions()
    } else {
      showBanner("error", "Error", result.error || "Failed to join session")
    }
    setIsJoining(false)
  }

  const handleSwipe = async (direction: "left" | "right") => {
    const currentMovie = movies[currentIndex]
    const liked = direction === "right"
    if (user && userSynced) {
      try {
        await saveSwipe(user.id, currentMovie.id, liked, currentMovie)
      } catch (error) {
        console.error("[v0] Exception while saving swipe:", error)
      }
    }
    setCurrentIndex((prev) => prev + 1)
    if (currentIndex >= movies.length - 3) loadMovies()
  }

  const currentMovie = movies[currentIndex]

  if (!currentMovie && !loading) {
    return (
      <View className="flex-1 bg-cyan-50 justify-center items-center px-10">
        <Text className="text-2xl font-extrabold text-gray-900 mb-4">No more movies!</Text>
        <TouchableOpacity
          onPress={loadMovies}
          className="bg-cyan-400 px-8 py-4 rounded-3xl shadow-md shadow-cyan-700/30"
        >
          <Text className="text-white font-bold text-base">Load More</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-cyan-50">
      <MessageBanner
        visible={bannerVisible}
        type={bannerType}
        title={bannerTitle}
        message={bannerMessage}
        onDismiss={() => setBannerVisible(false)}
      />
      {/* ── Header ── */}
      <View className="pt-16 px-6 flex-row items-center justify-between">
        {/* Left: avatar + greeting */}
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-full bg-sky-200 overflow-hidden justify-center items-center">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={22} color="#0891b2" />
            )}
          </View>
          <View>
            <Text className="text-xs text-gray-500 font-semibold">Welcome</Text>
            <Text className="text-lg font-extrabold text-gray-900">
              {user?.firstName ?? "You"}
            </Text>
          </View>
        </View>

        {/* Right: invite + bell */}
        <View className="flex-row items-center gap-3">
          {/* Invite button */}
          <TouchableOpacity
            onPress={() => setInviteModalVisible(true)}
            style={{
              borderRadius: 24,
              overflow: "hidden",
              shadowColor: "#ec4899",
              shadowOpacity: 0.35,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={["#f472b6", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                gap: 6,
              }}
            >
              <Ionicons name="people" size={18} color="#fff" />
              <Text className="text-white font-bold text-sm">Invite</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bell / notifications */}
          <TouchableOpacity
            onPress={async () => {
              setNotificationsOpen(true)
              await markAllRead()
            }}
            className="w-11 h-11 rounded-full bg-white justify-center items-center shadow shadow-black/10"
          >
            <BellIcon size={22} color="#0f172a" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <View className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white items-center justify-center">
                <Text className="text-white text-[10px] font-extrabold leading-none">
                  {unreadCount > 99 ? "99+" : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Active Sessions Banner ── */}
      {activeSessions.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="mx-6 mt-4 flex-row items-center px-4 py-3 bg-white rounded-2xl shadow shadow-black/10"
        >
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2.5" />
          <Text className="flex-1 text-sm font-semibold text-gray-700">
            Swiping with {activeSessions.length}{" "}
            {activeSessions.length === 1 ? "friend" : "friends"}
          </Text>
          <View className="flex-row items-center">
            {activeSessions.slice(0, 3).map((session, index) => {
              const partner =
                session.user1_id === user?.id ? session.user2 : session.user1
              return (
                <View
                  key={session.id}
                  className="w-7 h-7 rounded-full border-2 border-white overflow-hidden"
                  style={{ marginLeft: index > 0 ? -8 : 0 }}
                >
                  {partner.image_url ? (
                    <Image
                      source={{ uri: partner.image_url }}
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="w-full h-full bg-pink-100 justify-center items-center">
                      <Text className="text-xs font-bold text-pink-500">
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

      {/* ── Cards ── */}
      <View className="flex-1 justify-center items-center px-5 pb-10">
        {movies
          .slice(currentIndex, currentIndex + 2)
          .reverse()
          .map((movie, index) => (
            <Animated.View
              key={movie.id}
              entering={FadeIn.duration(250)}
              style={{
                position: "absolute",
                width: width - 40,
                zIndex: index === 1 ? 2 : 1,
                opacity: index === 1 ? 1 : 0.85,
                transform: [
                  { scale: index === 1 ? 1 : 0.96 },
                  { translateY: index === 1 ? 0 : 12 },
                ],
              }}
            >
              <MovieCard
                movie={movie}
                onSwipe={index === 1 ? handleSwipe : undefined}
              />
            </Animated.View>
          ))}
      </View>

      {/* ── Invite Modal ── */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            entering={FadeInDown.springify()}
            className="bg-white rounded-t-[32px] pb-10"
            style={{ minHeight: height * 0.55 }}
          >
            {/* Handle + close */}
            <View className="items-center pt-3 px-5">
              <View className="w-10 h-1 rounded-full bg-gray-300" />
              <TouchableOpacity
                onPress={() => setInviteModalVisible(false)}
                className="absolute right-5 top-3 w-9 h-9 rounded-full bg-gray-100 justify-center items-center"
              >
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Title section */}
            <View className="items-center px-6 pt-6">
              <LinearGradient
                colors={["#fce7f3", "#fbcfe8"]}
                className="w-16 h-16 rounded-full justify-center items-center mb-4"
              >
                <Ionicons name="heart-circle" size={32} color="#ec4899" />
              </LinearGradient>
              <Text className="text-2xl font-extrabold text-gray-900 mb-2">
                Swipe Together
              </Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                Invite friends to swipe and find movies you both love
              </Text>
            </View>

            {/* Tab switcher */}
            <View className="flex-row mx-6 mt-6 bg-gray-100 rounded-2xl p-1">
              {(["create", "join"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-3 items-center rounded-xl ${
                    activeTab === tab
                      ? "bg-white shadow shadow-black/10"
                      : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      activeTab === tab ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {tab === "create" ? "Create Invite" : "Join Session"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab content */}
            <View className="px-6 pt-6">
              {activeTab === "create" ? (
                !inviteCode ? (
                  <TouchableOpacity
                    onPress={handleCreateInvite}
                    disabled={isCreatingInvite}
                    className="rounded-2xl overflow-hidden shadow-md shadow-pink-500/30"
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
                        gap: 10,
                      }}
                    >
                      {isCreatingInvite ? (
                        <Text className="text-white text-base font-bold">Creating...</Text>
                      ) : (
                        <>
                          <Ionicons name="add-circle" size={24} color="#fff" />
                          <Text className="text-white text-base font-bold">
                            Generate Invite Code
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View className="items-center">
                    <Text className="text-sm font-semibold text-gray-500 mb-3">
                      Your Invite Code
                    </Text>
                    <View className="bg-gray-100 py-5 px-10 rounded-2xl border-2 border-dashed border-gray-300">
                      <Text className="text-3xl font-extrabold text-gray-900 tracking-widest">
                        {inviteCode}
                      </Text>
                    </View>
                    <View className="flex-row gap-3 mt-6">
                      <TouchableOpacity
                        onPress={handleCopyCode}
                        className="flex-row items-center px-5 py-3.5 rounded-2xl bg-gray-100 gap-2"
                      >
                        <Ionicons name="copy-outline" size={20} color="#6b7280" />
                        <Text className="text-sm font-semibold text-gray-500">Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleShareInvite}
                        className="flex-row items-center px-5 py-3.5 rounded-2xl bg-pink-500 gap-2"
                      >
                        <Ionicons name="share-social" size={20} color="#fff" />
                        <Text className="text-sm font-semibold text-white">Share</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="mt-5 text-xs text-gray-400">
                      Code expires in 7 days
                    </Text>
                  </View>
                )
              ) : (
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Enter Invite Code
                  </Text>
                  <TextInput
                    className="bg-gray-100 rounded-2xl px-5 py-[18px] text-lg font-bold text-center tracking-widest text-gray-900 border-2 border-gray-200"
                    placeholder="e.g. ABC123XY"
                    placeholderTextColor="#9ca3af"
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                  <TouchableOpacity
                    onPress={handleJoinSession}
                    disabled={!joinCode.trim() || isJoining}
                    className={`mt-5 rounded-2xl overflow-hidden ${
                      joinCode.trim()
                        ? "shadow-md shadow-cyan-600/30"
                        : "opacity-70"
                    }`}
                  >
                    <LinearGradient
                      colors={
                        joinCode.trim()
                          ? ["#06b6d4", "#0891b2"]
                          : ["#d1d5db", "#9ca3af"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 18,
                        gap: 10,
                      }}
                    >
                      {isJoining ? (
                        <Text className="text-white text-base font-bold">Joining...</Text>
                      ) : (
                        <>
                          <Ionicons name="enter-outline" size={22} color="#fff" />
                          <Text className="text-white text-base font-bold">
                            Join Session
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      <NotificationsModal
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={notifications}
        loading={notificationsLoading}
        onMarkAllRead={() => markAllRead()}
        onPressItem={(n) => {
          if (!n.read_at) markRead(n.id)
        }}
      />
    </View>
  )
}