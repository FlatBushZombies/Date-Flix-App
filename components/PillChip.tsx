import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface PillChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function PillChip({ label, selected, onPress }: PillChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-full px-4 py-2 border ${
        selected
          ? 'bg-primary/10 border-primary'
          : 'bg-surface border-surface-2'
      }`}
    >
      <Text
        className={`text-sm ${
          selected ? 'text-primary-light' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
