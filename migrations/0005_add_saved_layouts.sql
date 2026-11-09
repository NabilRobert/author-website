-- Pages the owner saved as layouts (shared/schema.ts: savedLayoutSchema).
-- Their blocks go in the blocks table with page_id set to the layout's id.
CREATE TABLE saved_layouts (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (site_id, id)
);
