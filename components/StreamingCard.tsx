import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { StreamingConfig } from '../lib/streaming';

interface StreamingCardProps {
  config: StreamingConfig;
  selected: boolean;
  onPress: () => void;
}

export function StreamingCard({ config, selected, onPress }: StreamingCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="rounded-2xl p-4 flex-row items-center border"
      style={{
        backgroundColor: selected ? '#1a1528' : '#151520',
        borderColor: selected ? config.color : '#2a2535',
      }}
    >
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

      {/* Check circle */}
      <View
        className="w-5 h-5 rounded-full items-center justify-center"
        style={{
          backgroundColor: selected ? '#FF3B5C' : 'transparent',
          borderWidth: 1,
          borderColor: selected ? '#FF3B5C' : '#3a3050',
        }}
      >
        {selected && (
          <Text className="text-white text-xs font-bold">✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
