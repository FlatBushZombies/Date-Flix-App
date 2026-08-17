import { PillChip } from '@/components/PillChip';
import { Duration, Vibe } from '@/types/planner';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

// Each mood is a premium 3D-illustrated icon (isometric mini-scene) on a
// white, black-bordered card. Selection state (ring + checkmark) stays the
// app's own pink accent.
const VIBES: {
  value: Vibe;
  label: string;
  icon: number;
}[] = [
  { value: 'cozy', label: 'Cozy', icon: require('@/assets/icons/cozy.png') },
  { value: 'excited', label: 'Excited', icon: require('@/assets/icons/excited.png') },
  { value: 'emotional', label: 'Emotional', icon: require('@/assets/icons/emotional.png') },
  { value: 'chill', label: 'Chill', icon: require('@/assets/icons/chill.png') },
  { value: 'laugh', label: 'Laughing', icon: require('@/assets/icons/laughing.png') },
  { value: 'surprised', label: 'Surprised', icon: require('@/assets/icons/suprised.png') },
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
        <Text style={{ fontSize: 13, color: '#4b5563' }}>← Back</Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 11,
          color: '#C81E4B',
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
          fontWeight: '700',
          color: '#14121A',
          marginBottom: 8,
        }}
      >
        What mood are you looking for?
      </Text>

      <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 24 }}>
        How do you want to feel tonight?
      </Text>

      {/* Vibe tile grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        {VIBES.map((v) => {
          const selected = vibe === v.value;
          return (
            <View key={v.value} style={{ width: '47.5%' }}>
              <TouchableOpacity
                onPress={() => onVibeChange(v.value)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={v.label}
                accessibilityState={{ selected }}
                style={{
                  aspectRatio: 1,
                  borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: selected ? 'rgba(255,59,92,0.06)' : '#ffffff',
                  borderWidth: selected ? 2.5 : 1.5,
                  borderColor: selected ? '#FF3B5C' : '#18161c',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Icon */}
                <Image
                  source={v.icon}
                  style={{ width: 68, height: 68, marginBottom: 10 }}
                  resizeMode="contain"
                />

                {/* Label */}
                <Text style={{ color: '#14121A', fontWeight: '700', fontSize: 15 }}>
                  {v.label}
                </Text>

                {/* Checkmark badge */}
                {selected && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#FF3B5C',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: '#ffffff',
                    }}
                  >
                    <Check size={13} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Duration */}
      <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
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
          backgroundColor: canContinue ? '#FF3B5C' : '#eceaea',
        }}
      >
        <Text
          style={{
            fontWeight: '500',
            fontSize: 15,
            color: canContinue ? '#ffffff' : '#9a969e',
          }}
        >
          {vibe ? 'Continue →' : 'Pick a mood to continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
