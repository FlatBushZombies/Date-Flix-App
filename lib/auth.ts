import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key)
      if (item) {
        console.log(`${key} was used 🔐 \n`)
      } else {
        console.log("No values stored under key: " + key)
      }
      return item
    } catch (error) {
      console.error("SecureStore get item error: ", error)
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch {
      return
    }
  },
}

export const googleOAuth = async (startOAuthFlow: any) => {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(protected)/post-auth"),
    })

    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId })

      if (signUp && signUp.createdUserId) {
        try {
          await fetchAPI("/(api)/user", {
            method: "POST",
            body: JSON.stringify({
              name: `${signUp.firstName ?? ""} ${signUp.lastName ?? ""}`.trim(),
              email: signUp.emailAddress,
              clerkId: signUp.createdUserId,
            }),
          })
        } catch (error) {
          // Backend user creation failure should not break the OAuth flow in Expo Go
          console.warn("Failed to sync user to backend after Google OAuth:", error)
        }
      }

      return {
        success: true,
        code: "success",
        message: "You have successfully signed in with Google",
      }
    }

    return {
      success: false,
      code: "session_missing",
      message: "An error occurred while signing in with Google",
    }
  } catch (err: any) {
    console.error("Google OAuth error:", err)

    let message = "Failed to sign in with Google"

    if (Array.isArray(err?.errors) && err.errors.length > 0) {
      message = err.errors[0]?.longMessage || message
    } else if (err?.message) {
      message = err.message
    }

    return {
      success: false,
      code: err?.code ?? "oauth_error",
      message,
    }
  }
}
