-- Gamification: streaks + badges
-- Run this in the Supabase SQL editor.

-- ── user_stats: one row per user, tracks streak ───────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  user_id        uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  current_streak int  NOT NULL DEFAULT 0,
  longest_streak int  NOT NULL DEFAULT 0,
  last_shot_date date,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats_owner" ON user_stats
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── user_badges: one row per earned badge per user ────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  badge_id    text        NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_owner" ON user_badges
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
