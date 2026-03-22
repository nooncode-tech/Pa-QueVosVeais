-- Migration 013: Modifier groups for menu items
-- Allows admins to define required/optional customizations per dish
-- e.g. "Término de cocción" (required, single choice), "¿Con qué salsa?" (required, single choice)

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS grupos_modificadores JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.menu_items.grupos_modificadores IS
  'Array of ModifierGroup: [{id, nombre, requerido, tipo: unico|multiple, opciones: [{id, nombre, precioExtra}]}]';
