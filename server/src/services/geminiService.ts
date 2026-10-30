import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { CandidateReport } from './spatialService.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const apiKey = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash';

let aiInstance: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'your_google_gemini_api_key_here') {
  try {
    aiInstance = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('[GEMINI] Failed to initialize GoogleGenAI client:', err);
    aiInstance = null;
  }
}

export const SYSTEM_INSTRUCTION = `You are STRATUM-CORE, an expert Municipal Infrastructure Triage & Spatial Intelligence AI.
Your role is to analyze unstructured citizen civic complaints, optional hazard images, and nearby open tickets within a 200-meter radius.

Rules of Engagement:
1. CATEGORIZATION: Classify every issue into one of: WATERLOGGING_DRAINAGE, ROAD_INFRASTRUCTURE, ELECTRICAL_STREETLIGHTS, WASTE_SANITATION, WATER_SUPPLY_LEAKAGE, or PUBLIC_SAFETY_OBSTRUCTION.
2. DEDUPLICATION: Compare the new report against the provided list of nearby candidate reports (within 200m). Mark is_duplicate=true ONLY if they describe the exact same physical hazard or directly connected fault (e.g., two angles of the same flooded intersection or sparking pole). Do not mark distinct issues on the same street as duplicates; those belong to a spatial cluster.
3. EXPLAINABLE PRIORITIZATION: Score strictly using four additive sub-factors:
   - factor_safety (0-40): Immediate threat to human life, electrocution, open manholes, hospital/school proximity.
   - factor_disruption (0-25): Traffic paralysis, commercial flooding, main arterial blockage.
   - factor_cascading (0-20): Risk that delaying repair causes secondary infrastructure failure (e.g., clogged drain eroding road sub-base).
   - factor_corroboration (0-15): Base 3 points for a single report, scaling up to 15 points when multiple nearby reports corroborate urgency.
4. PLAIN-LANGUAGE EXPLANATION: Provide a crisp, transparent 1-2 sentence explanation suitable for both a Municipal Commissioner and a citizen explaining WHY this score was assigned.`;

export const triageReportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ai_category: {
      type: Type.STRING,
      enum: [
        'WATERLOGGING_DRAINAGE',
        'ROAD_INFRASTRUCTURE',
        'ELECTRICAL_STREETLIGHTS',
        'WASTE_SANITATION',
        'WATER_SUPPLY_LEAKAGE',
        'PUBLIC_SAFETY_OBSTRUCTION'
      ]
    },
    ai_summary: {
      type: Type.STRING,
      description: 'Concise 8-to-14 word operational summary of the physical issue.'
    },
    is_duplicate: {
      type: Type.BOOLEAN,
      description: 'True if this report describes the exact same physical incident as one of the nearby candidates.'
    },
    duplicate_of_ticket_code: {
      type: Type.STRING,
      nullable: true,
      description: 'Exact ticket_code of the matching master report from nearby_candidates, or null.'
    },
    duplicate_confidence: {
      type: Type.NUMBER,
      description: 'Confidence score between 0.0 and 1.0 that this is a duplicate.'
    },
    factor_safety: {
      type: Type.INTEGER,
      description: 'Life and physical safety hazard score from 0 to 40.'
    },
    factor_disruption: {
      type: Type.INTEGER,
      description: 'Mobility, school/hospital access, and public disruption score from 0 to 25.'
    },
    factor_cascading: {
      type: Type.INTEGER,
      description: 'Cascading infrastructure failure risk from 0 to 20.'
    },
    factor_corroboration: {
      type: Type.INTEGER,
      description: 'Report volume and spatial corroboration boost from 0 to 15.'
    },
    ai_explanation: {
      type: Type.STRING,
      description: 'Plain-language explanation of why these priority factors were assigned and why it ranks at this urgency.'
    },
    recommended_department: {
      type: Type.STRING,
      description: 'Specific municipal response unit to dispatch (e.g., Stormwater Jetting Unit, MESCOM Electrical Rapid Response, Road Engineering Division).'
    }
  },
  required: [
    'ai_category',
    'ai_summary',
    'is_duplicate',
    'duplicate_of_ticket_code',
    'duplicate_confidence',
    'factor_safety',
    'factor_disruption',
    'factor_cascading',
    'factor_corroboration',
    'ai_explanation',
    'recommended_department'
  ]
};

