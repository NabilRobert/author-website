-- The content box's settings (colour, opacity, corners, width) as JSON
-- (shared/theme.ts: panelSchema). NULL means the default box.
ALTER TABLE theme ADD COLUMN panel TEXT;
