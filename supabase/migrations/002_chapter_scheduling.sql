-- ─────────────────────────────────────────────────────────────────────────────
-- Adds per-chapter scheduling (mirrors stories.scheduled_at)
-- Run AFTER 001_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_chapters_scheduled ON chapters(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_stories_scheduled  ON stories(scheduled_at)  WHERE status = 'scheduled';
