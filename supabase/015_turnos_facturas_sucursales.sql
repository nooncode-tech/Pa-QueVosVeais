-- Migration 015: Turnos de empleados, solicitudes de factura, sucursales
-- Apply in Supabase SQL Editor

-- ============================================================
-- TURNOS (employee shifts / time clock)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.turnos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in    TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out   TIMESTAMPTZ,
  break_min   INTEGER NOT NULL DEFAULT 0,    -- break minutes to deduct
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all; employees can only read/create their own
CREATE POLICY "admin_all_turnos" ON public.turnos
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "employee_own_turnos" ON public.turnos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "employee_create_turno" ON public.turnos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "employee_update_own_turno" ON public.turnos
  FOR UPDATE USING (user_id = auth.uid() AND clock_out IS NULL);

-- ============================================================
-- SOLICITUDES DE FACTURA (CFDI requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.solicitudes_factura (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  mesa            INTEGER,
  total           NUMERIC(10,2) NOT NULL,
  rfc             TEXT NOT NULL,
  razon_social    TEXT NOT NULL,
  regimen_fiscal  TEXT NOT NULL,   -- e.g. "601 - General de Ley"
  uso_cfdi        TEXT NOT NULL,   -- e.g. "G01 - Adquisición de bienes"
  email           TEXT NOT NULL,
  cp              TEXT NOT NULL,   -- código postal del receptor
  status          TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente | procesada | cancelada
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitudes_factura ENABLE ROW LEVEL SECURITY;

-- Anon/authenticated can insert (client requests from table)
CREATE POLICY "insert_solicitud_factura" ON public.solicitudes_factura
  FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "admin_read_facturas" ON public.solicitudes_factura
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can update (mark as processed)
CREATE POLICY "admin_update_facturas" ON public.solicitudes_factura
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- SUCURSALES (multi-location)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sucursales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  direccion   TEXT,
  telefono    TEXT,
  activa      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_sucursales" ON public.sucursales
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "read_sucursales" ON public.sucursales
  FOR SELECT USING (true);

-- Insert default sucursal
INSERT INTO public.sucursales (nombre, direccion, telefono)
VALUES ('Pa'' Que Vos Veais', 'Insurgentes Sur, CDMX', '+52 55 1234 5678')
ON CONFLICT DO NOTHING;

-- Enable realtime on turnos
ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;
