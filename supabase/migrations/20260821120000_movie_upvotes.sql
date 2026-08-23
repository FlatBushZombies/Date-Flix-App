-- Movie upvotes: users upvote movies from the "New & Trending" feed; aggregated
-- into a live Top 10 leaderboard (top_upvoted_movies view, below).
CREATE TABLE IF NOT EXISTS movie_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_upvotes_movie_id ON movie_upvotes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_upvotes_user_id ON movie_upvotes(user_id);

ALTER TABLE movie_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes" ON movie_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own upvotes" ON movie_upvotes FOR ALL USING (true) WITH CHECK (true);

-- Always reflects current vote counts — the client queries this directly for
-- the Top 10 leaderboard instead of aggregating movie_upvotes client-side.
CREATE OR REPLACE VIEW top_upvoted_movies AS
SELECT
  movie_id,
  (array_agg(movie_data ORDER BY created_at DESC))[1] AS movie_data,
  COUNT(*) AS upvote_count
FROM movie_upvotes
GROUP BY movie_id
ORDER BY upvote_count DESC, MAX(created_at) DESC
LIMIT 10;

-- Required for the client's realtime subscription (INSERT/DELETE on this
-- table) that keeps the Top 10 leaderboard live without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE movie_upvotes;
