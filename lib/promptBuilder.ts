import { PlannerState } from '@/types/planner';
import { InputValidator } from '@/utils/inputValidation';

export function buildMoviePlannerPrompt(state: PlannerState): string {
  // Validate and sanitize input
  const validation = InputValidator.validatePlannerState(state);
  if (!validation.isValid) {
    throw new Error(`Invalid planner state: ${validation.errors.join(', ')}`);
  }

  const sanitizedState = InputValidator.sanitizePlannerState(state);

  const streamingInfo = sanitizedState.anyStreaming
    ? 'any streaming platform'
    : sanitizedState.streaming.map(s => InputValidator.sanitizeString(s)).join(', ');

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
- Genres: ${sanitizedState.genres.map(g => InputValidator.sanitizeString(g)).join(', ')}
- Streaming services available: ${streamingInfo}
- Vibe: ${sanitizedState.vibe ? InputValidator.sanitizeString(sanitizedState.vibe) : 'any'}
- Duration: ${durLabel}
- Era preference: ${sanitizedState.era ? InputValidator.sanitizeString(sanitizedState.era) : 'no preference'}
- Avoid: ${sanitizedState.avoid.length ? sanitizedState.avoid.map(a => InputValidator.sanitizeString(a)).join(', ') : 'nothing specific'}
- Occasion: ${sanitizedState.occasion ? InputValidator.sanitizeString(sanitizedState.occasion) : 'any'}

IMPORTANT: Only recommend movies actually available on the specified streaming services (${streamingInfo}). Each movie MUST have a streaming field that exactly matches one of: ${streamingInfo}.

Respond ONLY with valid JSON (no markdown, no backticks, no explanation):
{
  "summary": "1-2 warm sentences summarizing the vibe + why these picks fit tonight",
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
