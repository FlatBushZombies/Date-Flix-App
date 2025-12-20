import { View, Text, TouchableOpacity } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"

export default function OnboardingScreen() {
  const { user } = useUser()

  const finishOnboarding = async () => {
    if (!user) return

    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        onboarded: true,
      },
    })

    router.replace("/(tabs)/home")
  }

  return (
    <View className="flex-1 items-center justify-center bg-black px-6">
      <Text className="mb-6 text-2xl font-bold text-white">
        Welcome to DateFlix
      </Text>

      <Text className="mb-10 text-center text-zinc-400">
        Swipe movies you love and let DateFlix find matches
        for your perfect movie night.
      </Text>

      <TouchableOpacity
        onPress={finishOnboarding}
        className="rounded-xl bg-red-600 px-6 py-4"
      >
        <Text className="font-semibold text-white">
          Start Matching
        </Text>
      </TouchableOpacity>
    </View>
  )
}
