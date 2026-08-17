import { BottomSheet } from "@/components/ui/BottomSheet"
import { EmptyState } from "@/components/ui/EmptyState"
import { CloudOff, X, BellOff } from "lucide-react-native"
import React from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
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
  error,
  onRetry,
  onMarkAllRead,
  onPressItem,
}: {
  visible: boolean
  onClose: () => void
  items: AppNotification[]
  loading: boolean
  error?: boolean
  onRetry?: () => void
  onMarkAllRead: () => void
  onPressItem: (n: AppNotification) => void
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>Notifications</Text>
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: 8 }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
          >
            <X size={22} color="#6b7280" />
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
      ) : error ? (
        <EmptyState
          icon={<CloudOff size={32} color="#ef4444" strokeWidth={1.6} />}
          title="Couldn't Load Notifications"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={onRetry}
          tintColor="#ef4444"
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14 }}>
          {items.length === 0 ? (
            <EmptyState
              icon={<BellOff size={32} color="#9ca3af" strokeWidth={1.6} />}
              title="All Caught Up"
              description="You don't have any notifications right now."
              tintColor="#9ca3af"
            />
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
    </BottomSheet>
  )
}
