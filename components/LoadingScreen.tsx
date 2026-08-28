import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface LoadingScreenProps {
  message: string;
  progress: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 132;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function LoadingScreen({ message, progress }: LoadingScreenProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smoothly eases toward whatever progress value comes in — the ring is a
    // real determinate indicator of `progress`, not a decorative spinner.
    Animated.timing(progressAnim, {
      toValue: Math.max(0, Math.min(100, progress)),
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset isn't a native-driver-supported prop
    }).start();
  }, [progress]);

  useEffect(() => {
    // Slow ambient breathing halo behind the ring — reads as "alive" without
    // implying any information beyond what `progress` already says.
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View className="items-center py-16">
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        {/* Ambient glow */}
        <Animated.View
          style={{
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: 'rgba(255,59,92,0.14)',
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          }}
        />

        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,59,92,0.14)"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Determinate progress arc — starts at 12 o'clock, sweeps clockwise */}
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#FF3B5C"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#FF3B5C', letterSpacing: -1 }}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      <Text className="text-xl font-bold text-text-primary mt-7 mb-1.5 tracking-tight">
        Finding your perfect match
      </Text>
      <Text className="text-sm text-text-muted tracking-wide">{message}</Text>
    </View>
  );
}
