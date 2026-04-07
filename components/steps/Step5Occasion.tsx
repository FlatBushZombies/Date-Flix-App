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
        Step 5 of 5
      </Text>

      <Text
        style={{
          fontSize: 24,
          color: '#F0EAE4',
          marginBottom: 8,
          fontFamily: 'PlayfairDisplay_600SemiBold',
        }}
      >
        What's the occasion?
      </Text>

      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 24 }}>
        Tell us about tonight
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
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
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: selected && !loading ? '#FF3B5C' : '#3a2030',
        }}
      >
        <Text
          style={{
            fontWeight: '500',
            fontSize: 15,
            color: selected && !loading ? '#ffffff' : '#6a5060',
          }}
        >
          ✨  Plan our movie night
        </Text>
      </TouchableOpacity>
    </View>
  );
}