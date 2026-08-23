import * as Haptics from "expo-haptics"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { Image, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from "react-native"
import { X } from "lucide-react-native"
import Animated, {
  Easing,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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

// Pastel card + two-tone blob wash per kind — the /assets/icons renders already
// carry their own colored circle, so they sit on white with a little breathing
// room rather than inside a second tinted icon box.
const KIND_CONFIG: Record<
  ToastKind,
  { base: string; blobA: string; blobB: string; icon: ImageSourcePropType; accent: string }
> = {
  success: {
    base: "#DEF4E4",
    blobA: "#CDEDD8",
    blobB: "#C1E7CF",
    icon: require("@/assets/icons/success.png"),
    accent: "#22c55e",
  },
  error: {
    base: "#FBE0DF",
    blobA: "#F8CFCE",
    blobB: "#F4BFBE",
    icon: require("@/assets/icons/error.png"),
    accent: "#ef4444",
  },
  streakBroken: {
    base: "#FBE0DF",
    blobA: "#F8CFCE",
    blobB: "#F4BFBE",
    icon: require("@/assets/icons/error.png"),
    accent: "#ef4444",
  },
  streak: {
    base: "#FBEED4",
    blobA: "#F8E4BC",
    blobB: "#F5DAA5",
    icon: require("@/assets/icons/warning.png"),
    accent: "#f59e0b",
  },
  info: {
    base: "#DDEDF6",
    blobA: "#CCE3F1",
    blobB: "#BCD9EC",
    icon: require("@/assets/icons/warning.png"),
    accent: "#06b6d4",
  },
}

const DEFAULT_DURATION = 3500
const MILESTONE_DURATION = 4500

// Shared quick-and-quiet curve — a toast is uninvited, so it announces itself
// fast and gets out of the way just as fast. Exit is ~20% quicker than entry
// since the user has already read it by then.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
const TOAST_ENTER = SlideInUp.duration(300).easing(EASE_OUT)
const TOAST_EXIT = SlideOutUp.duration(250).easing(EASE_OUT)

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
  const insets = useSafeAreaInsets()
  const config = KIND_CONFIG[item.kind]

  const dismissScale = useSharedValue(1)
  const dismissStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dismissScale.value }],
  }))
  const handleDismissPressIn = () => {
    dismissScale.value = withTiming(0.94, { duration: 120, easing: EASE_OUT })
  }
  const handleDismissPressOut = () => {
    dismissScale.value = withTiming(1, { duration: 120, easing: EASE_OUT })
  }

  return (
    <Animated.View
      entering={TOAST_ENTER}
      exiting={TOAST_EXIT}
      style={[styles.wrapper, { top: insets.top + 10, shadowColor: config.accent }]}
    >
      <View style={[styles.card, { backgroundColor: config.base }]}>
        {/* Two-tone blob wash, clipped to the card's rounded corners */}
        <View style={[styles.blob, styles.blobTopRight, { backgroundColor: config.blobA }]} />
        <View style={[styles.blob, styles.blobBottom, { backgroundColor: config.blobB }]} />

        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Image source={config.icon} style={styles.iconImage} resizeMode="contain" />
            {item.kind === "streak" && item.milestone && <MilestoneBurst accent={config.accent} />}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDismiss}
            onPressIn={handleDismissPressIn}
            onPressOut={handleDismissPressOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            style={styles.dismissBtn}
          >
            <Animated.View style={dismissStyle}>
              <X size={17} color="rgba(31,41,55,0.4)" strokeWidth={2.2} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
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
    progress.value = withTiming(1, { duration: 650, easing: EASE_OUT })
  }, [])

  const style = useAnimatedStyle(() => {
    const angle = (angleDeg * Math.PI) / 180
    const distance = progress.value * 26
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
    left: 16,
    right: 16,
    zIndex: 999,
    borderRadius: 28,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobTopRight: {
    width: 140,
    height: 140,
    top: -70,
    right: -30,
    opacity: 0.65,
  },
  blobBottom: {
    width: 180,
    height: 100,
    bottom: -55,
    left: 40,
    opacity: 0.55,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconImage: {
    width: 42,
    height: 42,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#1f2937",
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  message: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(31,41,55,0.62)",
    lineHeight: 18,
    letterSpacing: 0.05,
  },
  dismissBtn: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  burstContainer: {
    position: "absolute",
    width: 56,
    height: 56,
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
