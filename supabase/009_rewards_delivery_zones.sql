-- Migration 009: rewards + delivery_zones tables
-- Run date: 2026-03-21

-- ── delivery_zones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_zones (
  nombre         text PRIMARY KEY,
  costo_envio    numeric(10,2) NOT NULL DEFAULT 0,
  tiempo_estimado integer NOT NULL DEFAULT 30,
  activa         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_zones_read"   ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "delivery_zones_write"  ON delivery_zones FOR ALL   USING (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_zones;

-- Seed default zones
INSERT INTO delivery_zones (nombre, costo_envio, tiempo_estimado, activa) VALUES
  ('Centro',    25, 20, true),
  ('Roma',      30, 25, true),
  ('Condesa',   30, 25, true),
  ('Juarez',    35, 30, true),
  ('Polanco',   45, 35, true),
  ('Del Valle', 40, 35, true),
  ('Coyoacan',  50, 40, true),
  ('Santa Fe',  60, 45, false)
ON CONFLICT (nombre) DO NOTHING;

-- ── rewards ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id             text PRIMARY KEY,
  nombre         text NOT NULL,
  descripcion    text NOT NULL DEFAULT '',
  tipo           text NOT NULL CHECK (tipo IN ('porcentaje', 'monto_fijo')),
  valor          numeric(10,2) NOT NULL DEFAULT 0,
  accion         text NOT NULL CHECK (accion IN ('seguir_instagram','primera_visita','cumpleanos','referido')),
  activo         boolean NOT NULL DEFAULT true,
  usos_maximos   integer,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_read"   ON rewards FOR SELECT USING (true);
CREATE POLICY "rewards_write"  ON rewards FOR ALL   USING (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;

-- Seed default rewards
INSERT INTO rewards (id, nombre, descripcion, tipo, valor, accion, activo, usos_maximos) VALUES
  ('reward_instagram', 'Seguir en Instagram', '10% de descuento por seguirnos en Instagram', 'porcentaje', 10, 'seguir_instagram', true, 1),
  ('reward_primera',   'Primera Visita',      '15% de descuento en tu primera visita',       'porcentaje', 15, 'primera_visita',  true, 1),
  ('reward_cumple',    'Cumpleaños',          '$50 de descuento en tu cumpleaños',            'monto_fijo', 50, 'cumpleanos',      true, 1),
  ('reward_referido',  'Referido',            '5% de descuento por traer un amigo',           'porcentaje',  5, 'referido',        true, null)
ON CONFLICT (id) DO NOTHING;
