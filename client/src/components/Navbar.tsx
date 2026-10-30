import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  SplitSquareVertical,
  Database,
  Cpu,
} from 'lucide-react';
import { fetchHealth, resetSyntheticSeed } from '../services/apiClient';
import { SystemHealth } from '../types/civic';

interface NavbarProps {
  onDataReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onDataReset }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (e) {
      // offline / starting
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setResetMessage(null);
    try {
      await resetSyntheticSeed();
      setResetMessage('Reset to 40 Curated Reports!');
      if (onDataReset) onDataReset();
      await loadHealth();
      setTimeout(() => setResetMessage(null), 3500);
    } catch (err: any) {
      setResetMessage('Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & System Tag */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">STRATUM<span className="text-blue-500">.AI</span></span>
                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Civic Triage & Spatial Action Platform</p>
            </div>
          </div>

          {/* Engine Badges (Mobile Compact) */}
          <div className="flex items-center gap-1.5 md:hidden">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                health?.gemini_ready
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Cpu className="w-3 h-3" />
              {health?.gemini_ready ? 'Gemini 2.5' : 'Deterministic'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <NavLink to="/" className={navItemClass} end>
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Split Demo</span>
          </NavLink>

          <NavLink to="/report" className={navItemClass}>
            <MapPin className="h-3.5 w-3.5" />
            <span>Citizen Report</span>
          </NavLink>

          <NavLink to="/track" className={navItemClass}>
            <Search className="h-3.5 w-3.5" />
            <span>Track Ticket</span>
          </NavLink>

          <NavLink to="/command" className={navItemClass}>
            <Activity className="h-3.5 w-3.5" />
            <span>Command Center</span>
          </NavLink>

          <NavLink to="/clusters" className={navItemClass}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hotspots & Briefs</span>
          </NavLink>

          <NavLink to="/honesty" className={navItemClass}>
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Honesty & Limits</span>
          </NavLink>
        </nav>

        {/* Status Indicators & Reset Control */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Storage & AI Badges (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border ${
                health?.gemini_ready
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
              }`}
              title={
                health?.gemini_ready
                  ? 'Connected to Google Gemini 2.5 Flash'
                  : 'Running Deterministic Spatial + Rule Engine'
              }
            >
              <Cpu className="w-3 h-3" />
              <span>{health?.gemini_ready ? 'Gemini 2.5 Flash' : 'Deterministic Engine'}</span>
            </div>

            <div
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border bg-slate-900 text-slate-300 border-slate-700"
              title={`Storage: ${health?.storage_engine || 'Local JSON Store'} (${health?.total_reports || 40} reports)`}
            >
              <Database className="w-3 h-3 text-slate-400" />
              <span className="capitalize">{health?.storage_engine === 'supabase' ? 'Supabase PG' : 'Local JSON'}</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition"
            title="Reset dataset to 40 curated synthetic reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span className="whitespace-nowrap">{isResetting ? 'Resetting...' : 'Reset 40 Reports'}</span>
          </button>

          {resetMessage && (
            <span className="text-[11px] font-medium text-emerald-400 animate-fade-in whitespace-nowrap bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
              {resetMessage}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
