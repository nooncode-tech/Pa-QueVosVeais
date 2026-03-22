-- Migration 011: feedback_done en table_sessions
-- Run date: 2026-03-21

ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS feedback_done boolean NOT NULL DEFAULT false;
