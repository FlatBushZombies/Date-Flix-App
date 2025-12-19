import React from "react"
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Film, Heart } from "lucide-react-native"
import { router } from "expo-router"

export default function LoginScren() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Background */}
      <LinearGradient
        colors={["#0B0B0F", "#000000"]}
        className="absolute inset-0"
      />

      {/* Hero / Branding */}
      <View className="flex-1 items-center justify-center">
        <View className="relative h-[160px] w-[160px] items-center justify-center rounded-full bg-zinc-900 shadow-2xl">
          <Film size={52} color="white" />
          <Heart
            size={26}
            color="#E50914"
            className="absolute bottom-7 right-8"
          />
        </View>

        <Text className="mt-6 text-3xl font-bold text-white">
          DateFlix
        </Text>

        <Text className="mt-2 text-center text-sm text-zinc-400">
          Find movies you both love
        </Text>
      </View>

      {/* Bottom Sheet */}
      <View className="rounded-t-[28px] bg-white px-6 pt-6 pb-10">
        <View className="mb-6 h-1 w-10 self-center rounded-full bg-zinc-300" />

        <Text className="mb-2 text-center text-2xl font-bold text-black">
          Sign in to continue
        </Text>

        <Text className="mb-8 text-center text-[15px] leading-6 text-zinc-500">
          Sign in with Google to start matching movies and planning the perfect
          movie night together.
        </Text>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="mb-4 flex-row items-center justify-center rounded-xl border border-zinc-200 bg-white py-4"
          onPress={() => {
            router.push("/(tabs)/home")
          }}
        >
          <View className="mr-3 h-5 w-5 items-center justify-center rounded-full bg-white">
            <Text className="text-base font-bold text-black">G</Text>
          </View>

          <Text className="text-base font-semibold text-black">
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text className="mt-4 text-center text-xs leading-5 text-zinc-400">
          By continuing, you agree to DateFlix’s Terms of Service and Privacy
          Policy.
        </Text>
      </View>
    </SafeAreaView>
  )
}
