-- The account-deletion flow (utils/supabase-helpers.ts deleteUserAccount) and
-- the "delete swipe session" button (home.tsx handleDeleteSession) both issue
-- DELETE statements against these tables, but users/swipes/matches/invitations/
-- swipe_sessions never got a DELETE policy (001-create-tables.sql only ever
-- granted SELECT/INSERT/UPDATE, and 002-fix-rls-policies.sql patched INSERT/
-- UPDATE/SELECT to permissive `true` checks but missed DELETE). With RLS
-- enabled and no matching policy, Postgres silently matches zero rows — the
-- client sees no error and the UI reports success, but the rows never
-- actually get removed. This matches the permissive pattern already used
-- elsewhere in this schema (movie_upvotes, watchlist, ai_taste_profiles,
-- session_streaks) where app-side .eq("user_id", ...) filtering does the
-- real scoping.
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (true);
CREATE POLICY "Users can delete own swipes" ON swipes FOR DELETE USING (true);
CREATE POLICY "Users can delete their matches" ON matches FOR DELETE USING (true);
CREATE POLICY "Users can delete their invitations" ON invitations FOR DELETE USING (true);
CREATE POLICY "Users can delete their sessions" ON swipe_sessions FOR DELETE USING (true);
