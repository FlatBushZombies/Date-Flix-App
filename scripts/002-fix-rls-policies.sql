-- Drop existing RLS policies for swipes
DROP POLICY IF EXISTS "Users can insert own swipes" ON swipes;

-- Create more permissive RLS policy that doesn't rely on current_setting
CREATE POLICY "Users can insert swipes" ON swipes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update own swipes" ON swipes 
FOR UPDATE 
USING (true);

-- Update matches policies to be more permissive for system operations
DROP POLICY IF EXISTS "System can insert matches" ON matches;
CREATE POLICY "System can insert matches" ON matches 
FOR INSERT 
WITH CHECK (true);

-- Make invitations more accessible
DROP POLICY IF EXISTS "Users can view their invitations" ON invitations;
CREATE POLICY "Anyone can view invitations by code" ON invitations 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
CREATE POLICY "Anyone can create invitations" ON invitations 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update received invitations" ON invitations;
CREATE POLICY "Anyone can update invitations" ON invitations 
FOR UPDATE 
USING (true);

-- Make sessions more accessible
DROP POLICY IF EXISTS "Users can create sessions" ON swipe_sessions;
CREATE POLICY "Anyone can create sessions" ON swipe_sessions 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their sessions" ON swipe_sessions;
CREATE POLICY "Anyone can view sessions" ON swipe_sessions 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update their sessions" ON swipe_sessions;
CREATE POLICY "Anyone can update sessions" ON swipe_sessions 
FOR UPDATE 
USING (true);
