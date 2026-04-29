-- Allow ratings to be tied to a named bar without requiring GPS coordinates.
-- bar_name already exists (sprint6); this migration only relaxes the NOT NULL
-- constraints on latitude/longitude.

ALTER TABLE public.ratings
  ALTER COLUMN latitude  DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;
