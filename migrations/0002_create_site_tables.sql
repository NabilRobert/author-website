-- Everyone's portfolio sites and their content. Every content row carries
-- its site's id as part of its key, so two people's rows can never collide
-- and a save only ever touches its own site (server/content-write.ts).
-- `position` keeps the order the owner arranged things in.

CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE CASCADE,
  -- The address: framed.my.id/<name> (shared/names.ts).
  name TEXT NOT NULL UNIQUE,
  -- Set by Arthur to take a reported site down (README).
  is_hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE author (
  site_id TEXT PRIMARY KEY REFERENCES sites (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio_short TEXT NOT NULL,
  photo_key TEXT,
  photo_crop TEXT,
  contact_email TEXT NOT NULL,
  newsletter_url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE theme (
  site_id TEXT PRIMARY KEY REFERENCES sites (id) ON DELETE CASCADE,
  background_colour TEXT NOT NULL,
  text_colour TEXT NOT NULL,
  accent_colour TEXT NOT NULL,
  button_colour TEXT NOT NULL,
  button_text_colour TEXT NOT NULL,
  heading_font TEXT NOT NULL,
  body_font TEXT NOT NULL,
  background_pattern TEXT NOT NULL,
  pattern_colours TEXT,
  background_image_key TEXT
);

CREATE TABLE social_links (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  PRIMARY KEY (site_id, position)
);

CREATE TABLE books (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  series_name TEXT NOT NULL,
  series_position INTEGER,
  published_on TEXT NOT NULL,
  blurb TEXT NOT NULL,
  cover_key TEXT,
  cover_crop TEXT,
  PRIMARY KEY (site_id, id)
);

CREATE TABLE buy_links (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  PRIMARY KEY (site_id, book_id, position)
);

CREATE TABLE reviews (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  quote TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (site_id, book_id, position)
);

CREATE TABLE news (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'event')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  happens_on TEXT NOT NULL,
  place TEXT NOT NULL,
  link_url TEXT NOT NULL,
  PRIMARY KEY (site_id, id)
);

CREATE TABLE pages (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  position INTEGER NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  show_in_menu INTEGER NOT NULL,
  PRIMARY KEY (site_id, id),
  UNIQUE (site_id, slug)
);

-- Each block type has different fields, so they are stored as JSON and
-- checked by the block schema (shared/blocks.ts) on every write and read.
CREATE TABLE blocks (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  PRIMARY KEY (site_id, id)
);

-- Who uploaded which picture, for each site's limits (server/image-routes.ts).
CREATE TABLE images (
  key TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX images_site_idx ON images (site_id);

-- Visitors' reports of a page that breaks the rules, for Arthur to review.
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
