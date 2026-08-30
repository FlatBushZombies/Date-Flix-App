import { color, fontSize, spacing } from "@/constants/theme"
import { useEffect } from "react"
import { Image, Text, View, useWindowDimensions, type ImageSourcePropType } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

const EMPTY_ICON = require("@/assets/icons/empty-icon.png")

export type EmptyStateProps = {
  title?: string
  description?: string
  size?: number
  animated?: boolean
  // Defaults to the standard "no data" illustration everywhere. Only pass
  // this to swap in a context-specific icon (e.g. notifications) — every
  // other call site should keep the default rather than pass EMPTY_ICON
  // explicitly.
  icon?: ImageSourcePropType
}

// Small ambient particles layered independently on top of the illustration.
// The source asset (empty-icon.png) is a single flattened image, so the
// magnifying glass / documents inside it can't be animated as separate
// limbs without the source being split into layers — these dots are the
// one piece of "independent decorative motion" this component can add for
// real, rather than faking sub-element movement on a static bitmap.
const PARTICLES: { top?: number; bottom?: number; left?: number; right?: number; delay: number; duration: number }[] = [
  { top: 6, left: 22, delay: 0, duration: 2200 },
  { top: 14, right: 18, delay: 400, duration: 2600 },
  { bottom: 18, left: 30, delay: 800, duration: 1900 },
]

function Particle({
  delay,
  duration,
  ...position
}: { delay: number; duration: number; top?: number; bottom?: number; left?: number; right?: number }) {
  const opacity = useSharedValue(0.35)
  const y = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.75, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.35, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    )
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-3, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    )
    // Mount-only — this is a fixed ambient loop, not something that should
    // restart on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          position: "absolute",
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color.textTertiary,
          ...position,
        },
      ]}
    />
  )
}

// Premium, calm "there's nothing here" illustration — a floating/breathing
// empty-icon with a soft entrance, used for genuine no-data states (as
// opposed to error states, which keep their own iconography in
// components/ui/EmptyState.tsx since "no results" and "something broke"
// are different messages).
export function EmptyState({ title, description, size, animated = true, icon }: EmptyStateProps) {
  const { width: screenWidth } = useWindowDimensions()
  const illustrationSize = size ?? (screenWidth < 360 ? 160 : screenWidth < 420 ? 190 : 220)
  const reducedMotion = useReducedMotion()
  const playMotion = animated && !reducedMotion

  const entranceOpacity = useSharedValue(0)
  const entranceScale = useSharedValue(0.94)
  const entranceY = useSharedValue(8)

  // Independent shared values so the float and the breathing never lock
  // into the same rhythm as each other.
  const floatY = useSharedValue(0)
  const breathe = useSharedValue(1)

  useEffect(() => {
    entranceOpacity.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    entranceScale.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    entranceY.value = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) })

    if (playMotion) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    }
    // Runs once on mount — entrance and ambient loops must never restart
    // just because `title`/`description` changed on a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { translateY: entranceY.value + floatY.value },
      { scale: entranceScale.value * breathe.value },
    ],
  }))

  return (
    <View style={{ alignItems: "center", paddingVertical: spacing["3xl"], paddingHorizontal: spacing["2xl"] }}>
      <View style={{ width: illustrationSize, height: illustrationSize, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={illustrationStyle}>
          <Image
            source={icon ?? EMPTY_ICON}
            style={{ width: illustrationSize, height: illustrationSize }}
            resizeMode="contain"
          />
        </Animated.View>

        {playMotion && PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
      </View>

      {title && (
        <Text
          style={{
            fontSize: fontSize.xl,
            fontWeight: "800",
            color: color.textPrimary,
            textAlign: "center",
            marginTop: spacing.xl,
            marginBottom: description ? spacing.sm : 0,
          }}
        >
          {title}
        </Text>
      )}
      {description && (
        <Text
          style={{
            fontSize: fontSize.base,
            color: color.textSecondary,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}
    </View>
  )
}
