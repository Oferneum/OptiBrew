-- Cold brew support and precision basket tracking.
--
-- extraction_time becomes nullable because cold brew shots use steep_time_hours
-- instead. Making it optional at the DB level mirrors the application logic:
-- the two fields are mutually exclusive depending on brew_method.
ALTER TABLE shots
  ALTER COLUMN extraction_time DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS steep_time_hours numeric;

-- basket_name captures the precision basket installed in the portafilter.
-- BrewRecommendationAgent uses this to tune extraction-time guidance.
ALTER TABLE equipment_profiles
  ADD COLUMN IF NOT EXISTS basket_name text;
