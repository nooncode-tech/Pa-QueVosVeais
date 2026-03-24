-- ============================================================
-- 021: Etiquetas personalizadas (admin define sus propias etiquetas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_etiquetas (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  emoji       TEXT NOT NULL DEFAULT '🏷️',
  label       TEXT NOT NULL,
  color_bg    TEXT NOT NULL DEFAULT 'bg-gray-100',
  color_text  TEXT NOT NULL DEFAULT 'text-gray-800',
  activa      BOOLEAN NOT NULL DEFAULT true,
  orden       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_etiquetas ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer (clientes ven etiquetas en el menú)
DROP POLICY IF EXISTS "todos leen etiquetas" ON public.custom_etiquetas;
CREATE POLICY "todos leen etiquetas"
  ON public.custom_etiquetas FOR SELECT USING (true);

-- Solo admin puede escribir
DROP POLICY IF EXISTS "admin gestiona etiquetas" ON public.custom_etiquetas;
CREATE POLICY "admin gestiona etiquetas"
  ON public.custom_etiquetas FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Realtime
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='custom_etiquetas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_etiquetas;
  END IF;
END $$;

-- Datos iniciales (las etiquetas predeterminadas del sistema)
INSERT INTO public.custom_etiquetas (id, emoji, label, color_bg, color_text, orden) VALUES
  ('vegano',       '🌿', 'Vegano',       'bg-green-100',  'text-green-800',  1),
  ('vegetariano',  '🥦', 'Vegetariano',  'bg-lime-100',   'text-lime-800',   2),
  ('sin-gluten',   '🌾', 'Sin gluten',   'bg-yellow-100', 'text-yellow-800', 3),
  ('sin-tacc',     '✅', 'Sin TACC',     'bg-yellow-100', 'text-yellow-800', 4),
  ('picante',      '🌶️', 'Picante',      'bg-red-100',    'text-red-700',    5),
  ('muy-picante',  '🔥', 'Muy picante',  'bg-red-200',    'text-red-800',    6),
  ('mariscos',     '🦐', 'Mariscos',     'bg-blue-100',   'text-blue-800',   7),
  ('lacteos',      '🥛', 'Lácteos',      'bg-sky-100',    'text-sky-800',    8),
  ('nueces',       '🥜', 'Nueces',       'bg-amber-100',  'text-amber-800',  9)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '021 aplicada: tabla custom_etiquetas con datos iniciales';
END $$;
