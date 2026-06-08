CREATE SCHEMA IF NOT EXISTS meddler;
SET search_path TO meddler, public;

CREATE TABLE IF NOT EXISTS api_keys (
  id           SERIAL PRIMARY KEY,
  provider     TEXT NOT NULL,
  label        TEXT NOT NULL DEFAULT 'default',
  ciphertext   TEXT NOT NULL,
  iv           TEXT NOT NULL,
  auth_tag     TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrate older single-account schema in place.
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT 'default';
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_key;
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_provider_label_idx ON api_keys (provider, label);

-- Microsoft TTS support has been removed.
DELETE FROM api_keys WHERE provider = 'microsoft';

CREATE TABLE IF NOT EXISTS tts_history (
  id           SERIAL PRIMARY KEY,
  provider     TEXT NOT NULL,
  account_id   INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  voice        TEXT,
  text         TEXT NOT NULL,
  bytes        INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tts_history ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS crawl_history (
  id          SERIAL PRIMARY KEY,
  source      TEXT NOT NULL,
  input_url   TEXT NOT NULL,
  result_url  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
