
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
        Step 2 of 5
      </Text>

      <Text
        style={{
          fontSize: 24,
          color: '#F0EAE4',
          marginBottom: 8,
          fontFamily: 'PlayfairDisplay_600SemiBold',
        }}
      >
        Where will you watch?
      </Text>

      <Text style={{ fontSize: 13, color: '#9A8A94', marginBottom: 24 }}>
        Select your streaming services
      </Text>

      {/* Platform grid */}
      <View style={{ gap: 10, marginBottom: 10 }}>
        {Array.from({ length: Math.ceil(STREAMING_PLATFORMS.length / 2) }).map((_, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: 'row', gap: 10 }}>
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
        style={{
          width: '100%',
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          borderWidth: 1,
          marginBottom: 28,
          backgroundColor: anyStreaming ? '#1a1020' : '#151520',
          borderColor: anyStreaming ? '#8a6070' : '#2a2535',
        }}
      >
        <Text style={{ fontSize: 13, color: anyStreaming ? '#c8b0b8' : '#8a8070' }}>
          I don't mind — show me anything
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        activeOpacity={0.85}
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: canContinue ? '#FF3B5C' : '#3a2030',
        }}
      >
        <Text
          style={{
            fontWeight: '500',
            fontSize: 15,
            color: canContinue ? '#ffffff' : '#6a5060',
          }}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}