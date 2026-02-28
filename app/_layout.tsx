import "./globals.css"
import { Stack } from "expo-router"
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { tokenCache } from "@/lib/auth"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in your .env file as a pk_test_… key for development.",
  )
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <SignedOut>
            <Stack.Screen name="(auth)" />
          </SignedOut>
          <SignedIn>
            <Stack.Screen name="(protected)" />
          </SignedIn>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GestureHandlerRootView>
    </ClerkProvider>
  )
}