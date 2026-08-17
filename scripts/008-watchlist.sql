-- Personal movie watchlist ("Save" on a movie card).
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their watchlist" ON watchlist FOR SELECT USING (true);
CREATE POLICY "Users can manage their watchlist" ON watchlist FOR ALL USING (true) WITH CHECK (true);
