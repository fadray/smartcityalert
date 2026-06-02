-- Drop and recreate images column as jsonb
ALTER TABLE incidents DROP COLUMN IF EXISTS images;
ALTER TABLE incidents ADD COLUMN images JSONB DEFAULT '[]';
