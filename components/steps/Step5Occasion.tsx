import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Occasion } from '@/types/planner';
import { GenreChip } from '@/components/GenreChip';

const OCCASIONS: { value: Occasion; label: string; emoji: string; desc: string }[] = [
  { value: 'date night', label: 'Date night', emoji: '🍷', desc: 'Romantic evening' },
  { value: 'lazy Sunday', label: 'Lazy Sunday', emoji: '🛋️', desc: 'Zero effort mode' },
  { value: 'anniversary', label: 'Anniversary', emoji: '🥂', desc: 'Something special' },
  { value: 'Friday night', label: 'Friday night', emoji: '🎉', desc: 'End of a long week' },
];

interface Step5OccasionProps {
  selected: Occasion | null;
  onChange: (o: Occasion) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function Step5Occasion({
  selected,
  onChange,
  onSubmit,
  onBack,
  loading,
}: Step5OccasionProps) {
  return (
    <View>
      <TouchableOpacity onPress={onBack} className="flex-row items-center mb-6">
        <Text className="text-sm text-text-muted">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xs text-primary uppercase tracking-widest mb-2 font-medium">
        Step 5 of 5
      </Text>
      <Text className="text-2xl text-text-primary mb-2" style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}>
        What's the occasion?
      </Text>
      <Text className="text-sm text-text-muted mb-6">Tell us about tonight</Text>

      <View className="flex-row flex-wrap mb-8" style={{ gap: 10 }}>
        {OCCASIONS.map((o) => (
          <View key={o.value} style={{ width: '47.5%' }}>
            <GenreChip
              label={o.label}
              description={o.desc}
              emoji={o.emoji}
              selected={selected === o.value}
              onPress={() => onChange(o.value)}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={!selected || loading}
        activeOpacity={0.85}
        className="w-full py-4 rounded-xl items-center"
        style={{
          backgroundColor: selected && !loading ? '#FF3B5C' : '#3a2030',
        }}
      >
        <Text
          className="font-medium text-base"
          style={{ color: selected && !loading ? '#fff' : '#6a5060' }}
        >
          ✨  Plan our movie night
        </Text>
      </TouchableOpacity>
    </View>
  );
}
