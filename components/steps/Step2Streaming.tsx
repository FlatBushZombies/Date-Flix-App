import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StreamingPlatform } from '@/types/planner';
import { STREAMING_PLATFORMS } from '@/lib/streaming';
import { StreamingCard } from '@/components/StreamingCard';

interface Step2StreamingProps {
  selected: StreamingPlatform[];
  anyStreaming: boolean;
  onChange: (platforms: StreamingPlatform[], anyStreaming: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Streaming({
  selected,
  anyStreaming,
  onChange,
  onNext,
  onBack,
}: Step2StreamingProps) {
  const toggle = (val: StreamingPlatform) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val), false);
    } else {
      onChange([...selected, val], false);
    }
  };

  const toggleAny = () => {
    onChange([], !anyStreaming);
  };

  const canContinue = selected.length > 0 || anyStreaming;

  return (
    <View>
      <TouchableOpacity onPress={onBack} className="flex-row items-center mb-6">
        <Text className="text-sm text-text-muted">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xs text-primary uppercase tracking-widest mb-2 font-medium">
        Step 2 of 5
      </Text>
      <Text className="text-2xl text-text-primary mb-2" style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}>
        Where will you watch?
      </Text>
      <Text className="text-sm text-text-muted mb-6">
        Select your streaming services
      </Text>

      {/* Platform grid */}
      <View style={{ gap: 10, marginBottom: 10 }}>
        {Array.from({ length: Math.ceil(STREAMING_PLATFORMS.length / 2) }).map((_, rowIdx) => (
          <View key={rowIdx} className="flex-row" style={{ gap: 10 }}>
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

      {/* Any streaming option */}
      <TouchableOpacity
        onPress={toggleAny}
        activeOpacity={0.7}
        className="w-full py-3 rounded-xl items-center border mb-7"
        style={{
          backgroundColor: anyStreaming ? '#1a1020' : '#151520',
          borderColor: anyStreaming ? '#8a6070' : '#2a2535',
        }}
      >
        <Text
          className="text-sm"
          style={{ color: anyStreaming ? '#c8b0b8' : '#8a8070' }}
        >
          I don't mind — show me anything
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        activeOpacity={0.85}
        className="w-full py-4 rounded-xl items-center"
        style={{ backgroundColor: canContinue ? '#FF3B5C' : '#3a2030' }}
      >
        <Text
          className="font-medium text-base"
          style={{ color: canContinue ? '#fff' : '#6a5060' }}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
