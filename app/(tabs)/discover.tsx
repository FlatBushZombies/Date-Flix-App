import { DiscoverLanding } from '@/components/DiscoverLanding';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultsScreen } from '@/components/ResultsScreen';
import { Step1Genre } from '@/components/steps/Step1Genre';
import { Step2Streaming } from '@/components/steps/Step2Streaming';
import { Step3Vibe } from '@/components/steps/Step3Vibe';
import { Step4Prefs } from '@/components/steps/Step4Prefs';
import { Step5Occasion } from '@/components/steps/Step5Occasion';
import { useMoviePlanner } from '@/hooks/useMoviePlanner';
import { useWatchlist } from '@/hooks/useWatchlist';
import { buildAIConsentPrompt } from '@/lib/aiConsent';
import { useConfirm } from '@/components/Confirm/ConfirmProvider';
import { Genre, PlannerState, StreamingPlatform } from '@/types/planner';
import { useUser } from '@clerk/clerk-expo';
import { AlertTriangle, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [showLanding, setShowLanding] = useState(true);
  const [step, setStep] = useState(1);
  const [plannerState, setPlannerState] = useState<PlannerState>(initialState);
  const { plan, prompt, loading, loadingMessage, progress, error, needsConsent, generatePlan, reset } =
    useMoviePlanner();
  const { user } = useUser();
  const { isSaved, toggleSave } = useWatchlist(user?.id);
  const confirm = useConfirm();

  const update = (patch: Partial<PlannerState>) =>
    setPlannerState((s) => ({ ...s, ...patch }));

  const handleSubmit = async () => {
    await generatePlan(plannerState);
  };

  const handleEnableAI = () => {
    confirm.show(buildAIConsentPrompt(() => generatePlan(plannerState)));
  };

  const handleReset = () => {
    setPlannerState(initialState);
    setStep(1);
    reset();
    setShowLanding(true);
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#ffffff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 px-5 pt-8">
          <View className="items-center mb-8">
            <Text
              className="text-2xl font-bold"
              style={{ color: '#FF3B5C' }}
            >
              Duo
            </Text>
            <Text className="text-xs text-text-muted mt-1 uppercase tracking-widest">
              Movie Night Planner
            </Text>
          </View>
          <LoadingScreen message={loadingMessage} progress={progress} />
        </View>
      </SafeAreaView>
    );
  }

  // Consent gate — the request never fired, so show the same inline ask
  // used elsewhere instead of a generic error.
  if (needsConsent) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#ffffff' }}>
        <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: 'rgba(6,182,212,0.12)' }}>
          <Sparkles size={28} color="#06b6d4" strokeWidth={1.8} />
        </View>
        <Text className="text-xl font-bold text-text-primary text-center mb-2">
          Enable AI Recommendations
        </Text>
        <Text className="text-sm text-text-muted text-center mb-8">
          The Movie Night Planner uses Google Gemini to turn your answers into picks. Allow sharing your preferences to continue.
        </Text>
        <TouchableOpacity
          onPress={handleEnableAI}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Enable AI Recommendations"
          className="w-full py-4 rounded-xl items-center"
          style={{ backgroundColor: '#FF3B5C' }}
        >
          <Text className="text-white font-medium">
            Continue
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#ffffff' }}>
        <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,59,92,0.12)' }}>
          <AlertTriangle size={28} color="#FF3B5C" strokeWidth={1.8} />
        </View>
        <Text
          className="text-xl font-bold text-text-primary text-center mb-2"
        >
          Something went wrong
        </Text>
        <Text className="text-sm text-text-muted text-center mb-8">{error}</Text>
        <TouchableOpacity
          onPress={handleReset}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          className="w-full py-4 rounded-xl items-center"
          style={{ backgroundColor: '#FF3B5C' }}
        >
          <Text className="text-white font-medium">
            Try again
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Results — full-bleed reveal, owns its own layout (no wizard chrome)
  if (plan) {
    return (
      <ResultsScreen
        plan={plan}
        prompt={prompt}
        onReset={handleReset}
        isSaved={isSaved}
        toggleSave={toggleSave}
      />
    );
  }

  // Landing / cover screen — shown once before the wizard begins
  if (showLanding) {
    return <DiscoverLanding onStart={() => setShowLanding(false)} />;
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
            className="text-2xl font-bold"
            style={{ color: '#FF3B5C' }}
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
            onChange={(genres) => update({ genres: genres as Genre[] })}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Streaming
            selected={plannerState.streaming}
            anyStreaming={plannerState.anyStreaming}
            onChange={(streaming, anyStreaming) => update({ streaming: streaming as StreamingPlatform[], anyStreaming })}
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
