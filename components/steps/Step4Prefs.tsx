
import { View, Text, TouchableOpacity } from 'react-native';
import { Era, Avoid } from '@/types/planner';
import { PillChip } from '@/components/PillChip';

const ERAS: { value: Era; label: string; desc: string }[] = [
  { value: 'new releases', label: 'New releases', desc: '2020s films, fresh and current' },
  { value: 'classics', label: 'Classics', desc: 'Timeless, before 2000' },
  { value: 'hidden gems', label: 'Hidden gems', desc: 'Underrated, off the path' },
  { value: 'award winners', label: 'Award winners', desc: 'Oscar, Cannes, BAFTA' },
];

const AVOIDS: { value: Avoid; label: string }[] = [
  { value: 'no sad endings', label: 'No sad endings' },
  { value: 'no gore', label: 'No gore' },
  { value: 'no kids films', label: 'No kids films' },
  { value: 'no sequels', label: 'No sequels' },
];

interface Step4PrefsProps {
  era: Era | null;
  avoid: Avoid[];
  onEraChange: (e: Era) => void;
  onAvoidChange: (a: Avoid[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Prefs({
  era,
  avoid,
  onEraChange,
  onAvoidChange,
  onNext,
  onBack,
}: Step4PrefsProps) {
  const toggleAvoid = (val: Avoid) => {
    if (avoid.includes(val)) {
      onAvoidChange(avoid.filter((a) => a !== val));
    } else {
      onAvoidChange([...avoid, val]);
    }
  };

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
        Step 4 of 5
      </Text>

      <Text
        style={{
          fontSize: 24,
          color: '#F0EAE4',
          marginBottom: 8,
          fontFamily: 'PlayfairDisplay_600SemiBold',
        }}
      >
        Fine-tune the picks
      </Text>

      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 24 }}>
        What kind of film appeals to you?
      </Text>

      {/* Era grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {ERAS.map((e) => (
          <TouchableOpacity
            key={e.value}
            onPress={() => onEraChange(e.value)}
            activeOpacity={0.7}
            style={{
              width: '47.5%',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              backgroundColor: era === e.value ? '#2a0d14' : '#151520',
              borderColor: era === e.value ? '#FF3B5C' : '#2a2535',
            }}
          >
            <Text
              style={{
                fontWeight: '500',
                fontSize: 13,
                marginBottom: 4,
                color: era === e.value ? '#FF9FB3' : '#E0D8D0',
              }}
            >
              {e.label}
            </Text>
            <Text style={{ fontSize: 11, color: '#6a6060' }}>{e.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Avoid */}
      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 12 }}>
        Anything to avoid?
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
        {AVOIDS.map((a) => (
          <PillChip
            key={a.value}
            label={a.label}
            selected={avoid.includes(a.value)}
            onPress={() => toggleAvoid(a.value)}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.85}
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: '#FF3B5C',
        }}
      >
        <Text style={{ fontWeight: '500', fontSize: 15, color: '#ffffff' }}>
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}