import { useUser } from "@clerk/clerk-expo"
import { useEffect } from "react"
import { router } from "expo-router"
import { View, ActivityIndicator } from "react-native"

export default function PostAuthRedirect() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    const completedOnboarding =
      user.unsafeMetadata?.onboarded === true

    if (!completedOnboarding) {
      router.replace("/(protected)/onboarding")
    } else {
      router.replace("/(tabs)/home")
    }
  }, [isLoaded, user])

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <ActivityIndicator />
    </View>
  )
}
