-- ============================================================
-- 019: Acceso anónimo para clientes QR
-- Los clientes escanean el QR sin iniciar sesión (rol = anon).
-- Esta migración abre solo lo necesario para que puedan:
--   • Ver el menú y categorías
--   • Ver el estado de su sesión/pedido
--   • Realizar pedidos
--   • Dejar feedback
-- ============================================================

-- ── menu_items: lectura pública ───────────────────────────────────────────────
DROP POLICY IF EXISTS "anon lee menu" ON public.menu_items;
CREATE POLICY "anon lee menu"
  ON public.menu_items FOR SELECT TO anon USING (true);

-- ── categories: lectura pública ──────────────────────────────────────────────
DROP POLICY IF EXISTS "anon lee categorias" ON public.categories;
CREATE POLICY "anon lee categorias"
  ON public.categories FOR SELECT TO anon USING (true);

-- ── table_sessions: lectura pública (solo sesiones activas) ──────────────────
DROP POLICY IF EXISTS "anon lee sesiones activas" ON public.table_sessions;
CREATE POLICY "anon lee sesiones activas"
  ON public.table_sessions FOR SELECT TO anon USING (activa = true);

-- ── orders: lectura pública (clientes ven el estado de su pedido) ─────────────
DROP POLICY IF EXISTS "anon lee pedidos" ON public.orders;
CREATE POLICY "anon lee pedidos"
  ON public.orders FOR SELECT TO anon USING (true);

-- ── orders: inserción anónima (fallback si no se usa la RPC) ──────────────────
DROP POLICY IF EXISTS "anon inserta pedidos" ON public.orders;
CREATE POLICY "anon inserta pedidos"
  ON public.orders FOR INSERT TO anon WITH CHECK (true);

-- ── create_order_atomic: permitir ejecución anónima ──────────────────────────
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb) TO anon;

-- ── session_feedback: lectura y escritura anónima ────────────────────────────
DROP POLICY IF EXISTS "anon lee feedback" ON public.session_feedback;
CREATE POLICY "anon lee feedback"
  ON public.session_feedback FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon inserta feedback" ON public.session_feedback;
CREATE POLICY "anon inserta feedback"
  ON public.session_feedback FOR INSERT TO anon WITH CHECK (true);

-- ── app_config: lectura pública (nombre del restaurante, config visual) ───────
DROP POLICY IF EXISTS "anon lee config" ON public.app_config;
CREATE POLICY "anon lee config"
  ON public.app_config FOR SELECT TO anon USING (true);

-- ── promociones: lectura pública (clientes ven descuentos activos) ────────────
DROP POLICY IF EXISTS "anon lee promociones" ON public.promociones;
CREATE POLICY "anon lee promociones"
  ON public.promociones FOR SELECT TO anon USING (activa = true);

-- ── applied_rewards: inserción anónima (canjear recompensas) ──────────────────
DROP POLICY IF EXISTS "anon inserta rewards aplicados" ON public.applied_rewards;
CREATE POLICY "anon inserta rewards aplicados"
  ON public.applied_rewards FOR INSERT TO anon WITH CHECK (true);

-- ── rewards: lectura pública ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon lee rewards" ON public.rewards;
CREATE POLICY "anon lee rewards"
  ON public.rewards FOR SELECT TO anon USING (true);

DO $$
BEGIN
  RAISE NOTICE '019 aplicada: acceso anónimo para clientes QR';
END $$;
