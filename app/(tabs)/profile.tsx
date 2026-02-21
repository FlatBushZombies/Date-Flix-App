"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Share, TextInput, Modal } from "react-native"
import { useUser, useClerk } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { Film, Users, Heart } from "lucide-react-native"
import {
  syncUserWithSupabase,
  getUserStats,
  createInvitation,
  acceptInvitation,
  getUserInvitations,
  getActiveSwipeSessions,
} from "@/utils/supabase-helpers"
import type { Invitation, SwipeSession, SupabaseUser } from "@/types"
import { Ionicons } from "@expo/vector-icons"

export default function ProfileScreen() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const [stats, setStats] = useState({ totalSwipes: 0, totalMatches: 0, activeSessions: 0 })
  const [invitations, setInvitations] = useState<(Invitation & { sender: SupabaseUser })[]>([])
  const [sessions, setSessions] = useState<(SwipeSession & { user1: SupabaseUser; user2: SupabaseUser })[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
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

  const handleCreateInvite = async () => {
    if (!user) return
    setLoading(true)

    try {
      const invitation = await createInvitation(user.id)
      if (invitation) {
        setShowInviteModal(false)

        // Share invitation
        const shareMessage = `Join me on Movie Circle! Use code: ${invitation.invite_code}\n\nOr use this link: movieapp://invite/${invitation.invite_code}`

        await Share.share({
          message: shareMessage,
          title: "Join me on Movie Circle",
        })

        Alert.alert("Invitation Created!", `Share code: ${invitation.invite_code}`)
        loadUserData()
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create invitation")
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
        Alert.alert("Success!", "You can now start swiping together!")
        loadUserData()
      } else {
        Alert.alert("Error", result.error || "Failed to join")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to join with code")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace("/")
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="items-center px-6 pt-14 pb-6">
        <Text className="text-2xl font-semibold text-gray-900">Movie Circle</Text>
        <Text className="text-sm text-gray-500 mt-1 text-center">Match, watch, and enjoy movies together</Text>
      </View>

      {/* Avatar Cluster with Active Sessions */}
      <View className="items-center mb-6">
        <View className="flex-row items-center gap-4">
          {/* Left Session Partner */}
          <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
            {sessions[0] ? (
              <Image
                source={{
                  uri: (sessions[0].user1_id === user?.id ? sessions[0].user2 : sessions[0].user1).image_url || "",
                }}
                className="w-full h-full"
              />
            ) : (
              <Users size={20} className="text-gray-400" />
            )}
          </View>

          {/* Main User Avatar */}
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="w-20 h-20 rounded-full border-2 border-cyan-400" />
          ) : (
            <View className="w-20 h-20 rounded-full bg-cyan-200 items-center justify-center border-2 border-cyan-400">
              <Ionicons name="person" size={40} color="#06b6d4" />
            </View>
          )}

          {/* Right Session Partner */}
          <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
            {sessions[1] ? (
              <Image
                source={{
                  uri: (sessions[1].user1_id === user?.id ? sessions[1].user2 : sessions[1].user1).image_url || "",
                }}
                className="w-full h-full"
              />
            ) : (
              <Heart size={20} className="text-gray-400" />
            )}
          </View>
        </View>

        {/* Username */}
        <Text className="mt-4 text-lg font-semibold text-gray-900">{user?.firstName || user?.username || "User"}</Text>

        {user?.emailAddresses?.[0]?.emailAddress && (
          <Text className="text-sm text-gray-500 mt-0.5">{user.emailAddresses[0].emailAddress}</Text>
        )}

        <Text className="text-sm text-gray-500 mt-1">Ready to pair a movie 🎬</Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row mx-6 mb-6 gap-3">
        <View className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4">
          <Text className="text-3xl font-black text-cyan-600">{stats.totalSwipes}</Text>
          <Text className="text-xs text-gray-600 mt-1">Total Swipes</Text>
        </View>

        <View className="flex-1 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4">
          <Text className="text-3xl font-black text-pink-600">{stats.totalMatches}</Text>
          <Text className="text-xs text-gray-600 mt-1">Matches</Text>
        </View>

        <View className="flex-1 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4">
          <Text className="text-3xl font-black text-purple-600">{stats.activeSessions}</Text>
          <Text className="text-xs text-gray-600 mt-1">Active Friends</Text>
        </View>
      </View>

      {/* Invite Section */}
      <View className="mx-6 mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-3">Swipe Together</Text>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setShowInviteModal(true)}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 flex-row items-center justify-center shadow-lg"
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text className="text-white font-bold ml-2">Invite Friend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            className="flex-1 bg-white border-2 border-cyan-500 rounded-2xl p-4 flex-row items-center justify-center"
          >
            <Ionicons name="enter" size={20} color="#06b6d4" />
            <Text className="text-cyan-600 font-bold ml-2">Join Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <View className="mx-6 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Swiping With</Text>
          {sessions.map((session) => {
            const partner = session.user1_id === user?.id ? session.user2 : session.user1
            return (
              <View key={session.id} className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-cyan-100 items-center justify-center overflow-hidden mr-3">
                  {partner.image_url ? (
                    <Image source={{ uri: partner.image_url }} className="w-full h-full" />
                  ) : (
                    <Ionicons name="person" size={24} color="#06b6d4" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">{partner.first_name || partner.username || "Friend"}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">Active session</Text>
                </View>
                <View className="w-3 h-3 bg-green-500 rounded-full" />
              </View>
            )
          })}
        </View>
      )}

      {/* Movie Pairing Actions */}
      <View className="mx-6 gap-3 mb-2">
        <ActionCard
          title="Movie Match"
          description="Swipe and match movies with a friend"
          action="Start"
          icon={<Film size={20} className="text-gray-700" />}
        />

        <ActionCard
          title="Watch Together"
          description="Create a synced movie night"
          action="Create"
          icon={<Users size={20} className="text-gray-700" />}
        />

        <ActionCard
          title="Shared Watchlist"
          description="Save movies you both want to see"
          action="Open"
          icon={<Heart size={20} className="text-gray-700" />}
        />
      </View>

      {/* Footer Actions */}
      <View className="mt-8 mx-6 border-t border-gray-200 mb-8">
        <TouchableOpacity className="py-4" onPress={() => Alert.alert("Account", "Account settings coming soon")}>
          <Text className="text-gray-700 text-base">Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-4" onPress={handleLogout}>
          <Text className="text-red-500 text-base">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md">
            <Text className="text-2xl font-black text-gray-900 mb-2">Invite a Friend</Text>
            <Text className="text-gray-600 mb-6">Create an invitation code to swipe together</Text>

            <TouchableOpacity
              onPress={handleCreateInvite}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 py-4 rounded-2xl items-center mb-3"
            >
              <Text className="text-white font-bold">{loading ? "Creating..." : "Create Invite Code"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowInviteModal(false)} className="py-3 items-center">
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade" onRequestClose={() => setShowJoinModal(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md">
            <Text className="text-2xl font-black text-gray-900 mb-2">Join with Code</Text>
            <Text className="text-gray-600 mb-6">Enter your friends invitation code</Text>

            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter code (e.g., ABC123XY)"
              className="bg-gray-100 rounded-2xl px-4 py-4 text-lg font-semibold mb-4"
              autoCapitalize="characters"
              maxLength={8}
            />

            <TouchableOpacity
              onPress={handleJoinWithCode}
              disabled={loading || !inviteCode.trim()}
              className={`py-4 rounded-2xl items-center mb-3 ${
                loading || !inviteCode.trim() ? "bg-gray-300" : "bg-gradient-to-r from-cyan-500 to-blue-500"
              }`}
            >
              <Text className="text-white font-bold">{loading ? "Joining..." : "Join Session"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowJoinModal(false)
                setInviteCode("")
              }}
              className="py-3 items-center"
            >
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-4">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">{icon}</View>

        <View>
          <Text className="text-base font-medium text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>
        </View>
      </View>

      <TouchableOpacity className="px-4 py-2 rounded-full bg-white border border-gray-200">
        <Text className="text-sm font-medium text-gray-800">{action}</Text>
      </TouchableOpacity>
    </View>
  )
}