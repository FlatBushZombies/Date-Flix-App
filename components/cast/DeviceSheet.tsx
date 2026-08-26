import { useToast } from "@/components/Toast/ToastProvider"
import { useCast } from "@/lib/cast/CastProvider"
import { color, radius, shadow } from "@/constants/theme"
import { Cast, Tv, Wifi, X } from "lucide-react-native"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"

interface DeviceSheetProps {
  visible: boolean
  onClose: () => void
  // Called after a successful connection — e.g. to immediately cast the
  // movie the user was looking at when they tapped "Connect to TV".
  onConnected?: () => void
}

export function DeviceSheet({ visible, onClose, onConnected }: DeviceSheetProps) {
  const { devices, connect, startDiscovery } = useCast()
  const toast = useToast()
  const [connectingId, setConnectingId] = useState<string | null>(null)

  useEffect(() => {
    if (visible) startDiscovery()
  }, [visible, startDiscovery])

  const handleSelect = async (deviceId: string, name: string) => {
    if (connectingId) return
    setConnectingId(deviceId)
    const result = await connect(deviceId)
    setConnectingId(null)
    if (result.ok) {
      toast.success("Connected", `Now connected to ${name}.`)
      onConnected?.()
      onClose()
    } else {
      toast.error("Couldn't connect", result.message ?? "Please try again.")
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: color.bg,
            borderTopLeftRadius: radius["2xl"],
            borderTopRightRadius: radius["2xl"],
            paddingTop: 12,
            paddingBottom: 40,
            minHeight: 320,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: color.border,
              alignSelf: "center",
              marginBottom: 18,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: color.textPrimary }}>Connect to TV</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: color.surfaceHigh,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={color.textSecondary} />
            </TouchableOpacity>
          </View>

          {devices.length === 0 ? (
            <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 24 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: color.surfaceHigh,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Wifi size={24} color={color.textTertiary} strokeWidth={1.6} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: color.textPrimary, marginBottom: 6 }}>
                No TVs found
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: color.textSecondary,
                  textAlign: "center",
                  lineHeight: 19,
                  marginBottom: 20,
                }}
              >
                Make sure your phone and TV are connected to the same Wi-Fi network.
              </Text>
              <TouchableOpacity
                onPress={startDiscovery}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 11,
                  borderRadius: radius.full,
                  backgroundColor: color.surfaceHigh,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: color.textPrimary }}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: color.textTertiary,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  paddingHorizontal: 8,
                  marginBottom: 8,
                }}
              >
                Available devices
              </Text>
              {devices.map((d) => {
                const connecting = connectingId === d.id
                return (
                  <Animated.View key={d.id} entering={FadeIn.duration(200)}>
                    <TouchableOpacity
                      onPress={() => handleSelect(d.id, d.name)}
                      disabled={!!connectingId}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Connect to ${d.name}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        borderRadius: radius.lg,
                        opacity: connectingId && !connecting ? 0.5 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: color.surfaceHigh,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <Tv size={20} color={color.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: color.textPrimary }}>{d.name}</Text>
                        <Text style={{ fontSize: 12, color: color.textSecondary, marginTop: 2 }}>
                          {d.modelName || "Cast device"}
                        </Text>
                      </View>
                      {connecting ? (
                        <ActivityIndicator size="small" color={color.info} />
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.success }} />
                          <Text style={{ fontSize: 12, fontWeight: "700", color: color.success }}>Available</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                )
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

// Small reusable trigger button — a Cast-shaped affordance any screen can
// drop in to open this sheet (or jump straight to the Remote if already
// connected). Kept here since it's tightly coupled to the sheet it opens.
export function CastTriggerButton({
  onPress,
  connected,
  size = 18,
}: {
  onPress: () => void
  connected: boolean
  size?: number
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={connected ? "Casting to TV" : "Connect to TV"}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: connected ? color.info : "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: connected ? "transparent" : "rgba(255,255,255,0.15)",
        ...(connected ? shadow.sm : null),
      }}
    >
      <Cast size={size + 2} color="#fff" />
    </TouchableOpacity>
  )
}
