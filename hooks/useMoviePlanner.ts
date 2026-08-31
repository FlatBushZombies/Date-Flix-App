import { buildMoviePlannerPrompt } from '@/lib/promptBuilder';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { assertAIConsent, AI_CONSENT_REQUIRED } from '../lib/aiConsent';
import { MovieNightPlan, PlannerState } from '../types/planner';

const LOADING_MESSAGES = [
  'Scanning across your platforms...',
  'Reading your vibe...',
  'Consulting the film critics...',
  'Matching to your mood...',
  'Almost ready...',
];

export function useMoviePlanner() {
  const [plan, setPlan] = useState<MovieNightPlan | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Set instead of `error` when the user hasn't granted AI consent yet — kept
  // separate so callers can render an "Enable AI Recommendations" prompt
  // rather than a generic error message.
  const [needsConsent, setNeedsConsent] = useState(false);

  const generatePlan = async (state: PlannerState) => {
    setLoading(true);
    setError(null);
    setNeedsConsent(false);
    setPlan(null);
    setProgress(0);

    try {
      await assertAIConsent();

      const builtPrompt = buildMoviePlannerPrompt(state);
      setPrompt(builtPrompt);

      // Cycle loading messages and progress
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[idx]);
        setProgress((idx + 1) * 20); // 20% per message
      }, 1500);

      const { data, error: fnError } = await supabase.functions.invoke(
        'super-function',
        { body: { prompt: builtPrompt } }
      );

      if (fnError) throw new Error(fnError.message);
      setPlan(data as MovieNightPlan);
      setProgress(100);
      clearInterval(interval);
      setLoading(false);
    } catch (err: any) {
      if (err.message === AI_CONSENT_REQUIRED) {
        setNeedsConsent(true);
      } else if (err.message.includes('Invalid planner state')) {
        setError('Invalid input data. Please check your selections and try again.');
      } else {
        setError(err.message ?? 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  const reset = () => {
    setPlan(null);
    setPrompt('');
    setError(null);
    setNeedsConsent(false);
    setLoading(false);
    setProgress(0);
  };

  return {
    plan,
    prompt,
    loading,
    loadingMessage,
    progress,
    error,
    needsConsent,
    generatePlan,
    reset,
  };
}
