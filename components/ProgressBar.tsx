import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          className="flex-1 h-0.5 rounded-full"
          style={{ backgroundColor: i < currentStep ? '#FF3B5C' : '#374151' }}
        />
      ))}
    </View>
  );
}
