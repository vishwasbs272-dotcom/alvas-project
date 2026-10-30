import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Copy,
  Flame,
  Info,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { submitCitizenReport } from '../services/apiClient';
import { CivicCategory, CivicReport } from '../types/civic';

interface LocationPreset {
  label: string;
  category: CivicCategory;
  address: string;
  lat: number;
  lng: number;
  suggestedDesc: string;
  sampleImg: string;
  hazardType: string;
}

const LOCATION_PRESETS: LocationPreset[] = [
  {
    label: 'Hampankatta Drain Cluster (Duplicate Test)',
    category: 'WATERLOGGING_DRAINAGE',
    address: 'Jyothi Circle corridor, Hampankatta',
    lat: 12.8708,
    lng: 74.8441,
    suggestedDesc: 'Water overflowing onto the main road and entering shops because the side storm drain is packed with plastic waste near Jyothi Circle.',
    sampleImg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    hazardType: 'Drainage Overwash'
  },
  {
    label: 'Kadri School Sparking Wire (Critical Safety)',
    category: 'ELECTRICAL_STREETLIGHTS',
    address: 'St. Agnes School Gate, Kadri Road',
    lat: 12.8849,
    lng: 74.8559,
    suggestedDesc: 'Dangerous low-hanging overhead power cable sparking violently across wet school footpath. Immediate electrocution risk!',
    sampleImg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    hazardType: 'Sparking Conductor'
  },
  {
    label: 'City Centre Cave-in Crater (Structural Road Risk)',
    category: 'ROAD_INFRASTRUCTURE',
    address: 'Opposite City Centre Mall, K.S. Rao Road',
    lat: 12.8702,
    lng: 74.8434,
    suggestedDesc: 'Deep asphalt cave-in crater in middle of road opposite mall. Waterwashed foundation caused a scooter wheel to get trapped.',
    sampleImg: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    hazardType: 'Asphalt Cave-in'
  },
  {
    label: 'Central Market Rotten Waste (Sanitation Biohazard)',
    category: 'WASTE_SANITATION',
    address: 'Bhavanthi Street Wholesale Market',
    lat: 12.8633,
    lng: 74.8382,
    suggestedDesc: 'Overfilled garbage dumpsters spilling rotten vegetable and fish remains across the entire walking alleyway with foul leachate runoff.',
    sampleImg: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    hazardType: 'Sanitation Spill'
  },
  {
    label: 'Bejai Church Drinking Water Pipe Burst',
    category: 'WATER_SUPPLY_LEAKAGE',
    address: 'Bejai New Road, near Bejai Church',
    lat: 12.8890,
    lng: 74.8480,
    suggestedDesc: 'High-pressure clean drinking water pipeline ruptured at main valve, wasting gallons of water and flooding curb.',
    sampleImg: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    hazardType: 'Pipeline Rupture'
  },
  {
    label: 'Urwa Market Routine Pothole (Low Priority Baseline)',
    category: 'ROAD_INFRASTRUCTURE',
    address: 'Urwa Market approach road',
    lat: 12.8872,
    lng: 74.8355,
    suggestedDesc: 'Shallow surface pothole near marketplace entrance causing minor bumps for vehicles. No standing water.',
    sampleImg: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    hazardType: 'Surface Pothole'
  }
];

const BUILT_IN_SAMPLE_PHOTOS = [
  {
    name: 'Blocked Culvert & Flooding',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Deep Asphalt Crater',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Overflowing Waste Dumper',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Urban Waterlogging',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
  },
];

interface CitizenReportFormProps {
  onReportSubmitted?: (report: CivicReport) => void;
  isCompactSimulator?: boolean;
}

