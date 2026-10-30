import React from 'react';
import { useParams } from 'react-router-dom';
import { CitizenStatusTracker } from '../components/CitizenStatusTracker';
import { Search, ShieldCheck } from 'lucide-react';

export const CitizenTrackPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId?: string }>();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Transparent Municipal Accountability
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Citizen Status & Audit Portal
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Track the live 5-stage lifecycle of your reported incident, see AI factor weights, and monitor assigned municipal crews.
        </p>
      </div>

      <CitizenStatusTracker initialTicketCode={ticketId || 'REP-1004'} />
    </div>
  );
};