export const clusterActionBriefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executive_headline: {
      type: Type.STRING,
      description: 'High-impact 10-word headline summarizing the area-level crisis.'
    },
    root_cause_diagnosis: {
      type: Type.STRING,
      description: '2-sentence synthesis explaining how the multiple categories in this area are physically connected (e.g., plastic-choked storm drain causing surface flooding which caused asphalt pothole collapse).'
    },
    operational_sequence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step_number: { type: Type.INTEGER },
          department: { type: Type.STRING },
          action_directive: { type: Type.STRING },
          dependency_note: { type: Type.STRING }
        },
        required: ['step_number', 'department', 'action_directive', 'dependency_note']
      },
      description: 'Ordered 3-step sequence of operations so crews fix the root cause before surface symptoms.'
    },
    estimated_impact_if_delayed: {
      type: Type.STRING,
      description: 'Concrete risk projection over the next 24-48 hours if unaddressed.'
    },
    field_equipment_checklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: [
    'executive_headline',
    'root_cause_diagnosis',
    'operational_sequence',
    'estimated_impact_if_delayed',
    'field_equipment_checklist'
  ]
};

export interface TriageResult {
  ai_category: string;
  ai_summary: string;
  is_duplicate: boolean;
  duplicate_of_ticket_code: string | null;
  duplicate_confidence: number;
  factor_safety: number;
  factor_disruption: number;
  factor_cascading: number;
  factor_corroboration: number;
  priority_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  ai_explanation: string;
  recommended_department: string;
  ai_engine: 'gemini-2.5-flash' | 'deterministic-fallback';
}

export interface ClusterActionBriefResult {
  executive_headline: string;
  root_cause_diagnosis: string;
  operational_sequence: Array<{
    step_number: number;
    department: string;
    action_directive: string;
    dependency_note: string;
  }>;
  estimated_impact_if_delayed: string;
  field_equipment_checklist: string[];
  ai_engine: 'gemini-2.5-flash' | 'deterministic-fallback';
}

/**
 * Deterministic Fallback TF-IDF token overlap & rule-based scorer
 */
