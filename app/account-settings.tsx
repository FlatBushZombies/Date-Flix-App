"use client"

import { useConfirm } from "@/components/Confirm/ConfirmProvider"
import { useToast } from "@/components/Toast/ToastProvider"
import { getPreferences, setPreferences } from "@/lib/preferences"
import { getStreamingConfig } from "@/lib/streaming"
import { CASTABLE_PLATFORMS, isAppInstalled, sendToStreamingApp } from "@/lib/tvCast"
import type { Invitation, SupabaseMatch, SupabaseUser, SwipeSession } from "@/types"
import { permanentlyDeleteAccount } from "@/utils/account"
import { registerForPushNotificationsAsync, updateUserPushToken } from "@/utils/notifications"
import {
  deleteSwipeSession,
  getActiveSwipeSessions,
  getSessionStreak,
  getUserInvitations,
  getUserMatches,
} from "@/utils/supabase-helpers"
import { useClerk, useUser } from "@clerk/clerk-expo"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Snowflake,
  Trash2,
  Tv,
  UserMinus,
} from "lucide-react-native"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

const C = {
  bg: "#ffffff",
  surface: "#f9fafb",
  surfaceHigh: "#f3f4f6",
  border: "#e5e7eb",
  cyan: "#06b6d4",
  text: "#111827",
  textMuted: "#6b7280",
  textSub: "#9ca3af",
  red: "#ef4444",
}

