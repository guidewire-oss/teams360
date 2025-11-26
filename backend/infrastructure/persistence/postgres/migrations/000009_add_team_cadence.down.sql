-- Remove cadence column from teams table
ALTER TABLE teams DROP COLUMN IF EXISTS cadence;
