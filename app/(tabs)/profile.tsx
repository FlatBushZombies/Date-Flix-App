"use client"

import { MessageBanner } from "@/components/MessageBanner"
import type { Invitation, SupabaseUser, SwipeSession } from "@/types"
import { permanentlyDeleteAccount } from "@/utils/account"
import {
  acceptInvitation,
  createInvitation,
  getActiveSwipeSessions,
  getUserInvitations,
  getUserStats,
  syncUserWithSupabase,
} from "@/utils/supabase-helpers"
import { useClerk, useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Film, Heart, Users } from "lucide-react-native"
import type React from "react"
import { useEffect, useState } from "react"
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg:          "#ffffff",
  surface:     "#f9fafb",
  surfaceHigh: "#f3f4f6",
  border:      "#e5e7eb",
  borderGlow:  "#06b6d420",
  cyan:        "#06b6d4",
  cyanLight:   "#67e8f9",
  cyanDim:     "#06b6d420",
  text:        "#111827",
  textMuted:   "#6b7280",
  textSub:     "#9ca3af",
  accent:      "#3b82f6",
  green:       "#22c55e",
  red:         "#ef4444",
  redDim:      "#fef2f2",
  // aliases used below
  gold:        "#06b6d4",
  goldDim:     "#06b6d420",
}

const F = {
  display: undefined,  // System default
  body:    undefined,
}