export default function AccountSettingsScreen() {
  const { user } = useUser()
  const clerk = useClerk()
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()

  // ── Profile edit ──────────────────────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const profileDirty = firstName !== (user?.firstName ?? "") || lastName !== (user?.lastName ?? "")

  // ── Notifications ─────────────────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(true)
  const [partnerActivityMuted, setPartnerActivityMuted] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  // ── Relationship settings ─────────────────────────────────
  const [sessions, setSessions] = useState<(SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]>([])
  const [invitations, setInvitations] = useState<(Invitation & { sender: SupabaseUser })[]>([])
  const [matches, setMatches] = useState<(SupabaseMatch & { user1: SupabaseUser; user2: SupabaseUser })[]>([])
  const [freeze, setFreeze] = useState<{ available: number; longestStreak: number } | null>(null)
  const [relationshipLoading, setRelationshipLoading] = useState(true)
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null)

  // ── Data export / delete ──────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  // ── Cast & TV ────────────────────────────────────────────
  const [castStatus, setCastStatus] = useState<Record<string, boolean>>({})
  const [checkingCast, setCheckingCast] = useState(true)
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null)

  useEffect(() => {
    getPreferences().then((p) => {
      setPushEnabled(p.pushEnabled)
      setPartnerActivityMuted(p.partnerActivityMuted)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setCheckingCast(true)
    Promise.all(CASTABLE_PLATFORMS.map((name) => isAppInstalled(name))).then((results) => {
      if (cancelled) return
      const next: Record<string, boolean> = {}
      CASTABLE_PLATFORMS.forEach((name, i) => {
        next[name] = results[i]
      })
      setCastStatus(next)
      setCheckingCast(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (user) loadRelationshipData()
  }, [user])

  const loadRelationshipData = async () => {
    if (!user) return
    setRelationshipLoading(true)
    try {
      const [sessionsData, invitesData, matchesData] = await Promise.all([
        getActiveSwipeSessions(user.id),
        getUserInvitations(user.id),
        getUserMatches(user.id),
      ])
      setSessions(sessionsData)
      setInvitations(invitesData)
      setMatches(matchesData ?? [])

      if (sessionsData[0]) {
        const streak = await getSessionStreak(sessionsData[0].id)
        if (streak) setFreeze({ available: streak.freeze_available, longestStreak: streak.longest_streak })
      } else {
        setFreeze(null)
      }
    } catch (error) {
      console.error("[v0] Error loading relationship data:", error)
    } finally {
      setRelationshipLoading(false)
    }
  }

  // ── Profile handlers ───────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user || !profileDirty) return
    setSavingProfile(true)
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() })
      toast.success("Saved", "Your profile has been updated")
    } catch {
      toast.error("Error", "Failed to update your profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePhoto = async () => {
    if (!user) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      toast.error("Permission needed", "Allow photo access to change your profile picture")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return

    setUploadingPhoto(true)
    try {
      const asset = result.assets[0]
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      await user.setProfileImage({ file: blob })
      toast.success("Photo updated", "Your new profile picture is live")
    } catch {
      toast.error("Error", "Failed to update your photo")
    } finally {
      setUploadingPhoto(false)
    }
  }

  // ── Notification handlers ──────────────────────────────────
  const handleTogglePush = async (value: boolean) => {
    if (!user) return
    setPushBusy(true)
    setPushEnabled(value)
    try {
      if (value) {
        const token = await registerForPushNotificationsAsync()
        if (!token) {
          setPushEnabled(false)
          toast.error("Couldn't enable", "Push permission was denied — check your device settings")
          return
        }
        await updateUserPushToken(user.id, token)
      } else {
        await updateUserPushToken(user.id, null)
      }
      await setPreferences({ pushEnabled: value })
    } finally {
      setPushBusy(false)
    }
  }

  const handleTogglePartnerMute = async (value: boolean) => {
    setPartnerActivityMuted(value)
    await setPreferences({ partnerActivityMuted: value })
  }

  // ── Cast & TV handlers ──────────────────────────────────────
  // There's no video hosted in-app to cast directly — this opens the
  // platform's own app (which has its own Cast/AirPlay button) or its web
  // search as a fallback, matching the "Send to TV" flow on a movie's page.
  const handleTestCast = async (platformName: string) => {
    if (testingPlatform) return
    setTestingPlatform(platformName)
    try {
      const result = await sendToStreamingApp(platformName, "DateFlix")
      if (result === "app") {
        toast.success("Connected", `${platformName} opened — tap its Cast or AirPlay icon to send to your TV.`)
        setCastStatus((prev) => ({ ...prev, [platformName]: true }))
      } else {
        toast.info("Not installed", `${platformName} isn't installed — opened its website instead.`)
        setCastStatus((prev) => ({ ...prev, [platformName]: false }))
      }
    } catch {
      toast.error("Connection failed", `Couldn't open ${platformName}. Check your connection and try again.`)
    } finally {
      setTestingPlatform(null)
    }
  }

  // ── Relationship handlers ──────────────────────────────────
  const handleEndSession = (session: SwipeSession & { user1: SupabaseUser; user2: SupabaseUser }) => {
    const partner = session.user1_id === user?.id ? session.user2 : session.user1
    const partnerName = partner.first_name || partner.username || "this friend"
    confirm.show({
      title: "End Session",
      message: `Stop swiping together with ${partnerName}? You can always invite them again later.`,
      variant: "destructive",
      buttons: [
        { label: "Cancel", style: "cancel" },
        {
          label: "End Session",
          style: "destructive",
          onPress: async () => {
            setEndingSessionId(session.id)
            const result = await deleteSwipeSession(session.id)
            if (result.success) {
              toast.success("Session Ended", `You're no longer swiping with ${partnerName}`)
              loadRelationshipData()
            } else {
              toast.error("Error", result.error || "Failed to end session")
            }
            setEndingSessionId(null)
          },
        },
      ],
    })
  }

  // ── Data export ─────────────────────────────────────────────
  const handleExportData = async () => {
    if (!user) return
    setExporting(true)
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: {
          name: [user.firstName, user.lastName].filter(Boolean).join(" "),
          email: user.emailAddresses?.[0]?.emailAddress ?? null,
        },
        matches: matches.map((m) => ({
          movie: (m.movie_data as any)?.title ?? null,
          matchedAt: m.matched_at,
          watched: m.watched,
        })),
        activeSessions: sessions.length,
      }
      await Share.share({
        title: "My Movie Circle Data",
        message: JSON.stringify(payload, null, 2),
      })
    } catch {
      toast.error("Error", "Failed to export your data")
    } finally {
      setExporting(false)
    }
  }

  // ── Delete account ─────────────────────────────────────────
  const handleDeleteAccount = () => {
    if (!user) return
    confirm.show({
      title: "Delete Account",
      message: "Are you sure you want to permanently delete your account? This action cannot be undone.",
      variant: "destructive",
      buttons: [
        { label: "Cancel", style: "cancel" },
        {
          label: "Delete",
          style: "destructive",
          onPress: () => {
            confirm.show({
              title: "Final Warning",
              message:
                "This will permanently delete all your data including matches, swipes, and profile information. Are you absolutely sure?",
              variant: "destructive",
              buttons: [
                { label: "Cancel", style: "cancel" },
                {
                  label: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true)
                    try {
                      const result = await permanentlyDeleteAccount(user.id, user)
                      if (result.success) {
                        toast.success("Account Deleted", result.message)
                        router.replace("/")
                      } else {
                        confirm.show({ title: "Deletion Failed", message: result.message, variant: "warning" })
                      }
                    } catch {
                      toast.error("Error", "Failed to delete account. Please try again or contact support.")
                    } finally {
                      setDeletingAccount(false)
                    }
                  },
                },
              ],
            })
          },
        },
      ],
    })
  }

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={s.backBtn}
        >
          <ChevronLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Account Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Profile ── */}
      <SectionLabel text="Profile" />
      <View style={s.card}>
        <View style={s.profileRow}>
          <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto} activeOpacity={0.85} style={s.avatarWrap}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={{ fontSize: 22, fontWeight: "700", color: C.cyan }}>
                  {(user?.firstName?.[0] ?? "U").toUpperCase()}
                </Text>
              </View>
            )}
            <View style={s.avatarBadge}>
              {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={13} color="#fff" />}
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, gap: 10 }}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={C.textSub}
              style={s.input}
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={C.textSub}
              style={s.input}
            />
          </View>
        </View>

        {user?.emailAddresses?.[0]?.emailAddress && (
          <Text style={s.emailText}>{user.emailAddresses[0].emailAddress}</Text>
        )}

        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={!profileDirty || savingProfile}
          activeOpacity={0.85}
          style={[s.btnCyan, (!profileDirty || savingProfile) && s.btnDisabled]}
        >
          <Text style={s.btnCyanText}>{savingProfile ? "Saving…" : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Notifications ── */}
      <SectionLabel text="Notifications" />
      <View style={s.card}>
        <SettingRow
          title="Push Notifications"
          description="Matches, invites, and streak alerts on your device"
          value={pushEnabled}
          onValueChange={handleTogglePush}
          disabled={pushBusy}
        />
        <View style={s.rowDivider} />
        <SettingRow
          title="Partner Activity Alerts"
          description="In-app banners when your partner swipes or your streak changes"
          value={!partnerActivityMuted}
          onValueChange={(v) => handleTogglePartnerMute(!v)}
        />
      </View>

      {/* ── Cast & TV ── */}
      <SectionLabel text="Cast & TV" />
      <View style={s.card}>
        <View style={s.castIntro}>
          <View style={s.castIntroIconWrap}>
            <Tv size={16} color={C.cyan} />
          </View>
          <Text style={s.castIntroText}>
            DateFlix doesn&apos;t stream video itself — &quot;Watch on TV&quot; opens a title in its
            streaming app, which has its own Cast or AirPlay button. Connect the apps
            below so casting always goes straight there.
          </Text>
        </View>

        {checkingCast ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator color={C.cyan} />
          </View>
        ) : (
          CASTABLE_PLATFORMS.map((name, i) => {
            const config = getStreamingConfig(name)
            const installed = !!castStatus[name]
            const testing = testingPlatform === name
            return (
              <View key={name} style={[s.castRow, i > 0 && s.rowDivider]}>
                {config && (
                  <View style={[s.castIconWrap, { backgroundColor: config.bgColor }]}>
                    <config.IconComponent size={18} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.linkedName}>{name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    {installed && <CheckCircle2 size={12} color={C.cyan} />}
                    <Text style={[s.linkedMeta, installed && { color: C.cyan, fontWeight: "700" }]}>
                      {installed ? "Ready to cast" : "Not installed — opens in browser"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleTestCast(name)}
                  disabled={!!testingPlatform}
                  activeOpacity={0.8}
                  style={s.castTestBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Test casting to ${name}`}
                >
                  {testing ? (
                    <ActivityIndicator size="small" color={C.cyan} />
                  ) : (
                    <Text style={s.castTestBtnText}>Test</Text>
                  )}
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </View>

      {/* ── Relationship ── */}
      <SectionLabel text="Relationship" />
      <View style={s.card}>
        {relationshipLoading ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator color={C.cyan} />
          </View>
        ) : (
          <>
            {sessions.length === 0 ? (
              <Text style={s.emptyText}>Not linked with anyone yet — invite a friend from Profile.</Text>
            ) : (
              sessions.map((session, i) => {
                const partner = session.user1_id === user?.id ? session.user2 : session.user1
                return (
                  <View key={session.id} style={[s.linkedRow, i > 0 && s.rowDivider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.linkedName}>{partner.first_name || partner.username || "Friend"}</Text>
                      <Text style={s.linkedMeta}>Linked · swiping together</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEndSession(session)}
                      disabled={endingSessionId === session.id}
                      activeOpacity={0.8}
                      style={s.endBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`End session with ${partner.first_name || "friend"}`}
                    >
                      <UserMinus size={14} color={C.red} />
                      <Text style={s.endBtnText}>
                        {endingSessionId === session.id ? "Ending…" : "End"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              })
            )}

            {invitations.some((i) => i.status === "pending") && (
              <View style={[s.linkedRow, sessions.length > 0 && s.rowDivider]}>
                <Text style={s.emptyText}>
                  {invitations.filter((i) => i.status === "pending").length} pending invitation
                  {invitations.filter((i) => i.status === "pending").length === 1 ? "" : "s"}
                </Text>
              </View>
            )}

            {freeze && (
              <View style={[s.freezeCard, sessions.length > 0 && { marginTop: 12 }]}>
                <Snowflake size={16} color={freeze.available > 0 ? C.cyan : C.textSub} />
                <Text style={s.freezeText}>
                  {freeze.available > 0
                    ? "1 free Streak Freeze available this month"
                    : "Streak Freeze used — refreshes next month"}
                  {"  ·  "}Longest streak: {freeze.longestStreak}d
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* ── Session history ── */}
      <SectionLabel text="Session History" />
      <View style={s.card}>
        {relationshipLoading ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator color={C.cyan} />
          </View>
        ) : matches.length === 0 ? (
          <Text style={s.emptyText}>Your matched movies will show up here.</Text>
        ) : (
          matches.slice(0, 8).map((match, i) => {
            const movieTitle = (match.movie_data as any)?.title ?? "Untitled"
            const partner = match.user1_id === user?.id ? match.user2 : match.user1
            return (
              <View key={match.id} style={[s.historyRow, i > 0 && s.rowDivider]}>
                <Clock size={14} color={C.textSub} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.historyTitle} numberOfLines={1}>{movieTitle}</Text>
                  <Text style={s.historyMeta}>
                    with {partner.first_name || partner.username || "friend"} ·{" "}
                    {new Date(match.matched_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
              </View>
            )
          })
        )}
      </View>

      {/* ── Data & Privacy ── */}
      <SectionLabel text="Data & Privacy" />
      <View style={s.card}>
        <TouchableOpacity
          onPress={handleExportData}
          disabled={exporting}
          activeOpacity={0.8}
          style={s.exportRow}
        >
          <View style={s.exportIconWrap}>
            <Download size={16} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.linkedName}>Export My Data</Text>
            <Text style={s.linkedMeta}>Share a copy of your matches and profile info</Text>
          </View>
          {exporting && <ActivityIndicator size="small" color={C.cyan} />}
        </TouchableOpacity>
      </View>

      {/* ── Danger zone ── */}
      <SectionLabel text="Danger Zone" />
      <View style={{ marginHorizontal: 20, marginBottom: 48 }}>
        <TouchableOpacity
          style={[s.btnDelete, deletingAccount && s.btnDeleteDisabled]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete account permanently"
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Trash2 size={18} color={deletingAccount ? "#fca5a5" : "#fff"} />
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
    </ScrollView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 28, marginBottom: 12 }}>
      <View style={{ width: 3, height: 14, backgroundColor: C.cyan, borderRadius: 2, marginRight: 8 }} />
      <Text style={s.sectionLabel}>{text}</Text>
    </View>
  )
}

function SettingRow({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  title: string
  description: string
  value: boolean
  onValueChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <View style={s.settingRow}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={s.linkedName}>{title}</Text>
        <Text style={s.linkedMeta}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: C.border, true: C.cyan }}
        thumbColor="#ffffff"
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.surfaceHigh,
    borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: C.textMuted,
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  profileRow: { flexDirection: "row", gap: 16, marginBottom: 14 },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: C.border },
  avatarFallback: { backgroundColor: C.surfaceHigh, alignItems: "center", justifyContent: "center" },
  avatarBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.cyan, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.surface,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontWeight: "600", color: C.text,
  },
  emailText: { fontSize: 12, color: C.textSub, marginBottom: 14 },
  btnCyan: {
    backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 13,
    alignItems: "center",
  },
  btnCyanText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnDisabled: { backgroundColor: C.border },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 2, paddingTop: 14 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  linkedRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  linkedName: { fontSize: 14, fontWeight: "700", color: C.text },
  linkedMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  emptyText: { fontSize: 13, color: C.textMuted, paddingVertical: 6 },
  endBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  endBtnText: { fontSize: 12, fontWeight: "700", color: C.red },
  freezeCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.bg, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  freezeText: { fontSize: 12, color: C.textMuted, fontWeight: "600", flex: 1 },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  historyTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  historyMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  castIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  castIntroIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: "rgba(6,182,212,0.1)",
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  castIntroText: { flex: 1, fontSize: 12, color: C.textMuted, lineHeight: 17 },
  castRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  castIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  castTestBtn: {
    minWidth: 52,
    alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1, borderColor: C.border,
  },
  castTestBtnText: { fontSize: 12, fontWeight: "700", color: C.cyan },
  exportRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exportIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(6,182,212,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  btnDelete: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 15, paddingHorizontal: 18, borderRadius: 16,
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10,
  },
  btnDeleteDisabled: { backgroundColor: "#fca5a5", shadowOpacity: 0 },
  btnDeleteText: { fontSize: 15, fontWeight: "600", color: "#ffffff", marginLeft: 10, letterSpacing: 0.2 },
  btnDeleteBadge: { backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  btnDeleteBadgeText: { fontSize: 11, fontWeight: "700", color: "#fecaca", letterSpacing: 0.5, textTransform: "uppercase" },
})
