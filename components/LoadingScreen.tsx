import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

interface LoadingScreenProps {
  message: string;
  progress: number;
}

export function LoadingScreen({ message, progress }: LoadingScreenProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow, soft breathing scale — reads as "expensive" rather than a
    // mechanical bounce. Asymmetric in/out easing avoids a robotic feel.
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    // Slower, constant-speed sweep for the accent arc.
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    // Gentle opacity breathing on the outer halo, offset from the scale pulse.
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    rotate.start();
    breathe.start();
    return () => {
      pulse.stop();
      rotate.stop();
      breathe.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const haloOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });

  return (
    <View className="items-center py-16">
      {/* Loader container */}
      <View className="mb-8 relative items-center justify-center" style={{ width: 104, height: 104 }}>

        {/* Outer breathing halo */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 104,
            height: 104,
            borderRadius: 52,
            borderWidth: 1,
            borderColor: 'rgba(255,59,92,0.16)',
            opacity: haloOpacity,
            transform: [{ scale }],
          }}
        />

        {/* Static mid ring */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            width: 76,
            height: 76,
            borderRadius: 38,
            borderWidth: 1.5,
            borderColor: 'rgba(255,59,92,0.16)',
          }}
        />

        {/* Spinning arc ring */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            width: 76,
            height: 76,
            borderRadius: 38,
            borderWidth: 1.5,
            borderTopColor: '#FF3B5C',
            borderRightColor: 'rgba(255,59,92,0.35)',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate }],
          }}
        />

        {/* Inner pill with progress */}
        <View
          style={{
            position: 'absolute',
            top: 26,
            left: 26,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(255,59,92,0.07)',
            borderWidth: 1,
            borderColor: 'rgba(255,59,92,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FF3B5C',
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.3,
            }}
          >
            {progress}%
          </Text>
        </View>
      </View>

      <Text
        className="text-xl font-bold text-text-primary mb-1.5 tracking-tight"
      >
        Finding your perfect match
      </Text>
      <Text className="text-sm text-text-muted tracking-wide">{message}</Text>
    </View>
  );
}
