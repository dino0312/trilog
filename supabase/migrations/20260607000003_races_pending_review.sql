-- Migration: add pending_review status to races for review workflow
-- New races created by assistants default to pending_review,
-- awaiting confirmation on /admin/races/review

-- Extend CHECK constraint to include 'pending_review'
ALTER TABLE public.races
  DROP CONSTRAINT IF EXISTS races_status_check;

ALTER TABLE public.races
  ADD CONSTRAINT races_status_check
  CHECK (status IN ('active', 'inactive', 'cancelled', 'pending_review'));

-- New races default to pending_review
ALTER TABLE public.races
  ALTER COLUMN status SET DEFAULT 'pending_review';
