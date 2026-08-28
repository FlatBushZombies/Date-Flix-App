import { useEffect } from "react"
import { Image, View } from "react-native"
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

const TAP_ICON = require("@/assets/icons/tap-icon.png")

export type TapDemoIconProps = {
  size?: number
  animated?: boolean
}

// One full "approach → contact → release → pause" cycle, in ms. Kept as a
// single constant so every independently-repeating layer below can derive
// phase durations that sum to exactly this — that's what keeps them from
// drifting out of sync with each other after the first loop.
const CYCLE = 2400
const CONTACT = 500 // ms into the cycle when the finger touches down

function ripplePhaseDurations(delay: number, riseMs: number, fallMs: number) {
  const waitMs = CONTACT + delay
  const idleMs = CYCLE - waitMs - riseMs - fallMs
  return { waitMs, riseMs, fallMs, idleMs }
}

// Builds a shared-value driver that: snaps to `restValue`, waits, eases to
// `riseValue`, eases to `fallValue`, holds until the cycle completes, then
// repeats — used for both the ripple rings and the touch flash, which are
// genuinely independent animated layers (not part of the static artwork).
function useBurstValue(
  restValue: number,
  riseValue: number,
  fallValue: number,
  phases: { waitMs: number; riseMs: number; fallMs: number; idleMs: number },
  enabled: boolean,
  startDelay: number,
) {
  const value = useSharedValue(restValue)
  useEffect(() => {
    if (!enabled) return
    value.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(restValue, { duration: 0 }),
          withTiming(restValue, { duration: phases.waitMs }),
          withTiming(riseValue, { duration: phases.riseMs, easing: Easing.out(Easing.quad) }),
          withTiming(fallValue, { duration: phases.fallMs, easing: Easing.out(Easing.quad) }),
          withTiming(fallValue, { duration: phases.idleMs }),
        ),
        -1,
        false,
      ),
    )
    // Intentionally mount-only — this is a fixed ambient loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
  return value
}

function RippleRing({ delay, enabled, startDelay }: { delay: number; enabled: boolean; startDelay: number }) {
  const phases = ripplePhaseDurations(delay, 220, 330)
  const opacity = useBurstValue(0, 0.75, 0, phases, enabled, startDelay)
  const scale = useBurstValue(0.65, 1.0, 1.35, phases, enabled, startDelay)

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          position: "absolute",
          width: 46,
          height: 46,
          borderRadius: 23,
          borderWidth: 1.5,
          borderColor: "rgba(120,120,128,0.55)",
        },
      ]}
    />
  )
}

// A "premium, calm tap demonstration" component — the whole hand/finger
// illustration is a single flattened image (tap-icon.png), so its baked-in
// details (rays, ripple linework) can't be isolated and animated as their
// own limbs. What this component adds as genuinely independent layers on
// top of the static art: the whole-icon approach/press/release motion, a
// synthetic ground shadow that reacts to that motion, 3 concentric ripple
// rings that burst outward from the fingertip on contact, and a soft touch
// flash — everything a "tap here" demo needs without pretending to animate
// pixels the source file doesn't expose separately.
export function TapDemoIcon({ size = 140, animated = true }: TapDemoIconProps) {
  const reducedMotion = useReducedMotion()
  const playMotion = animated && !reducedMotion

  const entranceOpacity = useSharedValue(0)
  const entranceScale = useSharedValue(0.96)
  const entranceY = useSharedValue(8)

  const handY = useSharedValue(0)
  const handScale = useSharedValue(1)
  const shadowOpacity = useSharedValue(0.25)
  const shadowScaleX = useSharedValue(1)

  useEffect(() => {
    entranceOpacity.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    entranceScale.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    entranceY.value = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) })

    if (!playMotion) return

    // Six phases — rest, approach, contact, press-hold, release, idle —
    // shared by the hand and its ground shadow so they always react
    // together. Durations: 300 + 200 + 60 + 140 + 150 + 1550 = 2400 = CYCLE.
    handY.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 300 }),
          withTiming(-5, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(2, { duration: 60, easing: Easing.in(Easing.quad) }),
          withTiming(2, { duration: 140 }),
          withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1550 }),
        ),
        -1,
        false,
      ),
    )
    handScale.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(1.01, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(0.985, { duration: 60, easing: Easing.in(Easing.quad) }),
          withTiming(0.985, { duration: 140 }),
          withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 1550 }),
        ),
        -1,
        false,
      ),
    )
    shadowOpacity.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(0.25, { duration: 300 }),
          withTiming(0.15, { duration: 200 }),
          withTiming(0.3, { duration: 60 }),
          withTiming(0.3, { duration: 140 }),
          withTiming(0.25, { duration: 150 }),
          withTiming(0.25, { duration: 1550 }),
        ),
        -1,
        false,
      ),
    )
    shadowScaleX.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.94, { duration: 200 }),
          withTiming(1.04, { duration: 60 }),
          withTiming(1.04, { duration: 140 }),
          withTiming(1, { duration: 150 }),
          withTiming(1, { duration: 1550 }),
        ),
        -1,
        false,
      ),
    )
    // Mount-only continuous loop — must not restart on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playMotion])

  const flashPhases = ripplePhaseDurations(0, 100, 100)
  const flashOpacity = useBurstValue(0, 0.35, 0, flashPhases, playMotion, 560)

  const handStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { translateY: entranceY.value + handY.value },
      { scale: entranceScale.value * handScale.value },
    ],
  }))
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value * shadowOpacity.value,
    transform: [{ scaleX: shadowScaleX.value }],
  }))
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }))

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Ground shadow — synthetic, independent of the artwork */}
      <Animated.View
        pointerEvents="none"
        style={[
          shadowStyle,
          {
            position: "absolute",
            bottom: size * 0.06,
            width: size * 0.42,
            height: size * 0.1,
            borderRadius: size * 0.06,
            backgroundColor: "rgba(30,30,35,0.35)",
          },
        ]}
      />

      {/* Touch flash + ripple rings — centered near the fingertip, roughly
          the upper third of the icon */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: size * 0.16, width: size, alignItems: "center" }}
      >
        <Animated.View
          style={[
            flashStyle,
            {
              position: "absolute",
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "rgba(150,150,158,0.4)",
            },
          ]}
        />
        {playMotion && [0, 130, 260].map((delay, i) => (
          <RippleRing key={i} delay={delay} enabled={playMotion} startDelay={560} />
        ))}
      </View>

      <Animated.View style={handStyle}>
        <Image source={TAP_ICON} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  )
}
