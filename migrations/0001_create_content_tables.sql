-- The site's content, one table per kind of thing. `position` keeps the
-- order the owner arranged things in. A save replaces every row in one
-- transaction (server/content-store.ts), so there are no partial updates.

CREATE TABLE author (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  bio_short TEXT NOT NULL,
  photo_key TEXT,
  contact_email TEXT NOT NULL,
  newsletter_url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE theme (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  background_colour TEXT NOT NULL,
  text_colour TEXT NOT NULL,
  accent_colour TEXT NOT NULL,
  button_colour TEXT NOT NULL,
  button_text_colour TEXT NOT NULL,
  heading_font TEXT NOT NULL,
  body_font TEXT NOT NULL
);

CREATE TABLE social_links (
  position INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  series_name TEXT NOT NULL,
  series_position INTEGER,
  published_on TEXT NOT NULL,
  blurb TEXT NOT NULL,
  cover_key TEXT
);

CREATE TABLE buy_links (
  book_id TEXT NOT NULL REFERENCES books (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  PRIMARY KEY (book_id, position)
);

CREATE TABLE reviews (
  book_id TEXT NOT NULL REFERENCES books (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  quote TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (book_id, position)
);

CREATE TABLE news (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'event')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  happens_on TEXT NOT NULL,
  place TEXT NOT NULL,
  link_url TEXT NOT NULL
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  show_in_menu INTEGER NOT NULL
);

-- Each block type has different fields, so they are stored as JSON and
-- checked by the block schema (shared/blocks.ts) on every write and read.
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  fields_json TEXT NOT NULL
);
