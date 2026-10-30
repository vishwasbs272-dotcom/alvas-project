import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getSupabase } from '../config/supabase.js';
import {
  SEED_CLUSTERS,
  SEED_REPORTS,
  SEED_STATUS_LOGS,
  SyntheticCluster,
  SyntheticReport,
  SyntheticStatusLog,
} from '../data/syntheticSeedData.js';
import { TriageResult } from './geminiService.js';
import { calculateHaversineDistanceMeters } from './spatialService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNTIME_STORE_DIR = __dirname.includes('dist')
  ? path.resolve(__dirname, '../../src/data')
  : path.resolve(__dirname, '../data');
const RUNTIME_STORE_PATH = path.resolve(RUNTIME_STORE_DIR, 'runtimeStore.json');

interface RuntimeStoreSchema {
  clusters: SyntheticCluster[];
  reports: SyntheticReport[];
  status_logs: SyntheticStatusLog[];
}

// In-memory cache + file sync
let localStore: RuntimeStoreSchema = {
  clusters: [],
  reports: [],
  status_logs: [],
};

function loadLocalStore(): void {
  try {
    if (fs.existsSync(RUNTIME_STORE_PATH)) {
      const raw = fs.readFileSync(RUNTIME_STORE_PATH, 'utf-8');
      localStore = JSON.parse(raw);
      console.log(`[STORAGE] Loaded ${localStore.reports.length} reports and ${localStore.clusters.length} clusters from runtimeStore.json`);
    } else {
      console.log('[STORAGE] runtimeStore.json not found. Initializing with synthetic seed data.');
      resetLocalStoreToSeed();
    }
  } catch (err) {
    console.error('[STORAGE] Error loading runtimeStore.json, seeding defaults:', err);
    resetLocalStoreToSeed();
  }
}

