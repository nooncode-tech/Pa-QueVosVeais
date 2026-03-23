-- ============================================================
-- Solo migraciones nuevas (013–017)
-- Para bases de datos que ya tienen el schema base (001–012)
-- ============================================================

-- ── Migration 013: Modifier groups ───────────────────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS grupos_modificadores JSONB DEFAULT '[]'::jsonb;

-- ── Migration 014: Allergen tags + Reservations ───────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS etiquetas JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.reservaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  telefono    TEXT,
  fecha       DATE NOT NULL,
  hora        TIME NOT NULL,
  personas    INTEGER NOT NULL DEFAULT 2,
  mesa        INTEGER,
  notas       TEXT,
  status      TEXT NOT NULL DEFAULT 'confirmada'
                CHECK (status IN ('confirmada', 'llegaron', 'cancelada', 'no-show')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage reservations" ON public.reservaciones;
CREATE POLICY "Admin can manage reservations"
  ON public.reservaciones FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Staff can read reservations" ON public.reservaciones;
CREATE POLICY "Staff can read reservations"
  ON public.reservaciones FOR SELECT
  USING (auth.role() = 'authenticated');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='reservaciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservaciones;
  END IF;
END $$;

-- ── Migration 015: Turnos, solicitudes_factura, sucursales ────────────────────
CREATE TABLE IF NOT EXISTS public.turnos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in    TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out   TIMESTAMPTZ,
  break_min   INTEGER NOT NULL DEFAULT 0,
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_turnos" ON public.turnos;
CREATE POLICY "admin_all_turnos" ON public.turnos FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "employee_own_turnos" ON public.turnos;
CREATE POLICY "employee_own_turnos" ON public.turnos FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "employee_create_turno" ON public.turnos;
CREATE POLICY "employee_create_turno" ON public.turnos FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "employee_update_own_turno" ON public.turnos;
CREATE POLICY "employee_update_own_turno" ON public.turnos FOR UPDATE
  USING (user_id = auth.uid() AND clock_out IS NULL);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='turnos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.solicitudes_factura (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT,
  mesa            INTEGER,
  total           NUMERIC(10,2) NOT NULL,
  rfc             TEXT NOT NULL,
  razon_social    TEXT NOT NULL,
  regimen_fiscal  TEXT NOT NULL,
  uso_cfdi        TEXT NOT NULL,
  email           TEXT NOT NULL,
  cp              TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendiente',
  cfdi_id         TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitudes_factura ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_solicitud_factura" ON public.solicitudes_factura;
CREATE POLICY "insert_solicitud_factura" ON public.solicitudes_factura
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_facturas" ON public.solicitudes_factura;
CREATE POLICY "admin_read_facturas" ON public.solicitudes_factura FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "admin_update_facturas" ON public.solicitudes_factura;
CREATE POLICY "admin_update_facturas" ON public.solicitudes_factura FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE TABLE IF NOT EXISTS public.sucursales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  direccion   TEXT,
  telefono    TEXT,
  activa      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_sucursales" ON public.sucursales;
CREATE POLICY "admin_all_sucursales" ON public.sucursales FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "read_sucursales" ON public.sucursales;
CREATE POLICY "read_sucursales" ON public.sucursales FOR SELECT USING (true);

INSERT INTO public.sucursales (nombre, direccion, telefono)
VALUES ('Pa'' Que Vos Veais', 'Insurgentes Sur, CDMX', '+52 55 1234 5678')
ON CONFLICT DO NOTHING;

-- ── Migration 016: CRM clientes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  telefono     TEXT UNIQUE,
  email        TEXT,
  direccion    TEXT,
  zona_reparto TEXT,
  total_pedidos INT NOT NULL DEFAULT 0,
  total_gastado NUMERIC(10,2) NOT NULL DEFAULT 0,
  ultimo_pedido TIMESTAMPTZ,
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access clientes" ON public.clientes;
CREATE POLICY "Admin full access clientes" ON public.clientes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes (telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre   ON public.clientes (nombre);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='clientes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_cliente(
  p_nombre     TEXT,
  p_telefono   TEXT DEFAULT NULL,
  p_direccion  TEXT DEFAULT NULL,
  p_zona       TEXT DEFAULT NULL,
  p_total      NUMERIC DEFAULT 0,
  p_fecha      TIMESTAMPTZ DEFAULT now()
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_telefono IS NOT NULL THEN
    INSERT INTO public.clientes (nombre, telefono, direccion, zona_reparto, total_pedidos, total_gastado, ultimo_pedido)
    VALUES (p_nombre, p_telefono, p_direccion, p_zona, 1, p_total, p_fecha)
    ON CONFLICT (telefono) DO UPDATE SET
      nombre        = EXCLUDED.nombre,
      direccion     = COALESCE(EXCLUDED.direccion, clientes.direccion),
      zona_reparto  = COALESCE(EXCLUDED.zona_reparto, clientes.zona_reparto),
      total_pedidos = clientes.total_pedidos + 1,
      total_gastado = clientes.total_gastado + p_total,
      ultimo_pedido = GREATEST(clientes.ultimo_pedido, p_fecha);
  ELSE
    INSERT INTO public.clientes (nombre, direccion, zona_reparto, total_pedidos, total_gastado, ultimo_pedido)
    VALUES (p_nombre, p_direccion, p_zona, 1, p_total, p_fecha);
  END IF;
END;
$$;

-- ── Migration 017: Columnas faltantes ─────────────────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS horario_disponible JSONB DEFAULT NULL;

ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS auto_print_comanda BOOLEAN NOT NULL DEFAULT false;

-- ── Verificación ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migraciones 013-017 aplicadas correctamente';
END $$;
