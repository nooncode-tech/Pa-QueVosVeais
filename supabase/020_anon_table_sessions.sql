-- ============================================================
-- 020: Políticas anon para table_sessions y qr_tokens
-- Sin esto, los clientes QR no pueden crear sesión de mesa
-- y admin/mesero nunca ven la mesa como ocupada.
-- ============================================================

-- ── table_sessions: anon puede insertar y actualizar ─────────────────────────
DROP POLICY IF EXISTS "anon inserta sesiones" ON public.table_sessions;
CREATE POLICY "anon inserta sesiones"
  ON public.table_sessions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon actualiza sesiones" ON public.table_sessions;
CREATE POLICY "anon actualiza sesiones"
  ON public.table_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ── qr_tokens: asegurar lectura anon explícita ───────────────────────────────
DROP POLICY IF EXISTS "anon lee qr_tokens" ON public.qr_tokens;
CREATE POLICY "anon lee qr_tokens"
  ON public.qr_tokens FOR SELECT TO anon USING (true);

-- ── orders: asegurar update anon (para actualizar status del pedido) ──────────
DROP POLICY IF EXISTS "anon actualiza pedidos" ON public.orders;
CREATE POLICY "anon actualiza pedidos"
  ON public.orders FOR UPDATE TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '020 aplicada: anon puede crear sesiones de mesa y actualizar pedidos';
END $$;
