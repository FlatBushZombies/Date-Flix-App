import "./globals.css"
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store"
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo"

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

export default function RootLayout() {
  return (
    <ClerkProvider
    publishableKey={publishableKey}
    tokenCache={tokenCache}
    >
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false}} />
      <SignedOut>
      <Stack.Screen name="(auth)" options={{ headerShown: false}} />
      </SignedOut>
      <SignedIn>
          <Stack.Screen name="(protected)" options={{ headerShown: false}}/>
      </SignedIn>
      <Stack.Screen name="(tabs)" options={{ headerShown: false}} />
    </Stack>
    </ClerkProvider>
  )
}
