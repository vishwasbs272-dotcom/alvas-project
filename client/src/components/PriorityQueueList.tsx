import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Filter,
  Flame,
  Layers,
  MapPin,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { CivicCategory, CivicReport, PriorityLevel, ReportsMetrics } from '../types/civic';

interface PriorityQueueListProps {
  reports: CivicReport[];
  metrics?: ReportsMetrics;
  selectedReportId?: string | null;
  onSelectReport: (report: CivicReport) => void;
  isLoading?: boolean;
}

export const PriorityQueueList: React.FC<PriorityQueueListProps> = ({
  reports,
  metrics,
  selectedReportId,
  onSelectReport,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredReports = reports.filter((r) => {
    if (selectedCategory !== 'ALL') {
      if (r.ai_category !== selectedCategory && r.user_category !== selectedCategory) return false;
    }
    if (statusFilter !== 'ALL') {
      if (r.status !== statusFilter) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchCode = r.ticket_code.toLowerCase().includes(term);
      const matchDesc = r.description.toLowerCase().includes(term);
      const matchAddress = r.address_label.toLowerCase().includes(term);
      const matchSummary = r.ai_summary.toLowerCase().includes(term);
      if (!matchCode && !matchDesc && !matchAddress && !matchSummary) return false;
    }
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header & KPI Metrics */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Triage Priority Queue
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredReports.length} Active Tickets
          </span>
        </div>

        {/* KPI Pills */}
        {metrics && (
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <div className="bg-slate-800/80 p-2 rounded-lg text-center border border-slate-700/60">
              <span className="block text-[10px] text-slate-400">Total</span>
              <span className="text-xs font-bold text-white font-mono">{metrics.totalReports}</span>
            </div>
            <div className="bg-red-950/40 p-2 rounded-lg text-center border border-red-500/30">
              <span className="block text-[10px] text-red-400">Critical</span>
              <span className="text-xs font-bold text-red-300 font-mono">
                {metrics.criticalHazardsCount}
              </span>
            </div>
            <div className="bg-blue-950/40 p-2 rounded-lg text-center border border-blue-500/30">
              <span className="block text-[10px] text-blue-400">Merged</span>
              <span className="text-xs font-bold text-blue-300 font-mono">
                {metrics.deduplicatedCount}
              </span>
            </div>
            <div className="bg-emerald-950/40 p-2 rounded-lg text-center border border-emerald-500/30">
              <span className="block text-[10px] text-emerald-400">Resolved</span>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                {metrics.resolvedCount}
              </span>
            </div>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, summary, street..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="WATERLOGGING_DRAINAGE">Drainage & Flooding</option>
              <option value="ROAD_INFRASTRUCTURE">Road & Potholes</option>
              <option value="ELECTRICAL_STREETLIGHTS">Electrical & Lights</option>
              <option value="WASTE_SANITATION">Waste & Sanitation</option>
              <option value="WATER_SUPPLY_LEAKAGE">Water Pipeline Leak</option>
              <option value="PUBLIC_SAFETY_OBSTRUCTION">Safety Obstruction</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="AI Triaged">AI Triaged</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading prioritized queue...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No reports matching filter criteria.
          </div>
        ) : (
          filteredReports.map((report) => {
            const isSelected = report.id === selectedReportId;

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className={`p-3 rounded-xl border cursor-pointer transition text-left group ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/40 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Code, Priority Pill, Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-blue-400 transition">
                      {report.ticket_code}
                    </span>
                    {report.corroboration_count > 1 && (
                      <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        +{report.corroboration_count - 1} merged
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.priority_level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : report.priority_level === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : report.priority_level === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {report.priority_score} {report.priority_level}
                  </span>
                </div>

                {/* Summary Headline */}
                <p className="text-xs text-slate-200 font-medium line-clamp-1 mb-1">
                  {report.ai_summary}
                </p>

                {/* Sub-details: Location, Dept, Status */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{report.address_label}</span>
                  </div>

                  <span
                    className={`font-medium ${
                      report.status === 'Resolved'
                        ? 'text-emerald-400'
                        : report.status === 'In Progress'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
