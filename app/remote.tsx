import { useCast } from "@/lib/cast/CastProvider"
import { useRouter } from "expo-router"
import {
  ChevronLeft,
  Pause,
  Play,
  Rewind,
  FastForward,
  Volume1,
  Volume2,
  VolumeX,
  Tv,
} from "lucide-react-native"
import { Image, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from "react-native"

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}

export default function RemoteScreen() {
  const router = useRouter()
  const {
    connectionState,
    device,
    currentMedia,
    playbackState,
    position,
    duration,
    volume,
    muted,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    disconnect,
  } = useCast()

  const artwork = currentMedia?.backdropUrl || currentMedia?.posterUrl
  const supportsTransport = duration > 0
  const isPlaying = playbackState === "playing"

  const handleDisconnect = async () => {
    await disconnect()
    router.back()
  }

  if (connectionState !== "connected") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <StatusBar barStyle="light-content" />
        <Tv size={36} color="rgba(255,255,255,0.3)" strokeWidth={1.6} />
        <Text style={{ color: "#F0EAE4", fontSize: 17, fontWeight: "700", marginTop: 16, marginBottom: 6 }}>
          Not connected
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
          Your TV session ended. Connect again from Profile → TV & Casting.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close remote"
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }} numberOfLines={1}>
            {device?.name ?? "TV"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" }} />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Connected</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleDisconnect}
          accessibilityRole="button"
          accessibilityLabel="Disconnect from TV"
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: "rgba(255,59,92,0.15)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FF3B5C", fontSize: 11, fontWeight: "800" }}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <View
          style={{
            width: "100%", aspectRatio: 16 / 10, borderRadius: 24, overflow: "hidden",
            backgroundColor: "#1a1a22", marginBottom: 24,
          }}
        >
          {artwork ? (
            <Image source={{ uri: artwork }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Tv size={40} color="rgba(255,255,255,0.25)" strokeWidth={1.4} />
            </View>
          )}
        </View>

        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" }} numberOfLines={2}>
          {currentMedia?.title ?? "Nothing playing yet"}
        </Text>
        {currentMedia?.subtitle && (
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 6, textAlign: "center" }}>
            {currentMedia.subtitle}
          </Text>
        )}

        {/* Progress — only meaningful for real video content with a duration */}
        {supportsTransport && (
          <View style={{ width: "100%", marginTop: 24 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${Math.min(100, (position / duration) * 100)}%`,
                  backgroundColor: "#FF3B5C",
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{formatTime(position)}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

        {!supportsTransport && currentMedia && (
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 16, textAlign: "center" }}>
            Showing on your TV as a companion display — open {currentMedia.subtitle?.split("  ·  ")[0] || "the streaming app"} to
            start playback there.
          </Text>
        )}
      </View>

      {/* Transport controls — hidden entirely when there's no real timeline to control */}
      {supportsTransport && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28, marginBottom: 28 }}>
          <TouchableOpacity
            onPress={() => seek(Math.max(0, position - 10))}
            accessibilityRole="button"
            accessibilityLabel="Rewind 10 seconds"
            style={{ alignItems: "center" }}
          >
            <Rewind size={26} color="#fff" fill="#fff" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 4 }}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (isPlaying ? pause() : play())}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause" : "Play"}
            style={{
              width: 68, height: 68, borderRadius: 34,
              backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
            }}
          >
            {isPlaying ? (
              <Pause size={28} color="#0a0a0f" fill="#0a0a0f" />
            ) : (
              <Play size={28} color="#0a0a0f" fill="#0a0a0f" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => seek(position + 10)}
            accessibilityRole="button"
            accessibilityLabel="Forward 10 seconds"
            style={{ alignItems: "center" }}
          >
            <FastForward size={26} color="#fff" fill="#fff" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 4 }}>10s</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Volume — device-level, always available while connected */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 16,
          paddingHorizontal: 24, paddingBottom: 32,
        }}
      >
        <TouchableOpacity
          onPress={toggleMute}
          accessibilityRole="button"
          accessibilityLabel={muted ? "Unmute" : "Mute"}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {muted ? (
            <VolumeX size={20} color="#fff" />
          ) : (
            <Volume1 size={20} color="rgba(255,255,255,0.7)" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setVolume(Math.max(0, volume - 0.1))}
          accessibilityRole="button"
          accessibilityLabel="Volume down"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: "300" }}>−</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${muted ? 0 : volume * 100}%`, backgroundColor: "#fff" }} />
        </View>

        <TouchableOpacity
          onPress={() => setVolume(Math.min(1, volume + 0.1))}
          accessibilityRole="button"
          accessibilityLabel="Volume up"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: "600" }}>+</Text>
        </TouchableOpacity>

        <Volume2 size={20} color="rgba(255,255,255,0.7)" />
      </View>
    </SafeAreaView>
  )
}
