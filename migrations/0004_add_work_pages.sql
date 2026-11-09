-- A work's own page (/<name>/work/<page_slug>); '' means it has none. The
-- page's blocks go in the blocks table with page_id set to the work's id.
ALTER TABLE works ADD COLUMN page_slug TEXT NOT NULL DEFAULT '';
