-- The background pattern's four colours, as JSON (shared/theme.ts:
-- patternColours). NULL means all automatic.
ALTER TABLE theme ADD COLUMN pattern_colours TEXT;
