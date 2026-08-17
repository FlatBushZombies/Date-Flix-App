import { StreamingCard } from '@/components/StreamingCard';
import { STREAMING_PLATFORMS } from '@/lib/streaming';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

export function Step2Streaming({
  selected,
  anyStreaming,
  onChange,
  onNext,
  onBack,
}: {
  selected: string[];
  anyStreaming: boolean;
  onChange: (selected: string[], anyStreaming: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val), false);
    } else {
      onChange([...selected, val], false);
    }
  };

  const toggleAny = () => {
    onChange([], !anyStreaming);
  };

  const [anyOpacity] = useState(new Animated.Value(anyStreaming ? 1 : 0));

  useEffect(() => {
    Animated.timing(anyOpacity, {
      toValue: anyStreaming ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [anyStreaming]);

  const canContinue = anyStreaming || selected.length > 0;

  return (
    <View style={{ padding: 20 }}>
      
      {/* Back */}
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#4b5563' }}>← Back</Text>
      </TouchableOpacity>

      {/* Card container */}
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: '#18161c',
      }}>

        <Text style={{
          fontSize: 11,
          color: '#C81E4B',
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
          Step 2 of 5
        </Text>

        <Text style={{
          fontSize: 26,
          fontWeight: '700',
          color: '#14121A',
          marginBottom: 6,
        }}>
          Where will you watch?
        </Text>

        <Text style={{
          fontSize: 13,
          color: '#4b5563',
          marginBottom: 24,
        }}>
          Select your streaming services
        </Text>

        {/* Grid */}
        <View style={{ gap: 12, marginBottom: 12 }}>
          {Array.from({ length: Math.ceil(STREAMING_PLATFORMS.length / 2) }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row', gap: 12 }}>
              {STREAMING_PLATFORMS.slice(rowIdx * 2, rowIdx * 2 + 2).map((p) => (
                <View key={p.name} style={{ flex: 1 }}>
                  <StreamingCard
                    config={p}
                    selected={selected.includes(p.name)}
                    onPress={() => toggle(p.name)}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Any Option */}
        <TouchableOpacity
          onPress={toggleAny}
          style={{
            paddingVertical: 14,
            borderRadius: 20,
            alignItems: 'center',
            marginBottom: 28,
            borderWidth: anyStreaming ? 2 : 1,
            backgroundColor: anyStreaming ? 'rgba(255,59,92,0.08)' : '#ffffff',
            borderColor: anyStreaming ? '#FF3B5C' : '#18161c',
            position: 'relative',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: anyOpacity,
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
          <Text style={{
            color: anyStreaming ? '#C81E4B' : '#4b5563',
            fontSize: 13,
          }}>
            I don&apos;t mind — show me anything
          </Text>
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          onPress={onNext}
          disabled={!canContinue}
          activeOpacity={0.9}
          style={{
            width: '100%',
            paddingVertical: 16,
            borderRadius: 999,
            alignItems: 'center',
            backgroundColor: canContinue ? '#FF3B5C' : '#eceaea',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '500',
            color: canContinue ? '#fff' : '#9a969e',
          }}>
            Continue →
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}