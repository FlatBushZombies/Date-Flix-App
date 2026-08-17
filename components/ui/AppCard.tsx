import { color, radius, shadow, spacing } from "@/constants/theme"
import React from "react"
import { View, ViewStyle } from "react-native"

// Soft rounded card — the base surface for grouped content across the app.
// Deliberately subtle: a thin border plus a soft neutral shadow, never a
// heavy drop shadow or a loud tint.
export function AppCard({
  children,
  padding = "lg",
  elevation = "sm",
  radius: radiusKey = "2xl",
  tint,
  style,
}: {
  children: React.ReactNode
  padding?: keyof typeof spacing
  elevation?: keyof typeof shadow | "none"
  radius?: keyof typeof radius
  tint?: string
  style?: ViewStyle
}) {
  return (
    <View
      style={[
        {
          backgroundColor: tint ?? color.bg,
          borderRadius: radius[radiusKey],
          padding: spacing[padding],
          borderWidth: 1,
          borderColor: color.border,
        },
        elevation !== "none" ? shadow[elevation] : null,
        style,
      ]}
    >
      {children}
    </View>
  )
}
