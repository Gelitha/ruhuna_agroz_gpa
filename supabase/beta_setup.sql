-- ============================================================================
-- Ruhuna Agri GPA — Temporary Beta Testing Database Setup (Supabase / PostgreSQL)
-- ============================================================================
-- Purpose: Temporary 30-day retention beta diagnostics & usage analytics.
-- Security: Row Level Security (RLS) enabled on all tables with NO public
--           policies. Only the server-side Vercel API (using service_role)
--           can insert, update, or delete records.
-- Monitoring: Use Supabase Table Editor or SQL Editor as the authorized developer.
-- ============================================================================

-- Enable pgcrypto if not already enabled for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Anonymous Beta Users
CREATE TABLE IF NOT EXISTS public.beta_users (
  anon_id TEXT PRIMARY KEY,
  device_category TEXT,
  browser TEXT,
  os TEXT,
  screen_dimensions TEXT,
  language_preference TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2. Consent Audit Log (Separate Analytics & Academic Diagnostics Consent)
CREATE TABLE IF NOT EXISTS public.beta_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  analytics_consent BOOLEAN NOT NULL DEFAULT FALSE,
  academic_consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  action TEXT NOT NULL CHECK (action IN ('granted', 'updated', 'withdrawn', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_beta_consents_anon_id ON public.beta_consents (anon_id);
CREATE INDEX IF NOT EXISTS idx_beta_consents_expires_at ON public.beta_consents (expires_at);

-- 3. Beta Sessions & Performance Metrics
CREATE TABLE IF NOT EXISTS public.beta_sessions (
  session_id TEXT PRIMARY KEY,
  anon_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  views_visited JSONB NOT NULL DEFAULT '[]'::jsonb,
  performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_beta_sessions_anon_id ON public.beta_sessions (anon_id);
CREATE INDEX IF NOT EXISTS idx_beta_sessions_expires_at ON public.beta_sessions (expires_at);

-- 4. Academic Calculation Snapshots & Diagnostics (No PII: no names, no reg numbers)
CREATE TABLE IF NOT EXISTS public.beta_academic_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  session_id TEXT,
  snapshot_hash TEXT NOT NULL,
  programme TEXT NOT NULL,
  academic_year INTEGER,
  current_semester TEXT,
  profile_count INTEGER NOT NULL DEFAULT 1,
  courses JSONB NOT NULL DEFAULT '[]'::jsonb,
  gpa_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  planning_diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  discrepancies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_beta_snapshots_anon_id ON public.beta_academic_snapshots (anon_id);
CREATE INDEX IF NOT EXISTS idx_beta_snapshots_hash ON public.beta_academic_snapshots (anon_id, snapshot_hash);
CREATE INDEX IF NOT EXISTS idx_beta_snapshots_created_at ON public.beta_academic_snapshots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_snapshots_expires_at ON public.beta_academic_snapshots (expires_at);

-- 5. Feature Usage Events
CREATE TABLE IF NOT EXISTS public.beta_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  feature_area TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_beta_events_anon_id ON public.beta_events (anon_id);
CREATE INDEX IF NOT EXISTS idx_beta_events_name ON public.beta_events (event_name);
CREATE INDEX IF NOT EXISTS idx_beta_events_expires_at ON public.beta_events (expires_at);

-- 6. Sanitized Error Logs
CREATE TABLE IF NOT EXISTS public.beta_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  session_id TEXT,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  stack_preview TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_beta_errors_created_at ON public.beta_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_errors_expires_at ON public.beta_errors (expires_at);

-- 7. Voluntary Student Feedback
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  session_id TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  message TEXT NOT NULL,
  page_context TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON public.beta_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_expires_at ON public.beta_feedback (expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (Prevent All Public Reads & Writes)
-- ============================================================================
ALTER TABLE public.beta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_academic_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke direct privileges from anon and authenticated roles.
-- Only service_role (used strictly server-side in Vercel API) can access these tables.
REVOKE ALL ON public.beta_users FROM anon, authenticated;
REVOKE ALL ON public.beta_consents FROM anon, authenticated;
REVOKE ALL ON public.beta_sessions FROM anon, authenticated;
REVOKE ALL ON public.beta_academic_snapshots FROM anon, authenticated;
REVOKE ALL ON public.beta_events FROM anon, authenticated;
REVOKE ALL ON public.beta_errors FROM anon, authenticated;
REVOKE ALL ON public.beta_feedback FROM anon, authenticated;

-- ============================================================================
-- RETENTION CLEANUP & PERMANENT DELETION INSTRUCTIONS
-- ============================================================================
-- A. Delete expired records (30-day retention limit):
--    DELETE FROM public.beta_events WHERE expires_at < NOW();
--    DELETE FROM public.beta_errors WHERE expires_at < NOW();
--    DELETE FROM public.beta_academic_snapshots WHERE expires_at < NOW();
--    DELETE FROM public.beta_sessions WHERE expires_at < NOW();
--    DELETE FROM public.beta_feedback WHERE expires_at < NOW();
--    DELETE FROM public.beta_consents WHERE expires_at < NOW();
--    DELETE FROM public.beta_users WHERE expires_at < NOW();
--
-- B. Delete a specific student's data upon request (replace <ANON_ID>):
--    DELETE FROM public.beta_events WHERE anon_id = '<ANON_ID>';
--    DELETE FROM public.beta_errors WHERE anon_id = '<ANON_ID>';
--    DELETE FROM public.beta_academic_snapshots WHERE anon_id = '<ANON_ID>';
--    DELETE FROM public.beta_sessions WHERE anon_id = '<ANON_ID>';
--    DELETE FROM public.beta_feedback WHERE anon_id = '<ANON_ID>';
--    DELETE FROM public.beta_consents WHERE anon_id = '<ANON_ID>';
--    DELETE FROM public.beta_users WHERE anon_id = '<ANON_ID>';
--
-- C. Permanently delete ALL beta data after testing concludes:
--    DROP TABLE IF EXISTS public.beta_events;
--    DROP TABLE IF EXISTS public.beta_errors;
--    DROP TABLE IF EXISTS public.beta_academic_snapshots;
--    DROP TABLE IF EXISTS public.beta_sessions;
--    DROP TABLE IF EXISTS public.beta_feedback;
--    DROP TABLE IF EXISTS public.beta_consents;
--    DROP TABLE IF EXISTS public.beta_users;
-- ============================================================================
