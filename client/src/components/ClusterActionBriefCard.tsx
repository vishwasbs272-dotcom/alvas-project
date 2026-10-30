import React, { useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  ListOrdered,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { generateClusterActionBrief } from '../services/apiClient';
import { SpatialCluster } from '../types/civic';

interface ClusterActionBriefCardProps {
  cluster: SpatialCluster;
  onBriefUpdated?: (updatedCluster: SpatialCluster) => void;
  onSelectReportCode?: (ticketCode: string) => void;
}

export const ClusterActionBriefCard: React.FC<ClusterActionBriefCardProps> = ({
  cluster,
  onBriefUpdated,
  onSelectReportCode,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localCluster, setLocalCluster] = useState<SpatialCluster>(cluster);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegenerateBrief = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const response = await generateClusterActionBrief(cluster.id);
      setLocalCluster(response.cluster);
      if (onBriefUpdated) {
        onBriefUpdated(response.cluster);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate action brief');
    } finally {
      setIsGenerating(false);
    }
  };

  const brief = localCluster.action_brief;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Cluster Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded">
              {localCluster.cluster_code}
            </span>
            <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
              Score: {localCluster.aggregate_priority}/100
            </span>
            <span className="text-xs text-slate-400">
              ({localCluster.report_count} Proximate Incidents within {localCluster.radius_meters}m)
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1.5">{localCluster.title}</h3>
        </div>

        {/* Regenerate Action Brief Button */}
        <button
          onClick={handleRegenerateBrief}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing Gemini Brief...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Regenerate AI Brief</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Action Brief Container */}
      {brief ? (
        <div className="space-y-4">
          {/* Executive Headline & Root Cause */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Executive Corridor Directive</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-2 leading-snug">
              {brief.executive_headline}
            </h4>
            <div className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3 rounded-lg border border-slate-800">
              <strong className="text-blue-400 block text-[10px] uppercase mb-0.5">
                Multi-Category Root-Cause Diagnosis:
              </strong>
              {brief.root_cause_diagnosis}
            </div>
          </div>

          {/* 3-Step Department Sequence */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-blue-400" />
              <span>Sequenced Operational Workflow (Fix Root Cause First)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {brief.operational_sequence.map((step) => (
                <div
                  key={step.step_number}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 font-bold font-mono text-xs flex items-center justify-center border border-blue-500/40">
                        {step.step_number}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase">
                        Step {step.step_number}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-white mb-1">
                      {step.department}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {step.action_directive}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-amber-300/90 italic">
                    <strong>Dependency:</strong> {step.dependency_note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Impact & Equipment Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Projected Impact */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Impact If Intervention Delayed (24-48 Hours)</span>
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {brief.estimated_impact_if_delayed}
              </p>
            </div>

            {/* Equipment Checklist */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                <span>Specialized Equipment Dispatch Checklist</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {brief.field_equipment_checklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
          No action brief generated yet. Click "Regenerate AI Brief" above.
        </div>
      )}

      {/* Constituent Reports List */}
      {localCluster.reports && localCluster.reports.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Constituent Reports in this {localCluster.radius_meters}m Cluster ({localCluster.reports.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {localCluster.reports.map((rep) => (
              <button
                key={rep.id}
                onClick={() => onSelectReportCode && onSelectReportCode(rep.ticket_code)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-left transition flex items-center gap-1.5 group"
              >
                <span className="font-mono text-blue-400 font-bold group-hover:text-blue-300">
                  {rep.ticket_code}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({rep.priority_score} pts)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
