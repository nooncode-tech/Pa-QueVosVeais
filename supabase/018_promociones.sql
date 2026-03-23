-- ============================================================
-- 018: Promociones (descuentos del admin visibles al cliente)
-- ============================================================

-- Tabla de promociones
CREATE TABLE IF NOT EXISTS public.promociones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descripcion  TEXT NOT NULL DEFAULT '',
  tipo         TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'monto_fijo')),
  valor        NUMERIC(10,2) NOT NULL DEFAULT 0,
  activa       BOOLEAN NOT NULL DEFAULT false,
  fecha_inicio DATE,
  fecha_fin    DATE,
  color        TEXT NOT NULL DEFAULT 'orange',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_promociones_updated_at ON public.promociones;
CREATE TRIGGER trg_promociones_updated_at
  BEFORE UPDATE ON public.promociones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: todos pueden leer, solo admin escribe
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read promociones" ON public.promociones;
CREATE POLICY "anyone can read promociones"
  ON public.promociones FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin manages promociones" ON public.promociones;
CREATE POLICY "admin manages promociones"
  ON public.promociones FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Realtime
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='promociones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.promociones;
  END IF;
END $$;

-- Columna google_review_url en app_config
ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS google_review_url TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  RAISE NOTICE '018 aplicada: tabla promociones + app_config.google_review_url';
END $$;
