
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
        Step 1 of 5
      </Text>

      <Text
        style={{
          fontSize: 24,
          color: '#F0EAE4',
          marginBottom: 8,
          fontFamily: 'PlayfairDisplay_600SemiBold',
        }}
      >
        What are you in the mood for?
      </Text>

      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 24 }}>
        Pick one or more genres
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
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
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: selected.length > 0 ? '#FF3B5C' : '#3a2030',
        }}
      >
        <Text
          style={{
            fontWeight: '500',
            fontSize: 15,
            color: selected.length > 0 ? '#ffffff' : '#6a5060',
          }}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}