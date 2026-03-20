-- ============================================================
-- Pa' Que Vos Veáis POS — Realtime + Mesas persistentes
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Habilitar Realtime (seguro si ya existe) ───────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['menu_items','categories','app_config','refunds','tables_config']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ── Configuración de mesas (persistente) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tables_config (
  id          text    PRIMARY KEY,
  numero      integer NOT NULL UNIQUE,
  nombre      text,
  capacidad   integer NOT NULL DEFAULT 4,
  activa      boolean DEFAULT true,
  ubicacion   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tables_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer mesas"
  ON public.tables_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin puede gestionar mesas"
  ON public.tables_config FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- 12 mesas por defecto
INSERT INTO public.tables_config (id, numero, nombre, capacidad, activa)
SELECT 'table-' || i, i, 'Mesa ' || i, 4, true
FROM generate_series(1, 12) AS t(i)
ON CONFLICT (id) DO NOTHING;
