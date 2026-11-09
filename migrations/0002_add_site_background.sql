-- The site's background: a pattern, or a picture that replaces it
-- (shared/theme.ts). Existing sites keep a plain background.
ALTER TABLE theme ADD COLUMN background_pattern TEXT NOT NULL DEFAULT 'none';
ALTER TABLE theme ADD COLUMN background_image_key TEXT;
