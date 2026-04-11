import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';

interface PillChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function PillChip({ label, selected, onPress }: PillChipProps) {
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
      className={`rounded-full px-4 py-2 border relative ${
        selected
          ? 'bg-primary/10 border-primary'
          : 'bg-surface border-surface-2'
      }`}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          opacity,
          backgroundColor: '#10B981',
          borderRadius: 6,
          width: 12,
          height: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 8 }}>✓</Text>
      </Animated.View>
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
