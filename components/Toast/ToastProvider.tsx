import * as Haptics from "expo-haptics"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import {
  CheckCircleIcon,
  FireIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "react-native-heroicons/outline"
import Animated, {
  Easing,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

type ToastKind = "success" | "error" | "info" | "streak" | "streakBroken"

interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  message: string
  milestone?: boolean
}

interface StreakToastOptions {
  day: number
  title: string
  message: string
  milestone?: boolean
}

interface ToastContextValue {
  success: (title: string, message: string) => void
  error: (title: string, message: string) => void
  info: (title: string, message: string) => void
  streak: (options: StreakToastOptions) => void
  streakBroken: (options: Omit<StreakToastOptions, "milestone">) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}

const KIND_CONFIG: Record<ToastKind, { accent: string; iconBg: string }> = {
  success: { accent: "#10b981", iconBg: "rgba(16,185,129,0.18)" },
  error: { accent: "#f43f5e", iconBg: "rgba(244,63,94,0.18)" },
  info: { accent: "#06b6d4", iconBg: "rgba(6,182,212,0.18)" },
  streak: { accent: "#f59e0b", iconBg: "rgba(245,158,11,0.2)" },
  streakBroken: { accent: "#f43f5e", iconBg: "rgba(244,63,94,0.18)" },
}

const DEFAULT_DURATION = 3500
const MILESTONE_DURATION = 4500

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([])
  const [current, setCurrent] = useState<ToastItem | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enqueue = useCallback((item: Omit<ToastItem, "id">) => {
    setQueue((prev) => [...prev, { ...item, id: nextId++ }])
  }, [])

  // Pull the next item off the queue once the current one clears
  useEffect(() => {
    if (current || queue.length === 0) return
    const [next, ...rest] = queue
    setCurrent(next)
    setQueue(rest)
  }, [current, queue])

  // Haptic feedback + auto-dismiss whenever a new toast becomes current
  useEffect(() => {
    if (!current) return

    if (current.kind === "error" || current.kind === "streakBroken") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } else if (current.kind === "streak" && current.milestone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else if (current.kind === "streak") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    const duration = current.milestone ? MILESTONE_DURATION : DEFAULT_DURATION
    dismissTimer.current = setTimeout(() => setCurrent(null), duration)
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [current])

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setCurrent(null)
  }, [])

  const value: ToastContextValue = {
    success: (title, message) => enqueue({ kind: "success", title, message }),
    error: (title, message) => enqueue({ kind: "error", title, message }),
    info: (title, message) => enqueue({ kind: "info", title, message }),
    streak: ({ title, message, milestone }) =>
      enqueue({ kind: "streak", title, message, milestone }),
    streakBroken: ({ title, message }) => enqueue({ kind: "streakBroken", title, message }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && <ToastCard key={current.id} item={current} onDismiss={dismiss} />}
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const config = KIND_CONFIG[item.kind]
  const duration = item.milestone ? MILESTONE_DURATION : DEFAULT_DURATION

  const progress = useSharedValue(1)
  useEffect(() => {
    progress.value = 1
    progress.value = withTiming(0, { duration, easing: Easing.linear })
  }, [])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }))

  return (
    <Animated.View
      entering={SlideInUp.duration(260).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutUp.duration(200).easing(Easing.in(Easing.cubic))}
      style={[
        styles.wrapper,
        {
          shadowColor: config.accent,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.accentStrip, { backgroundColor: config.accent }]} />

        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg, borderColor: `${config.accent}33` }]}>
            <ToastIcon kind={item.kind} color={config.accent} />
            {item.kind === "streak" && item.milestone && <MilestoneBurst accent={config.accent} />}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          </View>

          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <XMarkIcon size={14} color="#64748b" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { backgroundColor: config.accent }, progressStyle]}
          />
        </View>
      </View>
    </Animated.View>
  )
}

function ToastIcon({ kind, color }: { kind: ToastKind; color: string }) {
  if (kind === "success") return <CheckCircleIcon size={22} color={color} strokeWidth={1.9} />
  if (kind === "error") return <XCircleIcon size={22} color={color} strokeWidth={1.9} />
  if (kind === "info") return <InformationCircleIcon size={22} color={color} strokeWidth={1.9} />
  return <FireIcon size={22} color={color} strokeWidth={1.9} />
}

// Radiating dot burst — plays once on mount, used for milestone streak toasts
function MilestoneBurst({ accent }: { accent: string }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <View style={styles.burstContainer} pointerEvents="none">
      {angles.map((deg) => (
        <BurstDot key={deg} angleDeg={deg} accent={accent} />
      ))}
    </View>
  )
}

function BurstDot({ angleDeg, accent }: { angleDeg: number; accent: string }) {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })
  }, [])

  const style = useAnimatedStyle(() => {
    const angle = (angleDeg * Math.PI) / 180
    const distance = progress.value * 22
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: 1 - progress.value * 0.4 },
      ],
    }
  })

  return <Animated.View style={[styles.burstDot, { backgroundColor: accent }, style]} />
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 54,
    left: 14,
    right: 14,
    zIndex: 999,
    borderRadius: 20,
    overflow: "hidden",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  accentStrip: {
    height: 2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    gap: 13,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  message: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  dismissBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  progressTrack: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    opacity: 0.7,
  },
  burstContainer: {
    position: "absolute",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  burstDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
})
