export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ReportStatus = 'Submitted' | 'AI Triaged' | 'Assigned' | 'In Progress' | 'Resolved';

export type CivicCategory =
  | 'WATERLOGGING_DRAINAGE'
  | 'ROAD_INFRASTRUCTURE'
  | 'ELECTRICAL_STREETLIGHTS'
  | 'WASTE_SANITATION'
  | 'WATER_SUPPLY_LEAKAGE'
  | 'PUBLIC_SAFETY_OBSTRUCTION'
  | 'UNSURE';

export interface CivicReport {
  id: string;
  ticket_code: string;
  citizen_name: string;
  description: string;
  image_url: string | null;
  user_category: CivicCategory;
  ai_category: CivicCategory;
  ai_summary: string;
  latitude: number;
  longitude: number;
  address_label: string;
  priority_score: number;
  priority_level: PriorityLevel;
  factor_safety: number;
  factor_disruption: number;
  factor_cascading: number;
  factor_corroboration: number;
  ai_explanation: string;
  recommended_department: string;
  is_duplicate: boolean;
  duplicate_of_id: string | null;
  duplicate_confidence: number;
  corroboration_count: number;
  cluster_id: string | null;
  status: ReportStatus;
  assigned_crew: string | null;
  official_notes: string | null;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportStatusLog {
  id: string;
  report_id: string;
  previous_status: string | null;
  new_status: ReportStatus;
  actor: string;
  note: string;
  created_at: string;
}

export interface ActionBriefSequenceStep {
  step_number: number;
  department: string;
  action_directive: string;
  dependency_note: string;
}

export interface ClusterActionBrief {
  executive_headline: string;
  root_cause_diagnosis: string;
  operational_sequence: ActionBriefSequenceStep[];
  estimated_impact_if_delayed: string;
  field_equipment_checklist: string[];
}

export interface SpatialCluster {
  id: string;
  cluster_code: string;
  title: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  dominant_categories: string[];
  report_count: number;
  aggregate_priority: number;
  root_cause_hypothesis: string;
  action_brief: ClusterActionBrief;
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  reports?: CivicReport[];
}

export interface ReportsMetrics {
  totalReports: number;
  deduplicatedCount: number;
  criticalHazardsCount: number;
  activeClustersCount: number;
  resolvedCount: number;
}

export interface ReportsApiResponse {
  reports: CivicReport[];
  metrics: ReportsMetrics;
}

export interface SingleReportApiResponse {
  report: CivicReport;
  duplicate_reports: CivicReport[];
  status_logs: ReportStatusLog[];
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  storage_engine: 'supabase' | 'local-json-store';
  total_reports: number;
  total_clusters: number;
  gemini_ready: boolean;
}

export interface CreateReportPayload {
  citizen_name?: string;
  description: string;
  user_category: CivicCategory;
  latitude: number;
  longitude: number;
  address_label: string;
  image_url?: string | null;
}
