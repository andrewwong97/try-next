CREATE TABLE IF NOT EXISTS hangouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  earliest_hour INTEGER NOT NULL DEFAULT 18,
  latest_hour INTEGER NOT NULL DEFAULT 23,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY,
  hangout_id TEXT NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
  google_sub TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  encrypted_refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hangout_id, google_sub)
);

CREATE INDEX IF NOT EXISTS participants_hangout_idx ON participants(hangout_id);
