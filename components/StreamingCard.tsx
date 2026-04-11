import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { StreamingConfig } from '../lib/streaming';

interface StreamingCardProps {
  config: StreamingConfig;
  selected: boolean;
  onPress: () => void;
}

export function StreamingCard({ config, selected, onPress }: StreamingCardProps) {
  const [opacity] = useState(new Animated.Value(selected ? 1 : 0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="rounded-2xl p-4 flex-row items-center border relative"
      style={{
        backgroundColor: selected ? '#1a1528' : '#151520',
        borderColor: selected ? config.color : '#2a2535',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity,
          backgroundColor: '#10B981',
          borderRadius: 10,
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
      </Animated.View>
      {/* Icon */}
      <View
        className="w-9 h-9 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: config.bgColor }}
      >
        <Text className="text-lg">{config.icon}</Text>
      </View>

      {/* Labels */}
      <View className="flex-1">
        <Text className="text-sm font-medium text-text-primary">{config.name}</Text>
        <Text className="text-xs text-text-muted mt-0.5">{config.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}
