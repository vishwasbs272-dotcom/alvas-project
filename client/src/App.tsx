import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SplitDemoWorkspace } from './pages/SplitDemoWorkspace';
import { CitizenCapturePage } from './pages/CitizenCapturePage';
import { CitizenTrackPage } from './pages/CitizenTrackPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { ClusterBriefsPage } from './pages/ClusterBriefsPage';
import { HonestyLedgerPage } from './pages/HonestyLedgerPage';

export const App: React.FC = () => {
  const [resetKey, setResetKey] = useState(0);

  const handleDataReset = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <Navbar onDataReset={handleDataReset} />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6" key={resetKey}>
          <Routes>
            <Route path="/" element={<SplitDemoWorkspace />} />
            <Route path="/report" element={<CitizenCapturePage />} />
            <Route path="/track" element={<CitizenTrackPage />} />
            <Route path="/track/:ticketId" element={<CitizenTrackPage />} />
            <Route path="/command" element={<CommandCenterPage />} />
            <Route path="/clusters" element={<ClusterBriefsPage />} />
            <Route path="/honesty" element={<HonestyLedgerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-mono text-slate-400">
              STRATUM.AI &bull; Explainable Civic Triage, Spatial Deduplication & Action Platform
            </span>
            <span>
              Autonomous Gemini 2.5 Flash Triage Engine &bull; Zero-PII Civic Tech
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;

