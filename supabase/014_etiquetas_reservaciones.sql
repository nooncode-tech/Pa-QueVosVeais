-- Migration 014: Allergen tags + Reservations
-- Apply in Supabase SQL Editor

-- ── 1. Allergen/dietary tags on menu items ───────────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS etiquetas JSONB DEFAULT '[]'::jsonb;

-- ── 2. Reservations table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reservaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  telefono    TEXT,
  fecha       DATE NOT NULL,
  hora        TIME NOT NULL,
  personas    INTEGER NOT NULL DEFAULT 2,
  mesa        INTEGER,
  notas       TEXT,
  status      TEXT NOT NULL DEFAULT 'confirmada'
                CHECK (status IN ('confirmada', 'llegaron', 'cancelada', 'no-show')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.reservaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage reservations"
  ON public.reservaciones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Staff can read reservations"
  ON public.reservaciones
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservaciones;
