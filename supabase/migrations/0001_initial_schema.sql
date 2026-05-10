-- 0001_initial_schema.sql
-- Baseline schema for OptiBrew / Dialed (Layers 1–5).
-- Subsequent date-stamped migrations layer incremental features on top.
--
-- Apply order: this file → 20260507 → 20260508 → 20260509 → 20260510
-- All migrations are idempotent (IF NOT EXISTS / IF EXISTS guards).

-- ── Extensions ────────────────────────────────────────────────────────────────
-- pg_trgm powers the fuzzy-search RPC calls used by bag-scan and
-- equipment-lookup flows (search_beans_fuzzy, search_equipment_fuzzy).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── beans ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beans (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL    DEFAULT now(),
  user_id      uuid        NOT NULL    REFERENCES auth.users ON DELETE CASCADE,
  roaster      text        NOT NULL,
  origin       text        NOT NULL,
  roast_date   date,
  notes        text,
  is_active    boolean     NOT NULL    DEFAULT true,
  is_finished  boolean     NOT NULL    DEFAULT false,
  price_paid   numeric,
  weight_grams numeric
);

ALTER TABLE beans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beans_insert_owner" ON beans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "beans_update_owner" ON beans
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "beans_delete_owner" ON beans
  FOR DELETE USING (user_id = auth.uid());

-- Community-wide read: powers the VFM leaderboard and community brew method stats.
CREATE POLICY "beans_select_authenticated" ON beans
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── equipment_profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  user_id         uuid        NOT NULL    REFERENCES auth.users ON DELETE CASCADE,
  machine_name    text        NOT NULL,
  grinder_name    text,
  grinder_setting text,
  basket_type     text,
  notes           text
);

ALTER TABLE equipment_profiles ENABLE ROW LEVEL SECURITY;

-- Equipment profiles are fully private — no community sharing.
CREATE POLICY "equipment_owner" ON equipment_profiles
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── shots ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  user_id         uuid        NOT NULL    REFERENCES auth.users ON DELETE CASCADE,
  bean_id         uuid                    REFERENCES beans              ON DELETE SET NULL,
  equipment_id    uuid                    REFERENCES equipment_profiles ON DELETE SET NULL,

  -- Brew parameters
  brew_method     text        NOT NULL    DEFAULT 'Espresso',
  dose            numeric     NOT NULL,
  yield           numeric     NOT NULL,
  -- brew_ratio is a stored generated column so it is always consistent and
  -- available without a join or application-side computation.
  brew_ratio      numeric     GENERATED ALWAYS AS (
                    CASE WHEN dose > 0 THEN yield / dose ELSE 0 END
                  ) STORED,
  extraction_time integer,
  brew_temp       numeric,
  grind_setting   text,

  -- Tasting
  overall_score   integer     CHECK (overall_score BETWEEN 1 AND 10),
  flavor_tags     text[]      NOT NULL DEFAULT '{}',
  has_milk        boolean     NOT NULL DEFAULT false,
  notes           text,
  recommendation  text
);

ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shots_insert_owner" ON shots
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "shots_update_owner" ON shots
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "shots_delete_owner" ON shots
  FOR DELETE USING (user_id = auth.uid());

-- Community-wide read: powers CommunityAnalyticsAgent (best brew method per bean).
CREATE POLICY "shots_select_authenticated" ON shots
  FOR SELECT USING (auth.uid() IS NOT NULL);
