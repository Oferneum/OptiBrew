-- 20260519_fix_shots_update_with_check.sql
--
-- Threat model finding C1: the shots_update_owner policy was missing a
-- WITH CHECK clause.  Without it, an authenticated user could UPDATE their
-- own shot and set user_id to a different UUID, effectively transferring
-- ownership of the row to another account.
--
-- The fix adds WITH CHECK (user_id = auth.uid()) so Postgres also validates
-- the *resulting* row state, not just the row being selected for update.

DROP POLICY IF EXISTS "shots_update_owner" ON shots;

CREATE POLICY "shots_update_owner" ON shots
  FOR UPDATE
  USING     (user_id = auth.uid())   -- must own the row to update it
  WITH CHECK (user_id = auth.uid());  -- resulting row must still be owned by you
