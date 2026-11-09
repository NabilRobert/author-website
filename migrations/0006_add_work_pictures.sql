-- Every work now has its own page unless show_page is 0, and can have more
-- pictures than its cover, shown as a gallery on that page.
ALTER TABLE works ADD COLUMN show_page INTEGER NOT NULL DEFAULT 1;

CREATE TABLE work_pictures (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  work_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  image_key TEXT NOT NULL,
  image_crop TEXT,
  description TEXT NOT NULL,
  PRIMARY KEY (site_id, work_id, position)
);
