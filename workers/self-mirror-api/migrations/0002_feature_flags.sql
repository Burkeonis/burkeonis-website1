CREATE TABLE feature_flags (
  flag_key TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

INSERT INTO feature_flags (flag_key, enabled, updated_at) VALUES
  ('ABYSS_ENABLED', 1, unixepoch() * 1000),
  ('VOICE_ENABLED', 0, unixepoch() * 1000),
  ('OLLAMA_ENABLED', 1, unixepoch() * 1000),
  ('BILLING_ENABLED', 1, unixepoch() * 1000),
  ('BLOG_ENABLED', 0, unixepoch() * 1000)
ON CONFLICT(flag_key) DO NOTHING;
