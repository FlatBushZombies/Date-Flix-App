import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildMoviePlannerPrompt } from '@/lib/promptBuilder';
import { PlannerState, MovieNightPlan } from '../types/planner';

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
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (state: PlannerState) => {
    setLoading(true);
    setError(null);
    setPlan(null);

    const builtPrompt = buildMoviePlannerPrompt(state);
    setPrompt(builtPrompt);

    // Cycle loading messages
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[idx]);
    }, 1500);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'super-function',
        { body: { prompt: builtPrompt } }
      );

      if (fnError) throw new Error(fnError.message);
      setPlan(data as MovieNightPlan);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => {
    setPlan(null);
    setPrompt('');
    setError(null);
    setLoading(false);
  };

  return {
    plan,
    prompt,
    loading,
    loadingMessage,
    error,
    generatePlan,
    reset,
  };
}
