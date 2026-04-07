-- Add push_token column to users table for push notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create index for push_token for better query performance
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token);