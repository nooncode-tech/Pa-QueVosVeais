-- ============================================================
-- Pa' Que Vos Veáis POS — Schema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Helper: role desde JWT (evita referencias circulares en RLS) ─────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(auth.jwt()->'user_metadata'->>'role', '')
$$;

-- ── Profiles (roles de usuario, linked a auth.users) ────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text        UNIQUE NOT NULL,
  nombre     text        NOT NULL,
  role       text        NOT NULL CHECK (role IN ('admin', 'mesero', 'cocina_a', 'cocina_b')),
  activo     boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer perfiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin puede modificar perfiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Insertar los 5 perfiles (IDs de los usuarios creados via API)
INSERT INTO public.profiles (id, username, nombre, role) VALUES
  ('d3f9bc6e-594f-4322-bc03-82d435773683', 'admin',    'Administrador', 'admin'),
  ('9cbd8c7e-69ba-4dfb-b11c-817c999c8825', 'mesero1',  'Juan Pérez',    'mesero'),
  ('e2e620df-05a3-4673-b8c4-4fc582b616af', 'mesero2',  'María García',  'mesero'),
  ('6cab487a-a594-4db7-b393-00fe89d76904', 'cocina_a', 'Cocina A',      'cocina_a'),
  ('1dc55693-937d-43e1-ae98-4c0930ff65a6', 'cocina_b', 'Cocina B',      'cocina_b')
ON CONFLICT (id) DO NOTHING;

-- ── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       text        NOT NULL,
  orden      integer     DEFAULT 0,
  activa     boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer categorias"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin puede modificar categorias"
  ON public.categories FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Categorías por defecto
INSERT INTO public.categories (id, name, orden, activa) VALUES
  ('cat-1', 'Tacos',     1, true),
  ('cat-2', 'Antojitos', 2, true),
  ('cat-3', 'Bebidas',   3, true),
  ('cat-4', 'Postres',   4, true)
ON CONFLICT (id) DO NOTHING;

-- ── Menu Items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.menu_items (
  id          text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        text        NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  category_id text        REFERENCES public.categories(id) ON DELETE SET NULL,
  available   boolean     DEFAULT true,
  image       text,
  cocina      text        DEFAULT 'cocina_a' CHECK (cocina IN ('cocina_a', 'cocina_b', 'ambas')),
  orden       integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer menu"
  ON public.menu_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin puede modificar menu"
  ON public.menu_items FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Platillos por defecto
INSERT INTO public.menu_items (id, name, description, price, category_id, available, cocina, orden) VALUES
  ('taco-pastor',            'Taco al Pastor',                 'Cerdo marinado con achiote, piña, cebolla y cilantro',    35, 'cat-1', true, 'cocina_a', 1),
  ('taco-bistec',            'Taco de Bistec',                 'Bistec de res a la plancha con cebolla y cilantro',        40, 'cat-1', true, 'cocina_a', 2),
  ('taco-carnitas',          'Taco de Carnitas',               'Cerdo confitado al estilo Michoacán',                     38, 'cat-1', true, 'cocina_a', 3),
  ('taco-suadero',           'Taco de Suadero',                'Carne de res suave y jugosa',                              38, 'cat-1', true, 'cocina_a', 4),
  ('taco-chorizo',           'Taco de Chorizo',                'Chorizo artesanal con papas',                              35, 'cat-1', true, 'cocina_a', 5),
  ('quesadilla-flor',        'Quesadilla de Flor de Calabaza', 'Tortilla de maíz con queso Oaxaca y flor de calabaza',    55, 'cat-2', true, 'cocina_b', 1),
  ('quesadilla-huitlacoche', 'Quesadilla de Huitlacoche',     'Tortilla de maíz con queso Oaxaca y huitlacoche',         60, 'cat-2', true, 'cocina_b', 2),
  ('sope-chorizo',           'Sope de Chorizo',                'Base de masa con frijoles, chorizo, crema y queso',        50, 'cat-2', true, 'cocina_b', 3),
  ('sope-tinga',             'Sope de Tinga',                  'Base de masa con frijoles, tinga de pollo, crema y queso',50, 'cat-2', true, 'cocina_b', 4),
  ('tlacoyos',               'Tlacoyos de Frijol',             'Masa rellena de frijol negro con nopales y queso',         45, 'cat-2', true, 'cocina_b', 5),
  ('gorditas',               'Gorditas de Chicharrón',         'Masa de maíz rellena de chicharrón prensado',              48, 'cat-2', true, 'cocina_b', 6),
  ('agua-horchata',          'Agua de Horchata',               'Bebida tradicional de arroz con canela',                   35, 'cat-3', true, 'ambas',    1),
  ('agua-jamaica',           'Agua de Jamaica',                'Infusión de flor de jamaica',                              35, 'cat-3', true, 'ambas',    2),
  ('agua-tamarindo',         'Agua de Tamarindo',              'Bebida de tamarindo natural',                              35, 'cat-3', true, 'ambas',    3),
  ('refresco',               'Refresco',                       'Coca-Cola, Sprite, Fanta',                                 30, 'cat-3', true, 'ambas',    4),
  ('cerveza',                'Cerveza',                        'Corona, Victoria, Modelo',                                 45, 'cat-3', true, 'ambas',    5),
  ('flan',                   'Flan Napolitano',                'Flan casero con caramelo',                                 45, 'cat-4', true, 'cocina_b', 1),
  ('churros',                'Churros con Chocolate',          '3 churros con chocolate caliente',                         50, 'cat-4', true, 'cocina_b', 2)
ON CONFLICT (id) DO NOTHING;

-- ── Storage bucket para imágenes ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imágenes del menu son públicas"
  ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Solo admin puede subir imágenes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.get_my_role() = 'admin');

