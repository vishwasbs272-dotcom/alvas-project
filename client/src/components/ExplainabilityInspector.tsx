import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  HelpCircle,
  Info,
  Scale,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { CivicReport } from '../types/civic';

interface ExplainabilityInspectorProps {
  primaryReport: CivicReport | null;
  allReports: CivicReport[];
}

export const ExplainabilityInspector: React.FC<ExplainabilityInspectorProps> = ({
  primaryReport,
  allReports,
}) => {
  const [comparisonReportId, setComparisonReportId] = useState<string>('');

  if (!primaryReport) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#111827] border border-slate-800 rounded-2xl">
        <Scale className="w-8 h-8 text-slate-600 mb-2" />
        <h4 className="text-xs font-semibold uppercase text-slate-400">
          Explainability Inspector
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Select any ticket from the priority queue or map to inspect quantitative factor scoring and plain-English AI justification.
        </p>
      </div>
    );
  }

  const comparisonReport = allReports.find((r) => r.id === comparisonReportId) || null;

  return (
    <div className="w-full h-full flex flex-col bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Title & Ticket Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              "Why This Rank?" Inspector
            </span>
            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {primaryReport.ticket_code}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{primaryReport.address_label}</p>
        </div>

        {/* Priority Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              primaryReport.priority_level === 'CRITICAL'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : primaryReport.priority_level === 'HIGH'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : primaryReport.priority_level === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}
          >
            Score: {primaryReport.priority_score}/100 ({primaryReport.priority_level})
          </span>
        </div>
      </div>

      {/* Quantitative Sub-Factor Progress Breakdown */}
      <div className="space-y-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
          Deterministic 4-Factor Breakdown:
        </span>

        {/* Factor 1: Life & Physical Safety (0-40) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Life Safety Hazard
            </span>
            <span className="font-mono font-bold text-red-400">
              {primaryReport.factor_safety} <span className="text-slate-500 font-normal">/ 40</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${(primaryReport.factor_safety / 40) * 100}%` }}
            />
          </div>
        </div>

        {/* Factor 2: Public Disruption & Arterial Access (0-25) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Public Disruption & Mobility
            </span>
            <span className="font-mono font-bold text-orange-400">
              {primaryReport.factor_disruption}{' '}
              <span className="text-slate-500 font-normal">/ 25</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${(primaryReport.factor_disruption / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Factor 3: Cascading Infrastructure Risk (0-20) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Cascading Failure Risk
            </span>
            <span className="font-mono font-bold text-amber-400">
              {primaryReport.factor_cascading}{' '}
              <span className="text-slate-500 font-normal">/ 20</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(primaryReport.factor_cascading / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Factor 4: Corroboration Volume Boost (0-15) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Spatial Corroboration Boost
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {primaryReport.factor_corroboration}{' '}
              <span className="text-slate-500 font-normal">/ 15</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(primaryReport.factor_corroboration / 15) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gemini AI Plain English Rationale */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 block mb-1">
          AI Triage Rationale (Commissioner & Public Plain English)
        </span>
        <p className="text-slate-200 italic leading-relaxed">
          "{primaryReport.ai_explanation}"
        </p>
      </div>

      {/* Side-by-Side Comparison Selector */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            Compare Against Another Report
          </span>
          <select
            value={comparisonReportId}
            onChange={(e) => setComparisonReportId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 max-w-[200px]"
          >
            <option value="">Select comparison ticket...</option>
            {allReports
              .filter((r) => r.id !== primaryReport.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.ticket_code} ({r.priority_score} pts) - {r.ai_summary.slice(0, 24)}...
                </option>
              ))}
          </select>
        </div>

        {/* Side-by-Side Factor Comparison Table */}
        {comparisonReport && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2 animate-fade-in">
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pb-1 border-b border-slate-800">
              <span className="text-slate-400">Metric</span>
              <span className="text-blue-400 font-bold">{primaryReport.ticket_code}</span>
              <span className="text-amber-400 font-bold">{comparisonReport.ticket_code}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-slate-400">Overall Score</span>
              <span className="font-bold text-white">{primaryReport.priority_score} / 100</span>
              <span className="font-bold text-white">{comparisonReport.priority_score} / 100</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-slate-400">Safety (/40)</span>
              <span className="text-red-400 font-mono">{primaryReport.factor_safety}</span>
              <span className="text-red-400 font-mono">{comparisonReport.factor_safety}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-slate-400">Disruption (/25)</span>
              <span className="text-orange-400 font-mono">{primaryReport.factor_disruption}</span>
              <span className="text-orange-400 font-mono">{comparisonReport.factor_disruption}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-slate-400">Cascading (/20)</span>
              <span className="text-amber-400 font-mono">{primaryReport.factor_cascading}</span>
              <span className="text-amber-400 font-mono">{comparisonReport.factor_cascading}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-slate-400">Corroboration (/15)</span>
              <span className="text-emerald-400 font-mono">{primaryReport.factor_corroboration}</span>
              <span className="text-emerald-400 font-mono">{comparisonReport.factor_corroboration}</span>
            </div>

            <div className="pt-2 text-[11px] text-slate-300 italic border-t border-slate-800">
              {primaryReport.priority_score >= comparisonReport.priority_score ? (
                <span>
                  <strong>Verdict:</strong> {primaryReport.ticket_code} outranks{' '}
                  {comparisonReport.ticket_code} by{' '}
                  {primaryReport.priority_score - comparisonReport.priority_score} points primarily due to higher{' '}
                  {primaryReport.factor_safety > comparisonReport.factor_safety
                    ? 'acute safety risk'
                    : 'cascading infrastructure vulnerability'}
                  .
                </span>
              ) : (
                <span>
                  <strong>Verdict:</strong> {comparisonReport.ticket_code} outranks{' '}
                  {primaryReport.ticket_code} by{' '}
                  {comparisonReport.priority_score - primaryReport.priority_score} points.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
