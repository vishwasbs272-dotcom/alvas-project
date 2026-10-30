import React, { useEffect, useState } from 'react';
import {
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { InteractiveCivicMap } from '../components/InteractiveCivicMap';
import { PriorityQueueList } from '../components/PriorityQueueList';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { WorkflowDispatchPanel } from '../components/WorkflowDispatchPanel';
import { fetchClusters, fetchReports } from '../services/apiClient';
import { CivicReport, ReportsMetrics, SpatialCluster } from '../types/civic';

export const CommandCenterPage: React.FC = () => {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [clusters, setClusters] = useState<SpatialCluster[]>([]);
  const [metrics, setMetrics] = useState<ReportsMetrics | undefined>(undefined);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reportsData, clustersData] = await Promise.all([
        fetchReports({ include_duplicates: true }),
        fetchClusters(),
      ]);

      setReports(reportsData.reports);
      setMetrics(reportsData.metrics);
      setClusters(clustersData.clusters);

      if (reportsData.reports.length > 0 && !selectedReportId) {
        setSelectedReportId(reportsData.reports[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWorkflowUpdated = async (updatedReport: CivicReport) => {
    await loadData();
    setSelectedReportId(updatedReport.id);
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              Municipal Command & Geospatial Triage Center
            </h1>
            <p className="text-xs text-slate-400">
              Live operational oversight across waterlogging, structural road failures, electrical emergencies, and public hazards.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Grid: Queue (left) + Map (center) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[520px]">
        {/* Left: Priority Queue (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <PriorityQueueList
            reports={reports}
            metrics={metrics}
            selectedReportId={selectedReportId}
            onSelectReport={(rep) => setSelectedReportId(rep.id)}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Map (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <InteractiveCivicMap
            reports={reports}
            clusters={clusters}
            selectedReportId={selectedReportId}
            onSelectReport={(rep) => setSelectedReportId(rep.id)}
          />
        </div>
      </div>

      {/* Bottom Grid: Explainability Inspector + Dispatch Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[380px]">
        <ExplainabilityInspector
          primaryReport={selectedReport}
          allReports={reports}
        />

        <WorkflowDispatchPanel
          report={selectedReport}
          onWorkflowUpdated={handleWorkflowUpdated}
        />
      </div>
    </div>
  );
};

