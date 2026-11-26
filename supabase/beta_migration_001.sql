-- ============================================================================
-- Ruhuna Agri GPA — Incremental Beta Migration 001
-- ============================================================================
-- Applies:
--   1. Deduplication + UNIQUE constraint on beta_academic_snapshots (anon_id, snapshot_hash)
--   2. Server-side ownership verification column (secret_hash) on beta_users
--   3. Daily pg_cron cleanup job for 30-day retention (expires_at < NOW())
-- ============================================================================

-- 1. Remove any existing duplicate (anon_id, snapshot_hash) rows, keeping the earliest
DELETE FROM public.beta_academic_snapshots a
USING public.beta_academic_snapshots b
WHERE a.ctid > b.ctid
  AND a.anon_id = b.anon_id
  AND a.snapshot_hash = b.snapshot_hash;

-- Add uniqueness constraint if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_beta_snapshots_anon_hash'
      AND conrelid = 'public.beta_academic_snapshots'::regclass
  ) THEN
    ALTER TABLE public.beta_academic_snapshots
      ADD CONSTRAINT uq_beta_snapshots_anon_hash UNIQUE (anon_id, snapshot_hash);
  END IF;
END $$;

-- 2. Add hashed browser credential column for server-side ownership verification
ALTER TABLE public.beta_users
  ADD COLUMN IF NOT EXISTS secret_hash TEXT;

-- 3. Configure daily automatic 30-day retention cleanup via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'beta_cleanup_expired_records'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'beta_cleanup_expired_records',
    '0 3 * * *',
    $cron$
      DELETE FROM public.beta_events WHERE expires_at < NOW();
      DELETE FROM public.beta_errors WHERE expires_at < NOW();
      DELETE FROM public.beta_academic_snapshots WHERE expires_at < NOW();
      DELETE FROM public.beta_sessions WHERE expires_at < NOW();
      DELETE FROM public.beta_feedback WHERE expires_at < NOW();
      DELETE FROM public.beta_consents WHERE expires_at < NOW();
      DELETE FROM public.beta_users WHERE expires_at < NOW();
    $cron$
  );
END $$;
