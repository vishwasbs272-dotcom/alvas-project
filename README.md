# STRATUM.AI — Explainable Civic Triage, Spatial Deduplication & Infrastructure Action-Brief Platform

> **STRATUM.AI** transforms scattered citizen municipal complaints into prioritized, explainable, and trackable operational actions. Powered by Google Gemini 2.5 Flash, Haversine geospatial proximity clustering, and an explainable 4-factor scoring engine.

---

## 🏛️ Executive Summary & Core Mission

Every day, municipal corporations face waterlogging, broken roads, damaged streetlights, contaminated drinking water, and waste spills. Citizens submit redundant reports for the same hazard while acute life-safety hazards sit buried beneath routine complaints. Decision-makers lack prioritization clarity, and citizens rarely see what happened to their reports.

**STRATUM.AI** bridges this gap across all 4 stages of the civic report lifecycle:
1. **Capture**: Sub-60-second mobile-first capture with 1-click presets, photo evidence, and interactive coordinates.
2. **Understand**: Automated server-side AI pipeline combining **200m Haversine spatial candidate filtering** and **`gemini-2.5-flash`** with strict JSON schemas to categorize, detect semantic duplicates, and compute an explainable composite **Priority Score (0–100)** with 4 additive sub-factors.
3. **Reveal**: Interactive geospatial command map (`react-leaflet`), pulsing 250m multi-hazard cluster overlays, and Gemini-synthesized **Executive Action Briefs** determining root-cause dispatch sequence.
4. **Act**: Closed-loop field dispatch assigning specialized crews, transitioning statuses (`Submitted` &rarr; `AI Triaged` &rarr; `Assigned` &rarr; `In Progress` &rarr; `Resolved`), logging timestamped audit notes, and synchronizing live status back to every citizen who reported the issue.

---

## 🚀 Key Features

* **Sub-60-Second Mobile Report Capture**: Phone-optimized interface with 6 one-click location presets, preset hazard photo selector, and instant AI triage receipts.
* **Hybrid Spatial + LLM Duplicate Detection**: Pre-filters open tickets within a 200m Haversine radius, then passes candidates to `gemini-2.5-flash` to evaluate semantic duplication, merging tickets to eliminate queue clutter while boosting corroboration weights.
* **Explainable Priority Scoring Engine (0–100)**:
  * 🔴 **Life & Physical Safety Hazard** ($0-40$ pts)
  * 🟠 **Public Disruption & Corridor Mobility** ($0-25$ pts)
  * 🟡 **Cascading Infrastructure Failure Risk** ($0-20$ pts)
  * 🟢 **Spatial Corroboration Volume Boost** ($0-15$ pts)
* **Cross-Category Hotspot Detection & Action Brief Studio**: Groups spatially proximate reports (within 250m) across related categories (e.g., choked culvert + surface waterlogging + road cave-in) and synthesizes an executive 3-step action sequence so crews fix root causes before symptoms.
* **Live Closed-Loop Tracking Timeline**: 5-step visual stepper with real-time status updates, assigned crew telemetry, and duplicate sync.
* **Pre-Seeded 40-Item Synthetic Dataset**: Curated around Mangaluru/Bengaluru civic corridors with 3 distinct multi-hazard clusters and 8 deliberate duplicates.
* **100% Out-of-the-Box Local Fallback**: Seamless dual-engine storage (`@supabase/supabase-js` or auto-generating `runtimeStore.json`) and deterministic AI fallback if API keys are not supplied.
* **Limitations & System Honesty Ledger**: Explicit disclosure of real vs. mocked components and known AI failure modes.

---

## 📐 Architecture & Pipeline Flow

```
                      CITIZEN REPORT CAPTURE
                 (Text, Image, GPS Lat/Lng Pin)
                                │
                                ▼
               HAVERSINE SPATIAL CANDIDATE FILTER
                 (Finds Open Tickets within 200m)
                                │
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
          Nearby Candidates Found      Zero Nearby Matches
                  │                           │
                  └─────────────┬─────────────┘
                                ▼
                 GOOGLE GEMINI 2.5 FLASH ENGINE
               (@google/genai with strict JSON Schema)
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  Categorization         Duplicate Check         4-Factor Score
(6 Civic Domains)   (Confidence & Master ID)   (Safety, Disruption,
                                              Cascading, Corroboration)
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                ▼
                       STRATUM PERSISTENCE
                 (Supabase PG / Local JSON Store)
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
  COMMAND CENTER QUEUE                          CITIZEN TRACKER
 (Prioritized Roster,                        (Live 5-Stage Stepper,
  Map & Cluster Briefs)                      Assigned Crew & Audit Logs)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router DOM v6, Lucide React, Leaflet & React-Leaflet |
| **Backend** | Node.js (v20+), Express.js (ESM), TypeScript, `tsx`, `cors`, `dotenv` |
| **AI Engine** | Official `@google/genai` SDK (`gemini-2.5-flash`), strict `responseSchema`, deterministic heuristic fallback |
| **Validation** | `zod` for end-to-end request, query, and AI schema validation |
| **Database** | Dual-mode: Supabase PostgreSQL (`@supabase/supabase-js`) + persistent Local JSON Store (`runtimeStore.json`) |

---

## ⚡ Quick Start Guide

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd ALVAS\ 2.O

# Install root, server, and client dependencies
npm run install:all
```

### 2. Configure Environment Variables

A `.env.example` file is provided in the root directory:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Google Gemini API (Required for Live AI Triage & Action Briefs)
GEMINI_API_KEY=your_google_gemini_api_key_here

