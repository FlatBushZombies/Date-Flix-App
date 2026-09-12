import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter"
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo"
import { Stack } from "expo-router"
import { type ReactNode, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { PostHogErrorBoundary, PostHogProvider } from "posthog-react-native"
import "./globals.css"

import { ConfirmProvider } from "@/components/Confirm/ConfirmProvider"
import { PushNotificationHandler } from "@/components/PushNotificationHandler"
import { SplashScreen } from "@/components/SplashScreen"
import { ToastProvider } from "@/components/Toast/ToastProvider"
import { tokenCache } from "@/lib/auth"
import { CastProvider } from "@/lib/cast/CastProvider"
import { posthog } from "@/lib/posthog"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in your .env file as a pk_test_… key for development.",
  )
}

function PostHogErrorFallback() {
  return null
}

function PostHogBoundary({ children }: { children: ReactNode }) {
  return posthog ? (
    <PostHogProvider client={posthog} debug={__DEV__}>
      <PostHogErrorBoundary fallback={PostHogErrorFallback}>{children}</PostHogErrorBoundary>
    </PostHogProvider>
  ) : children
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (!fontsLoaded) return null

  return (
    <PostHogBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ToastProvider>
            <ConfirmProvider>
              <CastProvider>
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
                  <Stack.Screen name="remote" options={{ presentation: "modal" }} />
                </Stack>
              </CastProvider>
            </ConfirmProvider>
          </ToastProvider>
        </GestureHandlerRootView>
      </ClerkProvider>
    </PostHogBoundary>
  )
}