import { useEffect } from "react"
import { Image, Text, View } from "react-native"
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

const SWIPE_ICON = require("@/assets/icons/tap-icon.png")

export type SwipeDemoIconProps = {
  size?: number
  animated?: boolean
}

// Every phase list below sums to exactly 3200ms — one full "rest → swipe
// right → return → swipe left → return → pause" cycle — so the icon, its
// tilt, and the LIKE/NOPE flashes never drift out of sync across repeats.
const EASE = Easing.out(Easing.cubic)

// Premium "this is what swiping looks like" demonstration for the onboarding
// screen that replaces the old interactive movie-card demo. Reuses the same
// tap-icon.png hand illustration (per request) but sweeps it left/right
// instead of pressing it, with small LIKE/NOPE flashes reinforcing which
// direction means what — matching the same red/lime cue colors the real
// swipe deck uses (see components/MovieCard.tsx).
export function SwipeDemoIcon({ size = 150, animated = true }: SwipeDemoIconProps) {
  const reducedMotion = useReducedMotion()
  const playMotion = animated && !reducedMotion

  const entranceOpacity = useSharedValue(0)
  const entranceScale = useSharedValue(0.96)
  const entranceY = useSharedValue(8)

  const translateX = useSharedValue(0)
  const rotate = useSharedValue(0)
  const likeOpacity = useSharedValue(0)
  const nopeOpacity = useSharedValue(0)

  useEffect(() => {
    entranceOpacity.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    entranceScale.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    entranceY.value = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) })

    if (!playMotion) return

    // Phases: rest(300) → swipe right(450) → return(350) → swipe left(450)
    // → return(350) → pause(1300) = 3200 = CYCLE.
    translateX.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 300 }),
          withTiming(size * 0.3, { duration: 450, easing: EASE }),
          withTiming(0, { duration: 350, easing: EASE }),
          withTiming(-size * 0.3, { duration: 450, easing: EASE }),
          withTiming(0, { duration: 350, easing: EASE }),
          withTiming(0, { duration: 1300 }),
        ),
        -1,
        false,
      ),
    )
    rotate.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 300 }),
          withTiming(8, { duration: 450, easing: EASE }),
          withTiming(0, { duration: 350, easing: EASE }),
          withTiming(-8, { duration: 450, easing: EASE }),
          withTiming(0, { duration: 350, easing: EASE }),
          withTiming(0, { duration: 1300 }),
        ),
        -1,
        false,
      ),
    )
    // LIKE flash brackets the right-swipe peak (300→750ms).
    likeOpacity.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 420 }),
          withTiming(0.9, { duration: 180, easing: EASE }),
          withTiming(0, { duration: 250, easing: EASE }),
          withTiming(0, { duration: 2350 }),
        ),
        -1,
        false,
      ),
    )
    // NOPE flash brackets the left-swipe peak (1100→1550ms).
    nopeOpacity.value = withDelay(
      560,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1100 }),
          withTiming(0.9, { duration: 180, easing: EASE }),
          withTiming(0, { duration: 250, easing: EASE }),
          withTiming(0, { duration: 1670 }),
        ),
        -1,
        false,
      ),
    )
    // Mount-only continuous loop — must not restart on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playMotion])

  const iconStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { translateY: entranceY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: entranceScale.value },
    ],
  }))
  const likeStyle = useAnimatedStyle(() => ({ opacity: likeOpacity.value }))
  const nopeStyle = useAnimatedStyle(() => ({ opacity: nopeOpacity.value }))

  return (
    <View style={{ width: size * 1.6, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[nopeStyle, { position: "absolute", left: 0, top: size * 0.36 }]}
      >
        <View style={{
          borderWidth: 2, borderColor: "#ff4d6d", borderRadius: 7,
          paddingHorizontal: 7, paddingVertical: 2, transform: [{ rotate: "-10deg" }],
        }}>
          <Text style={{ color: "#ff4d6d", fontWeight: "900", fontSize: 11, letterSpacing: 1.5 }}>NOPE</Text>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[likeStyle, { position: "absolute", right: 0, top: size * 0.36 }]}
      >
        <View style={{
          borderWidth: 2, borderColor: "#84cc16", borderRadius: 7,
          paddingHorizontal: 7, paddingVertical: 2, transform: [{ rotate: "10deg" }],
        }}>
          <Text style={{ color: "#84cc16", fontWeight: "900", fontSize: 11, letterSpacing: 1.5 }}>LIKE</Text>
        </View>
      </Animated.View>

      <Animated.View style={iconStyle}>
        <Image source={SWIPE_ICON} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  )
}
