-- Page views per site, per page, per day (server/visits.ts). No cookies and
-- nothing about who visited: only a count. Kept for 90 days.
CREATE TABLE visits (
  site_id TEXT NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (site_id, day, path)
);
