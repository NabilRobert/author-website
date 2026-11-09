-- How the author photo and book covers sit in their frames: focus point and
-- zoom, as JSON (shared/fields.ts: imageCropSchema). NULL means centred.
ALTER TABLE author ADD COLUMN photo_crop TEXT;
ALTER TABLE books ADD COLUMN cover_crop TEXT;
