-- Migration: Add phone and professional_summary columns to candidates table
-- Description: Store phone number and professional summary extracted from resumes

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS professional_summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN candidates.phone IS 'Phone number extracted from resume or manually entered';
COMMENT ON COLUMN candidates.professional_summary IS 'Professional summary extracted from resume or manually entered';
