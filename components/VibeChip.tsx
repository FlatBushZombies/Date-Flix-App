import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';

interface VibeChipProps {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}

export function VibeChip({ label, emoji, selected, onPress }: VibeChipProps) {
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
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`rounded-xl py-3 px-2 items-center border relative ${
        selected
          ? 'bg-primary/10 border-primary'
          : 'bg-surface border-surface-2'
      }`}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          opacity,
          backgroundColor: '#10B981',
          borderRadius: 8,
          width: 16,
          height: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={11} color="white" strokeWidth={3} />
      </Animated.View>
      <Text className="text-xl mb-1">{emoji}</Text>
      <Text
        className={`text-xs ${
          selected ? 'text-primary-light' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
