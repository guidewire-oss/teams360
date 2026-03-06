-- Remove color column from hierarchy_levels table
ALTER TABLE hierarchy_levels DROP COLUMN IF EXISTS color;
