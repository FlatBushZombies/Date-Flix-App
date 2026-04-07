import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, Image } from 'react-native'

interface SplashScreenProps {
  onAnimationComplete?: () => void
  duration?: number
}

export function SplashScreen({ onAnimationComplete, duration = 2000 }: SplashScreenProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  const { width, height } = Dimensions.get('window')

  useEffect(() => {
    // Shake animation sequence
    const shakeSequence = Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ])

    // Repeat shake animation
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(500), // Wait before shaking
        shakeSequence,
        Animated.delay(1500), // Wait before next shake
      ])
    )

    // Start shake animation
    shakeLoop.start()

    // Fade out after duration
    const fadeOutTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete?.()
      })
    }, duration)

    return () => {
      shakeLoop.stop()
      clearTimeout(fadeOutTimer)
    }
  }, [shakeAnim, fadeAnim, duration, onAnimationComplete])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeAnim,
        zIndex: 9999,
      }}
    >
      <Animated.View
        style={{
          transform: [
            {
              translateX: shakeAnim.interpolate({
                inputRange: [-10, 10],
                outputRange: [-10, 10],
              }),
            },
          ],
        }}
      >
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{
            width: Math.min(width * 0.4, 150),
            height: Math.min(width * 0.4, 150),
            resizeMode: 'contain',
          }}
        />
      </Animated.View>
    </Animated.View>
  )
}