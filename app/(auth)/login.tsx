import { useToast } from "@/components/Toast/ToastProvider"
import { IMAGES } from "@/constants"
import { appleOAuth, googleOAuth } from "@/lib/auth"
import { useOAuth } from "@clerk/clerk-expo"
import { router } from "expo-router"
import React from "react"
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle, Defs, Path, RadialGradient as SvgRadialGradient, Stop } from "react-native-svg"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Official Google "G" logo SVG — full brand colours, HD-crisp at any size
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  )
}

// Official Apple logo silhouette — matches the Google "G" icon-chip pattern.
function AppleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="#000000"
      />
    </Svg>
  )
}

// Concave wave — dips inward at the center, placed at the bottom of the hero.
// The white fill reveals the white background beneath, creating a clean hard edge.
function ConcaveWave({ width }: { width: number }) {
  const waveHeight = 72
  const cx = width / 2
  // Starts at top-left (y=0), curves down to the dip at center, back up to top-right,
  // then fills the rectangle below to cover any sub-pixel gap.
  const d = [
    `M0 0`,
    `Q${cx * 0.45} ${waveHeight} ${cx} ${waveHeight}`,
    `Q${cx * 1.55} ${waveHeight} ${width} 0`,
    `L${width} ${waveHeight + 2}`,
    `L0 ${waveHeight + 2}`,
    `Z`,
  ].join(" ")

  return (
    <Svg
      width={width}
      height={waveHeight + 2}
      style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
    >
      <Path d={d} fill="#ffffff" />
    </Svg>
  )
}

// Soft radial glow centered on the logo — keeps the dark bg from feeling flat
function LogoGlow({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  const cy = height * 0.50

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <SvgRadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="#E50914" stopOpacity="0.22" />
          <Stop offset="60%"  stopColor="#E50914" stopOpacity="0.07" />
          <Stop offset="100%" stopColor="#E50914" stopOpacity="0"    />
        </SvgRadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={width * 0.55} fill="url(#glow)" />
    </Svg>
  )
}

export default function LoginScreen() {
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: "oauth_apple" })
  const insets = useSafeAreaInsets()
  const toast = useToast()

  const handleGoogleSignIn = async () => {
    const result = await googleOAuth(startGoogleOAuthFlow)
    if (result.success) {
      router.replace("/(protected)/post-auth")
      return
    }
    toast.error("Error", result.message)
  }

  const handleAppleSignIn = async () => {
    const result = await appleOAuth(startAppleOAuthFlow)
    if (result.success) {
      router.replace("/(protected)/post-auth")
      return
    }
    toast.error("Error", result.message)
  }

  // Hero is ~58% of the screen height. The wave (72px) sits at the very bottom
  // of this View, so the visible dark area is heroHeight minus the wave depth.
  const heroHeight = SCREEN_HEIGHT * 0.58

  return (
    <View className="flex-1 bg-white">
      {/* ── HERO (dark bg + wave bottom) ── */}
      <View style={{ height: heroHeight, backgroundColor: "#0d0307" }}>

        {/* Soft centered glow behind the logo — avoids a flat-black feel */}
        <LogoGlow width={SCREEN_WIDTH} height={heroHeight} />

        {/* Brand label */}
        <View style={{ paddingTop: insets.top + 16 }} className="px-7">
          <Text
            className="text-red-600 font-bold"
            style={{ fontSize: 10, letterSpacing: 5 }}
          >
            DUO
          </Text>
        </View>

        {/* Logo — vertically centered in the dark zone above the wave */}
        <View className="flex-1 items-center justify-center" style={{ paddingBottom: 56 }}>
          <Image
            source={IMAGES.logo}
            resizeMode="contain"
            style={{ width: 160, height: 160 }}
          />
        </View>

        {/* Concave wave — the hero-to-white transition */}
        <ConcaveWave width={SCREEN_WIDTH} />
      </View>

      {/* ── WHITE ACTIONS ── */}
      <View
        className="flex-1 bg-white px-7"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {/* Headline sits just below the wave */}
        <Text
          className="text-zinc-900 font-extrabold mt-2 mb-2"
          style={{ fontSize: 38, letterSpacing: -1.4, lineHeight: 44 }}
        >
          Movies you{"\n"}
          <Text className="text-red-600">both</Text> love.
        </Text>

        {/* Sub-copy */}
        <Text
          className="text-zinc-400 mb-8"
          style={{ fontSize: 15, lineHeight: 23 }}
        >
          Swipe together, match faster. Sign in to start
          building your perfect movie night.
        </Text>

        {/* Google CTA */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleGoogleSignIn}
          className="flex-row items-center justify-center rounded-3xl bg-zinc-900 mb-3"
          style={{
            height: 56,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View
            className="mr-3 items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              backgroundColor: "#ffffff",
            }}
          >
            <GoogleIcon size={18} />
          </View>

          <Text
            className="text-white font-bold"
            style={{ fontSize: 15, letterSpacing: 0.1 }}
          >
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Apple CTA */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleAppleSignIn}
          className="flex-row items-center justify-center rounded-3xl bg-zinc-900 mb-3"
          style={{
            height: 56,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View
            className="mr-3 items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              backgroundColor: "#ffffff",
            }}
          >
            <AppleIcon size={18} />
          </View>

          <Text
            className="text-white font-bold"
            style={{ fontSize: 15, letterSpacing: 0.1 }}
          >
            Continue with Apple
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text
          className="text-center text-zinc-300 mt-5"
          style={{ fontSize: 11, lineHeight: 17 }}
        >
          By continuing you agree to our{" "}
          <Text className="text-zinc-500 font-semibold">Terms</Text>
          {" "}and{" "}
          <Text className="text-zinc-500 font-semibold">Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}