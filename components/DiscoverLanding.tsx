import React from 'react';
import { Image, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

interface DiscoverLandingProps {
  onStart: () => void;
}

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
        {/* Cinema mark */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('@/assets/icons/cinema.png')}
            style={{ width: 148, height: 148 }}
            resizeMode="contain"
          />
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
