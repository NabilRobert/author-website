-- Invites for signing up while Framed is invite-only (server/invites.ts).
-- `email`, if set, is the only address the invite works for; `used_at` is
-- set once someone signs up with it.
CREATE TABLE invites (
  code TEXT PRIMARY KEY,
  email TEXT,
  created_at TEXT NOT NULL,
  used_at TEXT
);
