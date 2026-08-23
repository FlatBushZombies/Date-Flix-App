import { Linking } from "react-native"
import { getWatchUrl } from "@/lib/streaming"

// This app doesn't host video, so there's no real Cast/AirPlay stream to hand
// off — "send to TV" means opening the title in its actual streaming app,
// which has its own Cast/AirPlay button once it's open. iOS also needs each
// scheme whitelisted in app.json's ios.infoPlist.LSApplicationQueriesSchemes
// or `canOpenURL` always reports false, even with the app installed.
const APP_SCHEMES: Record<string, string> = {
  Netflix: "nflx://",
  "Disney+": "disneyplus://",
  "Prime Video": "aiv://",
  "Apple TV+": "videos://",
  Max: "hbomax://",
  Hulu: "hulu://",
  Peacock: "peacock://",
  "Paramount+": "paramountplus://",
  Mubi: "mubi://",
}

// The platforms this app knows how to hand off to directly — used to build
// the "Cast & TV" connection list in Account Settings.
export const CASTABLE_PLATFORMS = Object.keys(APP_SCHEMES)

// Whether the given streaming app is installed on this device, i.e. whether
// sendToStreamingApp will be able to open it directly instead of falling
// back to a web search.
export async function isAppInstalled(streaming: string): Promise<boolean> {
  const scheme = APP_SCHEMES[streaming]
  if (!scheme) return false
  try {
    return await Linking.canOpenURL(scheme)
  } catch {
    return false
  }
}

export type SendToTvResult = "app" | "web"

// Tries the platform's own app first (best case: user taps its native Cast/
// AirPlay icon once it opens); falls back to the same web search the
// existing "Watch Now" flow already uses if the app isn't installed or the
// platform has no known scheme — so this never leaves the user stranded.
export async function sendToStreamingApp(streaming: string, title: string): Promise<SendToTvResult> {
  const scheme = APP_SCHEMES[streaming]

  if (scheme) {
    try {
      const canOpen = await Linking.canOpenURL(scheme)
      if (canOpen) {
        await Linking.openURL(scheme)
        return "app"
      }
    } catch {
      // fall through to the web fallback below
    }
  }

  await Linking.openURL(getWatchUrl(streaming, title))
  return "web"
}
