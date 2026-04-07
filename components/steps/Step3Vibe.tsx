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
      {/* Back button */}
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
      >
        <Text style={{ fontSize: 13, color: '#9A8A94' }}>← Back</Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 11,
          color: '#FF3B5C',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 8,
          fontWeight: '500',
        }}
      >
        Step 3 of 5
      </Text>

      <Text
        style={{
          fontSize: 24,
          color: '#F0EAE4',
          marginBottom: 8,
          fontFamily: 'PlayfairDisplay_600SemiBold',
        }}
      >
        Set the vibe
      </Text>

      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 24 }}>
        How do you want to feel tonight?
      </Text>

      {/* Vibe grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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
      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 12 }}>
        How long do you have?
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
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
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: canContinue ? '#FF3B5C' : '#3a2030',
        }}
      >
        <Text
          style={{
            fontWeight: '500',
            fontSize: 15,
            color: canContinue ? '#ffffff' : '#6a5060',
          }}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}