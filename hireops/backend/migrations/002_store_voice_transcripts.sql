-- Migration: Persist Voice Interview Transcripts
-- Date: 2026-03-31
-- Purpose: Keep raw transcripts on the applications table so evaluation can replay real sessions

ALTER TABLE applications ADD COLUMN IF NOT EXISTS voice_transcript TEXT;

-- Backfill placeholder data to avoid null values (optional)
UPDATE applications
SET voice_transcript = ''
WHERE voice_transcript IS NULL;