import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

interface LoadingScreenProps {
  message: string;
  progress: number;
}

export function LoadingScreen({ message, progress }: LoadingScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    pulse.start();
    rotate.start();
    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="items-center py-16">
      {/* Loader container */}
      <View className="mb-8 relative items-center justify-center" style={{ width: 96, height: 96 }}>

        {/* Outer pulse ring */}
        <Animated.View
          style={{
            position: 'absolute',
            inset: 0,
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.07)',
            transform: [{ scale: pulseAnim }],
          }}
        />

        {/* Static mid ring */}
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 76,
            height: 76,
            borderRadius: 38,
            borderWidth: 1.5,
            borderColor: 'rgba(255,59,92,0.18)',
          }}
        />

        {/* Spinning arc ring */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 76,
            height: 76,
            borderRadius: 38,
            borderWidth: 1.5,
            borderTopColor: '#FF3B5C',
            borderRightColor: 'rgba(255,59,92,0.3)',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate }],
          }}
        />

        {/* Inner pill with progress */}
        <View
          style={{
            position: 'absolute',
            top: 22,
            left: 22,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(255,59,92,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,59,92,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FF3B5C',
              fontSize: 11,
              fontWeight: '500',
              letterSpacing: 0.5,
            }}
          >
            {progress}%
          </Text>
        </View>

        {/* Accent dot */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FF3B5C',
            transform: [{ scale: pulseAnim }],
          }}
        />
      </View>

      <Text
        className="text-xl text-text-primary mb-1.5 tracking-tight"
        style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}
      >
        Finding your perfect match
      </Text>
      <Text className="text-sm text-text-muted tracking-wide">{message}</Text>
    </View>
  );
}