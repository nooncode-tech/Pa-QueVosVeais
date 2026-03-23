-- 016: CRM básico — tabla de clientes
-- Captures customer info from delivery / para_llevar orders

CREATE TABLE IF NOT EXISTS clientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  telefono    text UNIQUE,            -- used as dedup key
  email       text,
  direccion   text,                   -- last known address
  zona_reparto text,
  total_pedidos int NOT NULL DEFAULT 0,
  total_gastado numeric(10,2) NOT NULL DEFAULT 0,
  ultimo_pedido timestamptz,
  notas       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access clientes"
  ON clientes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes (telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre   ON clientes (nombre);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;

-- RPC: upsert a client record from an order
-- If a record with the same telefono exists, update counters; otherwise insert.
CREATE OR REPLACE FUNCTION upsert_cliente(
  p_nombre     text,
  p_telefono   text DEFAULT NULL,
  p_direccion  text DEFAULT NULL,
  p_zona       text DEFAULT NULL,
  p_total      numeric DEFAULT 0,
  p_fecha      timestamptz DEFAULT now()
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_telefono IS NOT NULL THEN
    INSERT INTO clientes (nombre, telefono, direccion, zona_reparto, total_pedidos, total_gastado, ultimo_pedido)
    VALUES (p_nombre, p_telefono, p_direccion, p_zona, 1, p_total, p_fecha)
    ON CONFLICT (telefono) DO UPDATE SET
      nombre        = EXCLUDED.nombre,
      direccion     = COALESCE(EXCLUDED.direccion, clientes.direccion),
      zona_reparto  = COALESCE(EXCLUDED.zona_reparto, clientes.zona_reparto),
      total_pedidos = clientes.total_pedidos + 1,
      total_gastado = clientes.total_gastado + p_total,
      ultimo_pedido = GREATEST(clientes.ultimo_pedido, p_fecha);
  ELSE
    INSERT INTO clientes (nombre, direccion, zona_reparto, total_pedidos, total_gastado, ultimo_pedido)
    VALUES (p_nombre, p_direccion, p_zona, 1, p_total, p_fecha);
  END IF;
END;
$$;
