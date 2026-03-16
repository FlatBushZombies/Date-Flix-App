import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface VibeChipProps {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}

export function VibeChip({ label, emoji, selected, onPress }: VibeChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-xl py-3 px-2 items-center border ${
        selected
          ? 'bg-primary/10 border-primary'
          : 'bg-surface border-surface-2'
      }`}
    >
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
