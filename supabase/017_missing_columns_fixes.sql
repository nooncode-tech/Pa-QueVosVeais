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
