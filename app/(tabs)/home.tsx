"use client"

import { useConfirm } from "@/components/Confirm/ConfirmProvider"
import { MovieCard } from "@/components/MovieCard"
import { NotificationsModal } from "@/components/NotificationsModal"
import { StreakModal } from "@/components/StreakModal"
import { useToast } from "@/components/Toast/ToastProvider"
import { DeviceSheet } from "@/components/cast/DeviceSheet"
import { shadow } from "@/constants/theme"
import { useNotifications } from "@/hooks/useNotifications"
import { useWatchlist } from "@/hooks/useWatchlist"
import { useCast } from "@/lib/cast/CastProvider"
import { castableMovieFromTmdb } from "@/lib/cast/media"
import { getPreferences } from "@/lib/preferences"
import type { StreakEvaluation, SupabaseUser, SwipeSession, Movie } from "@/types"
import {
    acceptInvitation,
    createInvitation,
    deleteSwipeSession,
    getActiveSwipeSessions,
    getSessionActivityStrip,
    refreshSessionStreak,
    saveSwipe,
    syncUserWithSupabase
} from "@/utils/supabase-helpers"
import { fetchTrendingMovies } from "@/utils/tmdb"
import { streakEventCopy } from "@/utils/streakCopy"
import { useUser } from "@clerk/clerk-expo"
import * as Clipboard from "expo-clipboard"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useEffect, useRef, useState } from "react"
import {
    Dimensions,
    Image,
    Modal,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native"
import {
    ArrowTrendingUpIcon,
    BellIcon,
    DocumentDuplicateIcon,
    MapPinIcon,
    UserPlusIcon,
    XMarkIcon
} from "react-native-heroicons/outline"
import { Flame } from "lucide-react-native"
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated"

const { width, height } = Dimensions.get("window")

export default function SwipeScreen() {
  const router = useRouter()
  const { user } = useUser()
  const { isSaved, toggleSave } = useWatchlist(user?.id)

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
  const [activeSessions, setActiveSessions] = useState<
    (SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]
  >([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Streak state — tracks the primary (first) active session
  const [streakInfo, setStreakInfo] = useState<{
    currentStreak: number
    longestStreak: number
    partnerSwipedToday: boolean
    freezeAvailable: number
  } | null>(null)
  const [streakModalOpen, setStreakModalOpen] = useState(false)
  const [streakActivity, setStreakActivity] = useState<{ date: string; bothActive: boolean }[]>([])
  const [streakActivityLoading, setStreakActivityLoading] = useState(false)

  const toast = useToast()
  const confirm = useConfirm()
  const cast = useCast()

  // Casting state — mirrors the connect-then-cast pattern used on the
  // Results screen: if no TV is connected yet, open the device picker and
  // remember which movie to send once the connection actually completes.
  const [showDeviceSheet, setShowDeviceSheet] = useState(false)
  const [castingMovieId, setCastingMovieId] = useState<number | null>(null)
  const pendingCastMovieRef = useRef<Movie | null>(null)

  useEffect(() => {
    if (pendingCastMovieRef.current && cast.connectionState === "connected") {
      const movie = pendingCastMovieRef.current
      pendingCastMovieRef.current = null
      castMovieToTv(movie)
    }
  }, [cast.connectionState])

  // Read once on mount — set from Account Settings, doesn't need to be reactive
  // mid-session. Only mutes the in-app streak toasts, not push notifications.
  const [partnerActivityMuted, setPartnerActivityMuted] = useState(false)
  useEffect(() => {
    getPreferences().then((p) => setPartnerActivityMuted(p.partnerActivityMuted))
  }, [])

  const {
    items: notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
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
    if (sessions.length > 0) {
      // Also catches a streak that broke overnight, without needing a fresh swipe
      const evaluation = await refreshSessionStreak(sessions[0])
      applyStreakEvaluation(sessions[0], evaluation, true)
    } else {
      setStreakInfo(null)
    }
  }

  const applyStreakEvaluation = (
    session: SwipeSession & { user1: SupabaseUser; user2: SupabaseUser },
    evaluation: StreakEvaluation,
    isPrimary: boolean,
  ) => {
    if (!user) return
    const isUser1 = session.user1_id === user.id

    if (isPrimary) {
      setStreakInfo({
        currentStreak: evaluation.currentStreak,
        longestStreak: evaluation.longestStreak,
        partnerSwipedToday: isUser1 ? evaluation.user2SwipedToday : evaluation.user1SwipedToday,
        freezeAvailable: evaluation.freezeAvailable,
      })
    }

    if (evaluation.event === "none" || partnerActivityMuted) return

    const partnerName = (isUser1 ? session.user2.first_name : session.user1.first_name) || "your partner"
    const day = evaluation.event === "broken" ? evaluation.previousStreak ?? 0 : evaluation.currentStreak
    const copy = streakEventCopy(evaluation.event, day, partnerName)

    if (evaluation.event === "broken") {
      toast.streakBroken({ day, title: copy.title, message: copy.body })
    } else {
      toast.streak({ day, title: copy.title, message: copy.body, milestone: evaluation.event === "milestone" })
    }
  }

  const openStreakModal = async () => {
    setStreakModalOpen(true)
    if (!activeSessions[0]) return
    setStreakActivityLoading(true)
    const strip = await getSessionActivityStrip(activeSessions[0].user1_id, activeSessions[0].user2_id)
    setStreakActivity(strip)
    setStreakActivityLoading(false)
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
        message: `Join me on Duo App! Use my invite code: ${inviteCode}\n\nLet's find movies we both love!`,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode)
    toast.success("Copied!", "Invite code copied to clipboard")
  }

  const handleJoinSession = async () => {
    if (!user || !joinCode.trim()) return
    setIsJoining(true)
    const result = await acceptInvitation(joinCode.trim().toUpperCase(), user.id)
    if (result.success) {
      toast.success("Success!", "You've joined the swipe session. Start swiping to find matches!")
      setInviteModalVisible(false)
      setJoinCode("")
      loadActiveSessions()
    } else {
      toast.error("Error", result.error || "Failed to join session")
    }
    setIsJoining(false)
  }

  const handleDeleteSession = async (sessionId: string) => {
    confirm.show({
      title: "Delete Session",
      message: "Are you sure you want to delete this session? You won't be able to swipe together anymore.",
      variant: "destructive",
      buttons: [
        { label: "Cancel", style: "cancel" },
        {
          label: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteSwipeSession(sessionId)
            if (result.success) {
              toast.success("Session Deleted", "The swipe session has been removed.")
              loadActiveSessions()
            } else {
              toast.error("Error", result.error || "Failed to delete session")
            }
          },
        },
      ],
    })
  }

  // Advances the deck immediately so swiping never waits on a network round
  // trip — the save happens in the background and only affects toasts, not
  // how fast the next card appears.
  const handleSwipe = (direction: "left" | "right") => {
    const currentMovie = movies[currentIndex]
    const liked = direction === "right"

    setCurrentIndex((prev) => prev + 1)
    if (currentIndex >= movies.length - 3) loadMovies()

    if (user && userSynced) {
      saveSwipe(user.id, currentMovie.id, liked, currentMovie)
        .then((result) => {
          const evaluations: { sessionId: string; evaluation: StreakEvaluation }[] =
            result?.streakEvaluations ?? []
          evaluations.forEach(({ sessionId, evaluation }) => {
            const session = activeSessions.find((s) => s.id === sessionId)
            if (session) applyStreakEvaluation(session, evaluation, activeSessions[0]?.id === sessionId)
          })
        })
        .catch((error) => console.error("[v0] Exception while saving swipe:", error))
    }
  }

  const handleSaveMovie = async (movie: Movie) => {
    if (!user) {
      toast.error("Sign in required", "Sign in to save movies to your watchlist")
      return
    }
    const wasSaved = isSaved(movie.id)
    const ok = await toggleSave(movie)
    if (!ok) {
      toast.error("Error", wasSaved ? "Failed to remove from watchlist" : "Failed to save to watchlist")
      return
    }
    if (wasSaved) {
      toast.info("Removed", `${movie.title} removed from your watchlist`)
    } else {
      toast.success("Saved!", `${movie.title} added to your watchlist`)
    }
  }

  const handleShareMovie = async (movie: Movie) => {
    try {
      const shareMessage = `Check out "${movie.title}" on Duo App! 🎬\n\n${movie.overview?.slice(0, 100)}...\n\n#MovieCircle #Movies`
      await Share.share({
        message: shareMessage,
      })
      toast.success("Shared!", "Movie shared successfully")
    } catch (error) {
      toast.error("Error", "Failed to share movie")
    }
  }

  const handleTrailerPress = async (movie: Movie, youtubeKey: string) => {
    try {
      await WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${youtubeKey}`)
    } catch {
      toast.error("Error", `Couldn't open the trailer for ${movie.title}`)
    }
  }

  // Sends this movie's poster/title to the connected Cast receiver, taking
  // it full-screen on the TV. See lib/cast/CastProvider.native.tsx — this is
  // a no-op with a helpful message when casting isn't available (Expo Go,
  // web, or no native module linked).
  async function castMovieToTv(movie: Movie) {
    setCastingMovieId(movie.id)
    try {
      const result = await cast.watchOnTV(castableMovieFromTmdb(movie))
      if (result.ok) {
        toast.success("Casting", `Now showing ${movie.title} on ${cast.device?.name ?? "your TV"}.`)
      } else {
        toast.error("Cast failed", result.message ?? "Could not send this to your TV.")
      }
    } finally {
      setCastingMovieId(null)
    }
  }

  const handleWatchOnTv = (movie: Movie) => {
    if (castingMovieId !== null) return
    if (cast.connectionState !== "connected") {
      pendingCastMovieRef.current = movie
      setShowDeviceSheet(true)
      return
    }
    castMovieToTv(movie)
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
              <UserPlusIcon size={22} color="#0891b2" strokeWidth={1.6} />
            )}
          </View>
          <View>
            <Text className="text-xs text-gray-500 font-semibold">Welcome</Text>
            <Text className="text-lg font-extrabold text-gray-900">
              {user?.firstName ?? "You"}
            </Text>
          </View>
        </View>

        {/* Right: invite + map + bell */}
        <View className="flex-row items-center gap-3">
          {/* Invite button */}
          <TouchableOpacity
            onPress={() => setInviteModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Invite a friend to swipe together"
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#E50914",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 6,
              shadowColor: "#E50914",
              shadowOpacity: 0.28,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 5,
            }}
          >
            <UserPlusIcon size={18} color="#fff" strokeWidth={1.6} />
            <Text className="text-white font-bold text-sm">Invite</Text>
          </TouchableOpacity>

          {/* Top Picks button */}
          <TouchableOpacity
            onPress={() => router.push("/top-picks")}
            className="w-11 h-11 rounded-full bg-white justify-center items-center shadow shadow-black/10"
            accessibilityRole="button"
            accessibilityLabel="View top upvoted movies"
          >
            <ArrowTrendingUpIcon size={22} color="#0f172a" strokeWidth={1.6} />
          </TouchableOpacity>

          {/* Streak badge */}
          {streakInfo && streakInfo.currentStreak > 0 && (
            <StreakBadge streakInfo={streakInfo} onPress={openStreakModal} />
          )}

          {/* Bell / notifications */}
          <TouchableOpacity
            onPress={async () => {
              setNotificationsOpen(true)
              await markAllRead()
            }}
            className="w-11 h-11 rounded-full bg-white justify-center items-center shadow shadow-black/10"
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
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
          className="mx-6 mt-4 flex-row items-center px-4 py-3.5 bg-white rounded-3xl"
          style={shadow.sm}
        >
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2.5" />
          <Text className="flex-1 text-sm font-semibold text-gray-700">
            Swiping with {activeSessions.length}{" "}
            {activeSessions.length === 1 ? "friend" : "friends"}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteSession(activeSessions[0].id)}
            className="mr-3"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Delete swipe session"
          >
            <XMarkIcon size={18} color="#ef4444" strokeWidth={1.8} />
          </TouchableOpacity>
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
                onSave={handleSaveMovie}
                onShare={handleShareMovie}
                onTrailer={handleTrailerPress}
                onWatchOnTv={handleWatchOnTv}
                castingToTv={castingMovieId === movie.id}
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
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Close invite dialog"
              >
                <XMarkIcon size={22} color="#6b7280" strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            {/* Title section */}
            <View className="items-center px-6 pt-6">
              <LinearGradient
                colors={["#fce7f3", "#fbcfe8"]}
                className="w-16 h-16 rounded-full justify-center items-center mb-4"
              >
                <UserPlusIcon size={30} color="#ec4899" strokeWidth={1.6} />
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
                          <UserPlusIcon size={22} color="#fff" strokeWidth={1.6} />
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
                        <DocumentDuplicateIcon size={20} color="#6b7280" strokeWidth={1.6} />
                        <Text className="text-sm font-semibold text-gray-500">Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleShareInvite}
                        className="flex-row items-center px-5 py-3.5 rounded-2xl bg-pink-500 gap-2"
                      >
                        <UserPlusIcon size={20} color="#fff" strokeWidth={1.6} />
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
                          <MapPinIcon size={22} color="#fff" strokeWidth={1.6} />
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
        error={notificationsError}
        onRetry={refreshNotifications}
        onMarkAllRead={() => markAllRead()}
        onPressItem={(n) => {
          if (!n.read_at) markRead(n.id)
        }}
      />

      <StreakModal
        visible={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        currentStreak={streakInfo?.currentStreak ?? 0}
        longestStreak={streakInfo?.longestStreak ?? 0}
        freezeAvailable={streakInfo?.freezeAvailable ?? 0}
        activityStrip={streakActivity}
        loading={streakActivityLoading}
      />

      <DeviceSheet
        visible={showDeviceSheet}
        onClose={() => {
          setShowDeviceSheet(false)
          pendingCastMovieRef.current = null
        }}
      />
    </View>
  )
}

function StreakBadge({
  streakInfo,
  onPress,
}: {
  streakInfo: { currentStreak: number; longestStreak: number; partnerSwipedToday: boolean }
  onPress: () => void
}) {
  const active = streakInfo.partnerSwipedToday
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = active ? withRepeat(withTiming(1, { duration: 1200 }), -1, true) : 0
  }, [active])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + pulse.value * 0.25,
  }))

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${streakInfo.currentStreak} day streak, view details`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: active ? "#fffbeb" : "#ffffff",
        borderRadius: 14,
        paddingHorizontal: 10,
        height: 44,
        gap: 4,
        borderWidth: 1.5,
        borderColor: active ? "#f59e0b" : "#e5e7eb",
      }}
    >
      {active && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: 18,
              backgroundColor: "#f59e0b",
            },
            glowStyle,
          ]}
        />
      )}
      <Flame size={16} color={active ? "#f59e0b" : "#9ca3af"} strokeWidth={1.8} />
      <Text style={{ fontSize: 13, fontWeight: "800", color: active ? "#b45309" : "#6b7280" }}>
        {streakInfo.currentStreak}
      </Text>
    </TouchableOpacity>
  )
}