-- 20260511_fix_delete_policy.sql
-- Investigation: production deletes were silently no-ops.
-- Root cause: the client was not sending the Authorization header, so
-- getRequestClient() fell back to the anon client. With no authenticated
-- uid(), the RLS USING clause (user_id = auth.uid()) matched zero rows.
--
-- The policy itself was correct since 0001_initial_schema.sql.
-- This migration re-asserts it idempotently as an audit checkpoint.

DROP POLICY IF EXISTS "shots_delete_owner" ON shots;
CREATE POLICY "shots_delete_owner" ON shots
  FOR DELETE USING (user_id = auth.uid());

-- Ensure beans DELETE policy exists too (already in initial schema).
DROP POLICY IF EXISTS "beans_delete_owner" ON beans;
CREATE POLICY "beans_delete_owner" ON beans
  FOR DELETE USING (user_id = auth.uid());
