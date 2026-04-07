import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Genre, Vibe, Duration, Era, Avoid, Occasion, StreamingPlatform, PlannerState } from '@/types/planner';
import { useMoviePlanner } from '@/hooks/useMoviePlanner';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { Step1Genre } from '@/components/steps/Step1Genre';
import { Step2Streaming } from '@/components/steps/Step2Streaming';
import { Step3Vibe } from '@/components/steps/Step3Vibe';
import { Step4Prefs } from '@/components/steps/Step4Prefs';
import { Step5Occasion } from '@/components/steps/Step5Occasion';

const TOTAL_STEPS = 5;

const initialState: PlannerState = {
  genres: [],
  streaming: [],
  anyStreaming: false,
  vibe: null,
  duration: null,
  era: null,
  avoid: [],
  occasion: null,
};

export default function MoviePlannerScreen() {
  const [step, setStep] = useState(1);
  const [plannerState, setPlannerState] = useState<PlannerState>(initialState);
  const { plan, prompt, loading, loadingMessage, error, generatePlan, reset } =
    useMoviePlanner();

  const update = (patch: Partial<PlannerState>) =>
    setPlannerState((s) => ({ ...s, ...patch }));

  const handleSubmit = async () => {
    await generatePlan(plannerState);
  };

  const handleReset = () => {
    setPlannerState(initialState);
    setStep(1);
    reset();
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#ffffff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 px-5 pt-8">
          <View className="items-center mb-8">
            <Text
              className="text-2xl"
              style={{ color: '#FF3B5C', fontFamily: 'PlayfairDisplay_600SemiBold' }}
            >
              Duo
            </Text>
            <Text className="text-xs text-text-muted mt-1 uppercase tracking-widest">
              Movie Night Planner
            </Text>
          </View>
          <LoadingScreen message={loadingMessage} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#ffffff' }}>
        <Text className="text-4xl mb-4">😬</Text>
        <Text
          className="text-xl text-text-primary text-center mb-2"
          style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}
        >
          Something went wrong
        </Text>
        <Text className="text-sm text-text-muted text-center mb-8">{error}</Text>
        <View
          className="w-full py-4 rounded-xl items-center"
          style={{ backgroundColor: '#FF3B5C' }}
        >
          <Text className="text-white font-medium" onPress={handleReset}>
            Try again
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Results
  if (plan) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#ffffff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView className="flex-1 px-5 pt-8" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-6">
            <Text
              className="text-2xl"
              style={{ color: '#FF3B5C', fontFamily: 'PlayfairDisplay_600SemiBold' }}
            >
              Duo
            </Text>
          </View>
          <ResultsScreen plan={plan} prompt={prompt} onReset={handleReset} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Planner steps
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        className="flex-1 px-5 pt-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mb-8">
          <Text
            className="text-2xl"
            style={{ color: '#FF3B5C', fontFamily: 'PlayfairDisplay_600SemiBold' }}
          >
            Duo
          </Text>
          <Text className="text-xs text-text-muted mt-1 uppercase tracking-widest">
            Movie Night Planner
          </Text>
        </View>

        {/* Progress */}
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* Steps */}
        {step === 1 && (
          <Step1Genre
            selected={plannerState.genres}
            onChange={(genres) => update({ genres })}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Streaming
            selected={plannerState.streaming}
            anyStreaming={plannerState.anyStreaming}
            onChange={(streaming, anyStreaming) => update({ streaming, anyStreaming })}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Vibe
            vibe={plannerState.vibe}
            duration={plannerState.duration}
            onVibeChange={(vibe) => update({ vibe })}
            onDurationChange={(duration) => update({ duration })}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Prefs
            era={plannerState.era}
            avoid={plannerState.avoid}
            onEraChange={(era) => update({ era })}
            onAvoidChange={(avoid) => update({ avoid })}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5Occasion
            selected={plannerState.occasion}
            onChange={(occasion) => update({ occasion })}
            onSubmit={handleSubmit}
            onBack={() => setStep(4)}
            loading={loading}
          />
        )}

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
