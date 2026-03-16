import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MovieNightPlan } from '../types/planner';
import { MovieCard } from '../components/MovieCard';


interface ResultsScreenProps {
  plan: MovieNightPlan;
  prompt: string;
  onReset: () => void;
}

export function ResultsScreen({ plan, prompt, onReset }: ResultsScreenProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="items-center mb-8">
        <View
          className="rounded-full px-4 py-1.5 border mb-3"
          style={{
            backgroundColor: '#2a0d14',
            borderColor: '#FF3B5C',
          }}
        >
          <Text
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#FF9FB3' }}
          >
            Tonight's picks
          </Text>
        </View>
        <Text
          className="text-2xl text-text-primary text-center"
          style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}
        >
          Your movie night is ready
        </Text>
      </View>

      {/* Movie cards */}
      {plan.movies.map((movie, i) => (
        <MovieCard key={i} movie={movie} />
      ))}

      {/* Divider */}
      <View className="items-center my-5">
        <Text className="text-xs text-text-muted uppercase tracking-widest">
          — Set the scene —
        </Text>
      </View>

      {/* Snack */}
      <View
        className="flex-row items-center rounded-xl p-4 mb-3 border border-surface-2"
        style={{ backgroundColor: '#151520' }}
      >
        <Text className="text-2xl mr-3">🍿</Text>
        <View className="flex-1">
          <Text className="text-xs text-text-muted uppercase tracking-widest mb-1">
            Tonight's snack pairing
          </Text>
          <Text className="text-sm text-text-secondary leading-relaxed">
            {plan.snack}
          </Text>
        </View>
      </View>

      {/* Ambiance */}
      <View
        className="flex-row items-center rounded-xl p-4 mb-3 border border-surface-2"
        style={{ backgroundColor: '#151520' }}
      >
        <Text className="text-2xl mr-3">🕯️</Text>
        <View className="flex-1">
          <Text className="text-xs text-text-muted uppercase tracking-widest mb-1">
            Ambiance
          </Text>
          <Text className="text-sm text-text-secondary leading-relaxed">
            {plan.ambiance}
          </Text>
        </View>
      </View>

   

      {/* Reset */}
      <TouchableOpacity
        onPress={onReset}
        activeOpacity={0.7}
        className="w-full py-3 rounded-xl items-center border border-surface-2 mt-3 mb-8"
      >
        <Text className="text-sm text-text-muted">Plan a different night</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
