-- 20260519_push_subscriptions.sql
-- Stores browser PushSubscription objects for web push notifications.
-- One row per user (UNIQUE on user_id) — updated in place on re-subscribe.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subscription jsonb       NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read, write, and delete their own subscription row.
CREATE POLICY "push_sub_select_owner" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_sub_insert_owner" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_sub_update_owner" ON push_subscriptions
  FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_sub_delete_owner" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- Index for the cron job's JOIN against shots.user_id
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);
