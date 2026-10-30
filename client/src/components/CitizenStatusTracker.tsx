import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { fetchReportDetails } from '../services/apiClient';
import { CivicReport, ReportStatus, ReportStatusLog } from '../types/civic';

interface CitizenStatusTrackerProps {
  initialTicketCode?: string;
}

const STAGES: { key: ReportStatus; label: string; desc: string }[] = [
  { key: 'Submitted', label: 'Report Submitted', desc: 'Incident captured with GPS coordinates' },
  { key: 'AI Triaged', label: 'AI Triaged & Prioritized', desc: 'Spatial deduplication & factor scoring' },
  { key: 'Assigned', label: 'Crew Assigned', desc: 'Department unit allocated' },
  { key: 'In Progress', label: 'In Progress', desc: 'Field teams operating on site' },
  { key: 'Resolved', label: 'Resolved & Closed', desc: 'Physical repair completed and verified' },
];

export const CitizenStatusTracker: React.FC<CitizenStatusTrackerProps> = ({
  initialTicketCode = 'REP-1004',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTicketCode);
  const [activeTicket, setActiveTicket] = useState<string>(initialTicketCode);
  const [report, setReport] = useState<CivicReport | null>(null);
  const [duplicates, setDuplicates] = useState<CivicReport[]>([]);
  const [statusLogs, setStatusLogs] = useState<ReportStatusLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTicket = async (ticket: string) => {
    if (!ticket.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportDetails(ticket.trim());
      setReport(data.report);
      setDuplicates(data.duplicate_reports || []);
      setStatusLogs(data.status_logs || []);
      setActiveTicket(ticket);
    } catch (err: any) {
      setError(err.message || `Ticket '${ticket}' not found.`);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicketCode) {
      setSearchQuery(initialTicketCode);
      loadTicket(initialTicketCode);
    }
  }, [initialTicketCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTicket(searchQuery);
  };

  const getStageIndex = (status: ReportStatus): number => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'AI Triaged':
        return 1;
      case 'Assigned':
        return 2;
      case 'In Progress':
        return 3;
      case 'Resolved':
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIndex = report ? getStageIndex(report.status) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Search Bar & Quick Switcher */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Ticket ID (e.g., REP-1001, REP-1004, REP-1013)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Ticket'}
          </button>
        </form>

        {/* Quick Sample Tickets for Judges */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Quick Lookup:
          </span>
          {['REP-1001', 'REP-1004', 'REP-1013', 'REP-1021', 'REP-1008'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setSearchQuery(code);
                loadTicket(code);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                activeTicket === code
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="font-semibold block">Ticket Search Error</span>
            <p className="text-red-300 text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Ticket Details View */}
      {report && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-mono">{report.ticket_code}</h2>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      report.priority_level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : report.priority_level === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : report.priority_level === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    Priority {report.priority_score}/100 • {report.priority_level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {report.address_label}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Workflow Status
                </span>
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold">
                  {report.status}
                </span>
              </div>
            </div>

            {/* Description & Metadata */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Citizen Description
                  </span>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    "{report.description}"
                  </p>
                </div>

                {/* AI Explanation Box */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Explainable AI Priority Rationale</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 italic leading-relaxed">
                    "{report.ai_explanation}"
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Responsible Department:</span>
                    <strong className="text-white font-medium">
                      {report.recommended_department}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Image & Corroboration */}
              <div className="space-y-3">
                {report.image_url ? (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Hazard Photo Evidence
                    </span>
                    <div className="mt-1 rounded-lg overflow-hidden border border-slate-800 aspect-video bg-black">
                      <img
                        src={report.image_url}
                        alt="Hazard site"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-lg text-center text-slate-500 text-[11px]">
                    No photo uploaded with report
                  </div>
                )}

                {/* Corroboration Volume */}
                <div className="bg-blue-950/30 border border-blue-500/20 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                    <Users className="w-3.5 h-3.5" />
                    <span>Spatial Corroboration</span>
                  </div>
                  <div className="mt-1 text-base font-bold text-white font-mono">
                    {report.corroboration_count}{' '}
                    <span className="text-xs font-normal text-slate-300">
                      {report.corroboration_count === 1 ? 'Citizen Report' : 'Citizens Reported'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Nearby duplicate reports automatically linked within 200m Haversine radius.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Step Progress Timeline */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Live Action Timeline</span>
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="relative group">
                    {/* Stepper Dot */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition ${
                        isCurrent
                          ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/20'
                          : isPassed
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                    </div>

                    {/* Step Content */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 transition group-hover:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isCurrent
                              ? 'text-blue-400'
                              : isPassed
                              ? 'text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stage.desc}</p>

                      {/* Stage Specific Meta */}
                      {stage.key === 'Assigned' && report.assigned_crew && (
                        <div className="mt-2 text-xs bg-slate-800/80 p-2 rounded flex items-center gap-2 text-emerald-300">
                          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Assigned Field Crew: <strong>{report.assigned_crew}</strong></span>
                        </div>
                      )}

                      {stage.key === 'In Progress' && report.official_notes && (
                        <div className="mt-2 text-xs bg-slate-800/80 p-2 rounded text-slate-200">
                          <span className="text-slate-400 block text-[10px]">Crew Notes:</span>
                          {report.official_notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linked Duplicates & Audit Trail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Linked Duplicates */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Linked Duplicate Reports ({duplicates.length})</span>
              </h4>

              {duplicates.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-400 font-semibold">
                          {dup.ticket_code}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(dup.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                        "{dup.description}"
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Reported by: {dup.citizen_name}</span>
                        <span className="text-amber-400">
                          Match: {Math.round((dup.duplicate_confidence || 0.9) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No additional duplicates linked to this master ticket.
                </p>
              )}
            </div>

            {/* Official Audit Logs */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audit & Dispatch Logs ({statusLogs.length})</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {statusLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-emerald-400">{log.actor}</span>
                      <span className="text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      Status: {log.new_status}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {log.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
