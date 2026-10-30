import {
  CivicReport,
  ClusterActionBrief,
  CreateReportPayload,
  ReportsApiResponse,
  SingleReportApiResponse,
  SpatialCluster,
  SystemHealth,
} from '../types/civic';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function fetchReports(params?: {
  status?: string;
  category?: string;
  priority_level?: string;
  include_duplicates?: boolean;
}): Promise<ReportsApiResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.category) query.append('category', params.category);
  if (params?.priority_level) query.append('priority_level', params.priority_level);
  if (params?.include_duplicates !== undefined) {
    query.append('include_duplicates', String(params.include_duplicates));
  }

  const url = `${API_BASE_URL}/reports${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reports (${res.status})`);
  return res.json();
}

export async function fetchReportDetails(
  ticketOrId: string
): Promise<SingleReportApiResponse> {
  const res = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(ticketOrId)}`);
  if (!res.ok) throw new Error(`Failed to fetch report ${ticketOrId} (${res.status})`);
  return res.json();
}

export async function submitCitizenReport(payload: CreateReportPayload): Promise<{
  success: boolean;
  data: CivicReport;
  master_report?: CivicReport | null;
  nearby_candidates_checked: number;
  ai_engine_used: string;
}> {
  const res = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Submission failed (${res.status})`);
  }
  return res.json();
}

export async function updateReportWorkflow(
  reportId: string,
  updates: {
    status: string;
    assigned_crew?: string | null;
    official_notes: string;
    actor?: string;
  }
): Promise<{
  success: boolean;
  data: CivicReport;
  synced_duplicate_children: number;
}> {
  const res = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(reportId)}/workflow`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Workflow update failed (${res.status})`);
  }
  return res.json();
}

export async function fetchClusters(): Promise<{ clusters: SpatialCluster[] }> {
  const res = await fetch(`${API_BASE_URL}/clusters`);
  if (!res.ok) throw new Error(`Failed to fetch clusters (${res.status})`);
  return res.json();
}

export async function generateClusterActionBrief(clusterId: string): Promise<{
  success: boolean;
  cluster: SpatialCluster;
  action_brief: ClusterActionBrief;
}> {
  const res = await fetch(
    `${API_BASE_URL}/clusters/${encodeURIComponent(clusterId)}/action-brief`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to generate brief (${res.status})`);
  }
  return res.json();
}

export async function resetSyntheticSeed(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/seed/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to reset seed data (${res.status})`);
  return res.json();
}