export default function ProfileScreen() {
  const { user } = useUser()
  const clerk = useClerk()
  const router = useRouter()

  const [stats, setStats] = useState({ totalSwipes: 0, totalMatches: 0, activeSessions: 0 })
  const [invitations, setInvitations] = useState<(Invitation & { sender: SupabaseUser })[]>([])
  const [sessions, setSessions] = useState<(SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)
  const [bannerType, setBannerType] = useState<"success" | "error" | "info">("info")
  const [bannerTitle, setBannerTitle] = useState("")
  const [bannerMessage, setBannerMessage] = useState("")

  useEffect(() => {
    if (user) loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    try {
      await syncUserWithSupabase(user)
      const [statsData, invitesData, sessionsData] = await Promise.all([
        getUserStats(user.id),
        getUserInvitations(user.id),
        getActiveSwipeSessions(user.id),
      ])
      setStats(statsData)
      setInvitations(invitesData)
      setSessions(sessionsData)
    } catch (error) {
      console.error("[v0] Error loading user data:", error)
    }
  }

  const showBanner = (type: "success" | "error" | "info", title: string, message: string) => {
    setBannerType(type)
    setBannerTitle(title)
    setBannerMessage(message)
    setBannerVisible(true)
  }

  const handleCreateInvite = async () => {
    if (!user) return
    setLoading(true)
    try {
      const invitation = await createInvitation(user.id)
      if (invitation) {
        setShowInviteModal(false)
        const shareMessage = `Join me on Movie Circle! Use code: ${invitation.invite_code}\n\nOr use this link: movieapp://invite/${invitation.invite_code}`
        await Share.share({ message: shareMessage, title: "Join me on Movie Circle" })
        showBanner("success", "Invitation Created!", `Share code: ${invitation.invite_code}`)
        loadUserData()
      }
    } catch {
      showBanner("error", "Error", "Failed to create invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWithCode = async () => {
    if (!user || !inviteCode.trim()) return
    setLoading(true)
    try {
      const result = await acceptInvitation(inviteCode.toUpperCase(), user.id)
      if (result.success) {
        setShowJoinModal(false)
        setInviteCode("")
        showBanner("success", "Success!", "You can now start swiping together!")
        loadUserData()
      } else {
        showBanner("error", "Error", result.error || "Failed to join")
      }
    } catch {
      showBanner("error", "Error", "Failed to join with code")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await clerk.signOut()
      router.replace("/")
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Warning",
              "This will permanently delete all your data including matches, swipes, and profile information. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true)
                    try {
                      const result = await permanentlyDeleteAccount(user.id, user)
                      if (result.success) {
                        Alert.alert("Account Deleted", result.message, [{ text: "OK", onPress: () => router.replace("/") }])
                      } else {
                        Alert.alert("Deletion Failed", result.message, [{ text: "OK" }])
                      }
                    } catch {
                      showBanner("error", "Error", "Failed to delete account. Please try again or contact support.")
                    } finally {
                      setDeletingAccount(false)
                    }
                  },
                },
              ]
            )
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <MessageBanner
        visible={bannerVisible}
        type={bannerType}
        title={bannerTitle}
        message={bannerMessage}
        onDismiss={() => setBannerVisible(false)}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Subtle decorative line accent */}
        <View style={s.headerAccentLine} />
        <Text style={s.appTitle}>Movie Circle</Text>
        <Text style={s.appSubtitle}>Match, watch, and enjoy movies together</Text>
      </View>

      {/* ── Avatar Cluster ───────────────────────────────────── */}
      <View style={s.avatarSection}>
        {/* Glow halo behind avatar */}
        <View style={s.avatarGlow} />

        <View style={s.avatarRow}>
          {/* Left Partner */}
          <View style={s.partnerAvatarWrap}>
            {sessions[0] ? (
              <Image
                source={{ uri: (sessions[0].user1_id === user?.id ? sessions[0].user2 : sessions[0].user1).image_url || "" }}
                style={s.partnerAvatar}
              />
            ) : (
              <View style={s.partnerAvatarEmpty}>
                <Users size={18} color={C.textSub} />
              </View>
            )}
            {/* Connector line */}
            <View style={[s.connector, s.connectorRight]} />
          </View>

          {/* Main Avatar */}
          <View style={s.mainAvatarOuter}>
            <View style={s.mainAvatarRing}>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={s.mainAvatar} />
              ) : (
                <View style={[s.mainAvatar, s.mainAvatarFallback]}>
                  <Ionicons name="person" size={36} color={C.gold} />
                </View>
              )}
            </View>
            {/* Gold badge */}
            <View style={s.cineBadge}>
              <Text style={s.cineBadgeText}>🎬</Text>
            </View>
          </View>

          {/* Right Partner */}
          <View style={s.partnerAvatarWrap}>
            {/* Connector line */}
            <View style={[s.connector, s.connectorLeft]} />
            {sessions[1] ? (
              <Image
                source={{ uri: (sessions[1].user1_id === user?.id ? sessions[1].user2 : sessions[1].user1).image_url || "" }}
                style={s.partnerAvatar}
              />
            ) : (
              <View style={s.partnerAvatarEmpty}>
                <Heart size={18} color={C.textSub} />
              </View>
            )}
          </View>
        </View>

        {/* Name & Email */}
        <Text style={s.userName}>{user?.firstName || user?.username || "User"}</Text>
        {user?.emailAddresses?.[0]?.emailAddress && (
          <Text style={s.userEmail}>{user.emailAddresses[0].emailAddress}</Text>
        )}
        <View style={s.statusPill}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>Ready to pair a movie</Text>
        </View>
      </View>

      {/* ── Stats ────────────────────────────────────────────── */}
      <View style={s.statsRow}>
        <StatCard value={stats.totalSwipes} label="Total Swipes" color={C.gold} />
        <View style={s.statsDivider} />
        <StatCard value={stats.totalMatches} label="Matches" color="#E879A0" />
        <View style={s.statsDivider} />
        <StatCard value={stats.activeSessions} label="Active Friends" color="#818CF8" />
      </View>

      {/* ── Swipe Together ───────────────────────────────────── */}
      <View style={s.section}>
        <SectionLabel text="Swipe Together" />
        <View style={s.inviteRow}>
          <TouchableOpacity style={s.btnGold} onPress={() => setShowInviteModal(true)} activeOpacity={0.85}>
            <Ionicons name="person-add" size={16} color={C.bg} />
            <Text style={s.btnGoldText}>Invite Friend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnGhost} onPress={() => setShowJoinModal(true)} activeOpacity={0.85}>
            <Ionicons name="enter" size={16} color={C.gold} />
            <Text style={s.btnGhostText}>Join Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Active Sessions ──────────────────────────────────── */}
      {sessions.length > 0 && (
        <View style={s.section}>
          <SectionLabel text="Swiping With" />
          {sessions.map((session) => {
            const partner = session.user1_id === user?.id ? session.user2 : session.user1
            return (
              <View key={session.id} style={s.sessionCard}>
                <View style={s.sessionAvatarWrap}>
                  {partner.image_url ? (
                    <Image source={{ uri: partner.image_url }} style={s.sessionAvatar} />
                  ) : (
                    <View style={[s.sessionAvatar, s.sessionAvatarFallback]}>
                      <Ionicons name="person" size={20} color={C.gold} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sessionName}>{partner.first_name || partner.username || "Friend"}</Text>
                  <Text style={s.sessionStatus}>Active session</Text>
                </View>
                <View style={s.onlinePulse}>
                  <View style={s.onlineDot} />
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* ── Action Cards ─────────────────────────────────────── */}
      <View style={s.section}>
        <ActionCard
          title="Movie Match"
          description="Swipe and match movies with a friend"
          action="Start"
          icon={<Film size={18} color={C.gold} />}
        />
        <ActionCard
          title="Watch Together"
          description="Create a synced movie night"
          action="Create"
          icon={<Users size={18} color={C.gold} />}
        />
        <ActionCard
          title="Shared Watchlist"
          description="Save movies you both want to see"
          action="Open"
          icon={<Heart size={18} color={C.gold} />}
        />
      </View>

      {/* ── Footer ───────────────────────────────────────────── */}
      <View style={s.footer}>
        <View style={s.footerDivider} />

        <TouchableOpacity style={s.footerRow} onPress={() => Alert.alert("Account", "Account settings coming soon")}>
          <Text style={s.footerText}>Account Settings</Text>
          <Ionicons name="chevron-forward" size={16} color={C.textSub} />
        </TouchableOpacity>

        <View style={s.footerDivider} />

        {/* Logout Button — prominent, outlined */}
        <TouchableOpacity style={s.btnLogout} onPress={handleLogout} activeOpacity={0.8}>
          <View style={s.btnInner}>
            <Ionicons name="log-out-outline" size={18} color="#f97316" />
            <Text style={s.btnLogoutText}>Logout</Text>
          </View>
          <View style={s.btnArrow}>
            <Ionicons name="chevron-forward" size={15} color="#f97316" />
          </View>
        </TouchableOpacity>

        {/* Delete Account Button — solid red, destructive weight */}
        <TouchableOpacity
          style={[s.btnDelete, deletingAccount && s.btnDeleteDisabled]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          activeOpacity={0.8}
        >
          <View style={s.btnInner}>
            <Ionicons name="trash-outline" size={18} color={deletingAccount ? "#fca5a5" : "#fff"} />
            <Text style={[s.btnDeleteText, deletingAccount && { color: "#fca5a5" }]}>
              {deletingAccount ? "Deleting Account…" : "Delete Account"}
            </Text>
          </View>
          {!deletingAccount && (
            <View style={s.btnDeleteBadge}>
              <Text style={s.btnDeleteBadgeText}>Permanent</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Invite Modal ─────────────────────────────────────── */}
      <Modal visible={showInviteModal} transparent animationType="fade" onRequestClose={() => setShowInviteModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Invite a Friend</Text>
            <Text style={s.modalSub}>Create an invitation code to swipe together</Text>
            <TouchableOpacity style={s.btnGoldFull} onPress={handleCreateInvite} disabled={loading} activeOpacity={0.85}>
              <Text style={s.btnGoldText}>{loading ? "Creating…" : "Create Invite Code"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowInviteModal(false)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Join Modal ───────────────────────────────────────── */}
      <Modal visible={showJoinModal} transparent animationType="fade" onRequestClose={() => setShowJoinModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Join with Code</Text>
            <Text style={s.modalSub}>Enter your friend's invitation code</Text>
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter code (e.g., ABC123XY)"
              placeholderTextColor={C.textSub}
              style={s.codeInput}
              autoCapitalize="characters"
              maxLength={8}
            />
            <TouchableOpacity
              style={[s.btnGoldFull, (!inviteCode.trim() || loading) && s.btnDisabled]}
              onPress={handleJoinWithCode}
              disabled={loading || !inviteCode.trim()}
              activeOpacity={0.85}
            >
              <Text style={s.btnGoldText}>{loading ? "Joining…" : "Join Session"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalCancel}
              onPress={() => { setShowJoinModal(false); setInviteCode("") }}
            >
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
      <View style={{ width: 3, height: 14, backgroundColor: C.gold, borderRadius: 2, marginRight: 8 }} />
      <Text style={s.sectionLabel}>{text}</Text>
    </View>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function ActionCard({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action: string
  icon: React.ReactNode
}) {
  return (
    <View style={s.actionCard}>
      <View style={s.actionIconWrap}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionDesc}>{description}</Text>
      </View>
      <TouchableOpacity style={s.actionBtn} activeOpacity={0.75}>
        <Text style={s.actionBtnText}>{action}</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  headerAccentLine: {
    width: 40,
    height: 2,
    backgroundColor: C.gold,
    borderRadius: 1,
    marginBottom: 16,
    opacity: 0.7,
  },
  appTitle: {
    fontFamily: F.display,
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: "center",
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarGlow: {
    position: "absolute",
    top: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.gold,
    opacity: 0.07,
    // blur via shadow simulation
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  partnerAvatarWrap: {
    alignItems: "center",
    flexDirection: "row",
  },
  partnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  partnerAvatarEmpty: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    width: 22,
    height: 1,
    backgroundColor: C.border,
  },
  connectorRight: { marginRight: 0 },
  connectorLeft:  { marginLeft: 0 },
  mainAvatarOuter: {
    position: "relative",
    marginHorizontal: 6,
  },
  mainAvatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: C.gold,
    padding: 3,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  mainAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  mainAvatarFallback: {
    backgroundColor: C.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  cineBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cineBadgeText: { fontSize: 13 },
  userName: {
    fontFamily: F.display,
    fontSize: 22,
    fontWeight: "600",
    color: C.text,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  statusText: {
    fontSize: 12,
    color: C.textMuted,
    letterSpacing: 0.2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
  },
  statsDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontFamily: F.display,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // Section
  section: {
    marginHorizontal: 20,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // Invite buttons
  inviteRow: {
    flexDirection: "row",
    gap: 12,
  },
  btnGold: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnGoldText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.bg,
    letterSpacing: 0.3,
  },
  btnGhost: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: C.gold,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.gold,
    letterSpacing: 0.3,
  },

  // Sessions
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  sessionAvatarWrap: {
    marginRight: 12,
  },
  sessionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sessionAvatarFallback: {
    backgroundColor: C.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
  },
  sessionStatus: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  onlinePulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${C.green}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
  },

  // Action Cards
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${C.gold}18`,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    letterSpacing: 0.1,
  },
  actionDesc: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.gold,
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    marginHorizontal: 20,
    marginBottom: 48,
  },
  footerDivider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 4,
  },
  footerDividerThin: {
    height: 1,
    backgroundColor: `${C.border}80`,
    marginHorizontal: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 15,
    color: C.textMuted,
    letterSpacing: 0.1,
  },

  // Logout — outlined orange-tinted premium button
  btnLogout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  btnLogoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f97316",
    marginLeft: 10,
    letterSpacing: 0.2,
  },

  // Delete — solid red, full weight
  btnDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  btnDeleteDisabled: {
    backgroundColor: "#fca5a5",
    shadowOpacity: 0,
  },
  btnDeleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  btnDeleteBadge: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnDeleteBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fecaca",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  btnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: F.display,
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 28,
    lineHeight: 20,
  },
  btnGoldFull: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnDisabled: {
    backgroundColor: C.surfaceHigh,
    shadowOpacity: 0,
  },
  codeInput: {
    backgroundColor: C.surfaceHigh,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  modalCancel: {
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    color: C.textMuted,
    fontWeight: "600",
  },
})