import React from "react"
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Film, Heart } from "lucide-react-native"
import { router } from "expo-router"

export default function DateFlixOnboarding() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      
      <LinearGradient
        colors={["#0B0B0F", "#000000"]}
        className="absolute inset-0"
      />

  
      <View className="flex-1 items-center justify-center">
        <View className="relative h-[180px] w-[180px] items-center justify-center rounded-full bg-zinc-900 shadow-2xl">
          <Film size={56} color="white" />
          <Heart
            size={28}
            color="#E50914"
            className="absolute bottom-8 right-10"
          />
        </View>
      </View>

    
      <View className="rounded-t-[28px] bg-white px-6 pt-4 pb-8">
        
        <View className="mb-5 h-1 w-10 self-center rounded-full bg-zinc-300" />

        <Text className="mb-2 text-center text-2xl font-bold text-black">
          Match Movies Together
        </Text>

        <Text className="mb-7 text-center text-[15px] leading-6 text-zinc-500">
          Swipe movies you love and let DateFlix find the perfect match for your
          next movie night.
        </Text>

        
        <TouchableOpacity className="mb-4 h-[52px] items-center justify-center rounded-xl bg-red-600" onPress={() => {
          router.push("/(auth)/login")
        }}>
          <Text className="text-base font-semibold text-white">
            Get Started
          </Text>
        </TouchableOpacity>

        
        <TouchableOpacity>
          <Text className="text-center text-sm text-zinc-400">
            Skip
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
