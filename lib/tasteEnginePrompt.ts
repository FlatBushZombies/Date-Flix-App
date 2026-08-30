export interface TasteProfileInput {
  genres: string[]
  vibe: string | null
  seedMovies: { title: string; year: number | null }[]
}

export interface FeedbackEntry {
  movieTitle: string
  liked: boolean
}

// Mirrors lib/promptBuilder.ts's buildMoviePlannerPrompt: pure function,
// structured input in, a prompt demanding a specific JSON shape back —
// same contract super-function already parses for the Discover planner.
export function buildTasteEnginePrompt(profile: TasteProfileInput, pastFeedback: FeedbackEntry[]): string {
  const seedList = profile.seedMovies.length
    ? profile.seedMovies.map((m) => (m.year ? `${m.title} (${m.year})` : m.title)).join(", ")
    : "no specific titles given"

  const liked = pastFeedback.filter((f) => f.liked).map((f) => f.movieTitle)
  const disliked = pastFeedback.filter((f) => !f.liked).map((f) => f.movieTitle)

  const feedbackBlock = pastFeedback.length
    ? `
Past feedback from this user on previous recommendations — use this to refine the picks, don't just repeat the same list:
- Rated positively: ${liked.length ? liked.join(", ") : "none yet"}
- Rated negatively: ${disliked.length ? disliked.join(", ") : "none yet"}
Lean further into what they liked. Do not recommend anything in the negatively-rated list, and avoid titles that are very similar in tone/genre to disliked ones if the pattern is clear.`
    : ""

  const excludeList = [...profile.seedMovies.map((m) => m.title), ...liked, ...disliked]
  const excludeBlock = excludeList.length
    ? `\nDo not recommend any of these titles again (already seen/rated): ${excludeList.join(", ")}.`
    : ""

  return `You are a personal movie taste engine. Recommend 6 movies this specific person will love, based on their profile below.

Taste profile:
- Favorite genres: ${profile.genres.length ? profile.genres.join(", ") : "no strong preference"}
- Current vibe: ${profile.vibe ?? "no specific vibe"}
- Movies they already like: ${seedList}
${feedbackBlock}${excludeBlock}

For each movie, give a personalised matchScore (0-100) reflecting how confident you are this specific person will love it, and a short reason (1-2 sentences) tied to their actual stated taste — not generic praise.

Respond ONLY with valid JSON (no markdown, no backticks, no explanation):
{
  "recommendations": [
    {
      "title": "string",
      "year": 2019,
      "reason": "1-2 sentences, personalised to this user's taste profile",
      "matchScore": 92
    }
  ]
}

Use real movie titles that actually exist. Order by matchScore descending.`
}
