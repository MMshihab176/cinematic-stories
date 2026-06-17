-- ─────────────────────────────────────────────────────────────────────────────
-- Cinematic Stories — Full Database Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID and vector extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Series ──────────────────────────────────────────────────────────────────
CREATE TABLE series (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Stories ─────────────────────────────────────────────────────────────────
CREATE TABLE stories (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  synopsis           TEXT,
  cover_image_url    TEXT,
  genre              TEXT NOT NULL DEFAULT 'drama',
  mood               TEXT NOT NULL DEFAULT 'default',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled')),
  tags               TEXT[] DEFAULT '{}',
  series_id          UUID REFERENCES series(id) ON DELETE SET NULL,
  series_order       INTEGER,
  atmosphere_config  JSONB NOT NULL DEFAULT '{}',
  published_at       TIMESTAMPTZ,
  scheduled_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_status   ON stories(status);
CREATE INDEX idx_stories_slug     ON stories(slug);
CREATE INDEX idx_stories_genre    ON stories(genre);
CREATE INDEX idx_stories_series   ON stories(series_id);

-- ─── Chapters ────────────────────────────────────────────────────────────────
CREATE TABLE chapters (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id       UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled')),
  audio_tracks   JSONB NOT NULL DEFAULT '[]',
  word_count     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

CREATE INDEX idx_chapters_story  ON chapters(story_id);
CREATE INDEX idx_chapters_status ON chapters(status);

-- ─── Media Assets ────────────────────────────────────────────────────────────
CREATE TABLE media_assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id    UUID REFERENCES stories(id) ON DELETE SET NULL,
  label       TEXT NOT NULL DEFAULT '',
  file_url    TEXT NOT NULL,
  file_type   TEXT NOT NULL CHECK (file_type IN ('image','audio','pdf','document','other')),
  mime_type   TEXT NOT NULL DEFAULT '',
  size_bytes  BIGINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_story    ON media_assets(story_id);
CREATE INDEX idx_media_filetype ON media_assets(file_type);

-- ─── Story Embeddings (RAG / AI Chatbot) ─────────────────────────────────────
CREATE TABLE story_embeddings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_story ON story_embeddings(story_id);

-- Nearest-neighbor index for fast similarity search
CREATE INDEX idx_embeddings_vec
  ON story_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Reading Progress ────────────────────────────────────────────────────────
CREATE TABLE reading_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL,
  story_id        UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id      UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  scroll_position INTEGER DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  last_read_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_progress_user  ON reading_progress(user_id);
CREATE INDEX idx_progress_story ON reading_progress(story_id);

-- ─── Bookmarks ───────────────────────────────────────────────────────────────
CREATE TABLE bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- ─── Comments ────────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  content    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_story  ON comments(story_id);
CREATE INDEX idx_comments_status ON comments(status);

-- ─── Chatbot Rate Limiting ────────────────────────────────────────────────────
CREATE TABLE chatbot_rate_limits (
  ip_hash    TEXT NOT NULL,
  hour_key   TEXT NOT NULL,  -- e.g. '2024-01-15-14'
  count      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (ip_hash, hour_key)
);

-- ─── Functions & Triggers ────────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_story_embeddings(
  query_embedding vector(1536),
  story_uuid      UUID,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (
  content    TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.content,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM story_embeddings se
  WHERE se.story_id = story_uuid
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ─── Row-Level Security (RLS) ─────────────────────────────────────────────────

ALTER TABLE stories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE series           ENABLE ROW LEVEL SECURITY;

-- PUBLIC: read published stories only
CREATE POLICY "public_read_stories" ON stories
  FOR SELECT USING (status = 'published');

CREATE POLICY "public_read_series" ON series
  FOR SELECT USING (TRUE);

CREATE POLICY "public_read_published_chapters" ON chapters
  FOR SELECT USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM stories s
      WHERE s.id = chapters.story_id AND s.status = 'published'
    )
  );

CREATE POLICY "public_read_media" ON media_assets
  FOR SELECT USING (TRUE);

CREATE POLICY "public_read_embeddings" ON story_embeddings
  FOR SELECT USING (TRUE);

-- READERS: own reading progress and bookmarks
CREATE POLICY "readers_own_progress" ON reading_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "readers_own_bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "readers_read_approved_comments" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "readers_insert_comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ADMIN: service role bypasses RLS – all admin writes use SUPABASE_SERVICE_ROLE_KEY
-- These policies allow admin to see drafts when reading via the service client
CREATE POLICY "admin_all_stories" ON stories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_chapters" ON chapters
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_media" ON media_assets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_embeddings" ON story_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_comments" ON comments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_series" ON series
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket (or via API)
-- Bucket: story-media  → public
-- Bucket: audio-tracks → public
-- Bucket: documents    → public

-- Public read for all buckets, upload only via service role
-- Configure in: Dashboard → Storage → Policies
