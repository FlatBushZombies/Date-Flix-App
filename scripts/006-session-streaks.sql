-- Track consecutive-day streaks for a swipe session (both partners swiped same day)
CREATE TABLE IF NOT EXISTS session_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES swipe_sessions(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_both_active_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_streaks_session_id ON session_streaks(session_id);

ALTER TABLE session_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view streaks for their sessions" ON session_streaks FOR SELECT USING (
  session_id IN (
    SELECT id FROM swipe_sessions
    WHERE user1_id = current_setting('app.user_id', true) OR user2_id = current_setting('app.user_id', true)
  )
);
CREATE POLICY "System can upsert streaks" ON session_streaks FOR ALL USING (true) WITH CHECK (true);
