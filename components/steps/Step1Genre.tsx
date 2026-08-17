import { GenreChip } from '@/components/GenreChip';
import { Text, TouchableOpacity, View } from 'react-native';

const GENRES = [
  { value: 'romance', label: 'Romance', emoji: '💕', desc: 'Love stories' },
  { value: 'thriller', label: 'Thriller', emoji: '🔪', desc: 'Edge of your seat' },
  { value: 'comedy', label: 'Comedy', emoji: '😂', desc: 'Laugh out loud' },
  { value: 'drama', label: 'Drama', emoji: '🎭', desc: 'Deep stories' },
  { value: 'action', label: 'Action', emoji: '💥', desc: 'High energy' },
  { value: 'horror', label: 'Horror', emoji: '👻', desc: 'Scream together' },
  { value: 'sci-fi', label: 'Sci-Fi', emoji: '🚀', desc: 'Mind-bending' },
  { value: 'documentary', label: 'Documentary', emoji: '🎞️', desc: 'Real stories' },
];

export function Step1Genre({ selected, onChange, onNext }: { selected: string[]; onChange: (genres: string[]) => void; onNext: () => void }) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((g) => g !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      
      {/* Card container */}
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 28,
          padding: 20,
          borderWidth: 1,
          borderColor: '#18161c',
        }}
      >
        <Text style={{
          fontSize: 11,
          color: '#C81E4B',
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
          Step 1 of 5
        </Text>

        <Text style={{
          fontSize: 26,
          fontWeight: '700',
          color: '#14121A',
          marginBottom: 6,
        }}>
          What are you in the mood for?
        </Text>

        <Text style={{
          fontSize: 13,
          color: '#4b5563',
          marginBottom: 24,
        }}>
          Pick one or more genres
        </Text>

        {/* Genre Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 28,
        }}>
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

        {/* CTA */}
        <TouchableOpacity
          onPress={onNext}
          disabled={selected.length === 0}
          activeOpacity={0.9}
          style={{
            width: '100%',
            paddingVertical: 16,
            borderRadius: 999,
            alignItems: 'center',
            backgroundColor: selected.length > 0 ? '#FF3B5C' : '#eceaea',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '500',
            color: selected.length > 0 ? '#fff' : '#9a969e',
          }}>
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}