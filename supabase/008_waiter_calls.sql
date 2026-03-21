-- ============================================================
-- Pa' Que Vos Veáis POS — Migration 008
-- Tabla waiter_calls para llamadas de mesero en tiempo real
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id          text        PRIMARY KEY,
  mesa        integer     NOT NULL,
  tipo        text        NOT NULL CHECK (tipo IN ('atencion', 'cuenta', 'otro')),
  mensaje     text,
  atendido    boolean     NOT NULL DEFAULT false,
  atendido_por text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  atendido_at timestamptz
);

-- RLS: todos los roles autenticados pueden leer y escribir llamadas
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read waiter_calls"
  ON public.waiter_calls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated insert waiter_calls"
  ON public.waiter_calls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated update waiter_calls"
  ON public.waiter_calls FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Clientes (anon) pueden insertar llamadas desde la vista de QR
CREATE POLICY "anon insert waiter_calls"
  ON public.waiter_calls FOR INSERT
  TO anon
  WITH CHECK (true);

-- Habilitar Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'waiter_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
  END IF;
END $$;

-- Índice para queries frecuentes (llamadas no atendidas por mesa)
CREATE INDEX IF NOT EXISTS idx_waiter_calls_atendido ON public.waiter_calls (atendido, created_at DESC);
