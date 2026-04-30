-- ── Video Purge Support: Add failure tracking columns to public_videos ─────────
--
-- This migration adds columns needed for the purge-broken functionality:
--   1. failure_count - tracks consecutive validation failures
--   2. last_checked_at - tracks when video was last validated
--
-- These columns allow the system to:
--   - Mark videos as inactive after multiple failures
--   - Hard delete videos after reaching max failure threshold
--   - Prioritize checking videos that haven't been checked recently

-- Add failure_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'public_videos' 
      AND column_name = 'failure_count'
  ) THEN
    ALTER TABLE public.public_videos 
    ADD COLUMN failure_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add last_checked_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'public_videos' 
      AND column_name = 'last_checked_at'
  ) THEN
    ALTER TABLE public.public_videos 
    ADD COLUMN last_checked_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index on last_checked_at for efficient querying of unchecked videos
CREATE INDEX IF NOT EXISTS idx_public_videos_last_checked 
  ON public.public_videos(last_checked_at ASC NULLS FIRST) 
  WHERE is_active = true;

-- Create index on failure_count for monitoring
CREATE INDEX IF NOT EXISTS idx_public_videos_failure_count 
  ON public.public_videos(failure_count) 
  WHERE is_active = true;

-- Create composite index for efficient purge queries
CREATE INDEX IF NOT EXISTS idx_public_videos_purge 
  ON public.public_videos(is_active, last_checked_at ASC NULLS FIRST, failure_count DESC)
  WHERE is_active = true;

-- Ensure sort_order column exists (used by use-video-discovery)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'public_videos' 
      AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.public_videos 
    ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update existing rows to have reasonable defaults
UPDATE public.public_videos 
SET 
  failure_count = COALESCE(failure_count, 0),
  sort_order = COALESCE(sort_order, 0)
WHERE failure_count IS NULL OR sort_order IS NULL;