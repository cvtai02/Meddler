CREATE SCHEMA IF NOT EXISTS meddler;
SET search_path TO meddler, public;

CREATE TABLE IF NOT EXISTS api_keys (
  id           SERIAL PRIMARY KEY,
  provider     TEXT NOT NULL UNIQUE,
  ciphertext   TEXT NOT NULL,
  iv           TEXT NOT NULL,
  auth_tag     TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tts_history (
  id          SERIAL PRIMARY KEY,
  provider    TEXT NOT NULL,
  voice       TEXT,
  text        TEXT NOT NULL,
  bytes       INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crawl_history (
  id          SERIAL PRIMARY KEY,
  source      TEXT NOT NULL,
  input_url   TEXT NOT NULL,
  result_url  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
