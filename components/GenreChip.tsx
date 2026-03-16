import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface GenreChipProps {
  label: string;
  description: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}

export function GenreChip({
  label,
  description,
  emoji,
  selected,
  onPress,
}: GenreChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-xl p-3.5 items-center border ${
        selected
          ? 'bg-primary/10 border-primary'
          : 'bg-surface border-surface-2'
      }`}
    >
      <Text className="text-2xl mb-1.5">{emoji}</Text>
      <Text
        className={`font-medium text-sm ${
          selected ? 'text-primary-light' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
      <Text className="text-xs text-text-muted mt-0.5">{description}</Text>
    </TouchableOpacity>
  );
}
