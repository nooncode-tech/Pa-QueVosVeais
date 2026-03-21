-- Add receta and extras columns to menu_items so they persist to Supabase
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS receta  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extras  jsonb DEFAULT '[]'::jsonb;
