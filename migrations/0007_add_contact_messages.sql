-- When each contact-form message was sent, and a salted hash of who sent
-- it, only to limit how many get through (server/contact-messages.ts). The
-- messages themselves are emailed, never stored. Rows older than a day are
-- deleted as new ones arrive.
CREATE TABLE contact_messages (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  sender_hash TEXT NOT NULL,
  sent_at TEXT NOT NULL
);
CREATE INDEX contact_messages_site_idx ON contact_messages (site_id, sent_at);