CREATE POLICY "Solo admin puede eliminar imágenes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.get_my_role() = 'admin');

-- ── Orders ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                       text        PRIMARY KEY,
  numero                   integer     NOT NULL DEFAULT 0,
  canal                    text        NOT NULL CHECK (canal IN ('mesa', 'mesero', 'para_llevar', 'delivery')),
  mesa                     integer,
  items                    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  status                   text        NOT NULL DEFAULT 'recibido' CHECK (status IN ('recibido', 'preparando', 'listo', 'empacado', 'en_camino', 'entregado', 'cancelado')),
  cocina_a_status          text        NOT NULL DEFAULT 'en_cola' CHECK (cocina_a_status IN ('en_cola', 'preparando', 'listo')),
  cocina_b_status          text        NOT NULL DEFAULT 'en_cola' CHECK (cocina_b_status IN ('en_cola', 'preparando', 'listo')),
  nombre_cliente           text,
  telefono                 text,
  direccion                text,
  zona_reparto             text,
  repartidor_id            text,
  claimed_by_kitchen       text        CHECK (claimed_by_kitchen IN ('cocina_a', 'cocina_b')),
  cancelado                boolean     DEFAULT false,
  cancel_reason            text,
  cancel_motivo            text,
  cancelado_por            text,
  session_id               text,
  tiempo_inicio_preparacion timestamptz,
  tiempo_fin_preparacion   timestamptz,
  cancelado_at             timestamptz,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer pedidos"
  ON public.orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados pueden insertar pedidos"
  ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden actualizar pedidos"
  ON public.orders FOR UPDATE TO authenticated USING (true);

-- ── Table Sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id              text        PRIMARY KEY,
  mesa            integer     NOT NULL,
  activa          boolean     DEFAULT true,
  bill_status     text        NOT NULL DEFAULT 'abierta' CHECK (bill_status IN ('abierta', 'cerrada', 'pagada')),
  subtotal        numeric(10,2) DEFAULT 0,
  impuestos       numeric(10,2) DEFAULT 0,
  propina         numeric(10,2) DEFAULT 0,
  descuento       numeric(10,2) DEFAULT 0,
  descuento_motivo text,
  total           numeric(10,2) DEFAULT 0,
  payment_method  text        CHECK (payment_method IN ('tarjeta', 'efectivo', 'apple_pay')),
  payment_status  text        NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'solicitado', 'pagado', 'reembolsado')),
  device_id       text,
  feedback_done   boolean     DEFAULT false,
  paid_at         timestamptz,
  receipt_id      text,
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer sesiones"
  ON public.table_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados pueden insertar sesiones"
  ON public.table_sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden actualizar sesiones"
  ON public.table_sessions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticados pueden eliminar sesiones"
  ON public.table_sessions FOR DELETE TO authenticated USING (true);

-- ── Realtime ──────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
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
-- ============================================================
-- Pa' Que Vos Veáis POS — Realtime + Mesas persistentes
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Habilitar Realtime en tablas existentes (seguro si ya existe) ──────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['menu_items','categories','app_config','refunds']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ── Configuración de mesas (persistente) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tables_config (
  id          text    PRIMARY KEY,
  numero      integer NOT NULL UNIQUE,
  nombre      text,
  capacidad   integer NOT NULL DEFAULT 4,
  activa      boolean DEFAULT true,
  ubicacion   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tables_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer mesas"
  ON public.tables_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin puede gestionar mesas"
  ON public.tables_config FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- 12 mesas por defecto
INSERT INTO public.tables_config (id, numero, nombre, capacidad, activa)
SELECT 'table-' || i, i, 'Mesa ' || i, 4, true
FROM generate_series(1, 12) AS t(i)
ON CONFLICT (id) DO NOTHING;

-- ── Habilitar Realtime para tables_config (después de crearla) ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tables_config;
  END IF;
END $$;
-- Fix: add 'transferencia' to payment_method CHECK constraint on table_sessions
-- The app supports transferencia but the original schema didn't include it

ALTER TABLE public.table_sessions
  DROP CONSTRAINT IF EXISTS table_sessions_payment_method_check;

ALTER TABLE public.table_sessions
  ADD CONSTRAINT table_sessions_payment_method_check
  CHECK (payment_method IN ('tarjeta', 'efectivo', 'transferencia', 'apple_pay'));
-- Add receta and extras columns to menu_items so they persist to Supabase
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS receta  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extras  jsonb DEFAULT '[]'::jsonb;
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
-- ============================================================
-- Pa' Que Vos Veáis POS — Migration 008
-- Tabla waiter_calls para llamadas de mesero en tiempo real
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id          text        PRIMARY KEY,
  mesa        integer     NOT NULL,
  tipo        text        NOT NULL CHECK (tipo IN ('atencion', 'cuenta', 'otro')),
  mensaje     text,
  atendido    boolean     NOT NULL DEFAULT false,
  atendido_por text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  atendido_at timestamptz
);

