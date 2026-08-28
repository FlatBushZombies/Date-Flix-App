import type {
  CastActionResult,
  CastConnectionState,
  CastDeviceInfo,
  CastPlaybackState,
  CastableMovie,
} from "@/types/cast"
import { createContext, useContext } from "react"

// Shared between CastProvider.native.tsx (real react-native-google-cast
// integration) and CastProvider.web.tsx (a same-shaped no-op) so Metro can
// pick the right one per platform — react-native-google-cast has no web
// implementation and must never be imported into the web bundle.
export interface CastContextValue {
  // False when the native Google Cast module isn't linked (e.g. running in
  // Expo Go instead of a development build, or on web) — every action below
  // becomes a safe no-op that reports why, instead of crashing.
  isCastAvailable: boolean
  connectionState: CastConnectionState
  hasDevicesAvailable: boolean
  devices: CastDeviceInfo[]
  device: CastDeviceInfo | null
  lastDevice: { id: string; name: string } | null
  playbackState: CastPlaybackState
  currentMedia: CastableMovie | null
  position: number
  duration: number
  volume: number
  muted: boolean
  connect: (deviceId: string) => Promise<CastActionResult>
  disconnect: () => Promise<void>
  watchOnTV: (movie: CastableMovie) => Promise<CastActionResult>
  play: () => Promise<void>
  pause: () => Promise<void>
  seek: (positionSeconds: number) => Promise<void>
  setVolume: (volume: number) => void
  toggleMute: () => void
  startDiscovery: () => void
}

const UNAVAILABLE_MESSAGE = "Casting requires the Duo App development build."

export const UNAVAILABLE_VALUE: CastContextValue = {
  isCastAvailable: false,
  connectionState: "disconnected",
  hasDevicesAvailable: false,
  devices: [],
  device: null,
  lastDevice: null,
  playbackState: "idle",
  currentMedia: null,
  position: 0,
  duration: 0,
  volume: 1,
  muted: false,
  connect: async () => ({ ok: false, message: UNAVAILABLE_MESSAGE }),
  disconnect: async () => {},
  watchOnTV: async () => ({ ok: false, message: UNAVAILABLE_MESSAGE }),
  play: async () => {},
  pause: async () => {},
  seek: async () => {},
  setVolume: () => {},
  toggleMute: () => {},
  startDiscovery: () => {},
}

export const CastReactContext = createContext<CastContextValue>(UNAVAILABLE_VALUE)

export function useCast() {
  return useContext(CastReactContext)
}
