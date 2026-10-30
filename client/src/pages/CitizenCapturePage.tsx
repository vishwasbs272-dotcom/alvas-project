import React from 'react';
import { CitizenReportForm } from '../components/CitizenReportForm';
import { Smartphone, Sparkles, CheckCircle2, MapPin } from 'lucide-react';

export const CitizenCapturePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Sub-60s Citizen Incident Capture
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Report Civic Hazard
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Capture urban waterlogging, broken electrical fixtures, road craters, and waste spills. Instantly prioritized and routed via spatial intelligence.
        </p>
      </div>

      <CitizenReportForm />
    </div>
  );
};

