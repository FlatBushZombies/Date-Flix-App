-- Debate Sessions Table
CREATE TABLE IF NOT EXISTS debate_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  partner_email VARCHAR(255),
  host_preferences TEXT,
  partner_preferences TEXT,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'both_joined', 'host_ready', 'partner_ready', 'settling', 'settled')),
  ai_verdict JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for debate sessions
CREATE INDEX IF NOT EXISTS idx_debate_sessions_code ON debate_sessions(code);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_host ON debate_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_partner ON debate_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_status ON debate_sessions(status);

-- Disable RLS for now (matching existing pattern)
ALTER TABLE debate_sessions DISABLE ROW LEVEL SECURITY;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_debate_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS debate_sessions_updated_at ON debate_sessions;
CREATE TRIGGER debate_sessions_updated_at
  BEFORE UPDATE ON debate_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_debate_session_timestamp();
