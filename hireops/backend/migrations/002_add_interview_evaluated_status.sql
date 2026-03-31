-- Migration: Extend applicationstatus enum with INTERVIEW_EVALUATED
-- Date: 2026-03-31
-- Purpose: Allow the backend to record that the AI voice interview has been evaluated.

ALTER TYPE applicationstatus ADD VALUE 'INTERVIEW_EVALUATED';