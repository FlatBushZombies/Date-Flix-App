import { radius, shadow } from "@/constants/theme"
import { useCast } from "@/lib/cast/CastProvider"
import { useRouter } from "expo-router"
import { Cast, Pause, Play, X } from "lucide-react-native"
import { Image, Text, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated"

// Persistent "still casting" bar — mounted once above the tab bar so it
// survives navigation between tabs while a TV session is active (see spec
// requirement: browsing must continue while casting).
export function MiniCastPlayer() {
  const { connectionState, device, currentMedia, playbackState, duration, play, pause, disconnect } = useCast()
  const router = useRouter()

  if (connectionState !== "connected") return null

  const artwork = currentMedia?.posterUrl || currentMedia?.backdropUrl
  // Only a real video (has a duration) supports meaningful play/pause — the
  // "Now Viewing" poster display doesn't have a timeline to pause.
  const supportsTransport = duration > 0

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        // Clears the floating center "Discover" tab button (which pokes up
        // above the 72px tab bar) so the two never visually overlap.
        bottom: 150,
        borderRadius: radius.xl,
        backgroundColor: "#14121A",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 12,
        ...shadow.lg,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push("/remote")}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open TV remote"
        style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {artwork ? (
            <Image source={{ uri: artwork }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Cast size={17} color="#fff" />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
            {currentMedia?.title ?? "Connected"}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>
            {device?.name ?? "TV"}
          </Text>
        </View>
      </TouchableOpacity>

      {supportsTransport && (
        <TouchableOpacity
          onPress={() => (playbackState === "playing" ? pause() : play())}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={playbackState === "playing" ? "Pause" : "Play"}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playbackState === "playing" ? (
            <Pause size={14} color="#fff" fill="#fff" />
          ) : (
            <Play size={14} color="#fff" fill="#fff" />
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={disconnect}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Disconnect from TV"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </Animated.View>
  )
}
