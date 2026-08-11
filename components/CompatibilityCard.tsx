import type { AIVerdict, SupabaseUser } from "@/types"
import { LinearGradient } from "expo-linear-gradient"
import { forwardRef } from "react"
import { Image, Text, View } from "react-native"
import { HeartIcon } from "react-native-heroicons/solid"

// Sized close to a 9:16 Instagram Story frame — captured at 3x resolution on share.
export const CARD_WIDTH = 300
export const CARD_HEIGHT = 533

export const CompatibilityCard = forwardRef<
  View,
  {
    host?: SupabaseUser
    partner?: SupabaseUser
    verdict: AIVerdict
  }
>(function CompatibilityCard({ host, partner, verdict }, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 28, overflow: "hidden" }}
    >
      <LinearGradient
        colors={["#1a0a0f", "#3b0a20", "#0d0307"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: 26, justifyContent: "space-between" }}
      >
        <Text style={{ color: "#f472b6", fontSize: 11, fontWeight: "800", letterSpacing: 5 }}>DUO</Text>

        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <MiniAvatar user={host} />
            <HeartIcon size={20} color="#ec4899" />
            <MiniAvatar user={partner} />
          </View>
          <View style={{ flexDirection: "row", gap: 30, marginTop: 10 }}>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", width: 56, textAlign: "center" }}>
              {host?.first_name || "You"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", width: 56, textAlign: "center" }}>
              {partner?.first_name || "Partner"}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 60, fontWeight: "900", color: "#ffffff", letterSpacing: -2 }}>
            {verdict.compatibilityScore}%
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#f9a8d4", letterSpacing: 3, marginTop: 2 }}>
            COMPATIBLE
          </Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#f9a8d4", letterSpacing: 2, marginBottom: 8 }}>
            TONIGHT'S PICK
          </Text>
          <Text
            style={{ fontSize: 20, fontWeight: "800", color: "#ffffff", textAlign: "center", lineHeight: 25 }}
            numberOfLines={2}
          >
            {verdict.recommendation}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 12.5,
            color: "rgba(255,255,255,0.65)",
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: 18,
          }}
          numberOfLines={3}
        >
          "{verdict.coupleInsight}"
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          Settled with Duo 🎬
        </Text>
      </LinearGradient>
    </View>
  )
})

function MiniAvatar({ user }: { user?: SupabaseUser }) {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#f472b6",
        overflow: "hidden",
        backgroundColor: "#2d0a17",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {user?.image_url ? (
        <Image source={{ uri: user.image_url }} style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ color: "#f9a8d4", fontWeight: "800", fontSize: 20 }}>
          {user?.first_name?.[0] || "?"}
        </Text>
      )}
    </View>
  )
}
