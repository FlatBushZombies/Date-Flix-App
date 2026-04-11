import { MessageBanner } from "@/components/MessageBanner"
import { IMAGES } from "@/constants"
import { googleOAuth } from "@/lib/auth"
import { useOAuth } from "@clerk/clerk-expo"
import { LinearGradient } from "expo-linear-gradient"
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
import Svg, { Path } from "react-native-svg"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

// Official Google "G" logo SVG — full brand colours, HD-crisp at any size
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Blue */}
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      {/* Green */}
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      {/* Yellow */}
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      {/* Red */}
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  )
}

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const insets = useSafeAreaInsets()
  const [bannerVisible, setBannerVisible] = React.useState(false)
  const [bannerType, setBannerType] = React.useState<"success" | "error" | "info">("info")
  const [bannerTitle, setBannerTitle] = React.useState("")
  const [bannerMessage, setBannerMessage] = React.useState("")

  const showBanner = (type: "success" | "error" | "info", title: string, message: string) => {
    setBannerType(type)
    setBannerTitle(title)
    setBannerMessage(message)
    setBannerVisible(true)
  }

  const handleGoogleSignIn = async () => {
    const result = await googleOAuth(startOAuthFlow)
    if (result.success) {
      router.replace("/(protected)/post-auth")
      return
    }
    showBanner("error", "Error", result.message)
  }

  return (
    <View className="flex-1 bg-white">
      <MessageBanner
        visible={bannerVisible}
        type={bannerType}
        title={bannerTitle}
        message={bannerMessage}
        onDismiss={() => setBannerVisible(false)}
      />

      {/* ── FULL-BLEED HERO ── */}
      <View style={{ height: SCREEN_HEIGHT * 0.62 }}>

        {/* Dark bg */}
        <LinearGradient
          colors={["#0A0408", "#160508", "#220810"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top-right red bloom — elevation added for Android parity */}
        <View
          style={{
            position: "absolute",
            borderRadius: 999,
            width: 280,
            height: 280,
            top: -80,
            right: -80,
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 120,
            elevation: 0, // bloom is decorative; elevation stays 0 to avoid Android artefact
            backgroundColor: "transparent",
          }}
        />

        {/* Bottom-left subtle bloom */}
        <View
          style={{
            position: "absolute",
            borderRadius: 999,
            width: 180,
            height: 180,
            bottom: 60,
            left: -50,
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 80,
            backgroundColor: "transparent",
          }}
        />

        {/* Brand label */}
        <View style={{ paddingTop: insets.top + 16 }} className="px-7">
          <Text
            className="text-red-600 font-bold"
            style={{ fontSize: 10, letterSpacing: 5 }}
          >
            DUO 
          </Text>
        </View>

        {/* Logo */}
        <View className="flex-1 items-center justify-center">
          <View
            style={{
              shadowColor: "#E50914",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.55,
              shadowRadius: 50,
              elevation: 24,
            }}
          >
            <Image
              source={IMAGES.logo}
              resizeMode="contain"
              style={{ width: 170, height: 170 }}
            />
          </View>
        </View>

        {/* Scrim fading into white — extended slightly for a smoother blend */}
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.82)", "#ffffff"]}
          locations={[0, 0.45, 0.78, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
          }}
        />

        {/* Bold headline overlaid on scrim */}
        <View className="absolute bottom-0 left-0 right-0 px-7 pb-6">
          <Text
            className="text-zinc-900 font-extrabold"
            style={{ fontSize: 40, letterSpacing: -1.4, lineHeight: 46 }}
          >
            Movies you{"\n"}
            <Text className="text-red-600">both</Text> love.
          </Text>
        </View>
      </View>

      {/* ── WHITE ACTIONS ── */}
      <View
        className="flex-1 bg-white px-7"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {/* Sub-copy */}
        <Text
          className="text-zinc-400 mt-1 mb-8"
          style={{ fontSize: 15, lineHeight: 23 }}
        >
          Swipe together, match faster. Sign in to start
          building your perfect movie night.
        </Text>

        {/* Google CTA — dark pill with proper Google icon */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleGoogleSignIn}
          className="flex-row items-center justify-center rounded-2xl bg-zinc-900 mb-3"
          style={{
            height: 56,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Icon container — sized to match the SVG naturally, no extra border-radius needed */}
          <View
            className="mr-3 items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
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