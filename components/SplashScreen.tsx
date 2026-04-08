import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, Image, Text, View } from 'react-native'

interface SplashScreenProps {
  onAnimationComplete?: () => void
  duration?: number
}

export function SplashScreen({ onAnimationComplete, duration = 2500 }: SplashScreenProps) {
  const floatAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.85)).current
  const textFadeAnim = useRef(new Animated.Value(0)).current
  const exitFadeAnim = useRef(new Animated.Value(1)).current

  const { width } = Dimensions.get('window')
  const logoSize = Math.min(width * 0.28, 110)

  useEffect(() => {
    // Entry: fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Text fades in slightly after logo
    const textTimer = setTimeout(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }, 300)

    // Gentle float loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    )
    floatLoop.start()

    // Exit
    const exitTimer = setTimeout(() => {
      floatLoop.stop()
      Animated.timing(exitFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onAnimationComplete?.())
    }, duration)

    return () => {
      floatLoop.stop()
      clearTimeout(textTimer)
      clearTimeout(exitTimer)
    }
  }, [floatAnim, fadeAnim, scaleAnim, textFadeAnim, exitFadeAnim, duration, onAnimationComplete])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exitFadeAnim,
        zIndex: 9999,
      }}
    >
      {/* Subtle radial glow behind logo */}
      <View
        style={{
          position: 'absolute',
          width: logoSize * 3,
          height: logoSize * 3,
          borderRadius: logoSize * 1.5,
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      />

      {/* Logo + Name group */}
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: floatAnim },
          ],
        }}
      >
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{
            width: logoSize,
            height: logoSize,
            resizeMode: 'contain',
            marginBottom: 20,
          }}
        />

        <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center' }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 36,
              fontWeight: '700',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            Duo
          </Text>
          {/* Thin divider accent */}
          <View
            style={{
              marginTop: 10,
              width: 28,
              height: 2,
              borderRadius: 1,
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  )
}