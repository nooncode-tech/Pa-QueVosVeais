-- ============================================================
-- Pa' Que Vos Veáis POS — Ingredientes e historial de inventario
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Ingredients ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ingredients (
  id              text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre          text        NOT NULL,
  categoria       text        NOT NULL DEFAULT 'General',
  unidad          text        NOT NULL DEFAULT 'kg',
  stock_actual    numeric(10,3) DEFAULT 0,
  stock_minimo    numeric(10,3) DEFAULT 0,
  cantidad_maxima numeric(10,3) DEFAULT 0,
  costo_unitario  numeric(10,2) DEFAULT 0,
  activo          boolean     DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer ingredientes"
  ON public.ingredients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin puede modificar ingredientes"
  ON public.ingredients FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin', 'cocina_a', 'cocina_b'));

-- ── Inventory Adjustments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id            text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ingredient_id text        NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  tipo          text        NOT NULL CHECK (tipo IN ('entrada', 'salida', 'merma', 'ajuste')),
  cantidad      numeric(10,3) NOT NULL,
  motivo        text        NOT NULL DEFAULT '',
  user_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer ajustes"
  ON public.inventory_adjustments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin y cocina pueden registrar ajustes"
  ON public.inventory_adjustments FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'cocina_a', 'cocina_b'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_adjustments;
