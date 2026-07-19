PRAGMA foreign_keys = ON;

CREATE TABLE users (
  firebase_uid TEXT PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE entitlements (
  firebase_uid TEXT PRIMARY KEY,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'plus', 'pro', 'founder', 'admin')),
  subscription_status TEXT NOT NULL,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  last_webhook_update INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
);

CREATE TABLE usage_windows (
  subject_hash TEXT NOT NULL,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  window_ends_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  provider_cost_micros INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subject_hash, feature, provider, window_started_at)
);

CREATE TABLE webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL,
  processing_status TEXT NOT NULL
);

CREATE TABLE operational_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  result_code TEXT NOT NULL,
  subject_hash TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_usage_window_end ON usage_windows(window_ends_at);
CREATE INDEX idx_operational_events_created ON operational_events(created_at);
