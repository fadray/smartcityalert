-- Drop and recreate images column as JSONB
ALTER TABLE incidents DROP COLUMN IF EXISTS images CASCADE;
ALTER TABLE incidents ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
