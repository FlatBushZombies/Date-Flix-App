import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

type MessageBannerType = 'success' | 'error' | 'info'

const colorMap: Record<MessageBannerType, { background: string; accent: string }> = {
  success: { background: '#ecfdf5', accent: '#16a34a' },
  error: { background: '#fef2f2', accent: '#dc2626' },
  info: { background: '#eff6ff', accent: '#2563eb' },
}

interface MessageBannerProps {
  visible: boolean
  type?: MessageBannerType
  title?: string
  message: string
  onDismiss?: () => void
  autoHide?: boolean
  autoHideDuration?: number
}

export function MessageBanner({
  visible,
  type = 'info',
  title,
  message,
  onDismiss,
  autoHide = true,
  autoHideDuration = 3200,
}: MessageBannerProps) {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      if (autoHide && onDismiss) {
        const timer = setTimeout(onDismiss, autoHideDuration)
        return () => clearTimeout(timer)
      }
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, translateY, opacity, autoHide, autoHideDuration, onDismiss])

  const colors = colorMap[type]

  if (!visible) {
    return null
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 40,
        left: 16,
        right: 16,
        transform: [{ translateY }],
        opacity,
        zIndex: 999,
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          backgroundColor: colors.background,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: `${colors.accent}33`,
          paddingVertical: 14,
          paddingHorizontal: 18,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.accent,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>
              {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice')}
            </Text>
            <Text style={{ color: '#374151', marginTop: 4, fontSize: 13, lineHeight: 18 }}>
              {message}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
