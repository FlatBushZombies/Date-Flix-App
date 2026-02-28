import React from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useOAuth } from "@clerk/clerk-expo"
import { router } from "expo-router"
import { googleOAuth } from "@/lib/auth"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { IMAGES } from "@/constants"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const insets = useSafeAreaInsets()

  const handleGoogleSignIn = async () => {
    const result = await googleOAuth(startOAuthFlow)
    if (result.success) {
      router.replace("/(protected)/post-auth")
    }
    Alert.alert(result.success ? "Success" : "Error", result.message)
  }

  return (
    <View className="flex-1 bg-white">

      {/* ── FULL-BLEED HERO ── */}
      <View style={{ height: SCREEN_HEIGHT * 0.62 }}>

        {/* Dark bg */}
        <LinearGradient
          colors={["#0A0408", "#160508", "#220810"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top-right red bloom */}
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
          }}
        />

        {/* Brand label */}
        <View style={{ paddingTop: insets.top + 16 }} className="px-7">
          <Text
            className="text-red-600 font-bold"
            style={{ fontSize: 10, letterSpacing: 5 }}
          >
            DATEFLIX
          </Text>
        </View>

        {/* Ghost icon */}
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

        {/* Scrim fading into white */}
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.88)", "#ffffff"]}
          locations={[0, 0.5, 0.8, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 190,
          }}
        />

        {/* Bold headline overlaid on scrim */}
        <View className="absolute bottom-0 left-0 right-0 px-7 pb-5">
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

        {/* Google CTA — dark pill */}
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
          <View className="mr-3 w-6 h-6 rounded-md bg-white items-center justify-center">
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#4285F4" }}>
              G
            </Text>
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