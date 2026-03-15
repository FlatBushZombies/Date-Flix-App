import React from "react"
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useAuth } from "@clerk/clerk-expo"
import { HandThumbUpIcon } from "react-native-heroicons/solid"
import { HeartIcon } from "react-native-heroicons/solid"
import { FilmIcon } from "react-native-heroicons/solid"

export default function DateFlixOnboarding() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return <View className="flex-1 bg-white" />

  const buttonLabel = isSignedIn ? "Explore" : "Get Started"

  const handlePress = () => {
    if (isSignedIn) {
      router.replace("/(tabs)/home")
    } else {
      router.push("/(auth)/login")
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* ── Red gradient top section ── */}
      <View
        className="flex-1 overflow-hidden pt-20 px-6 justify-center items-center"
        style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
      >
        <LinearGradient
          colors={["#FF2D2D", "#E50914", "#B2070F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Floating feature cards */}
        <View className="w-full items-end gap-y-[14px] pr-1">
          {/* Card 1 — Swipe to Match */}
          <View
            className="flex-row items-center bg-white rounded-2xl py-3 px-4 gap-x-3 self-end mr-0"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 10,
              transform: [{ rotate: "-1deg" }],
            }}
          >
            <View className="w-9 h-9 rounded-xl bg-red-100 items-center justify-center">
              <HandThumbUpIcon size={20} color="#E50914" />
            </View>
            <Text className="text-sm font-bold text-[#1A1A1A] tracking-tight">
              Swipe to Match
            </Text>
          </View>

          {/* Card 2 — Couples Picks */}
          <View
            className="flex-row items-center bg-white rounded-2xl py-3 px-4 gap-x-3 self-end mr-[30px]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 10,
              transform: [{ rotate: "0.5deg" }],
            }}
          >
            <View className="w-9 h-9 rounded-xl bg-red-100 items-center justify-center">
              <HeartIcon size={20} color="#E50914" />
            </View>
            <Text className="text-sm font-bold text-[#1A1A1A] tracking-tight">
              Couples Picks
            </Text>
          </View>

          {/* Card 3 — Movie Nights */}
          <View
            className="flex-row items-center bg-white rounded-2xl py-3 px-4 gap-x-3 self-end mr-0"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 10,
              transform: [{ rotate: "-0.5deg" }],
            }}
          >
            <View className="w-9 h-9 rounded-xl bg-red-100 items-center justify-center">
              <FilmIcon size={20} color="#E50914" />
            </View>
            <Text className="text-sm font-bold text-[#1A1A1A] tracking-tight">
              Movie Nights & Enjoy!
            </Text>
          </View>
        </View>
      </View>

      {/* ── White bottom sheet ── */}
      <View className="bg-white px-7 pt-3.5 pb-10">
        {/* Pill handle */}
        <View className="w-9 h-1 rounded-full bg-gray-200 self-center mb-6" />

        {/* Heading */}
        <Text
          className="text-[32px] font-extrabold text-[#1A1A1A] text-center mb-3"
          style={{ letterSpacing: -0.6, lineHeight: 40 }}
        >
          Match Movies{" "}
          <Text className="text-[#1A1A1A]">Together.</Text>
        </Text>

        {/* Subtitle */}
        <Text className="text-[15px] leading-6 text-gray-400 text-center mb-7 px-2">
          Swipe movies you love and let DateFlix find the perfect match for your
          next movie night.
        </Text>

        {/* CTA Button — full pill shape */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePress}
          style={{
            borderRadius: 50,
            overflow: "hidden",
            marginBottom: 12,
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 14,
          }}
        >
          <LinearGradient
            colors={["#FF2D2D", "#E50914"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 62,
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
          >
            <Text className="text-white text-[17px] font-bold tracking-wide">
              {buttonLabel}  →
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip */}
        {!isSignedIn && (
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/home")}
            activeOpacity={0.5}
            className="items-center py-1.5"
          >
            <Text className="text-[13px] text-[#B0B0B0] tracking-wide">
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}