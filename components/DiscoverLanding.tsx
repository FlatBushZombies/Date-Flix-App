import { LinearGradient } from 'expo-linear-gradient';
import { Clapperboard } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

interface DiscoverLandingProps {
  onStart: () => void;
}

// Fanned poster-stack "cover" art. These are abstract placeholders (gradient
// + film icon), not real movie art — there's no specific movie yet at this
// point in the flow, so nothing here pretends to be a real title.
const POSTERS: {
  rotate: string;
  translateX: number;
  translateY: number;
  colors: [string, string];
  z: number;
}[] = [
  { rotate: '-9deg', translateX: -62, translateY: 16, colors: ['#2a0d17', '#0f0407'], z: 1 },
  { rotate: '8deg', translateX: 62, translateY: 20, colors: ['#1f0a13', '#0d0306'], z: 1 },
  { rotate: '0deg', translateX: 0, translateY: 0, colors: ['#FF3B5C', '#7a1230'], z: 2 },
];

export function DiscoverLanding({ onStart }: DiscoverLandingProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 28,
          paddingTop: 32,
          paddingBottom: 28,
        }}
      >
        {/* Poster stack */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 200, height: 220, alignItems: 'center', justifyContent: 'center' }}>
            {POSTERS.map((p, i) => (
              <LinearGradient
                key={i}
                colors={p.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: 'absolute',
                  width: 130,
                  height: 190,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.08)',
                  transform: [
                    { translateX: p.translateX },
                    { translateY: p.translateY },
                    { rotate: p.rotate },
                  ],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.45,
                  shadowRadius: 22,
                  elevation: p.z * 5,
                  zIndex: p.z,
                }}
              >
                <Clapperboard size={30} color="rgba(255,255,255,0.5)" strokeWidth={1.4} />
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* Copy + CTA */}
        <View>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '700',
              color: '#14121A',
              textAlign: 'center',
              marginBottom: 10,
              letterSpacing: -0.5,
            }}
          >
            Find your great match
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#4b5563',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            A few quick questions, then we'll plan tonight's movie night together.
          </Text>
          <TouchableOpacity
            onPress={onStart}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Start matching"
            style={{
              width: '100%',
              paddingVertical: 18,
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor: '#FF3B5C',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
              Start matching
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
