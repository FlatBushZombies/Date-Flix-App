-- Streak Freeze: one free automatic freeze per calendar month per session.
-- When a couple misses a day, a stored freeze (if available) silently covers
-- the gap instead of resetting current_streak to 0.
ALTER TABLE session_streaks ADD COLUMN IF NOT EXISTS freeze_available INTEGER NOT NULL DEFAULT 1;
ALTER TABLE session_streaks ADD COLUMN IF NOT EXISTS freeze_refreshed_at DATE DEFAULT CURRENT_DATE;

-- AI debate settlement usage: visible monthly counter per user (no enforced cap yet).
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_ai_settlements INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_usage_month TEXT;
