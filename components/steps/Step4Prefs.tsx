
import { PillChip } from '@/components/PillChip';
import { Avoid, Era } from '@/types/planner';
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
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        backgroundColor: isSelected ? '#2a0d14' : '#151520',
        borderColor: isSelected ? '#FF3B5C' : '#2a2535',
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
        <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
      </Animated.View>
      <Text
        style={{
          fontWeight: '500',
          fontSize: 13,
          marginBottom: 4,
          color: isSelected ? '#FF9FB3' : '#E0D8D0',
        }}
      >
        {eraData.label}
      </Text>
      <Text style={{ fontSize: 11, color: '#6a6060' }}>{eraData.desc}</Text>
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
          <EraItem
            key={e.value}
            eraData={e}
            isSelected={era === e.value}
            onPress={() => onEraChange(e.value)}
          />
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