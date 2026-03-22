# Database Migrations

All migrations live in `/supabase/*.sql`. They must be applied **in order** directly in the Supabase SQL Editor or via the Supabase CLI.

## Status

| # | File | Description | Applied |
|---|------|-------------|---------|
| 001 | `001_initial_schema.sql` | Tables: profiles, categories, menu_items, orders, order_items, config | ✅ |
| 002 | `002_ingredients.sql` | Ingredients, inventory_adjustments, deduct_ingredients RPC | ✅ |
| 003 | `003_refunds_config.sql` | Refunds table, config table | ✅ |
| 004 | `004_realtime_tables.sql` | Enable Realtime on key tables | ✅ |
| 005 | `005_fix_payment_method_constraint.sql` | Add apple_pay, transferencia to payment enum | ✅ |
| 006 | `006_menu_items_recipe_extras.sql` | Add receta (JSONB) and extras (JSONB) columns to menu_items | ✅ |
| 007 | `007_orders_fixes_inventory_rpc.sql` | Order table fixes, inventory deduction RPC improvements | ✅ |
| 008 | `008_waiter_calls.sql` | waiter_calls table + RLS | ✅ |
| 009 | `009_rewards_delivery_zones.sql` | rewards and delivery_zones tables | ✅ |
| 010 | `010_audit_applied_rewards_qr.sql` | audit_logs, applied_rewards, QR support columns | ✅ |
| 011 | `011_session_feedback.sql` | table_sessions feedback columns | ✅ |
| 012 | `012_security_atomic_order.sql` | RLS hardening + create_order_atomic RPC | ⚠️ **PENDING** |
| 013 | `013_modifier_groups.sql` | Add grupos_modificadores JSONB column to menu_items | ⚠️ **PENDING** |
| 014 | `014_etiquetas_reservaciones.sql` | Add etiquetas (allergen tags) to menu_items + reservaciones table | ⚠️ **PENDING** |

## How to apply a migration

### Option A — Supabase SQL Editor (recommended for production)
1. Open [app.supabase.com](https://app.supabase.com) → your project
2. Go to **SQL Editor**
3. Paste the contents of the migration file
4. Click **Run**

### Option B — Supabase CLI
```bash
supabase db push
# or apply a specific file:
supabase db execute --file supabase/012_security_atomic_order.sql
```

## ⚠️ Migration 012 — apply before next production deployment

`012_security_atomic_order.sql` must be applied **before** the next deployment because:

1. It restricts write access on `rewards` and `delivery_zones` to `role = 'admin'` (currently any authenticated user can write).
2. It creates the `create_order_atomic` RPC that the frontend already calls in `lib/context.tsx`. Without it, every order creation will fail with a "function not found" error.

**Apply it now in the SQL Editor — it is safe to run on the existing data.**