export const CitizenReportForm: React.FC<CitizenReportFormProps> = ({
  onReportSubmitted,
  isCompactSimulator = false,
}) => {
  const navigate = useNavigate();

  const [citizenName, setCitizenName] = useState('');
  const [userCategory, setUserCategory] = useState<CivicCategory>('WATERLOGGING_DRAINAGE');
  const [description, setDescription] = useState(
    'Water overflowing onto the main road and entering shops because the side storm drain is packed with plastic waste near Jyothi Circle.'
  );
  const [latitude, setLatitude] = useState<number>(12.8708);
  const [longitude, setLongitude] = useState<number>(74.8441);
  const [addressLabel, setAddressLabel] = useState('Jyothi Circle corridor, Hampankatta');
  const [imageUrl, setImageUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [triageReceipt, setTriageReceipt] = useState<{
    report: CivicReport;
    masterReport?: CivicReport | null;
    nearbyCandidatesCount: number;
    aiEngine: string;
  } | null>(null);

  const handleApplyPreset = (preset: LocationPreset) => {
    setUserCategory(preset.category);
    setAddressLabel(preset.address);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setDescription(preset.suggestedDesc);
    setImageUrl(preset.sampleImg);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Image file size must be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setSubmissionError('Please provide a description of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await submitCitizenReport({
        citizen_name: citizenName.trim() || 'Anonymous Citizen',
        user_category: userCategory,
        description: description.trim(),
        latitude,
        longitude,
        address_label: addressLabel.trim(),
        image_url: imageUrl,
      });

      setTriageReceipt({
        report: response.data,
        masterReport: response.master_report,
        nearbyCandidatesCount: response.nearby_candidates_checked,
        aiEngine: response.ai_engine_used,
      });

      if (onReportSubmitted) {
        onReportSubmitted(response.data);
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'Submission failed. Please check your network or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormForNext = () => {
    setTriageReceipt(null);
    setDescription('');
    setImageUrl(null);
  };

  return (
    <div className={`w-full ${isCompactSimulator ? 'max-w-[400px]' : 'max-w-xl mx-auto'} bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
      {/* Mobile Top Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Citizen Capture Portal
          </span>
        </div>
        <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">
          Sub-60s SLA
        </span>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* Instant AI Triage Receipt Modal/Card */}
        {triageReceipt ? (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  AI Triage Receipt
                </span>
                <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {triageReceipt.report.ticket_code}
                </span>
              </div>

              {/* Deduplication Status Notice */}
              {triageReceipt.report.is_duplicate ? (
                <div className="mb-3 p-2.5 bg-amber-950/70 border border-amber-500/50 rounded-lg text-amber-200 text-xs">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <Copy className="w-3.5 h-3.5" />
                    Spatial Duplicate Corroborated!
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-100">
                    Your report matched open master ticket{' '}
                    <span className="font-mono font-bold text-white">
                      {triageReceipt.masterReport?.ticket_code || 'REP-Master'}
                    </span>{' '}
                    with{' '}
                    <strong className="text-white">
                      {Math.round(triageReceipt.report.duplicate_confidence * 100)}% confidence
                    </strong>
                    . It was merged to avoid queue spam while boosting its priority score!
                  </p>
                </div>
              ) : (
                <div className="mb-3 p-2 bg-blue-950/50 border border-blue-500/30 rounded-lg text-blue-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Unique Master Incident logged into dispatch queue.</span>
                </div>
              )}

              {/* Priority & Sub-factors */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Composite Priority:</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      triageReceipt.report.priority_level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : triageReceipt.report.priority_level === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : triageReceipt.report.priority_level === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {triageReceipt.report.priority_score}/100 • {triageReceipt.report.priority_level}
                  </span>
                </div>

                {/* Quantitative Factor Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800">
                  <div className="bg-slate-800/60 p-1.5 rounded">
                    <span className="text-slate-400 block">Life Safety:</span>
                    <span className="font-bold text-red-400 font-mono">
                      {triageReceipt.report.factor_safety} / 40
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-1.5 rounded">
                    <span className="text-slate-400 block">Disruption:</span>
                    <span className="font-bold text-orange-400 font-mono">
                      {triageReceipt.report.factor_disruption} / 25
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-1.5 rounded">
                    <span className="text-slate-400 block">Cascading Risk:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {triageReceipt.report.factor_cascading} / 20
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-1.5 rounded">
                    <span className="text-slate-400 block">Corroboration:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {triageReceipt.report.factor_corroboration} / 15
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-300">
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">
                    AI Diagnostic Rationale
                  </span>
                  <p className="mt-0.5 italic text-slate-300">
                    "{triageReceipt.report.ai_explanation}"
                  </p>
                </div>

                <div className="pt-1 text-[11px] text-slate-300 flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] font-semibold uppercase">
                    Routed Department:
                  </span>
                  <span className="font-medium text-blue-400">
                    {triageReceipt.report.recommended_department}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/track/${triageReceipt.report.ticket_code}`)}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition"
                >
                  <span>Track Live Ticket Progress</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={resetFormForNext}
                  className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Presets Dropdown/Chips for Judges */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-400" />
                  1-Click Judge Presets:
                </label>
                <span className="text-[10px] text-slate-500">Auto-fill Coordinates</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {LOCATION_PRESETS.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-left transition group"
                  >
                    <span className="block text-[11px] font-medium text-slate-200 group-hover:text-blue-300 truncate">
                      {p.hazardType}
                    </span>
                    <span className="block text-[9px] text-slate-400 truncate">
                      {p.label.split('(')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hazard Domain / Category
              </label>
              <select
                value={userCategory}
                onChange={(e) => setUserCategory(e.target.value as CivicCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="WATERLOGGING_DRAINAGE">WATERLOGGING & DRAINAGE</option>
                <option value="ROAD_INFRASTRUCTURE">ROAD INFRASTRUCTURE (Potholes/Craters)</option>
                <option value="ELECTRICAL_STREETLIGHTS">ELECTRICAL & STREETLIGHTS (Wires/Poles)</option>
                <option value="WASTE_SANITATION">WASTE & SANITATION (Overflow/Leachate)</option>
                <option value="WATER_SUPPLY_LEAKAGE">WATER SUPPLY LEAKAGE</option>
                <option value="PUBLIC_SAFETY_OBSTRUCTION">PUBLIC SAFETY & OBSTRUCTIONS</option>
                <option value="UNSURE">UNSURE / LET AI CLASSIFY</option>
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Describe the Issue
                </label>
                <span className="text-[10px] text-slate-500">Min 10 chars</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="E.g., Water overflowing onto the main road and entering shops..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Location & Interactive Coordinates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  Corridor Location
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                placeholder="Address label or street name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />

              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-[9px] text-slate-400">Lat:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-slate-400">Lng:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Photo Evidence (Base64 / Built-in Test Photos) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  Hazard Photo Evidence
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Clear photo
                  </button>
                )}
              </div>

              {/* Sample Photo Thumbnails */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {BUILT_IN_SAMPLE_PHOTOS.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageUrl(photo.url)}
                    className={`relative rounded-lg overflow-hidden border aspect-video group ${
                      imageUrl === photo.url ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-0.5 text-[8px] text-center text-white font-medium">
                      {photo.name.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>

              {/* Upload custom image */}
              <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/50 transition">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">Or upload image file</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {imageUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-700 h-24">
                  <img src={imageUrl} alt="Hazard preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                    Photo attached
                  </span>
                </div>
              )}
            </div>

            {/* Optional Citizen Name */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Citizen Name (Optional — Zero PII stored)
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="Anonymous Citizen"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Error Display */}
            {submissionError && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Spatial Proximity & AI Triage...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Hazard for Instant AI Triage</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
