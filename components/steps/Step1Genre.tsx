import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Genre } from '@/types/planner';
import { GenreChip } from '@/components/GenreChip';

const GENRES: { value: Genre; label: string; emoji: string; desc: string }[] = [
  { value: 'romance', label: 'Romance', emoji: '💕', desc: 'Love stories' },
  { value: 'thriller', label: 'Thriller', emoji: '🔪', desc: 'Edge of your seat' },
  { value: 'comedy', label: 'Comedy', emoji: '😂', desc: 'Laugh out loud' },
  { value: 'drama', label: 'Drama', emoji: '🎭', desc: 'Deep stories' },
  { value: 'action', label: 'Action', emoji: '💥', desc: 'High energy' },
  { value: 'horror', label: 'Horror', emoji: '👻', desc: 'Scream together' },
  { value: 'sci-fi', label: 'Sci-Fi', emoji: '🚀', desc: 'Mind-bending' },
  { value: 'documentary', label: 'Documentary', emoji: '🎞️', desc: 'Real stories' },
];

interface Step1GenreProps {
  selected: Genre[];
  onChange: (genres: Genre[]) => void;
  onNext: () => void;
}

export function Step1Genre({ selected, onChange, onNext }: Step1GenreProps) {
  const toggle = (val: Genre) => {
    if (selected.includes(val)) {
      onChange(selected.filter((g) => g !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <View>
      <Text className="text-xs text-primary uppercase tracking-widest mb-2 font-medium">
        Step 1 of 5
      </Text>
      <Text className="text-2xl text-text-primary mb-2" style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}>
        What are you in the mood for?
      </Text>
      <Text className="text-sm text-text-muted mb-6">Pick one or more genres</Text>

      <View className="flex-row flex-wrap" style={{ gap: 10, marginBottom: 28 }}>
        {GENRES.map((g) => (
          <View key={g.value} style={{ width: '47.5%' }}>
            <GenreChip
              label={g.label}
              description={g.desc}
              emoji={g.emoji}
              selected={selected.includes(g.value)}
              onPress={() => toggle(g.value)}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={selected.length === 0}
        activeOpacity={0.85}
        className="w-full py-4 rounded-xl items-center"
        style={{
          backgroundColor: selected.length > 0 ? '#FF3B5C' : '#3a2030',
        }}
      >
        <Text
          className="font-medium text-base"
          style={{ color: selected.length > 0 ? '#fff' : '#6a5060' }}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
