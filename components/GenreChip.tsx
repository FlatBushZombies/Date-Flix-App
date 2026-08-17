import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';

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
      className={`rounded-2xl p-4 items-center relative ${
        selected
          ? 'bg-primary/10 border-2 border-primary'
          : 'bg-surface border border-surface-2'
      }`}
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
        <Check size={13} color="white" strokeWidth={3} />
      </Animated.View>
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
