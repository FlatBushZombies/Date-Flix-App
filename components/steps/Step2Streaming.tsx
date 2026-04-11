import { StreamingCard } from '@/components/StreamingCard';
import { STREAMING_PLATFORMS } from '@/lib/streaming';
import { Text, TouchableOpacity, View } from 'react-native';

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

  const canContinue = selected.length > 0 || anyStreaming;

  return (
    <View style={{ padding: 20 }}>
      
      {/* Back */}
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#9CA3AF' }}>← Back</Text>
      </TouchableOpacity>

      {/* Glass Container */}
      <View style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}>
        
        <Text style={{
          fontSize: 11,
          color: '#FF3B5C',
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
          Step 2 of 5
        </Text>

        <Text style={{
          fontSize: 26,
          color: '#FFFFFF',
          marginBottom: 6,
        }}>
          Where will you watch?
        </Text>

        <Text style={{
          fontSize: 13,
          color: '#A1A1AA',
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
            borderWidth: 1,
            backgroundColor: anyStreaming ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
            borderColor: anyStreaming ? '#3B82F6' : 'rgba(255,255,255,0.08)',
          }}
        >
          <Text style={{
            color: anyStreaming ? '#93C5FD' : '#9CA3AF',
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
            backgroundColor: canContinue ? '#3B82F6' : '#1f2937',
          }}
        >
          <Text style={{
            fontSize: 15,
            color: canContinue ? '#fff' : '#6b7280',
          }}>
            Continue →
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}