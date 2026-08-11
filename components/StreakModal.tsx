import { BottomSheet } from "@/components/ui/BottomSheet"
import { Flame, Snowflake, Trophy, X } from "lucide-react-native"
import React from "react"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"

const GOLD = "#f59e0b"

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

export function StreakModal({
  visible,
  onClose,
  currentStreak,
  longestStreak,
  freezeAvailable,
  activityStrip,
  loading,
}: {
  visible: boolean
  onClose: () => void
  currentStreak: number
  longestStreak: number
  freezeAvailable: number
  activityStrip: { date: string; bothActive: boolean }[]
  loading: boolean
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>Streak</Text>
        <TouchableOpacity
          onPress={onClose}
          style={{ padding: 8 }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Close streak details"
        >
          <X size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={GOLD} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36 }}>
          {/* Big streak number */}
          <View style={{ alignItems: "center", paddingVertical: 18 }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: "rgba(245,158,11,0.12)",
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.25)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Flame size={38} color={GOLD} strokeWidth={1.6} />
            </View>
            <Text style={{ fontSize: 36, fontWeight: "800", color: "#111827", letterSpacing: -1 }}>
              {currentStreak}
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600", marginTop: 2 }}>
              {currentStreak === 1 ? "day streak" : "day streak"}
            </Text>
          </View>

          {/* Longest streak */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "#f9fafb",
              borderRadius: 14,
              paddingVertical: 10,
              marginBottom: 22,
            }}
          >
            <Trophy size={15} color="#9ca3af" strokeWidth={1.8} />
            <Text style={{ fontSize: 12.5, color: "#6b7280", fontWeight: "600" }}>
              Longest streak: {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </Text>
          </View>

          {/* Streak Freeze status */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: freezeAvailable > 0 ? "rgba(6,182,212,0.08)" : "#f9fafb",
              borderRadius: 14,
              paddingVertical: 10,
              marginBottom: 22,
              borderWidth: freezeAvailable > 0 ? 1 : 0,
              borderColor: "rgba(6,182,212,0.2)",
            }}
          >
            <Snowflake size={15} color={freezeAvailable > 0 ? "#06b6d4" : "#9ca3af"} strokeWidth={1.8} />
            <Text
              style={{
                fontSize: 12.5,
                color: freezeAvailable > 0 ? "#0e7490" : "#6b7280",
                fontWeight: "600",
              }}
            >
              {freezeAvailable > 0
                ? "Free Streak Freeze available this month"
                : "Streak Freeze used — refreshes next month"}
            </Text>
          </View>

          {/* 7-day strip */}
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 12 }}>
            Last 7 Days
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {activityStrip.map((day, i) => {
              const isToday = i === activityStrip.length - 1
              return (
                <View key={day.date} style={{ alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: day.bothActive ? GOLD : "transparent",
                      borderWidth: day.bothActive ? 0 : 1.5,
                      borderColor: isToday ? GOLD : "#e5e7eb",
                    }}
                  >
                    <Flame size={16} color={day.bothActive ? "#fff" : "#d1d5db"} strokeWidth={1.8} />
                  </View>
                  <Text style={{ fontSize: 10.5, fontWeight: "700", color: isToday ? "#111827" : "#9ca3af" }}>
                    {DAY_LABELS[new Date(`${day.date}T00:00:00.000Z`).getUTCDay()]}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}
    </BottomSheet>
  )
}
