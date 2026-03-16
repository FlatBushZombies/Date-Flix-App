import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Vibe, Duration } from '@/types/planner';
import { VibeChip } from '@/components/VibeChip';
import { PillChip } from '@/components/PillChip';

const VIBES: { value: Vibe; label: string; emoji: string }[] = [
  { value: 'cozy', label: 'Cozy', emoji: '🕯️' },
  { value: 'excited', label: 'Excited', emoji: '⚡' },
  { value: 'emotional', label: 'Emotional', emoji: '🥹' },
  { value: 'chill', label: 'Chill', emoji: '😌' },
  { value: 'laugh', label: 'Laughing', emoji: '🤣' },
  { value: 'surprised', label: 'Surprised', emoji: '🤯' },
];

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 'short', label: 'Under 90 min' },
  { value: 'medium', label: '90–120 min' },
  { value: 'long', label: '2+ hours' },
  { value: 'any', label: "Doesn't matter" },
];

interface Step3VibeProps {
  vibe: Vibe | null;
  duration: Duration | null;
  onVibeChange: (v: Vibe) => void;
  onDurationChange: (d: Duration) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Vibe({
  vibe,
  duration,
  onVibeChange,
  onDurationChange,
  onNext,
  onBack,
}: Step3VibeProps) {
  const canContinue = !!vibe && !!duration;

  return (
    <View>
      <TouchableOpacity onPress={onBack} className="flex-row items-center mb-6">
        <Text className="text-sm text-text-muted">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xs text-primary uppercase tracking-widest mb-2 font-medium">
        Step 3 of 5
      </Text>
      <Text className="text-2xl text-text-primary mb-2" style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}>
        Set the vibe
      </Text>
      <Text className="text-sm text-text-muted mb-6">
        How do you want to feel tonight?
      </Text>

      {/* Vibe grid */}
      <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
        {VIBES.map((v) => (
          <View key={v.value} style={{ width: '31%' }}>
            <VibeChip
              label={v.label}
              emoji={v.emoji}
              selected={vibe === v.value}
              onPress={() => onVibeChange(v.value)}
            />
          </View>
        ))}
      </View>

      {/* Duration */}
      <Text className="text-sm text-text-muted mb-3">How long do you have?</Text>
      <View className="flex-row flex-wrap mb-7" style={{ gap: 8 }}>
        {DURATIONS.map((d) => (
          <PillChip
            key={d.value}
            label={d.label}
            selected={duration === d.value}
            onPress={() => onDurationChange(d.value)}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        activeOpacity={0.85}
        className="w-full py-4 rounded-xl items-center"
        style={{ backgroundColor: canContinue ? '#FF3B5C' : '#3a2030' }}
      >
        <Text
          className="font-medium text-base"
          style={{ color: canContinue ? '#fff' : '#6a5060' }}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
