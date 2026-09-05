import * as Haptics from "expo-haptics"
import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from "react-native"
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
} from "react-native-heroicons/outline"
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated"

type ConfirmVariant = "default" | "destructive" | "warning" | "success"

interface ConfirmButton {
  label: string
  style?: "primary" | "destructive" | "cancel"
  onPress?: () => void | Promise<void>
}

interface ConfirmOptions {
  title: string
  message: string
  variant?: ConfirmVariant
  buttons?: ConfirmButton[]
  // Overrides the variant's default heroicon with a custom /assets/icons
  // image (e.g. require("@/assets/icons/bin.png")) — same slot, same size.
  icon?: ImageSourcePropType
}

interface ConfirmContextValue {
  show: (options: ConfirmOptions) => void
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider")
  return ctx
}

const VARIANT_CONFIG: Record<ConfirmVariant, { accent: string; iconBg: string; haptic: "warning" | "success" | "light" }> = {
  default: { accent: "#06b6d4", iconBg: "rgba(6,182,212,0.16)", haptic: "light" },
  destructive: { accent: "#f43f5e", iconBg: "rgba(244,63,94,0.16)", haptic: "warning" },
  warning: { accent: "#f59e0b", iconBg: "rgba(245,158,11,0.16)", haptic: "warning" },
  success: { accent: "#10b981", iconBg: "rgba(16,185,129,0.16)", haptic: "success" },
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ConfirmOptions | null>(null)

  const show = useCallback((options: ConfirmOptions) => {
    setCurrent(options)
  }, [])

  const close = useCallback(() => setCurrent(null), [])

  useEffect(() => {
    if (!current) return
    const { haptic } = VARIANT_CONFIG[current.variant ?? "default"]
    if (haptic === "warning") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    else if (haptic === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [current])

  const value: ConfirmContextValue = { show }

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {current && <ConfirmCard key={current.title} options={current} onClose={close} />}
    </ConfirmContext.Provider>
  )
}

function ConfirmCard({ options, onClose }: { options: ConfirmOptions; onClose: () => void }) {
  const variant = options.variant ?? "default"
  const config = VARIANT_CONFIG[variant]
  const buttons: ConfirmButton[] = options.buttons?.length
    ? options.buttons
    : [{ label: "OK", style: "primary" }]

  const handlePress = async (button: ConfirmButton) => {
    onClose()
    await button.onPress?.()
  }

  const sideBySide = buttons.length === 2

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(160)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.withInitialValues({ transform: [{ scale: 0.86 }] }).springify().damping(16).stiffness(300).mass(0.8)}
          exiting={ZoomOut.duration(160)}
          style={styles.card}
        >
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg, borderColor: `${config.accent}33` }]}>
            {options.icon ? (
              <Image source={options.icon} style={styles.iconImage} resizeMode="contain" />
            ) : (
              <ConfirmIcon variant={variant} color={config.accent} />
            )}
          </View>

          <Text style={styles.title}>{options.title}</Text>
          <Text style={styles.message}>{options.message}</Text>

          <View style={[styles.buttonRow, sideBySide && styles.buttonRowSideBySide]}>
            {buttons.map((button, i) => (
              <ConfirmButtonView
                key={i}
                button={button}
                accent={config.accent}
                fill={sideBySide}
                onPress={() => handlePress(button)}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

function ConfirmIcon({ variant, color }: { variant: ConfirmVariant; color: string }) {
  if (variant === "destructive") return <TrashIcon size={24} color={color} strokeWidth={1.8} />
  if (variant === "warning") return <ExclamationTriangleIcon size={24} color={color} strokeWidth={1.8} />
  if (variant === "success") return <CheckCircleIcon size={24} color={color} strokeWidth={1.8} />
  return <InformationCircleIcon size={24} color={color} strokeWidth={1.8} />
}

function ConfirmButtonView({
  button,
  accent,
  fill,
  onPress,
}: {
  button: ConfirmButton
  accent: string
  fill: boolean
  onPress: () => void
}) {
  const style = button.style ?? "primary"

  const backgroundColor =
    style === "destructive" ? "#f43f5e" : style === "primary" ? accent : "transparent"
  const textColor = style === "cancel" ? "#94a3b8" : "#ffffff"

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.button,
        fill && { flex: 1 },
        { backgroundColor },
        style === "cancel" && styles.buttonGhost,
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{button.label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconImage: {
    width: 26,
    height: 26,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: 0.1,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    color: "#94a3b8",
    lineHeight: 20,
    letterSpacing: 0.1,
    textAlign: "center",
    marginBottom: 22,
  },
  buttonRow: {
    width: "100%",
    gap: 10,
  },
  buttonRowSideBySide: {
    flexDirection: "row",
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGhost: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
})