function computeFallbackTriage(
  description: string,
  user_category: string,
  address_label: string,
  nearbyCandidates: CandidateReport[]
): TriageResult {
  const descLower = description.toLowerCase();
  
  // 1. Category Detection
  let ai_category = 'ROAD_INFRASTRUCTURE';
  if (
    descLower.includes('flood') ||
    descLower.includes('waterlog') ||
    descLower.includes('drain') ||
    descLower.includes('culvert') ||
    descLower.includes('overflow') ||
    descLower.includes('sewage')
  ) {
    ai_category = 'WATERLOGGING_DRAINAGE';
  } else if (
    descLower.includes('spark') ||
    descLower.includes('electric') ||
    descLower.includes('transformer') ||
    descLower.includes('wire') ||
    descLower.includes('current') ||
    descLower.includes('streetlight') ||
    descLower.includes('dark') ||
    descLower.includes('pole')
  ) {
    ai_category = 'ELECTRICAL_STREETLIGHTS';
  } else if (
    descLower.includes('garbage') ||
    descLower.includes('dump') ||
    descLower.includes('waste') ||
    descLower.includes('trash') ||
    descLower.includes('bin') ||
    descLower.includes('smell') ||
    descLower.includes('leachate')
  ) {
    ai_category = 'WASTE_SANITATION';
  } else if (
    descLower.includes('pipe') ||
    descLower.includes('leak') ||
    descLower.includes('drinking water') ||
    descLower.includes('burst') ||
    descLower.includes('tap')
  ) {
    ai_category = 'WATER_SUPPLY_LEAKAGE';
  } else if (
    descLower.includes('tree') ||
    descLower.includes('branch') ||
    descLower.includes('manhole') ||
    descLower.includes('pit') ||
    descLower.includes('slab') ||
    descLower.includes('footpath') ||
    descLower.includes('blocked road')
  ) {
    ai_category = 'PUBLIC_SAFETY_OBSTRUCTION';
  } else if (user_category && user_category !== 'UNSURE') {
    ai_category = user_category;
  }

  // 2. Duplicate Detection via Token Overlap with Candidates
  let is_duplicate = false;
  let duplicate_of_ticket_code: string | null = null;
  let duplicate_confidence = 0.0;

  const descWords = new Set(
    descLower
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  for (const cand of nearbyCandidates) {
    const candWords = new Set(
      cand.description
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    let intersection = 0;
    for (const w of descWords) {
      if (candWords.has(w)) intersection++;
    }
    const union = new Set([...descWords, ...candWords]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    // Proximity factor (closer = higher duplicate probability if text overlaps)
    const distanceBoost = Math.max(0, 1 - cand.distance_meters / 200) * 0.3;
    const combinedScore = Math.min(1.0, Number((jaccard * 0.7 + distanceBoost).toFixed(2)));

    if (combinedScore >= 0.55 && combinedScore > duplicate_confidence) {
      duplicate_confidence = combinedScore;
      duplicate_of_ticket_code = cand.ticket_code;
      is_duplicate = combinedScore >= 0.65;
    }
  }

  // 3. Sub-factor calculation
  let factor_safety = 8;
  let factor_disruption = 6;
  let factor_cascading = 5;
  let factor_corroboration = nearbyCandidates.length > 0 ? Math.min(15, 3 + nearbyCandidates.length * 3) : 3;

  if (ai_category === 'ELECTRICAL_STREETLIGHTS') {
    if (descLower.includes('spark') || descLower.includes('live wire') || descLower.includes('shock') || descLower.includes('school') || descLower.includes('hospital')) {
      factor_safety = 38;
      factor_disruption = 20;
      factor_cascading = 18;
    } else {
      factor_safety = 18;
      factor_disruption = 12;
      factor_cascading = 10;
    }
  } else if (ai_category === 'WATERLOGGING_DRAINAGE') {
    if (descLower.includes('entering shop') || descLower.includes('hospital') || descLower.includes('submerged') || descLower.includes('knee deep')) {
      factor_safety = 28;
      factor_disruption = 24;
      factor_cascading = 19;
    } else {
      factor_safety = 16;
      factor_disruption = 18;
      factor_cascading = 14;
    }
  } else if (ai_category === 'ROAD_INFRASTRUCTURE') {
    if (descLower.includes('cave-in') || descLower.includes('crater') || descLower.includes('accident')) {
      factor_safety = 32;
      factor_disruption = 22;
      factor_cascading = 15;
    } else {
      factor_safety = 12;
      factor_disruption = 14;
      factor_cascading = 8;
    }
  } else if (ai_category === 'PUBLIC_SAFETY_OBSTRUCTION') {
    factor_safety = 24;
    factor_disruption = 18;
    factor_cascading = 9;
  } else if (ai_category === 'WATER_SUPPLY_LEAKAGE') {
    factor_safety = 10;
    factor_disruption = 15;
    factor_cascading = 16;
  } else {
    // WASTE_SANITATION
    factor_safety = 14;
    factor_disruption = 11;
    factor_cascading = 10;
  }

  const priority_score = Math.min(
    100,
    Math.max(5, factor_safety + factor_disruption + factor_cascading + factor_corroboration)
  );

  let priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (priority_score >= 80) priority_level = 'CRITICAL';
  else if (priority_score >= 60) priority_level = 'HIGH';
  else if (priority_score >= 35) priority_level = 'MEDIUM';

  const departmentMap: Record<string, string> = {
    WATERLOGGING_DRAINAGE: 'Stormwater Jetting & Drainage Division',
    ROAD_INFRASTRUCTURE: 'Road Engineering & Asphalt Maintenance',
    ELECTRICAL_STREETLIGHTS: 'MESCOM Electrical Rapid Response',
    WASTE_SANITATION: 'Solid Waste Management & Sanitation Wing',
    WATER_SUPPLY_LEAKAGE: 'Municipal Water Board Rapid Pipeline Cell',
    PUBLIC_SAFETY_OBSTRUCTION: 'Disaster Management & Civic Obstruction Unit',
  };

  const words = description.split(' ').slice(0, 10).join(' ');
  const ai_summary = words.length > 0 ? `${words}...` : 'Civic incident reported at coordinates';

  const ai_explanation = `Assigned ${priority_score}/100 (${priority_level}) based on Safety (${factor_safety}/40), Disruption (${factor_disruption}/25), Cascading Infrastructure Risk (${factor_cascading}/20), and Corroboration (${factor_corroboration}/15). Evaluated with deterministic spatial engine.`;

  return {
    ai_category,
    ai_summary,
    is_duplicate,
    duplicate_of_ticket_code,
    duplicate_confidence,
    factor_safety,
    factor_disruption,
    factor_cascading,
    factor_corroboration,
    priority_score,
    priority_level,
    ai_explanation,
    recommended_department: departmentMap[ai_category] || 'Civil Infrastructure Division',
    ai_engine: 'deterministic-fallback',
  };
}

/**
 * Triage a report using @google/genai (gemini-2.5-flash) with strict JSON schema and fallback
 */
export async function triageReportWithGemini(
  description: string,
  user_category: string,
  address_label: string,
  latitude: number,
  longitude: number,
  image_data?: string | null,
  nearbyCandidates: CandidateReport[] = []
): Promise<TriageResult> {
  if (!aiInstance) {
    return computeFallbackTriage(description, user_category, address_label, nearbyCandidates);
  }

  try {
    const candidatesPrompt = nearbyCandidates.map((c) => ({
      ticket_code: c.ticket_code,
      category: c.category,
      summary: c.summary,
      description: c.description,
      distance_meters: c.distance_meters,
      priority_score: c.priority_score,
    }));

    const promptText = `
NEW CITIZEN REPORT TO TRIAGE:
- Description: "${description}"
- User Chosen Category: ${user_category}
- Location Label: ${address_label} (Lat: ${latitude}, Lng: ${longitude})

NEARBY OPEN INCIDENTS WITHIN 200 METERS (${nearbyCandidates.length} found):
${JSON.stringify(candidatesPrompt, null, 2)}

Analyze this complaint rigorously. Check if it matches any nearby open incident. Score all 4 factors deterministically and recommend the exact municipal crew.`;

    const contents: any[] = [];

    // Optional inline multimodal image support
    if (image_data && image_data.startsWith('data:image')) {
      const match = image_data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({ text: promptText });

    const response = await aiInstance.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: triageReportSchema,
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const factor_safety = Math.min(40, Math.max(0, Number(parsed.factor_safety) || 0));
    const factor_disruption = Math.min(25, Math.max(0, Number(parsed.factor_disruption) || 0));
    const factor_cascading = Math.min(20, Math.max(0, Number(parsed.factor_cascading) || 0));
    const factor_corroboration = Math.min(15, Math.max(0, Number(parsed.factor_corroboration) || 0));
    const priority_score = Math.min(100, Math.max(0, factor_safety + factor_disruption + factor_cascading + factor_corroboration));

    let priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (priority_score >= 80) priority_level = 'CRITICAL';
    else if (priority_score >= 60) priority_level = 'HIGH';
    else if (priority_score >= 35) priority_level = 'MEDIUM';

    return {
      ai_category: parsed.ai_category || user_category,
      ai_summary: parsed.ai_summary || description.slice(0, 80),
      is_duplicate: Boolean(parsed.is_duplicate),
      duplicate_of_ticket_code: parsed.duplicate_of_ticket_code || null,
      duplicate_confidence: Number(parsed.duplicate_confidence) || 0,
      factor_safety,
      factor_disruption,
      factor_cascading,
      factor_corroboration,
      priority_score,
      priority_level,
      ai_explanation: parsed.ai_explanation || 'Triaged via Gemini 2.5 Flash infrastructure intelligence.',
      recommended_department: parsed.recommended_department || 'Municipal Engineering Division',
      ai_engine: 'gemini-2.5-flash',
    };
  } catch (error) {
    console.error('[GEMINI] Live AI call failed or timed out. Falling back to deterministic engine:', error);
    return computeFallbackTriage(description, user_category, address_label, nearbyCandidates);
  }
}

/**
 * Synthesizes an Executive Cluster Action Brief using @google/genai with fallback
 */
export async function generateClusterActionBriefWithGemini(
  clusterTitle: string,
  clusterReports: any[]
): Promise<ClusterActionBriefResult> {
  if (!aiInstance) {
    return generateFallbackClusterBrief(clusterTitle, clusterReports);
  }

  try {
    const reportSummaries = clusterReports.map((r) => ({
      ticket_code: r.ticket_code,
      category: r.ai_category,
      summary: r.ai_summary,
      description: r.description,
      priority_score: r.priority_score,
      address_label: r.address_label,
    }));

    const promptText = `CLUSTER: "${clusterTitle}"
REPORTS IN THIS 250M GEOGRAPHIC CLUSTER (${clusterReports.length} incidents):
${JSON.stringify(reportSummaries, null, 2)}

Task: Analyze the systemic physical connection across these reports (cross-category root cause). Formulate an actionable, sequential 3-step dispatch directive so municipal decision makers solve the root cause before treating surface symptoms.`;

    const response = await aiInstance.models.generateContent({
      model: MODEL_NAME,
      contents: [{ text: promptText }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: clusterActionBriefSchema,
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      executive_headline: parsed.executive_headline || `Multi-Category Emergency: ${clusterTitle}`,
      root_cause_diagnosis: parsed.root_cause_diagnosis || 'Cross-category infrastructure interaction detected.',
      operational_sequence: parsed.operational_sequence || [],
      estimated_impact_if_delayed: parsed.estimated_impact_if_delayed || 'Prolonged public disruption and cascading road structural collapse.',
      field_equipment_checklist: parsed.field_equipment_checklist || ['Heavy Excavator', 'Drain Suction Jetter', 'Barricading'],
      ai_engine: 'gemini-2.5-flash',
    };
  } catch (error) {
    console.error('[GEMINI] Cluster Action Brief generation failed. Falling back to deterministic brief:', error);
    return generateFallbackClusterBrief(clusterTitle, clusterReports);
  }
}

function generateFallbackClusterBrief(
  clusterTitle: string,
  clusterReports: any[]
): ClusterActionBriefResult {
  const categories = Array.from(new Set(clusterReports.map((r) => r.ai_category)));
  
  return {
    executive_headline: `Urgent Corridor Intervention: ${clusterTitle} Multi-Hazard Zone`,
    root_cause_diagnosis: `Analysis of ${clusterReports.length} proximate incidents reveals that subterranean waterlogging and blocked arterial drainage are undermining road sub-base integrity and exposing electrical conduit infrastructure across this corridor.`,
    operational_sequence: [
      {
        step_number: 1,
        department: 'Stormwater Jetting & Drainage Division',
        action_directive: 'Deploy high-velocity suction jetting units to clear clogged culverts and primary arterial conduits.',
        dependency_note: 'Must precede road surface repairs to avoid recurring hydraulic washouts.'
      },
      {
        step_number: 2,
        department: 'MESCOM Electrical Rapid Response',
        action_directive: 'Isolate and secure exposed transformer cables and low-hanging distribution lines before road excavation begins.',
        dependency_note: 'Critical life-safety prerequisite for heavy road machinery crews.'
      },
      {
        step_number: 3,
        department: 'Road Engineering & Asphalt Maintenance',
        action_directive: 'Backfill water-saturated cavities with dense bituminous macadam and seal asphalt fissures.',
        dependency_note: 'Execute only after water table subsides following step 1 culvert clearance.'
      }
    ],
    estimated_impact_if_delayed: 'Within 24-48 hours, standing water will trigger extensive sub-base subsidence, causing complete traffic gridlock and severe electrocution risks.',
    field_equipment_checklist: [
      'High-velocity vacuum jetting truck (10,000L)',
      'Submersible dewatering pumps (x4)',
      'Cold mix asphalt compactors',
      'Insulated high-voltage line inspection kit',
      'Class-1 reflective traffic diversion barriers'
    ],
    ai_engine: 'deterministic-fallback'
  };
}
