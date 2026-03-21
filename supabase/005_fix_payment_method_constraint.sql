-- Fix: add 'transferencia' to payment_method CHECK constraint on table_sessions
-- The app supports transferencia but the original schema didn't include it

ALTER TABLE public.table_sessions
  DROP CONSTRAINT IF EXISTS table_sessions_payment_method_check;

ALTER TABLE public.table_sessions
  ADD CONSTRAINT table_sessions_payment_method_check
  CHECK (payment_method IN ('tarjeta', 'efectivo', 'transferencia', 'apple_pay'));
