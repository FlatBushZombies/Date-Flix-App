import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const anims = Array.from({ length: 5 }, () => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View className="items-center py-16">
      {/* Film strip animation */}
      <View className="flex-row mb-8" style={{ gap: 6 }}>
        {anims.map((anim, i) => (
          <Animated.View
            key={i}
            className="rounded"
            style={{
              width: 36,
              height: 48,
              borderWidth: 1,
              backgroundColor: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#151520', '#2a0d14'],
              }),
              borderColor: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#2a2535', '#FF3B5C'],
              }),
            }}
          />
        ))}
      </View>

      <Text
        className="text-xl text-text-primary mb-2"
        style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}
      >
        Finding your perfect match
      </Text>
      <Text className="text-sm text-text-muted">{message}</Text>
    </View>
  );
}
