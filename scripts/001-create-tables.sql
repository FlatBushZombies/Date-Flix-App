-- Create users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  liked BOOLEAN NOT NULL,
  movie_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id INTEGER NOT NULL,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_data JSONB,
  watched BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invite_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create swipe_sessions table (for tracking who is swiping together)
CREATE TABLE IF NOT EXISTS swipe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_movie_id ON swipes(movie_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_movie_id ON matches(movie_id);
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_swipe_sessions_users ON swipe_sessions(user1_id, user2_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = current_setting('app.user_id', true));
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = current_setting('app.user_id', true));

-- RLS Policies for swipes
CREATE POLICY "Users can view own swipes" ON swipes FOR SELECT USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users can insert own swipes" ON swipes FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));

-- RLS Policies for matches
CREATE POLICY "Users can view their matches" ON matches FOR SELECT USING (
  user1_id = current_setting('app.user_id', true) OR 
  user2_id = current_setting('app.user_id', true)
);
CREATE POLICY "System can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their matches" ON matches FOR UPDATE USING (
  user1_id = current_setting('app.user_id', true) OR 
  user2_id = current_setting('app.user_id', true)
);

-- RLS Policies for invitations
CREATE POLICY "Users can view their invitations" ON invitations FOR SELECT USING (
  sender_id = current_setting('app.user_id', true) OR 
  recipient_id = current_setting('app.user_id', true)
);
CREATE POLICY "Users can create invitations" ON invitations FOR INSERT WITH CHECK (
  sender_id = current_setting('app.user_id', true)
);
CREATE POLICY "Users can update received invitations" ON invitations FOR UPDATE USING (
  recipient_id = current_setting('app.user_id', true) OR
  sender_id = current_setting('app.user_id', true)
);

-- RLS Policies for swipe_sessions
CREATE POLICY "Users can view their sessions" ON swipe_sessions FOR SELECT USING (
  user1_id = current_setting('app.user_id', true) OR 
  user2_id = current_setting('app.user_id', true)
);
CREATE POLICY "Users can create sessions" ON swipe_sessions FOR INSERT WITH CHECK (
  user1_id = current_setting('app.user_id', true) OR 
  user2_id = current_setting('app.user_id', true)
);
CREATE POLICY "Users can update their sessions" ON swipe_sessions FOR UPDATE USING (
  user1_id = current_setting('app.user_id', true) OR 
  user2_id = current_setting('app.user_id', true)
);
