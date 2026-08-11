import { color, radius } from "@/constants/theme"
import React from "react"
import { Modal, TouchableOpacity, View } from "react-native"

// Shared bottom-sheet shell: dim overlay, tap-outside-to-dismiss, rounded card,
// drag handle. Callers own everything below the handle (header, content).
export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightPercent = 0.8,
}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  maxHeightPercent?: number
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            backgroundColor: color.bg,
            borderTopLeftRadius: radius["3xl"],
            borderTopRightRadius: radius["3xl"],
            maxHeight: `${maxHeightPercent * 100}%` as `${number}%`,
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: color.border }} />
          </View>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}
