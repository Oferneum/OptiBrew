-- Add ambient weather columns captured at shot time.
-- Run this in the Supabase SQL editor or via supabase db push.
ALTER TABLE shots
  ADD COLUMN IF NOT EXISTS ambient_temp numeric,
  ADD COLUMN IF NOT EXISTS humidity     numeric;
