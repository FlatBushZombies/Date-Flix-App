-- TEMPORARY SOLUTION: Disable RLS to debug the issue
-- This will help us identify if RLS is the problem

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_sessions DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swipes_user_movie ON swipes(user_id, movie_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_movie ON matches(movie_id);
CREATE INDEX IF NOT EXISTS idx_sessions_users ON swipe_sessions(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
