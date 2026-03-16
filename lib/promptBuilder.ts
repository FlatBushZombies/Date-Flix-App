import { PlannerState } from '@/types/planner';

export function buildMoviePlannerPrompt(state: PlannerState): string {
  const streamingInfo = state.anyStreaming
    ? 'any streaming platform'
    : state.streaming.join(', ');

  const durLabel =
    state.duration === 'short'
      ? 'under 90 min'
      : state.duration === 'medium'
      ? '90–120 min'
      : state.duration === 'long'
      ? 'over 2 hours'
      : 'any duration';

  return `You are a movie night curator for couples. Recommend 3 perfect movies based on their preferences.

Preferences:
- Genres: ${state.genres.join(', ')}
- Streaming services available: ${streamingInfo}
- Vibe: ${state.vibe}
- Duration: ${durLabel}
- Era preference: ${state.era ?? 'no preference'}
- Avoid: ${state.avoid.length ? state.avoid.join(', ') : 'nothing specific'}
- Occasion: ${state.occasion}

IMPORTANT: Only recommend movies actually available on the specified streaming services (${streamingInfo}). Each movie MUST have a streaming field that exactly matches one of: ${streamingInfo}.

Respond ONLY with valid JSON (no markdown, no backticks, no explanation):
{
  "movies": [
    {
      "title": "string",
      "year": 2019,
      "genre": "string",
      "duration": "1h 52m",
      "rating": "8.1",
      "reason": "2 sentence personalised reason why this is perfect for their vibe and occasion tonight",
      "streaming": "exact platform name from their list",
      "topPick": true
    }
  ],
  "snack": "creative specific snack pairing for this kind of movie night",
  "ambiance": "one sentence tip to set the perfect atmosphere"
}

Only the first movie has topPick set to true. Make reasons warm, specific, and tied to their mood and occasion.`;
}
