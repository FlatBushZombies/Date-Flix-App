
import { PillChip } from '@/components/PillChip';
import { Avoid, Era } from '@/types/planner';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

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

function EraItem({ eraData, isSelected, onPress }: { eraData: { value: Era; label: string; desc: string }; isSelected: boolean; onPress: () => void }) {
  const [opacity] = useState(new Animated.Value(isSelected ? 1 : 0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isSelected ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: '47.5%',
        borderRadius: 18,
        padding: 16,
        borderWidth: isSelected ? 2 : 1,
        backgroundColor: isSelected ? 'rgba(255,59,92,0.06)' : '#ffffff',
        borderColor: isSelected ? '#FF3B5C' : '#18161c',
        position: 'relative',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity,
          backgroundColor: '#10B981',
          borderRadius: 10,
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={13} color="white" strokeWidth={3} />
      </Animated.View>
      <Text
        style={{
          fontWeight: '600',
          fontSize: 13,
          marginBottom: 4,
          color: isSelected ? '#C81E4B' : '#14121A',
        }}
      >
        {eraData.label}
      </Text>
      <Text style={{ fontSize: 11, color: '#6b7280' }}>{eraData.desc}</Text>
    </TouchableOpacity>
  );
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
        Step 4 of 5
      </Text>

      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          color: '#14121A',
          marginBottom: 8,
        }}
      >
        Fine-tune the picks
      </Text>

      <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 24 }}>
        What kind of film appeals to you?
      </Text>

      {/* Era grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {ERAS.map((e) => (
          <EraItem
            key={e.value}
            eraData={e}
            isSelected={era === e.value}
            onPress={() => onEraChange(e.value)}
          />
        ))}
      </View>

      {/* Avoid */}
      <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
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
        disabled={!era}
        activeOpacity={0.85}
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: era ? '#FF3B5C' : '#eceaea',
        }}
      >
        <Text style={{ fontWeight: '500', fontSize: 15, color: era ? '#ffffff' : '#9a969e' }}>
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}