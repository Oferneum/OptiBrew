-- Fix the beans UPDATE RLS policy.
--
-- Symptom: an authenticated owner could not update their own bean — the
-- UPDATE silently affected 0 rows. A service-role audit confirmed the rows
-- were correctly owned (user_id = the editing user) and none were NULL, so
-- the data was fine; the policy itself was the problem.
--
-- The original policy (migration 0001) had only USING and no WITH CHECK,
-- and in the live database it was not permitting owner updates. This rebuilds
-- it to match the working shots_update_owner policy (migration 20260519):
-- USING gates which rows you may target, WITH CHECK validates the resulting
-- row still belongs to you (prevents reassigning user_id to another account).

DROP POLICY IF EXISTS "beans_update_owner" ON beans;

CREATE POLICY "beans_update_owner" ON beans
  FOR UPDATE
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
