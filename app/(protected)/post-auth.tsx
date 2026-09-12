import { useUser } from "@clerk/clerk-expo"
import { useEffect } from "react"
import { router } from "expo-router"
import { View, ActivityIndicator } from "react-native"

import { posthog } from "@/lib/posthog"

export default function PostAuthRedirect() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    posthog?.identify(user.id, {
      $set: {
        ...(user.primaryEmailAddress?.emailAddress
          ? { email: user.primaryEmailAddress.emailAddress }
          : {}),
        ...(user.firstName ? { first_name: user.firstName } : {}),
        ...(user.lastName ? { last_name: user.lastName } : {}),
        ...(user.username ? { username: user.username } : {}),
      },
    })

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
