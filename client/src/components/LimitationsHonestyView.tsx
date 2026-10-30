import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Info,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const LimitationsHonestyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              System Honesty & Architectural Limitations Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Mandatory Hackathon Engineering Disclosure: Full Transparency on Real vs. Mocked Capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Real vs Mocked Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Real Live Systems vs. Mocked Integrations</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">System Subsystem</th>
                <th className="py-2.5 px-3">Operational State</th>
                <th className="py-2.5 px-3">Implementation Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-3 font-semibold text-white">
                  Gemini 2.5 Flash Structured AI Triage
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" /> LIVE REAL AI
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300">
                  Official <code className="text-blue-300 font-mono">@google/genai</code> SDK with strict JSON <code className="text-blue-300 font-mono">responseSchema</code> and deterministic fallback.
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-white">
                  Haversine Geospatial Deduplication
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" /> LIVE REAL MATH
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300">
                  Computes exact surface distances (meters) on a 200m radius before passing candidate pairs to LLM.
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-white">
                  Cross-Category Cluster Synthesis
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" /> LIVE REAL AI
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300">
                  Gemini analyzes multi-category proximate tickets within 250m to produce structured 3-step action directives.
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-white">
                  Persistence & State Engine
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" /> LIVE PERSISTENT
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300">
                  Dual-mode: Supabase PostgreSQL when credentials exist, with auto-generating local JSON persistence fallback.
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-white">
                  SMS Gateway Citizen Notifications
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 w-fit">
                    <Radio className="w-3 h-3" /> MOCKED FOR DEMO
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Real SMS gateways (Twilio/Gupshup) require telecom DLT registration in India; mocked via in-app timeline sync.
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-white">
                  Field Vehicle Real-Time Telemetry
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 w-fit">
                    <Radio className="w-3 h-3" /> MOCKED FOR DEMO
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Municipal jetting truck GPS telematics are simulated through interactive dispatch state transitions.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Known AI Failure Modes */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Known AI Failure Modes & Engineering Mitigations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-300">1. Ambiguous Spatial Descriptions</h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Risk:</strong> Citizen submits "the big hole near the tea shop" without street names.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Mitigation:</strong> Frontend enforces mandatory GPS coordinate pin-drop (lat/lng), restricting candidate duplicate search to exact 200m Haversine radius regardless of textual vagueness.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-300">2. Nighttime Low-Contrast Imagery</h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Risk:</strong> Poor lighting in streetlight failure or nighttime flooded pothole photos.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Mitigation:</strong> Multimodal prompt treats image evidence as corroborative rather than single-point-of-truth; fallback to structured text semantics and spatial cluster weights.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-300">3. Local Dialect & Transliteration</h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Risk:</strong> Mix of Kannada, Tulu, and Mangalore English (e.g., "mori" for culvert, "kandi" for pothole).
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Mitigation:</strong> Gemini 2.5 Flash's multilingual training automatically normalizes Indic civic vocabulary into standardized municipal categories.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-300">4. Gemini API Outage or Rate Limit</h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Risk:</strong> Live hackathon demo network timeout or missing API key.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Mitigation:</strong> Production deterministic engine takes over seamlessly with TF-IDF keyword overlap + mathematical heuristic weights, returning valid triage results without crash.
            </p>
          </div>
        </div>
      </div>

      {/* Production Roadmap */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Production Scale Roadmap</span>
        </h3>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold font-mono">01.</span>
            <span><strong>PostGIS Spatial Indexing:</strong> Replace in-memory Haversine distance with <code className="text-blue-300 font-mono">ST_DWithin(geom, ST_MakePoint(lng, lat)::geography, 200)</code> in PostgreSQL for sub-10ms queries over 1,000,000 reports.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold font-mono">02.</span>
            <span><strong>WhatsApp Conversational Bot:</strong> Enable citizens to capture photo + audio note via WhatsApp Cloud API webhook, routed directly into STRATUM.AI's multimodal triage pipeline.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold font-mono">03.</span>
            <span><strong>Automated Resolution Verification:</strong> Field crew uploads post-repair photo; Gemini performs side-by-side vision diffing to verify the pothole is patched or wire re-strung before closing the ticket.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
