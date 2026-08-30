-- "For You" tab: personal AI recommendation engine. ai_taste_profiles holds
-- each user's latest onboarding answers (overwritten on "retake quiz");
-- ai_recommendation_feedback accumulates every like/dislike so "Refresh"
-- can actually adapt instead of repeating the same batch.
--
-- NOTE: already applied to the live database (supabase migration list
-- confirms 20260828160000 remotely) — this file exists for local tracking
-- parity only, do not re-push.
CREATE TABLE IF NOT EXISTS ai_taste_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  genres TEXT[] NOT NULL DEFAULT '{}',
  vibe TEXT,
  seed_movies JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_title TEXT NOT NULL,
  movie_year INTEGER,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_recommendation_feedback(user_id);

ALTER TABLE ai_taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Matches this project's existing authorization model (see movie_upvotes):
-- policies are permissive, all scoping happens app-side via .eq("user_id", ...).
CREATE POLICY "Anyone can manage taste profiles" ON ai_taste_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage recommendation feedback" ON ai_recommendation_feedback FOR ALL USING (true) WITH CHECK (true);