# Supabase Configuration (Optional - app automatically uses local JSON fallback if blank)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:4000/api
```

*(Note: If no `GEMINI_API_KEY` is provided, STRATUM.AI automatically runs its deterministic spatial and heuristic engine so the entire platform works out of the box!)*

### 3. Run the Development Servers

```bash
# Start both server (:4000) and client (:5173) concurrently
npm run dev
```

* **Client Web App**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
* **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🧭 Application Routes

* **`/` — Executive Split-Screen Demo Workspace**: The signature 5-minute judge demonstration view. Features the 390px Mobile Citizen Simulator on the left and the Live Command Center on the right. Submitting a report on the left immediately animates into the queue, updates the map, and tests live duplicate merging.
* **`/report` — Citizen Mobile Capture View**: Dedicated capture screen with 1-click judge presets, photo upload/sample selector, and instant AI Triage Receipt.
* **`/track` (& `/track/:ticketId`) — Citizen Status & Transparency Portal**: Searchable ticket view with 5-stage timeline (`Submitted` &rarr; `AI Triaged` &rarr; `Assigned` &rarr; `In Progress` &rarr; `Resolved`), corroboration counter, and audit notes.
* **`/command` — Municipal Command Center & Map**: Full-screen interactive OpenStreetMap, filterable prioritized queue, "Why This Rank?" explainability inspector, and field crew dispatch drawer.
* **`/clusters` — Hotspot & AI Action Brief Studio**: Multi-category geographic cluster cards displaying Gemini-synthesized Executive Action Briefs with 1-click re-generation.
* **`/honesty` — System Integrity & Limitations Ledger**: Architectural transparency scorecard detailing real vs. mocked integrations and known AI failure modes.

---

## ⏱️ 5-Minute Hackathon Demo Script for Judges

1. **Step 1: Open Split Demo Workspace (`/`)**
   * Point out the dual-mode view: Citizen Mobile Simulator on the left and Municipal Command Center on the right.
   * Note the top badges: Storage Engine (`Local JSON` or `Supabase PG`) and AI Engine status (`Gemini 2.5 Flash`).
2. **Step 2: Demonstrate 1-Click Duplicate Detection**
   * In the Mobile Simulator, click the preset **"Hampankatta Drain Cluster (Duplicate Test)"**.
   * The form automatically populates coordinates (`12.8708, 74.8441`) near existing open master ticket `REP-1004`.
   * Click **"Submit Hazard for Instant AI Triage"**.
   * Within seconds, the AI Triage Receipt appears, highlighting: **"Spatial Duplicate Corroborated! Merged to Master Ticket REP-1004 (94% Match)"**.
   * Point out that the main queue did not get cluttered with a redundant ticket; instead, `REP-1004` corroboration count incremented to `4` and jumped up in urgency!
3. **Step 3: Inspect "Why This Rank?" Explainability**
   * On the Command Center queue, click `REP-1013` (Sparking 11kV Conductor outside school gate, Priority `97 CRITICAL`).
   * Inspect the **"Why This Rank?"** panel: point to the 4 quantitative sub-scores:
     * Safety: `40/40`, Disruption: `23/25`, Cascading: `19/20`, Corroboration: `15/15`.
   * Open the **"Compare Against Another Report"** dropdown and select a routine pothole (`REP-1031`, Priority 38).
   * Observe the automated side-by-side comparison explaining why `REP-1013` outranks `REP-1031`.
4. **Step 4: View Multi-Category Cluster Action Brief (`/clusters`)**
   * Navigate to the **Hotspots & Briefs** tab.
   * View **Cluster 1: Hampankatta Drainage-Subbase Corridor (12 Reports)**.
   * Show how Gemini synthesized a 3-step root-cause sequence:
     * *Step 1: Stormwater Jetting Unit clears choked culvert (halts surface overwash).*
     * *Step 2: Road Engineering excavates waterlogged sub-base and applies cold-mix asphalt.*
     * *Step 3: Traffic Police diverts corridor traffic.*
   * Click **"Regenerate AI Brief"** to watch live AI synthesis in real time.
5. **Step 5: Dispatch & Closed-Loop Loop Closure**
   * On the Dispatch Panel, select crew **"Stormwater Jetting Unit Alpha"**, change status to **"In Progress"**, and submit notes.
   * Switch the left Mobile Simulator to **"Citizen Track"** (`REP-1004`).
   * The live timeline immediately reflects the `In Progress` status and assigned crew!
6. **Step 6: Show Honesty Ledger (`/honesty`)**
   * Highlight the engineering transparency table detailing live Gemini calls vs. mocked external SMS/vehicle telemetry.
   * Click **"Reset 40 Reports"** in the top navbar to restore the clean initial state in 1 second.

---

## 🔒 Security & Privacy Practices

* **Zero Real PII**: No citizen phone numbers, Aadhaar, email addresses, or precise residential coordinates are stored. Names default to "Anonymous Citizen".
* **Server-Side API Key Isolation**: `GEMINI_API_KEY` and Supabase keys never leave the Node.js backend.
* **Payload Sanitation**: Express `5MB` request body limits protect against memory exhaustion from image data.
* **Input Validation**: Strict Zod schemas guard every route against malformed parameters.

---

## 📄 License & Team Credits

Built for civic-tech hackathons and modern municipal triage automation.
Powered by **Google Gemini 2.5 Flash**, **OpenStreetMap**, and **React**.

