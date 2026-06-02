-- Update incidents table to use text columns instead of JSON
ALTER TABLE incidents ALTER COLUMN images TYPE TEXT;
ALTER TABLE incidents ALTER COLUMN escalation_history TYPE TEXT;
ALTER TABLE incidents ALTER COLUMN resolution_proofs TYPE TEXT;
ALTER TABLE incidents ALTER COLUMN approvals TYPE TEXT;
