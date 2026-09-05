// Single source of truth for the genre/vibe taxonomy behind the taste
// profile (ai_taste_profiles: genres text[], vibe text) — shared by the
// post-signup onboarding personalization step and the Movie Tracker's
// TasteOnboarding "retake" flow so both write the same values Gemini's
// prompt already expects (see lib/tasteEnginePrompt.ts).
export const TASTE_GENRES = [
  { value: "romance", label: "Romance", color: "#ec4899" },
  { value: "thriller", label: "Thriller", color: "#dc2626" },
  { value: "comedy", label: "Comedy", color: "#f97316" },
  { value: "drama", label: "Drama", color: "#8B5CF6" },
  { value: "action", label: "Action", color: "#ef4444" },
  { value: "horror", label: "Horror", color: "#6b7280" },
  { value: "sci-fi", label: "Sci-Fi", color: "#06b6d4" },
  { value: "documentary", label: "Documentary", color: "#10b981" },
] as const

export const TASTE_VIBES = [
  { value: "cozy", label: "Cozy", icon: require("@/assets/icons/cozy.png") },
  { value: "excited", label: "Excited", icon: require("@/assets/icons/excited.png") },
  { value: "emotional", label: "Emotional", icon: require("@/assets/icons/emotional.png") },
  { value: "chill", label: "Chill", icon: require("@/assets/icons/chill.png") },
  { value: "laugh", label: "Laughing", icon: require("@/assets/icons/laughing.png") },
  { value: "surprised", label: "Surprised", icon: require("@/assets/icons/suprised.png") },
] as const
