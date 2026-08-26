import { getPreferences, setPreferences } from "@/lib/preferences"
import type { CastActionResult, CastConnectionState, CastDeviceInfo, CastPlaybackState, CastableMovie } from "@/types/cast"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { NativeModules } from "react-native"
import GoogleCast, {
  CastState,
  MediaPlayerIdleReason,
  MediaPlayerState,
  MediaStreamType,
  useCastDevice,
  useCastState,
  useDevices,
  useMediaStatus,
  useRemoteMediaClient,
  useStreamPosition,
} from "react-native-google-cast"
import { CastReactContext, UNAVAILABLE_VALUE, type CastContextValue } from "./context"

export { useCast } from "./context"

// react-native-google-cast requires custom native code and will crash if the
// native module isn't linked (e.g. the app was opened in Expo Go rather than
// a dev-client/EAS build). Guard on the native module itself so the rest of
// the app degrades gracefully instead of throwing on import.
const isCastNativeModuleLinked = !!NativeModules.RNGCCastContext

export function CastProvider({ children }: { children: React.ReactNode }) {
  if (!isCastNativeModuleLinked) {
    return <CastReactContext.Provider value={UNAVAILABLE_VALUE}>{children}</CastReactContext.Provider>
  }
  return <LiveCastProvider>{children}</LiveCastProvider>
}

function LiveCastProvider({ children }: { children: React.ReactNode }) {
  const castState = useCastState()
  const rawDevice = useCastDevice()
  const rawDevices = useDevices()
  const client = useRemoteMediaClient()
  const mediaStatus = useMediaStatus()
  const position = useStreamPosition(1000)

  const [disconnecting, setDisconnecting] = useState(false)
  const [currentMedia, setCurrentMedia] = useState<CastableMovie | null>(null)
  const [lastDevice, setLastDevice] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    getPreferences().then((p) => setLastDevice(p.lastCastDevice))
  }, [])

  const device: CastDeviceInfo | null = useMemo(
    () =>
      rawDevice
        ? { id: rawDevice.deviceId, name: rawDevice.friendlyName, modelName: rawDevice.modelName }
        : null,
    [rawDevice],
  )

  const devices: CastDeviceInfo[] = useMemo(
    () => rawDevices.map((d) => ({ id: d.deviceId, name: d.friendlyName, modelName: d.modelName })),
    [rawDevices],
  )

  // Remember the device once a session is actually established — never mark
  // a saved device as "connected" just because it was used before.
  useEffect(() => {
    if (!device) return
    const next = { id: device.id, name: device.name }
    setLastDevice(next)
    setPreferences({ lastCastDevice: next })
  }, [device])

  // Once fully disconnected, drop whatever we were showing on the TV.
  useEffect(() => {
    if (castState === CastState.NOT_CONNECTED || castState === CastState.NO_DEVICES_AVAILABLE) {
      setCurrentMedia(null)
    }
  }, [castState])

  const connectionState: CastConnectionState = useMemo(() => {
    if (disconnecting) return "disconnecting"
    if (castState === CastState.CONNECTING) return "connecting"
    if (castState === CastState.CONNECTED) return "connected"
    return "disconnected"
  }, [castState, disconnecting])

  const playbackState: CastPlaybackState = useMemo(() => {
    if (!mediaStatus) return "idle"
    switch (mediaStatus.playerState) {
      case MediaPlayerState.LOADING:
        return "loading"
      case MediaPlayerState.PLAYING:
        return "playing"
      case MediaPlayerState.PAUSED:
        return "paused"
      case MediaPlayerState.BUFFERING:
        return "buffering"
      case MediaPlayerState.IDLE:
        if (mediaStatus.idleReason === MediaPlayerIdleReason.FINISHED) return "ended"
        if (mediaStatus.idleReason === MediaPlayerIdleReason.ERROR) return "error"
        return "idle"
      default:
        return "idle"
    }
  }, [mediaStatus])

  const connect = useCallback(async (deviceId: string): Promise<CastActionResult> => {
    try {
      const started = await GoogleCast.getSessionManager().startSession(deviceId)
      return started
        ? { ok: true }
        : { ok: false, message: "Couldn't connect to that TV. Make sure it's on and on the same Wi-Fi network." }
    } catch {
      return { ok: false, message: "Couldn't connect to that TV. Make sure it's on and on the same Wi-Fi network." }
    }
  }, [])

  const disconnect = useCallback(async () => {
    setDisconnecting(true)
    try {
      await GoogleCast.getSessionManager().endCurrentSession(true)
    } catch {
      // best-effort — useCastState reflects the real state regardless
    } finally {
      setCurrentMedia(null)
      setDisconnecting(false)
    }
  }, [])

  const watchOnTV = useCallback(
    async (movie: CastableMovie): Promise<CastActionResult> => {
      if (!client) return { ok: false, message: "Connect a TV first." }
      const artwork = movie.backdropUrl || movie.posterUrl
      if (!artwork) return { ok: false, message: `${movie.title} doesn't have artwork to send to the TV.` }
      try {
        await client.loadMedia({
          autoplay: true,
          mediaInfo: {
            contentId: movie.id,
            contentUrl: artwork,
            contentType: "image/jpeg",
            streamType: MediaStreamType.OTHER,
            metadata: {
              type: "movie",
              title: movie.title,
              subtitle: movie.subtitle,
              images: [{ url: artwork }],
            },
          },
        })
        setCurrentMedia(movie)
        return { ok: true }
      } catch {
        return { ok: false, message: "Couldn't send this to your TV. Try reconnecting." }
      }
    },
    [client],
  )

  const play = useCallback(async () => {
    try {
      await client?.play()
    } catch {
      // surfaced to the user via playbackState staying unchanged
    }
  }, [client])

  const pause = useCallback(async () => {
    try {
      await client?.pause()
    } catch {
      // surfaced to the user via playbackState staying unchanged
    }
  }, [client])

  const seek = useCallback(
    async (positionSeconds: number) => {
      try {
        await client?.seek({ position: Math.max(0, positionSeconds) })
      } catch {
        // no-op — position stays wherever the receiver actually is
      }
    },
    [client],
  )

  const setVolume = useCallback(
    (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume))
      client?.setStreamVolume(clamped).catch(() => {})
    },
    [client],
  )

  const toggleMute = useCallback(() => {
    client?.setStreamMuted(!mediaStatus?.isMuted).catch(() => {})
  }, [client, mediaStatus?.isMuted])

  const startDiscovery = useCallback(() => {
    GoogleCast.getDiscoveryManager()
      .startDiscovery()
      .catch(() => {})
  }, [])

  const value: CastContextValue = {
    isCastAvailable: true,
    connectionState,
    hasDevicesAvailable: castState !== CastState.NO_DEVICES_AVAILABLE,
    devices,
    device,
    lastDevice,
    playbackState,
    currentMedia,
    position: position ?? 0,
    duration: mediaStatus?.mediaInfo?.streamDuration ?? 0,
    volume: mediaStatus?.volume ?? 1,
    muted: mediaStatus?.isMuted ?? false,
    connect,
    disconnect,
    watchOnTV,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    startDiscovery,
  }

  return <CastReactContext.Provider value={value}>{children}</CastReactContext.Provider>
}
