import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MovieNightPlan } from '../types/planner';

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
          className="text-2xl text-text-primary text-center mb-3"
          style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}
        >
          Your movie night is ready
        </Text>
        {!!plan.summary && (
          <Text className="text-sm text-text-secondary text-center px-4 leading-relaxed">
            {plan.summary}
          </Text>
        )}
      </View>

      {/* Movie list from AI plan */}
      <View className="mt-2 mb-4" style={{ gap: 12 }}>
        {plan.movies.map((movie, i) => (
          <View
            key={`${movie.title}-${i}`}
            className="rounded-2xl p-4 border border-surface-2"
            style={{ backgroundColor: '#151520' }}
          >
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-base text-white font-semibold flex-shrink">
                {movie.title}
              </Text>
              <Text className="text-xs text-text-muted">
                {movie.year} • {movie.genre}
              </Text>
            </View>
            <Text className="text-xs text-text-muted mb-1.5">
              {movie.duration} • {movie.rating} • {movie.streaming}
            </Text>
            <Text className="text-xs text-text-secondary leading-relaxed mb-1.5">
              {movie.reason}
            </Text>
            {movie.topPick && (
              <View className="self-start mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#2a0d14' }}>
                <Text className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#FF9FB3' }}>
                  Top pick
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

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
