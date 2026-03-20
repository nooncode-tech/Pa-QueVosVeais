-- ============================================================
-- Pa' Que Vos Veáis POS — Reembolsos y Configuración
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Refunds ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.refunds (
  id                   text        PRIMARY KEY,
  order_id             text        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  session_id           text,
  monto                numeric(10,2) NOT NULL,
  motivo               text        NOT NULL DEFAULT '',
  tipo                 text        NOT NULL CHECK (tipo IN ('total', 'parcial')),
  items_reembolsados   jsonb,
  inventario_revertido boolean     DEFAULT true,
  user_id              text,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer reembolsos"
  ON public.refunds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin puede gestionar reembolsos"
  ON public.refunds FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- ── App Config (single row) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  id                              text    PRIMARY KEY DEFAULT 'default',
  impuesto_porcentaje             numeric DEFAULT 16,
  propina_sugerida_porcentaje     numeric DEFAULT 15,
  tiempo_expiracion_sesion_minutos integer DEFAULT 180,
  zonas_reparto                   jsonb   DEFAULT '["Centro","Roma","Condesa"]'::jsonb,
  horarios_operacion              jsonb   DEFAULT '[]'::jsonb,
  metodos_pago_activos            jsonb   DEFAULT '{"efectivo":true,"tarjeta":true,"transferencia":true}'::jsonb,
  sonido_nuevos_pedidos           boolean DEFAULT true,
  notificaciones_stock_bajo       boolean DEFAULT true,
  updated_at                      timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer config"
  ON public.app_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin puede modificar config"
  ON public.app_config FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Fila inicial
INSERT INTO public.app_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
