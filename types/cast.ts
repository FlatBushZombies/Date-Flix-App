// Shared types for the TV Casting feature (Google Cast). Kept separate from
// react-native-google-cast's own types so the rest of the app depends on a
// small, stable surface rather than the SDK's full API.

export type CastConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"

export type CastPlaybackState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error"

export interface CastDeviceInfo {
  id: string
  name: string
  modelName?: string | null
}

// Minimal, screen-agnostic shape any movie card/detail screen can produce —
// see lib/cast/media.ts for the builders that collect these fields from the
// app's actual Movie / EnrichedMovie / TopPick shapes.
export interface CastableMovie {
  id: string
  title: string
  subtitle?: string
  overview?: string
  posterUrl?: string | null
  backdropUrl?: string | null
}

export interface CastActionResult {
  ok: boolean
  message?: string
}
