import "./globals.css"
import { Stack } from "expo-router"
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo"
import "react-native-gesture-handler"

import { tokenCache } from "@/lib/auth"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  // Fail fast in development with a clear error instead of a cryptic runtime crash
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in your .env file as a pk_test_… key for development.",
  )
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <SignedOut>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </SignedOut>
        <SignedIn>
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </SignedIn>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  )
}
