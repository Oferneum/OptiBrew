-- Layer 6: adds bag_name to beans for multi-bag tracking.
-- VisionAgent extracts this from the bag photo; displayed on BeanCard.
ALTER TABLE beans ADD COLUMN IF NOT EXISTS bag_name text;
