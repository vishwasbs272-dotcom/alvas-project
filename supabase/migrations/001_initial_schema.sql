-- STRATUM.AI - Initial Database Schema & RLS Policies
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.spatial_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_code VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 250,
  dominant_categories TEXT[] NOT NULL DEFAULT '{}',
  report_count INTEGER NOT NULL DEFAULT 0,
  aggregate_priority INTEGER NOT NULL DEFAULT 0,
  root_cause_hypothesis TEXT,
  action_brief JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISPATCHED', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.civic_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_code VARCHAR(32) UNIQUE NOT NULL,
  citizen_name VARCHAR(120) NOT NULL DEFAULT 'Anonymous Citizen',
  description TEXT NOT NULL,
  image_url TEXT,
  user_category VARCHAR(64) NOT NULL,
  ai_category VARCHAR(64) NOT NULL,
  ai_summary VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address_label VARCHAR(255) NOT NULL,
  
  -- Prioritization & Explainability
  priority_score INTEGER NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
  priority_level VARCHAR(16) NOT NULL CHECK (priority_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  factor_safety INTEGER NOT NULL DEFAULT 0 CHECK (factor_safety >= 0 AND factor_safety <= 40),
  factor_disruption INTEGER NOT NULL DEFAULT 0 CHECK (factor_disruption >= 0 AND factor_disruption <= 25),
  factor_cascading INTEGER NOT NULL DEFAULT 0 CHECK (factor_cascading >= 0 AND factor_cascading <= 20),
  factor_corroboration INTEGER NOT NULL DEFAULT 0 CHECK (factor_corroboration >= 0 AND factor_corroboration <= 15),
  ai_explanation TEXT NOT NULL,
  recommended_department VARCHAR(120) NOT NULL,
  
  -- Deduplication & Clustering
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  duplicate_of_id UUID REFERENCES public.civic_reports(id) ON DELETE SET NULL,
  duplicate_confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  corroboration_count INTEGER NOT NULL DEFAULT 1,
  cluster_id UUID REFERENCES public.spatial_clusters(id) ON DELETE SET NULL,
  
  -- Workflow & Action Tracking
  status VARCHAR(32) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'AI Triaged', 'Assigned', 'In Progress', 'Resolved')),
  assigned_crew VARCHAR(120),
  official_notes TEXT,
  is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.civic_reports(id) ON DELETE CASCADE,
  previous_status VARCHAR(32),
  new_status VARCHAR(32) NOT NULL,
  actor VARCHAR(120) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_civic_reports_priority ON public.civic_reports(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status ON public.civic_reports(status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_coords ON public.civic_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_civic_reports_cluster ON public.civic_reports(cluster_id);

-- Row Level Security (RLS)
ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for transparency (no PII is stored)
CREATE POLICY "Allow public read access to civic_reports"
  ON public.civic_reports FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to spatial_clusters"
  ON public.spatial_clusters FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to report_status_logs"
  ON public.report_status_logs FOR SELECT
  USING (true);

-- Backend service_role or authenticated municipal operators perform writes
CREATE POLICY "Allow service role full access on civic_reports"
  ON public.civic_reports FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on spatial_clusters"
  ON public.spatial_clusters FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on report_status_logs"
  ON public.report_status_logs FOR ALL
  USING (true)
  WITH CHECK (true);

