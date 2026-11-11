-- Wrong-password logins per account, for the lockout in
-- server/sign-in-lockout.ts. Rows older than the lockout window are
-- deleted as new ones arrive, and a correct login clears an account's rows.
CREATE TABLE sign_in_failures (
  email TEXT NOT NULL,
  failed_at TEXT NOT NULL
);
CREATE INDEX sign_in_failures_by_email ON sign_in_failures (email, failed_at);
