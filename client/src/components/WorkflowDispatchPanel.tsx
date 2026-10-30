import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { updateReportWorkflow } from '../services/apiClient';
import { CivicReport, ReportStatus } from '../types/civic';

interface WorkflowDispatchPanelProps {
  report: CivicReport | null;
  onWorkflowUpdated?: (report: CivicReport) => void;
}

const CREW_PRESETS: Record<string, string[]> = {
  WATERLOGGING_DRAINAGE: [
    'Stormwater Jetting Unit Alpha',
    'Submersible Dewatering Squad 3',
    'Culvert Suction Tanker Team 1',
  ],
  ROAD_INFRASTRUCTURE: [
    'Rapid Asphalt Patching Squad 2',
    'Bituminous Cold-Mix Roller Unit',
    'Road Safety Barricading Squad',
  ],
  ELECTRICAL_STREETLIGHTS: [
    'MESCOM Emergency Unit 1',
    'High-Voltage Line Isolation Crew',
    'Hydraulic Bucket Truck Team B',
  ],
  WASTE_SANITATION: [
    'Market Sanitation Night Shift C',
    'Compactor Truck 14M Crew',
    'Vector Chemical Wash Squad',
  ],
  WATER_SUPPLY_LEAKAGE: [
    'Water Board Rapid Pipeline Cell',
    'Valve Replacement Crew 4',
  ],
  PUBLIC_SAFETY_OBSTRUCTION: [
    'Disaster Management Obstruction Unit',
    'Hydraulic Tree Pruning Squad',
  ],
};

export const WorkflowDispatchPanel: React.FC<WorkflowDispatchPanelProps> = ({
  report,
  onWorkflowUpdated,
}) => {
  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#111827] border border-slate-800 rounded-2xl">
        <Truck className="w-8 h-8 text-slate-600 mb-2" />
        <h4 className="text-xs font-semibold uppercase text-slate-400">
          Field Dispatch Panel
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Select a ticket from the priority queue to assign specialized field crews and transition operational status.
        </p>
      </div>
    );
  }

  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [assignedCrew, setAssignedCrew] = useState<string>(
    report.assigned_crew || CREW_PRESETS[report.ai_category]?.[0] || 'Municipal Rapid Response Squad'
  );
  const [officialNotes, setOfficialNotes] = useState<string>(
    report.official_notes || `Dispatched to ${report.address_label}. Safety perimeter established and repair work initiated.`
  );
  const [actorName, setActorName] = useState<string>('Chief Operations Engineer');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const availableCrews = CREW_PRESETS[report.ai_category] || [
    'Municipal Rapid Response Squad',
    'Emergency Inspection Cell',
  ];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (officialNotes.trim().length < 3) {
      setErrorNotice('Please provide official notes (min 3 chars).');
      return;
    }

    setIsUpdating(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const response = await updateReportWorkflow(report.id, {
        status,
        assigned_crew: assignedCrew,
        official_notes: officialNotes.trim(),
        actor: actorName.trim() || 'Municipal Duty Officer',
      });

      setSuccessNotice(
        `Successfully updated to "${status}". Synchronized live status across ${response.synced_duplicate_children} linked duplicate citizen trackers!`
      );

      if (onWorkflowUpdated) {
        onWorkflowUpdated(response.data);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update workflow');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Operational Dispatch Control
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
          {report.ticket_code}
        </span>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4 flex-1">
        {/* Status Stepper Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Transition Workflow Status
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {(['Submitted', 'AI Triaged', 'Assigned', 'In Progress', 'Resolved'] as ReportStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition border ${
                  status === st
                    ? st === 'Resolved'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Specialized Field Unit Selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              Assign Specialized Crew
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Dept: {report.recommended_department.split('&')[0]}
            </span>
          </div>

          <select
            value={assignedCrew}
            onChange={(e) => setAssignedCrew(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {availableCrews.map((crew, idx) => (
              <option key={idx} value={crew}>
                {crew}
              </option>
            ))}
            <option value="Municipal Emergency Rapid Response">
              Municipal Emergency Rapid Response (General)
            </option>
          </select>
        </div>

        {/* Official Resolution / Progress Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Public Operational & Resolution Notes
          </label>
          <textarea
            value={officialNotes}
            onChange={(e) => setOfficialNotes(e.target.value)}
            rows={3}
            placeholder="Document actions taken, equipment deployed, or resolution verification..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            required
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Synchronizes instantly with the citizen tracking timeline and linked duplicates.
          </span>
        </div>

        {/* Dispatch Officer Signoff */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Sign-off Officer / Actor
          </label>
          <input
            type="text"
            value={actorName}
            onChange={(e) => setActorName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            required
          />
        </div>

        {/* Notices */}
        {successNotice && (
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Dispatch Action Button */}
        <button
          type="submit"
          disabled={isUpdating}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synchronizing Dispatch & Citizen Status...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Broadcast Workflow Update</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
