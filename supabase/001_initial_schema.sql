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
