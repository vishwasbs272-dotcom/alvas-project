import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  Eye,
  Filter,
  Layers,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import { CivicReport, PriorityLevel, SpatialCluster } from '../types/civic';

// Fix Leaflet Default Icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG pin generator
function createCustomPin(priority: PriorityLevel, isSelected: boolean = false): L.DivIcon {
  let color = '#3B82F6'; // Low
  if (priority === 'CRITICAL') color = '#EF4444';
  else if (priority === 'HIGH') color = '#F97316';
  else if (priority === 'MEDIUM') color = '#EAB308';

  const size = isSelected ? 36 : 28;
  const stroke = isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.4)';
  const strokeWidth = isSelected ? 3 : 1.5;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.6));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Invalidate map size on layout/container resize
function MapResizeFixer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

// Controller to auto-pan map to selected coordinate
function MapPanController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

interface InteractiveCivicMapProps {
  reports: CivicReport[];
  clusters: SpatialCluster[];
  selectedReportId?: string | null;
  onSelectReport?: (report: CivicReport) => void;
  onSelectCluster?: (cluster: SpatialCluster) => void;
}

export const InteractiveCivicMap: React.FC<InteractiveCivicMapProps> = ({
  reports,
  clusters,
  selectedReportId,
  onSelectReport,
  onSelectCluster,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'masters_only' | 'critical_only'>('masters_only');
  const [showClusters, setShowClusters] = useState(true);

  // Selected report coordinate target for auto-pan
  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const panTarget: [number, number] | null = selectedReport
    ? [selectedReport.latitude, selectedReport.longitude]
    : null;

  // Filter reports
  const displayReports = reports.filter((r) => {
    if (filterMode === 'masters_only' && r.is_duplicate) return false;
    if (filterMode === 'critical_only' && r.priority_level !== 'CRITICAL') return false;
    return true;
  });

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F19] shadow-2xl flex flex-col">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filter Pills */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            onClick={() => setFilterMode('masters_only')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              filterMode === 'masters_only'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Deduplicated Masters
          </button>
          <button
            onClick={() => setFilterMode('critical_only')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              filterMode === 'critical_only'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Critical Only
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Reports ({reports.length})
          </button>
        </div>

        {/* Hotspot Toggle */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={showClusters}
              onChange={(e) => setShowClusters(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              250m Spatial Hotspots ({clusters.length})
            </span>
          </label>
        </div>
      </div>

      {/* React Leaflet Map */}
      <MapContainer
        center={[12.8708, 74.8441]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full flex-1 z-0"
      >
        <MapResizeFixer />
        <MapPanController target={panTarget} />

        {/* Keyless OpenStreetMap Standard Tiles with Dark Theme CSS Filter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-command-map-tiles"
          maxZoom={19}
        />

        {/* Pulsing Hotspot Circles */}
        {showClusters &&
          clusters.map((cluster) => (
            <Circle
              key={cluster.id}
              center={[cluster.center_lat, cluster.center_lng]}
              radius={cluster.radius_meters}
              pathOptions={{
                color: cluster.aggregate_priority >= 90 ? '#EF4444' : '#F97316',
                fillColor: cluster.aggregate_priority >= 90 ? '#EF4444' : '#F97316',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
              eventHandlers={{
                click: () => onSelectCluster && onSelectCluster(cluster),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-slate-100 max-w-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                    <span className="text-[10px] font-mono font-bold text-red-400">
                      {cluster.cluster_code}
                    </span>
                    <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded font-bold border border-red-800">
                      Score {cluster.aggregate_priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{cluster.title}</h4>
                  <p className="text-[10px] text-slate-300 line-clamp-2">
                    {cluster.root_cause_hypothesis}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{cluster.report_count} Proximate Reports</span>
                    <span className="text-blue-400 font-medium cursor-pointer hover:underline">
                      Click to View AI Brief →
                    </span>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* Report Markers */}
        {displayReports.map((report) => {
          const isSelected = report.id === selectedReportId;
          const pinIcon = createCustomPin(report.priority_level, isSelected);

          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectReport && onSelectReport(report),
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 text-slate-100 max-w-xs">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {report.ticket_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        report.priority_level === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : report.priority_level === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {report.priority_score} {report.priority_level}
                    </span>
                  </div>

                  <p className="text-xs text-white font-medium">{report.ai_summary}</p>

                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{report.address_label}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span>Dept: <strong className="text-slate-200">{report.recommended_department.split('&')[0]}</strong></span>
                      <span className="text-emerald-400 font-mono font-medium">{report.status}</span>
                    </div>
                  </div>

                  {report.corroboration_count > 1 && (
                    <div className="bg-blue-950/60 p-1 rounded text-[10px] text-blue-300 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-400" />
                      <span>{report.corroboration_count} citizens corroborated this incident</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectReport && onSelectReport(report)}
                    className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect Explainability & Dispatch</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Bottom Legend */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> CRITICAL (80-100)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> HIGH (60-79)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> MEDIUM (35-59)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> LOW (&lt;35)
          </span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:block">
          OpenStreetMap &bull; Haversine Distance Filter &bull; Zero Map API Costs
        </span>
      </div>
    </div>
  );
};
