import React from 'react';
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
      <TouchableOpacity onPress={onBack} className="flex-row items-center mb-6">
        <Text className="text-sm text-text-muted">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xs text-primary uppercase tracking-widest mb-2 font-medium">
        Step 4 of 5
      </Text>
      <Text className="text-2xl text-text-primary mb-2" style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}>
        Fine-tune the picks
      </Text>
      <Text className="text-sm text-text-muted mb-6">
        What kind of film appeals to you?
      </Text>

      {/* Era grid */}
      <View className="flex-row flex-wrap mb-6" style={{ gap: 10 }}>
        {ERAS.map((e) => (
          <TouchableOpacity
            key={e.value}
            onPress={() => onEraChange(e.value)}
            activeOpacity={0.7}
            className="rounded-xl p-3.5 border"
            style={{
              width: '47.5%',
              backgroundColor: era === e.value ? '#2a0d14' : '#151520',
              borderColor: era === e.value ? '#FF3B5C' : '#2a2535',
            }}
          >
            <Text
              className="font-medium text-sm mb-1"
              style={{ color: era === e.value ? '#FF9FB3' : '#e0d8d0' }}
            >
              {e.label}
            </Text>
            <Text className="text-xs" style={{ color: '#6a6060' }}>
              {e.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Avoid */}
      <Text className="text-sm text-text-muted mb-3">Anything to avoid?</Text>
      <View className="flex-row flex-wrap mb-8" style={{ gap: 8 }}>
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
        className="w-full py-4 rounded-xl items-center"
        style={{ backgroundColor: '#FF3B5C' }}
      >
        <Text className="font-medium text-base text-white">Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}
