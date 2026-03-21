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
