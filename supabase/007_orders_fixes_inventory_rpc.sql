-- ============================================================
-- Pa' Que Vos Veáis POS — Migration 007
-- Fixes: costo_envio en orders + RPC inventario transaccional
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Agregar columna costo_envio a orders (faltaba en schema) ──────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS costo_envio numeric(10,2) DEFAULT 0;

-- ── RPC: Deducción transaccional de ingredientes ─────────────────────────────
-- Recibe un array de {ingredient_id, cantidad} y los deduce en una sola tx.
-- Si algún stock quedaría negativo, lanza excepción y hace rollback completo.
CREATE OR REPLACE FUNCTION public.deduct_ingredients(
  deductions jsonb  -- [{"ingredient_id": "uuid", "cantidad": 1.5}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item      jsonb;
  ing_id    text;
  cantidad  numeric;
  curr_stock numeric;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(deductions)
  LOOP
    ing_id   := item->>'ingredient_id';
    cantidad := (item->>'cantidad')::numeric;

    SELECT stock_actual INTO curr_stock
    FROM public.ingredients
    WHERE id = ing_id
    FOR UPDATE;  -- lock row to prevent race conditions

    IF curr_stock IS NULL THEN
      RAISE EXCEPTION 'Ingrediente % no encontrado', ing_id;
    END IF;

    IF curr_stock < cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para ingrediente %. Disponible: %, Requerido: %',
        ing_id, curr_stock, cantidad;
    END IF;

    UPDATE public.ingredients
    SET stock_actual = ROUND((stock_actual - cantidad)::numeric, 2)
    WHERE id = ing_id;
  END LOOP;
END;
$$;

-- Permisos: solo usuarios autenticados pueden llamar esta función
REVOKE ALL ON FUNCTION public.deduct_ingredients(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_ingredients(jsonb) TO authenticated;

-- ── RPC: Restaurar ingredientes (para cancelaciones) ──────────────────────────
CREATE OR REPLACE FUNCTION public.restore_ingredients(
  restorations jsonb  -- [{"ingredient_id": "uuid", "cantidad": 1.5}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item      jsonb;
  ing_id    text;
  cantidad  numeric;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(restorations)
  LOOP
    ing_id   := item->>'ingredient_id';
    cantidad := (item->>'cantidad')::numeric;

    UPDATE public.ingredients
    SET stock_actual = ROUND((stock_actual + cantidad)::numeric, 2)
    WHERE id = ing_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_ingredients(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_ingredients(jsonb) TO authenticated;

-- ── Habilitar Realtime para ingredients (si no está ya) ──────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ingredients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
  END IF;
END $$;
