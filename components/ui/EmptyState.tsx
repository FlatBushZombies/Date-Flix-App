import { color, fontSize, radius, spacing } from "@/constants/theme"
import React from "react"
import { Text, TouchableOpacity, View } from "react-native"

// Shared shape for every empty/error state in the app: icon in a soft tinted
// circle → heading → description → optional action. Illustration → heading →
// explanation → CTA, the same beat every time.
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tintColor = color.accentPink,
}: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  tintColor?: string
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing["3xl"], paddingHorizontal: spacing["2xl"] }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: radius.full,
          backgroundColor: `${tintColor}14`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xl,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: fontSize.xl,
          fontWeight: "800",
          color: color.textPrimary,
          textAlign: "center",
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: fontSize.base,
          color: color.textSecondary,
          textAlign: "center",
          lineHeight: 20,
          marginBottom: actionLabel ? spacing.xl : 0,
        }}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={{
            backgroundColor: tintColor,
            borderRadius: radius.full,
            paddingHorizontal: spacing["2xl"],
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: fontSize.base }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
