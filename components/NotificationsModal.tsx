import React from "react"
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { AppNotification } from "@/types"

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export function NotificationsModal({
  visible,
  onClose,
  items,
  loading,
  onMarkAllRead,
  onPressItem,
}: {
  visible: boolean
  onClose: () => void
  items: AppNotification[]
  loading: boolean
  onMarkAllRead: () => void
  onPressItem: (n: AppNotification) => void
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" }}>
          <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>Notifications</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onMarkAllRead} style={{ alignSelf: "flex-start", paddingVertical: 6 }}>
              <Text style={{ color: "#ec4899", fontWeight: "700" }}>Mark all as read</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 22, alignItems: "center" }}>
              <ActivityIndicator color="#ec4899" />
              <Text style={{ marginTop: 10, color: "#6b7280", fontWeight: "600" }}>Loading…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 14 }}>
              {items.length === 0 ? (
                <View style={{ padding: 22, alignItems: "center" }}>
                  <Ionicons name="notifications-off-outline" size={34} color="#9ca3af" />
                  <Text style={{ marginTop: 10, color: "#6b7280", fontWeight: "700" }}>All caught up</Text>
                </View>
              ) : (
                items.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => onPressItem(n)}
                    activeOpacity={0.8}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#f3f4f6",
                      backgroundColor: n.read_at ? "#ffffff" : "#fff1f2",
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontWeight: "800", color: "#111827" }}>{n.title}</Text>
                        <Text style={{ marginTop: 4, color: "#4b5563" }}>{n.body}</Text>
                        <Text style={{ marginTop: 8, fontSize: 12, color: "#9ca3af", fontWeight: "600" }}>
                          {timeAgo(n.created_at)}
                        </Text>
                      </View>
                      {!n.read_at && (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444", marginTop: 4 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

