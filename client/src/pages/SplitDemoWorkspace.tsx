import React, { useEffect, useState } from 'react';
import {
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  SplitSquareVertical,
  Zap,
} from 'lucide-react';
import { CitizenReportForm } from '../components/CitizenReportForm';
import { CitizenStatusTracker } from '../components/CitizenStatusTracker';
import { InteractiveCivicMap } from '../components/InteractiveCivicMap';
import { PriorityQueueList } from '../components/PriorityQueueList';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { WorkflowDispatchPanel } from '../components/WorkflowDispatchPanel';
import { fetchClusters, fetchReports } from '../services/apiClient';
import { CivicReport, ReportsMetrics, SpatialCluster } from '../types/civic';

export const SplitDemoWorkspace: React.FC = () => {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [clusters, setClusters] = useState<SpatialCluster[]>([]);
  const [metrics, setMetrics] = useState<ReportsMetrics | undefined>(undefined);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'submit' | 'track'>('submit');
  const [trackTicketCode, setTrackTicketCode] = useState<string>('REP-1004');
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

      // Default select highest priority active report
      if (reportsData.reports.length > 0 && !selectedReportId) {
        setSelectedReportId(reportsData.reports[0].id);
        setTrackTicketCode(reportsData.reports[0].ticket_code);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReportSubmitted = async (newReport: CivicReport) => {
    await loadData();
    setSelectedReportId(newReport.id);
    setTrackTicketCode(newReport.ticket_code);
  };

  const handleWorkflowUpdated = async (updatedReport: CivicReport) => {
    await loadData();
    setSelectedReportId(updatedReport.id);
    setTrackTicketCode(updatedReport.ticket_code);
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  return (
    <div className="space-y-4">
      {/* Walkthrough Banner for Hackathon Judges */}
      <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 border border-blue-500/30 rounded-2xl p-3.5 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                5-Minute Hackathon Demo Workspace
              </h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold px-2 py-0.5 rounded-full">
                Judge Walkthrough View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit on the mobile simulator (left) &rarr; See Haversine deduplication, instant AI triage scoring, map pulse, and dispatch closure (right).
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Sync Workspace</span>
        </button>
      </div>

      {/* Side-by-Side Dual-Mode Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: 390px Mobile Citizen Simulator */}
        <div className="xl:col-span-4 flex flex-col items-center">
          {/* Phone Frame Mockup */}
          <div className="w-full max-w-[400px] bg-[#0A0D14] border-4 border-slate-800 rounded-[36px] p-3 shadow-2xl relative">
            {/* Phone Speaker Notch */}
            <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Mobile Tab Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl mb-3 border border-slate-800">
              <button
                onClick={() => setLeftTab('submit')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  leftTab === 'submit'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Citizen Capture</span>
              </button>
              <button
                onClick={() => setLeftTab('track')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  leftTab === 'track'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Citizen Track</span>
              </button>
            </div>

            {/* Simulated Phone Screen Content */}
            <div className="overflow-hidden rounded-2xl">
              {leftTab === 'submit' ? (
                <CitizenReportForm
                  isCompactSimulator={true}
                  onReportSubmitted={handleReportSubmitted}
                />
              ) : (
                <div className="max-h-[640px] overflow-y-auto p-1">
                  <CitizenStatusTracker initialTicketCode={trackTicketCode} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Municipal Command Center */}
        <div className="xl:col-span-8 space-y-4">
          {/* Top Row: Geospatial Map + Priority Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[480px]">
            {/* Priority Queue (5 cols) */}
            <div className="lg:col-span-5 h-full">
              <PriorityQueueList
                reports={reports}
                metrics={metrics}
                selectedReportId={selectedReportId}
                onSelectReport={(rep) => {
                  setSelectedReportId(rep.id);
                  setTrackTicketCode(rep.ticket_code);
                }}
                isLoading={isLoading}
              />
            </div>

            {/* Map (7 cols) */}
            <div className="lg:col-span-7 h-full">
              <InteractiveCivicMap
                reports={reports}
                clusters={clusters}
                selectedReportId={selectedReportId}
                onSelectReport={(rep) => {
                  setSelectedReportId(rep.id);
                  setTrackTicketCode(rep.ticket_code);
                }}
              />
            </div>
          </div>

          {/* Bottom Row: Explainability Inspector + Field Dispatch */}
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
      </div>
    </div>
  );
};

