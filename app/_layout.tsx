import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo"
import { Stack } from "expo-router"
import { useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import "./globals.css"

import { ConfirmProvider } from "@/components/Confirm/ConfirmProvider"
import { PushNotificationHandler } from "@/components/PushNotificationHandler"
import { SplashScreen } from "@/components/SplashScreen"
import { ToastProvider } from "@/components/Toast/ToastProvider"
import { tokenCache } from "@/lib/auth"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in your .env file as a pk_test_… key for development.",
  )
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <ConfirmProvider>
            {showSplash && <SplashScreen onAnimationComplete={handleSplashComplete} />}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <SignedOut>
                <Stack.Screen name="(auth)" />
              </SignedOut>
              <SignedIn>
                <PushNotificationHandler />
                <Stack.Screen name="(protected)" />
              </SignedIn>
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ConfirmProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  )
}