-- ============================================================
-- Pa' Que Vos Veáis POS — Migration 012
-- Security: RLS admin-only para rewards/delivery_zones
-- Performance: RPC atómica para crear orden + descontar inventario
-- ============================================================

-- ── Fix RLS: rewards solo admin puede escribir ────────────────────────────────
DROP POLICY IF EXISTS "rewards_write" ON public.rewards;
CREATE POLICY "rewards_write"
  ON public.rewards FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ── Fix RLS: delivery_zones solo admin puede escribir ────────────────────────
DROP POLICY IF EXISTS "delivery_zones_write" ON public.delivery_zones;
CREATE POLICY "delivery_zones_write"
  ON public.delivery_zones FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ── Fix RLS: audit_logs solo admin puede leer (insert sigue abierto) ─────────
DROP POLICY IF EXISTS "audit_logs_read" ON public.audit_logs;
CREATE POLICY "audit_logs_read"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

-- ── RPC: Crear orden + descontar ingredientes en una sola transacción ─────────
-- Si la deducción falla (stock insuficiente), el INSERT de la orden hace rollback.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order   jsonb,   -- todos los campos de la orden
  p_deductions jsonb -- [{"ingredient_id":"...","cantidad":1.5}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1) Insertar la orden
  INSERT INTO public.orders (
    id, numero, canal, mesa, items, status,
    cocina_a_status, cocina_b_status,
    nombre_cliente, telefono, direccion, zona_reparto, costo_envio,
    session_id, created_at, updated_at
  ) VALUES (
    p_order->>'id',
    (p_order->>'numero')::integer,
    p_order->>'canal',
    CASE WHEN p_order->>'mesa' IS NOT NULL THEN (p_order->>'mesa')::integer ELSE NULL END,
    p_order->'items',
    COALESCE(p_order->>'status', 'recibido'),
    COALESCE(p_order->>'cocina_a_status', 'en_cola'),
    COALESCE(p_order->>'cocina_b_status', 'en_cola'),
    p_order->>'nombre_cliente',
    p_order->>'telefono',
    p_order->>'direccion',
    p_order->>'zona_reparto',
    CASE WHEN p_order->>'costo_envio' IS NOT NULL
         THEN (p_order->>'costo_envio')::numeric ELSE 0 END,
    p_order->>'session_id',
    COALESCE((p_order->>'created_at')::timestamptz, now()),
    now()
  );

  -- 2) Descontar ingredientes (lanza excepción y hace rollback si stock insuficiente)
  IF jsonb_array_length(p_deductions) > 0 THEN
    PERFORM public.deduct_ingredients(p_deductions);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb) TO authenticated;
