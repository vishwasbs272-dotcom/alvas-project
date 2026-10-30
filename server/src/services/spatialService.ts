export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface CandidateReport {
  id: string;
  ticket_code: string;
  category: string;
  summary: string;
  description: string;
  distance_meters: number;
  latitude: number;
  longitude: number;
  priority_score: number;
  created_at: string;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Filters reports within a given radius (default 200m) to serve as candidates for duplicate evaluation.
 */
export function findNearbyCandidates(
  targetLat: number,
  targetLng: number,
  existingReports: any[],
  radiusMeters: number = 200,
  excludeId?: string
): CandidateReport[] {
  const candidates: CandidateReport[] = [];

  for (const report of existingReports) {
    if (excludeId && report.id === excludeId) continue;
    // Don't evaluate against child duplicates; compare against master tickets or distinct tickets
    if (report.is_duplicate) continue;
    if (report.status === 'Resolved') continue;

    const distance = calculateHaversineDistanceMeters(
      targetLat,
      targetLng,
      report.latitude,
      report.longitude
    );

    if (distance <= radiusMeters) {
      candidates.push({
        id: report.id,
        ticket_code: report.ticket_code,
        category: report.ai_category || report.user_category,
        summary: report.ai_summary || report.description.slice(0, 80),
        description: report.description,
        distance_meters: distance,
        latitude: report.latitude,
        longitude: report.longitude,
        priority_score: report.priority_score,
        created_at: report.created_at,
      });
    }
  }

  return candidates.sort((a, b) => a.distance_meters - b.distance_meters);
}

/**
 * Helper to compute the centroid of a group of coordinates
 */
export function calculateCentroid(points: { latitude: number; longitude: number }[]): {
  center_lat: number;
  center_lng: number;
} {
  if (points.length === 0) return { center_lat: 0, center_lng: 0 };
  const sumLat = points.reduce((acc, p) => acc + p.latitude, 0);
  const sumLng = points.reduce((acc, p) => acc + p.longitude, 0);
  return {
    center_lat: Number((sumLat / points.length).toFixed(6)),
    center_lng: Number((sumLng / points.length).toFixed(6)),
  };
}