function saveLocalStore(): void {
  try {
    fs.mkdirSync(path.dirname(RUNTIME_STORE_PATH), { recursive: true });
    fs.writeFileSync(RUNTIME_STORE_PATH, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[STORAGE] Failed to write runtimeStore.json:', err);
  }
}

function resetLocalStoreToSeed(): void {
  localStore = {
    clusters: JSON.parse(JSON.stringify(SEED_CLUSTERS)),
    reports: JSON.parse(JSON.stringify(SEED_REPORTS)),
    status_logs: JSON.parse(JSON.stringify(SEED_STATUS_LOGS)),
  };
  saveLocalStore();
}

// Initialize on boot
loadLocalStore();

export class StorageService {
  private static isSupabaseActive(): boolean {
    return getSupabase() !== null;
  }

  static getEngineName(): 'supabase' | 'local-json-store' {
    return this.isSupabaseActive() ? 'supabase' : 'local-json-store';
  }

  static async getHealth(): Promise<{
    storage_engine: string;
    total_reports: number;
    total_clusters: number;
    gemini_ready: boolean;
  }> {
    const supabase = getSupabase();
    let totalReports = localStore.reports.length;
    let totalClusters = localStore.clusters.length;

    if (supabase) {
      try {
        const { count: repCount } = await supabase.from('civic_reports').select('*', { count: 'exact', head: true });
        const { count: clusCount } = await supabase.from('spatial_clusters').select('*', { count: 'exact', head: true });
        if (repCount !== null && repCount !== undefined) totalReports = repCount;
        if (clusCount !== null && clusCount !== undefined) totalClusters = clusCount;
      } catch (err) {
        // Fallback to local
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const gemini_ready = Boolean(geminiKey && geminiKey.length > 5 && geminiKey !== 'your_google_gemini_api_key_here');

    return {
      storage_engine: this.getEngineName(),
      total_reports: totalReports,
      total_clusters: totalClusters,
      gemini_ready,
    };
  }

  static async resetAllData(): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('report_status_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('civic_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('spatial_clusters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        await supabase.from('spatial_clusters').insert(SEED_CLUSTERS);
        await supabase.from('civic_reports').insert(SEED_REPORTS);
        await supabase.from('report_status_logs').insert(SEED_STATUS_LOGS);

        resetLocalStoreToSeed();
        return { success: true, message: 'Reset Supabase database and local store with 40 synthetic seed reports.' };
      } catch (err) {
        console.warn('[STORAGE] Supabase reset error, falling back to local reset:', err);
      }
    }

    resetLocalStoreToSeed();
    return { success: true, message: 'Reset local JSON store with 40 synthetic seed reports.' };
  }

  static async getReports(filters: {
    status?: string;
    category?: string;
    priority_level?: string;
    include_duplicates?: string;
  }): Promise<{
    reports: SyntheticReport[];
    metrics: {
      totalReports: number;
      deduplicatedCount: number;
      criticalHazardsCount: number;
      activeClustersCount: number;
      resolvedCount: number;
    };
  }> {
    const supabase = getSupabase();
    let allReports = [...localStore.reports];

    if (supabase) {
      try {
        const { data, error } = await supabase.from('civic_reports').select('*').order('priority_score', { ascending: false });
        if (!error && data) {
          allReports = data as SyntheticReport[];
        }
      } catch (err) {
        // Fallback to localStore
      }
    }

    // Compute Metrics across all reports
    const totalReports = allReports.length;
    const deduplicatedCount = allReports.filter((r) => r.is_duplicate).length;
    const criticalHazardsCount = allReports.filter((r) => r.priority_level === 'CRITICAL' && r.status !== 'Resolved').length;
    const resolvedCount = allReports.filter((r) => r.status === 'Resolved').length;

    let activeClustersCount = localStore.clusters.filter((c) => c.status === 'ACTIVE').length;
    if (supabase) {
      try {
        const { count } = await supabase.from('spatial_clusters').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
        if (count !== null && count !== undefined) activeClustersCount = count;
      } catch (e) {}
    }

    // Apply filtering
    let filtered = allReports;

    if (filters.include_duplicates !== 'true') {
      filtered = filtered.filter((r) => !r.is_duplicate);
    }

    if (filters.status) {
      filtered = filtered.filter((r) => r.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters.category) {
      filtered = filtered.filter(
        (r) =>
          r.ai_category.toLowerCase() === filters.category?.toLowerCase() ||
          r.user_category.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    if (filters.priority_level) {
      filtered = filtered.filter((r) => r.priority_level === filters.priority_level);
    }

    // Always sort by priority_score DESC
    filtered.sort((a, b) => b.priority_score - a.priority_score);

    return {
      reports: filtered,
      metrics: {
        totalReports,
        deduplicatedCount,
        criticalHazardsCount,
        activeClustersCount,
        resolvedCount,
      },
    };
  }

  static async getReportByIdOrTicket(ticketOrId: string): Promise<{
    report: SyntheticReport | null;
    duplicate_reports: SyntheticReport[];
    status_logs: SyntheticStatusLog[];
  }> {
    const supabase = getSupabase();
    let report: SyntheticReport | null = null;
    let duplicate_reports: SyntheticReport[] = [];
    let status_logs: SyntheticStatusLog[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('civic_reports')
          .select('*')
          .or(`id.eq.${ticketOrId},ticket_code.eq.${ticketOrId}`)
          .single();

        if (!error && data) {
          report = data as SyntheticReport;
          // Fetch duplicates of this report
          const { data: dups } = await supabase
            .from('civic_reports')
            .select('*')
            .eq('duplicate_of_id', report.id)
            .order('created_at', { ascending: false });
          if (dups) duplicate_reports = dups;

          // Fetch status logs
          const { data: logs } = await supabase
            .from('report_status_logs')
            .select('*')
            .eq('report_id', report.id)
            .order('created_at', { ascending: true });
          if (logs) status_logs = logs;

          return { report, duplicate_reports, status_logs };
        }
      } catch (err) {
        // Fallback to localStore
      }
    }

    // Local JSON search
    report =
      localStore.reports.find(
        (r) => r.id === ticketOrId || r.ticket_code.toLowerCase() === ticketOrId.toLowerCase()
      ) || null;

    if (report) {
      duplicate_reports = localStore.reports.filter((r) => r.duplicate_of_id === report!.id);
      status_logs = localStore.status_logs
        .filter((l) => l.report_id === report!.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return { report, duplicate_reports, status_logs };
  }

  static async createReport(
    input: {
      citizen_name?: string;
      description: string;
      user_category: string;
      latitude: number;
      longitude: number;
      address_label: string;
      image_url?: string | null;
    },
    triage: TriageResult
  ): Promise<{
    report: SyntheticReport;
    master_report?: SyntheticReport | null;
  }> {
    const newId = crypto.randomUUID();
    const ticketNumber = 1000 + localStore.reports.length + 1;
    const ticket_code = `REP-${ticketNumber}`;
    const nowIso = new Date().toISOString();

    let is_duplicate = triage.is_duplicate;
    let duplicate_of_id: string | null = null;
    let master_report: SyntheticReport | null = null;

    // Resolve master report if duplicate detected
    if (is_duplicate && triage.duplicate_of_ticket_code) {
      const foundMaster = localStore.reports.find(
        (r) =>
          r.ticket_code.toLowerCase() === triage.duplicate_of_ticket_code?.toLowerCase() ||
          r.id === triage.duplicate_of_ticket_code
      );
      if (foundMaster) {
        duplicate_of_id = foundMaster.id;
        master_report = foundMaster;
        // Boost master corroboration count and score
        foundMaster.corroboration_count = (foundMaster.corroboration_count || 1) + 1;
        foundMaster.factor_corroboration = Math.min(15, foundMaster.factor_corroboration + 2);
        foundMaster.priority_score = Math.min(
          100,
          foundMaster.factor_safety +
            foundMaster.factor_disruption +
            foundMaster.factor_cascading +
            foundMaster.factor_corroboration
        );
        if (foundMaster.priority_score >= 80) foundMaster.priority_level = 'CRITICAL';
        else if (foundMaster.priority_score >= 60) foundMaster.priority_level = 'HIGH';
        else if (foundMaster.priority_score >= 35) foundMaster.priority_level = 'MEDIUM';
        foundMaster.updated_at = nowIso;
      } else {
        is_duplicate = false;
      }
    }

    // Determine cluster assignment (find closest cluster within radius)
    let assignedClusterId: string | null = null;
    for (const cluster of localStore.clusters) {
      const dist = calculateHaversineDistanceMeters(
        input.latitude,
        input.longitude,
        cluster.center_lat,
        cluster.center_lng
      );
      if (dist <= cluster.radius_meters) {
        assignedClusterId = cluster.id;
        cluster.report_count += 1;
        if (!cluster.dominant_categories.includes(triage.ai_category)) {
          cluster.dominant_categories.push(triage.ai_category);
        }
        break;
      }
    }

    const newReport: SyntheticReport = {
      id: newId,
      ticket_code,
      citizen_name: input.citizen_name || 'Anonymous Citizen',
      description: input.description,
      image_url: input.image_url || null,
      user_category: input.user_category,
      ai_category: triage.ai_category,
      ai_summary: triage.ai_summary,
      latitude: input.latitude,
      longitude: input.longitude,
      address_label: input.address_label,
      priority_score: triage.priority_score,
      priority_level: triage.priority_level,
      factor_safety: triage.factor_safety,
      factor_disruption: triage.factor_disruption,
      factor_cascading: triage.factor_cascading,
      factor_corroboration: triage.factor_corroboration,
      ai_explanation: triage.ai_explanation,
      recommended_department: triage.recommended_department,
      is_duplicate,
      duplicate_of_id,
      duplicate_confidence: triage.duplicate_confidence,
      corroboration_count: 1,
      cluster_id: assignedClusterId,
      status: 'AI Triaged',
      assigned_crew: null,
      official_notes: null,
      is_synthetic: false,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Audit logs
    const logSubmitted: SyntheticStatusLog = {
      id: crypto.randomUUID(),
      report_id: newId,
      previous_status: null,
      new_status: 'Submitted',
      actor: `${newReport.citizen_name} (Mobile Portal)`,
      note: 'Citizen captured incident report with GPS coordinates.',
      created_at: nowIso,
    };

    const logTriaged: SyntheticStatusLog = {
      id: crypto.randomUUID(),
      report_id: newId,
      previous_status: 'Submitted',
      new_status: 'AI Triaged',
      actor: `STRATUM-CORE (${triage.ai_engine})`,
      note: is_duplicate
        ? `Linked as duplicate of ${triage.duplicate_of_ticket_code} (${Math.round(triage.duplicate_confidence * 100)}% confidence). Master corroboration incremented.`
        : `Assigned Priority ${triage.priority_score}/100 (${triage.priority_level}) for ${triage.recommended_department}.`,
      created_at: new Date(Date.now() + 1000).toISOString(),
    };

    // Save to localStore
    localStore.reports.unshift(newReport);
    localStore.status_logs.push(logSubmitted, logTriaged);
    saveLocalStore();

    // Supabase persist if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('civic_reports').insert(newReport);
        await supabase.from('report_status_logs').insert([logSubmitted, logTriaged]);
        if (master_report) {
          await supabase.from('civic_reports').update({
            corroboration_count: master_report.corroboration_count,
            factor_corroboration: master_report.factor_corroboration,
            priority_score: master_report.priority_score,
            priority_level: master_report.priority_level,
            updated_at: nowIso,
          }).eq('id', master_report.id);
        }
      } catch (err) {
        console.warn('[STORAGE] Supabase insert failed, local JSON store is intact:', err);
      }
    }

    return { report: newReport, master_report };
  }

  static async updateWorkflow(
    reportId: string,
    updates: {
      status: 'Submitted' | 'AI Triaged' | 'Assigned' | 'In Progress' | 'Resolved';
      assigned_crew?: string | null;
      official_notes?: string | null;
      actor?: string;
    }
  ): Promise<{
    report: SyntheticReport | null;
    updatedChildDuplicatesCount: number;
  }> {
    const reportIndex = localStore.reports.findIndex((r) => r.id === reportId || r.ticket_code === reportId);
    if (reportIndex === -1) {
      return { report: null, updatedChildDuplicatesCount: 0 };
    }

    const report = localStore.reports[reportIndex];
    const prevStatus = report.status;
    const nowIso = new Date().toISOString();

    report.status = updates.status;
    if (updates.assigned_crew !== undefined) report.assigned_crew = updates.assigned_crew;
    if (updates.official_notes !== undefined) report.official_notes = updates.official_notes;
    report.updated_at = nowIso;

    // Log the event
    const statusLog: SyntheticStatusLog = {
      id: crypto.randomUUID(),
      report_id: report.id,
      previous_status: prevStatus,
      new_status: updates.status,
      actor: updates.actor || 'Municipal Duty Officer',
      note: updates.official_notes || `Status transitioned from ${prevStatus} to ${updates.status}. Assigned crew: ${updates.assigned_crew || 'Unassigned'}`,
      created_at: nowIso,
    };
    localStore.status_logs.push(statusLog);

    // Synchronize linked duplicates
    const childDuplicates = localStore.reports.filter((r) => r.duplicate_of_id === report.id);
    for (const child of childDuplicates) {
      child.status = updates.status;
      child.assigned_crew = updates.assigned_crew ?? null;
      child.official_notes = updates.official_notes ?? null;
      child.updated_at = nowIso;

      localStore.status_logs.push({
        id: crypto.randomUUID(),
        report_id: child.id,
        previous_status: prevStatus,
        new_status: updates.status,
        actor: updates.actor || 'Municipal Duty Officer',
        note: `Status synchronized from master ticket ${report.ticket_code}: ${updates.official_notes || updates.status}`,
        created_at: nowIso,
      });
    }

    saveLocalStore();

    // Supabase mirror
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('civic_reports').update({
          status: report.status,
          assigned_crew: report.assigned_crew,
          official_notes: report.official_notes,
          updated_at: nowIso,
        }).eq('id', report.id);

        await supabase.from('report_status_logs').insert(statusLog);

        if (childDuplicates.length > 0) {
          await supabase.from('civic_reports').update({
            status: report.status,
            assigned_crew: report.assigned_crew,
            official_notes: report.official_notes,
            updated_at: nowIso,
          }).eq('duplicate_of_id', report.id);
        }
      } catch (err) {
        console.warn('[STORAGE] Supabase workflow update mirror error:', err);
      }
    }

    return {
      report,
      updatedChildDuplicatesCount: childDuplicates.length,
    };
  }

  static async getClusters(): Promise<Array<SyntheticCluster & { reports: SyntheticReport[] }>> {
    const supabase = getSupabase();
    let clusters = [...localStore.clusters];

    if (supabase) {
      try {
        const { data, error } = await supabase.from('spatial_clusters').select('*');
        if (!error && data && data.length > 0) {
          clusters = data as SyntheticCluster[];
        }
      } catch (e) {}
    }

    // Attach member reports
    return clusters.map((cluster) => {
      const memberReports = localStore.reports.filter((r) => r.cluster_id === cluster.id);
      return {
        ...cluster,
        reports: memberReports,
        report_count: memberReports.length || cluster.report_count,
      };
    });
  }

  static async updateClusterActionBrief(
    clusterId: string,
    actionBrief: any
  ): Promise<SyntheticCluster | null> {
    const cluster = localStore.clusters.find((c) => c.id === clusterId || c.cluster_code === clusterId);
    if (!cluster) return null;

    cluster.action_brief = actionBrief;
    cluster.updated_at = new Date().toISOString();
    saveLocalStore();

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('spatial_clusters')
          .update({ action_brief: actionBrief, updated_at: cluster.updated_at })
          .eq('id', cluster.id);
      } catch (e) {}
    }

    return cluster;
  }

  static getAllReportsSync(): SyntheticReport[] {
    return localStore.reports;
  }
}
