import React from "react"
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useAuth } from "@clerk/clerk-expo"
import { IMAGES } from "@/constants"

export default function DateFlixOnboarding() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return <View className="flex-1 bg-[#0A0408]" />

  const buttonLabel = isSignedIn ? "Explore" : "Get Started"

  const handlePress = () => {
    if (isSignedIn) {
      router.replace("/(tabs)/home")
    } else {
      router.push("/(auth)/login")
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0408]">
      {/* Background gradient */}
      <LinearGradient
        colors={["#0A0408", "#180608", "#0A0408"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top brand label */}
      <View className="items-center pt-10 pb-2">
        <Text
          className="text-red-600 text-xs font-bold tracking-[4px] uppercase"
        >
          DateFlix
        </Text>
      </View>

      {/* Icon area — takes up remaining space above sheet */}
      <View className="flex-1 items-center justify-center">

        {/* Layered glow rings behind the icon */}
        <View
          className="absolute w-72 h-72 rounded-full"
          style={{
            backgroundColor: "#E5091408",
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 80,
            elevation: 0,
          }}
        />
        <View
          className="absolute w-52 h-52 rounded-full"
          style={{
            backgroundColor: "#E5091412",
          }}
        />

        {/* Icon card */}
        <View
          className="items-center justify-center"
          style={{
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.35,
            shadowRadius: 40,
            elevation: 24,
          }}
        >
          <Image
            source={IMAGES.logo}
            resizeMode="contain"
            style={{ width: 180, height: 180 }}
          />
        </View>

        {/* Subtle ellipse shadow beneath icon */}
        <View
          className="mt-4 rounded-full bg-red-700 opacity-20"
          style={{ width: 100, height: 12 }}
        />
      </View>

      {/* Bottom sheet */}
      <View
        className="bg-white rounded-t-[36px] px-7 pt-5 pb-10"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 20,
        }}
      >
        {/* Pill handle */}
        <View className="w-9 h-[3px] rounded-full bg-zinc-200 self-center mb-6" />

        {/* Text block */}
        <Text
          className="text-[28px] font-extrabold text-zinc-900 text-center mb-3"
          style={{ letterSpacing: -0.6, lineHeight: 34 }}
        >
          Match Movies{"\n"}Together
        </Text>

        <Text className="text-[15px] leading-[24px] text-zinc-400 text-center mb-9 px-3">
          Swipe movies you love and let DateFlix find the perfect match for your
          next movie night.
        </Text>

        {/* Pill feature tags */}
        <View className="flex-row justify-center gap-2 mb-8">
          {["🎬 Swipe to match", "❤️ Couples picks", "🍿 Movie nights"].map(
            (tag) => (
              <View
                key={tag}
                className="bg-zinc-100 rounded-full px-3 py-1"
              >
                <Text className="text-[11px] font-medium text-zinc-500">
                  {tag}
                </Text>
              </View>
            )
          )}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePress}
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 18,
            elevation: 14,
          }}
        >
          <LinearGradient
            colors={["#FF3020", "#E50914"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 items-center justify-center"
          >
            <Text
              className="text-white text-[16px] font-bold"
              style={{ letterSpacing: 0.4 }}
            >
              {buttonLabel}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip */}
        {!isSignedIn && (
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/home")}
            activeOpacity={0.5}
            className="items-center py-1"
          >
            <Text
              className="text-[13px] text-zinc-400"
              style={{ letterSpacing: 0.2 }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}