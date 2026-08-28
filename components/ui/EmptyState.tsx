import { color, fontSize, radius, spacing } from "@/constants/theme"
import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import Svg, { Circle } from "react-native-svg"

const BADGE_SIZE = 108

// Loosely-sketched dashed ring behind the icon badge — reads as a hand-drawn
// annotation circling the icon rather than a precise geometric frame, and a
// few scattered dots around it for the same "doodled, not corporate" feel.
function SketchRing({ tintColor }: { tintColor: string }) {
  const r = BADGE_SIZE / 2 - 4
  return (
    <Svg
      width={BADGE_SIZE}
      height={BADGE_SIZE}
      viewBox={`0 0 ${BADGE_SIZE} ${BADGE_SIZE}`}
      style={{ position: "absolute" }}
    >
      <Circle
        cx={BADGE_SIZE / 2}
        cy={BADGE_SIZE / 2}
        r={r}
        stroke={tintColor}
        strokeOpacity={0.4}
        strokeWidth={1.5}
        strokeDasharray="1 8"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}

// Shared shape for every empty/error state in the app: illustrated icon badge
// → heading → explanation → optional action. Illustration → heading →
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
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xl,
        }}
      >
        {/* soft ambient glow */}
        <View
          style={{
            position: "absolute",
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: BADGE_SIZE / 2,
            backgroundColor: `${tintColor}14`,
          }}
        />
        <SketchRing tintColor={tintColor} />
        {/* icon badge */}
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: `${tintColor}16`,
            borderWidth: 1,
            borderColor: `${tintColor}30`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        {/* scattered accent dots — the "hand-doodled" flourish */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute", top: 2, right: 8,
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: tintColor, opacity: 0.55,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute", bottom: 10, left: 0,
            width: 4, height: 4, borderRadius: 2,
            backgroundColor: tintColor, opacity: 0.35,
          }}
        />
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