-- RLS: todos los roles autenticados pueden leer y escribir llamadas
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read waiter_calls"
  ON public.waiter_calls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated insert waiter_calls"
  ON public.waiter_calls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated update waiter_calls"
  ON public.waiter_calls FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Clientes (anon) pueden insertar llamadas desde la vista de QR
CREATE POLICY "anon insert waiter_calls"
  ON public.waiter_calls FOR INSERT
  TO anon
  WITH CHECK (true);

-- Habilitar Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'waiter_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
  END IF;
END $$;

-- Índice para queries frecuentes (llamadas no atendidas por mesa)
CREATE INDEX IF NOT EXISTS idx_waiter_calls_atendido ON public.waiter_calls (atendido, created_at DESC);
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
-- Migration 010: audit_logs, applied_rewards, qr_tokens
-- Run date: 2026-03-21

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          text PRIMARY KEY,
  user_id     text NOT NULL DEFAULT 'anonymous',
  accion      text NOT NULL,
  detalles    text NOT NULL DEFAULT '',
  entidad     text NOT NULL DEFAULT '',
  entidad_id  text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx    ON audit_logs (user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_read"   ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- ── applied_rewards ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applied_rewards (
  id          text PRIMARY KEY,
  session_id  text NOT NULL,
  reward_id   text NOT NULL,
  descuento   numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applied_rewards_session_idx ON applied_rewards (session_id);

ALTER TABLE applied_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applied_rewards_read"   ON applied_rewards FOR SELECT USING (true);
CREATE POLICY "applied_rewards_insert" ON applied_rewards FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE applied_rewards;

-- ── qr_tokens ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_tokens (
  id          text PRIMARY KEY,
  mesa        integer NOT NULL,
  token       text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  session_id  text,
  activo      boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS qr_tokens_mesa_idx   ON qr_tokens (mesa, activo);
CREATE INDEX IF NOT EXISTS qr_tokens_token_idx  ON qr_tokens (token);

ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qr_tokens_read"   ON qr_tokens FOR SELECT USING (true);
CREATE POLICY "qr_tokens_write"  ON qr_tokens FOR ALL   USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE qr_tokens;
-- Migration 011: feedback_done en table_sessions
-- Run date: 2026-03-21

ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS feedback_done boolean NOT NULL DEFAULT false;
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
-- Migration 013: Modifier groups for menu items
-- Allows admins to define required/optional customizations per dish
-- e.g. "Término de cocción" (required, single choice), "¿Con qué salsa?" (required, single choice)

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS grupos_modificadores JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.menu_items.grupos_modificadores IS
  'Array of ModifierGroup: [{id, nombre, requerido, tipo: unico|multiple, opciones: [{id, nombre, precioExtra}]}]';
-- Migration 014: Allergen tags + Reservations
-- Apply in Supabase SQL Editor

-- ── 1. Allergen/dietary tags on menu items ───────────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS etiquetas JSONB DEFAULT '[]'::jsonb;

-- ── 2. Reservations table ────────────────────────────────────────────────────
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

-- RLS
ALTER TABLE public.reservaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage reservations"
  ON public.reservaciones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Staff can read reservations"
  ON public.reservaciones
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservaciones;
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
-- ============================================================
-- 017: Columnas faltantes y correcciones de esquema
-- ============================================================

-- 1. Horario de disponibilidad por platillo
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS horario_disponible JSONB DEFAULT NULL;

COMMENT ON COLUMN public.menu_items.horario_disponible IS
  'Rango horario en que el platillo aparece en el menú. Ej: {"inicio":"08:00","fin":"14:00"}';

-- 2. Auto-impresión de comanda en configuración global
ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS auto_print_comanda BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.app_config.auto_print_comanda IS
  'Si está activo, imprime automáticamente el ticket de cocina al crear cada orden.';

-- ============================================================
-- Verificación: muestra columnas añadidas
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Migración 017 aplicada correctamente:';
  RAISE NOTICE '  ✓ menu_items.horario_disponible';
  RAISE NOTICE '  ✓ app_config.auto_print_comanda';
END $$;
