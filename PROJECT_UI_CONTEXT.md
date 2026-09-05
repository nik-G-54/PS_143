# 🌊 OCEAN SENTINEL (NAUKA) — Complete Project Context & UI Redesign Specification

> **SIH 2026 — Problem Statement #143: Maritime Oil Spill Detection, Backtracking & AIS Vessel Attribution**  
> **Authoritative Purpose:** Complete codebase and architectural blueprint for a full UI/UX redesign.

---

## 📑 TABLE OF CONTENTS
1. [Project Overview & Core Mission](#1-project-overview--core-mission)
2. [Current Tech Stack & Dependencies](#2-current-tech-stack--dependencies)
3. [Design System & Styling Architecture](#3-design-system--styling-architecture)
4. [Routing & Application Shell (Layout)](#4-routing--application-shell-layout)
5. [Page 1: Executive Dashboard (`/`)](#5-page-1-executive-dashboard-)
6. [Page 2: Maritime Map 2D GIS (`/maritime-map`)](#6-page-2-maritime-map-2d-gis-maritime-map)
7. [Page 3: Incidents Registry (`/incidents`)](#7-page-3-incidents-registry-incidents)
8. [Page 4: 3D Incident Reconstruction Digital Twin (`/incident-reconstruction`)](#8-page-4-3d-incident-reconstruction-digital-twin-incident-reconstruction)
9. [State Management & Context Architecture](#9-state-management--context-architecture)
10. [Backend APIs & Data Contracts](#10-backend-apis--data-contracts)
11. [Current UI Flaws, Inconsistencies & Redesign Recommendations](#11-current-ui-flaws-inconsistencies--redesign-recommendations)

---

## 1. Project Overview & Core Mission

### 1.1 The Problem (SIH 2026 #143)
Illegal oil dumping, vessel bilge cleaning, and accidental spills cause massive damage to marine ecosystems. Conventional satellite radar (SAR) and optical imagery detect slicks on the ocean surface, but by the time a satellite observes the spill:
1. The culprit ship has already sailed far away.
2. The slick has drifted miles away from its release point under the influence of wind and ocean currents.

### 1.2 The Core Paradigm Shift
* **Previous/Naive Approach:** Trace ship paths backwards blindly to guess who was near the spill.
* **Current Core Paradigm:** **Oil Drift Backtracking + AIS Spatio-Temporal Correlation**.
  ```text
  [ Satellite Radar / Optical Detection ]
                     ↓
  [ Observed Oil Slick Location & Centroid ]
                     ↓
  [ Hydrodynamic Reverse Physics (ECMWF Winds + HYCOM Ocean Currents) ]
                     ↓
  [ Backwards Drift Trajectory & Estimated Source Release Location / Time ]
                     ↓
  [ Spatio-Temporal Query on AIS Vessel Tracks at the Release Window ]
                     ↓
  [ Ranked Suspect Vessels & Attribution Scoring ]
  ```
* **Authoritative Geographic Dataset:** **Mediterranean Sea** (Coordinates around Latitude `35.0494° N`, Longitude `24.0517° E`, near Crete/Greece). *(Initial prototypes used Bay of Bengal, but authoritative backend demo data is Mediterranean Sea).*

---

## 2. Current Tech Stack & Dependencies

| Category | Technology / Library | Version | Usage |
|---|---|---|---|
| **Core Framework** | React | `^19.2.7` | Modern functional UI components |
| **Build Tool** | Vite | `^8.1.1` | Ultra-fast HMR and bundling |
| **Language** | TypeScript | `^7.0.2` | Type-safe models, interfaces, and contracts |
| **Styling** | Tailwind CSS | `^3.4.4` | Utility-first styling with CSS variables |
| **Routing** | React Router DOM | `^7.18.2` | Single Page App routing with Suspense lazy loading |
| **2D GIS Map** | MapLibre GL | `^6.7.0` | Vector tile basemap rendering |
| **2D Layers** | Deck.gl (`@deck.gl/react`, `@deck.gl/layers`, `@deck.gl/mapbox`) | `^9.3.11` | High-volume GPU data rendering on maps |
| **3D Engine** | Three.js | `^0.185.1` | 3D scene rendering, meshes, custom shaders |
| **React 3D Bridge** | `@react-three/fiber` (R3F) & `@react-three/drei` | `^9.7.0` / `^10.7.8` | Declarative 3D scene graph & helpers |
| **Charts** | Recharts | `^3.10.1` | Pie charts, radial rings, trend heatmaps |
| **Icons** | Lucide React | `^1.34.0` | Clean, modern SVG iconography |
| **3D Globe** | Cobe | `^2.0.1` | Interactive canvas mini globe preview |
| **Animation** | GSAP | `^3.15.0` | Advanced timeline & hover animations |

---

## 3. Design System & Styling Architecture

The project currently has two aesthetic themes that need unification during the UI redesign:

### 3.1 Active Theme (Claude Terracotta Amber / Warm Minimalist)
* **Fonts:** `Outfit` (Headings & UI Sans), `Geist Mono` (Data / Telemetry / Coordinates).
* **Light Palette:**
  * Background: `#faf9f5` (Warm Cream / Linen)
  * Card: `#f5f4ef` | Border: `#dad9d4` | Text: `#3d3929`
  * Primary / Accent: `#c96442` (Terracotta Amber)
* **Dark Palette:**
  * Background: `#262624` (Deep Charcoal)
  * Card: `#2c2c2b` | Border: `#3e3e38` | Text: `#f1f1ef`
  * Primary / Accent: `#d97757` (Vibrant Coral Amber)

### 3.2 Target Averra B2B Maritime Intelligence Concept (`design.md`)
* **Reference:** Averra B2B Dashboard Specification.
* **Palette:**
  * **Primary Action:** `#0D9488` (Sea Green / Cyan) or `#00B894`
  * **Dark Mode Base:** `#090D16` (Deep Oceanic Navy Black)
  * **Surfaces/Cards:** `#151F33` (Midnight Slate) with `#64748B` borders
  * **Alert Critical:** `#DC2626` (Spill Crimson)
  * **Vessel Safe:** `#10B981` (Safe Emerald)
  * **Telemetry Monospace:** `JetBrains Mono`

> 💡 **Redesign Opportunity:** Unify these aesthetics into a sleek, military/defense cyber-tactical command center aesthetic.

---

## 4. Routing & Application Shell (Layout)

The application runs inside a persistent shell (`Sidebar` + `Header` + Dynamic Main Content):

```text
┌──────────────┬────────────────────────────────────────────────────────┐
│              │ Header: Route Title | Incident Picker | Demo Badge | ☀️/🌙 │
│   SIDEBAR    ├────────────────────────────────────────────────────────┤
│              │                                                        │
│ [NAUKA Logo] │                                                        │
│              │                                                        │
│ • Dashboard  │                                                        │
│ • Live Map   │                    PAGE CONTENT                        │
│ • Incidents  │                                                        │
│ • 3D Recon   │                                                        │
│              │                                                        │
└──────────────┴────────────────────────────────────────────────────────┘
```

### 4.1 Sidebar (`src/components/layout/Sidebar.tsx`)
* **Brand Logo:** Vector insignia combining Satellite radar, Waves, and Ship bow.
* **Brand Title:** `NAUKA` ("Science / Vessel" in Slavic / Maritime context) or `OCEAN SENTINEL`.
* **State Behavior:**
  * Width is `240px` on Dashboard and Incidents.
  * **Auto-collapses** to `68px` (icon-only mode) on `/maritime-map` and `/incident-reconstruction` to give maximum viewport space to maps and 3D scenes.
  * Expands on hover with smooth transition and shadow elevation.
* **Navigation Links:**
  1. `Dashboard` (`/` or `/dashboard`) — Icon: `LayoutDashboard`
  2. `Maritime Map` (`/maritime-map`) — Icon: `Map`
  3. `Incidents` (`/incidents`) — Icon: `AlertTriangle`
  4. `3D Incident Reconstruction` (`/incident-reconstruction`) — Icon: `Video`

### 4.2 Header (`src/components/layout/Header.tsx`)
* **Height:** `64px` (`h-16`).
* **Left Section:** Route icon and uppercase Title.
* **Incident Selector Dropdown (on `/incident-reconstruction`):**
  * Allows user to instantly switch between active spills (`spill_A`, `spill_B`, `spill_dba12b`, etc.).
  * Synchronizes via URL search params (`?id=spill_xxx`).
* **Data Provenance Status Badge:**
  * `LIVE DATA` (Emerald green dot + badge) when consuming real backend responses.
  * `DEMO DATA` (Amber dot + badge) when utilizing simulated fallbacks.
  * `LOADING...` with spinning icon during data fetch.
* **Right Section:** Sun/Moon Theme Toggle button.

---

## 5. Page 1: Executive Dashboard (`/`)

File: `src/pages/DashboardPage.tsx`  
Layout: **Magic Bento Grid** with interactive cursor spotlight and hover physics (`MagicBento.tsx`).

```text
┌──────────────────────────────────────┬────────────────────────────────────────────────┐
│  CARD 1: Satellite Radar Surveillance│  CARD 2: Recent Alerts & Incidents Table       │
│  (Concentric Rings, Sweep Animation, │  (Spill ID, Timestamp, Status, Severity, Area, │
│   Active Satellite Constellation)    │   Click to launch Live Map investigation)      │
├──────────────────────────────────────┼────────────────────────────────────────────────┤
│  CARD 3: Severity Distribution Chart │  CARD 4: Case Status Distribution Rings        │
│  (Recharts Pie Chart: High/Med/Low)  │  (Recharts Radial Activity: Active/Closed/Rev) │
├──────────────────────────────────────┴────────────────────────────────────────────────┤
│  CARD 5: Monthly Detection Trend Heatmap Calendar Grid (Full Width)                   │
│  (Activity blocks by day/month, intensity based on incident volume)                  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Components in Dashboard:
1. **`SatelliteRadar.tsx`:**
   * CSS conic-gradient radar sweep animation (4s loop).
   * Concentric range circles, grid crosshairs, blinking alert hotspots.
   * Constellation Status Feed: Sentinel-1A (Active), Landsat-8 (Active), Sentinel-2B (Scanning), RADARSAT-2 (Standby) with pass times.
   * Telemetry status: "COMS LINK STABLE", "HEALTH 99.8%".
2. **`RecentIncidents.tsx`:**
   * Table displaying recent spill observations.
   * Columns: Spill ID (e.g. `DARTIS-2019-001`), Timestamp, Location name, Status pill (`NEW`, `REVIEW`, `CLOSED`), Severity pill (`HIGH`, `MEDIUM`, `LOW`), Suspected Vessel, Spill Area (`km²`).
   * Clicking a row navigates to `/live-map?spill_id=...`.
3. **`SeverityDistribution.tsx`:**
   * Solid Donut / Pie chart visualizing severity proportions.
4. **`CaseStatusChart.tsx`:**
   * Radial activity rings representing workflow status (Under Review, Attributed, Investigating).
5. **`MonthlyTrend.tsx`:**
   * GitHub-style heatmap grid showing monthly detection frequency.
6. **`MagicBento.tsx`:**
   * Custom tilt, particle effects, magnetism, and global spotlight follower.

---

## 6. Page 2: Maritime Map 2D GIS (`/maritime-map`)

File: `src/features/maritime-map/page/MaritimeMapPage.tsx`  
Core Engine: `MaritimeMap.tsx` running **MapLibre GL** + **Deck.GL**.

### 6.1 Map Features & Deck.GL Layers
* **Basemap Tile Support:** Carto Dark Matter, Carto Positron Light, ESRI Satellite Imagery, Nautical basemaps.
* **Layers (`src/features/maritime-map/layers/`):**
  * `SpillLayer.ts`: Renders oil spill bounding polygons and centroids with severity colors and pulsing markers.
  * `TrajectoryLayer.ts`: Renders reverse drift spline with gradient arrows showing drift from release location to satellite observation.
  * `VesselLayer.ts`: Renders real-time and candidate ships as directional vessel icons with speed vectors.
  * `AISTrackLayer.ts`: Displays historical AIS track paths of candidate vessels.
  * `EnvironmentLayer.ts`: Vector arrows showing ECMWF wind and HYCOM sea currents.
  * `IncidentLayer.ts`: High-priority incident markers.

### 6.2 Floating Controls & Panels
* **`BasemapSelector.tsx`:** Switch between Dark, Light, and Satellite basemaps.
* **`EnvironmentToggles.tsx`:** Quick toggles for Wind vectors, Current vectors, and Wave fields.
* **`SpillLegend.tsx`:** Color legend for spill severity, status, and candidate confidence.
* **`SpillStatusBadge.tsx`:** Floating operational status indicator.
* **`InvestigationTimeline.tsx`:** 2D interactive playback scrubber to replay spill progression.

### 6.3 Side Drawers & Evidence Details
* **`InvestigationPanel.tsx` (Slide-over drawer on spill select):**
  * Detection summary: Area (`km²`), Confidence score, Timestamp, Coordinates.
  * **Drift Backtrack Readout:** Backtracked duration (hours), Path length (`km`), Total trajectory positions, Source origin lat/lon, Uncertainty radius (`km`).
  * **Attribution Readout:** Number of candidate ships found in the spatiotemporal window, top suspect vessel ID, match score, and distance.
  * Controls: Focus Mode (zooms camera to incident), Toggle Backtrack Path, Recenter.
* **`SpillDetailsSection.tsx` (Scroll-down deep dive):**
  * High-resolution ESRI satellite imagery snapshot of the detected slick.
  * `TrajectoryChart.tsx`: Scientific graph plotting drift speed vs time.

---

## 7. Page 3: Incidents Registry (`/incidents`)

File: `src/pages/IncidentsPage.tsx`  
Purpose: Complete search, sorting, filtering, and management table of all detected maritime incidents.

### 7.1 Filter Bar (`IncidentFilters.tsx`)
* **Search Input:** Searches incident ID (`spill_xxx`), location name, or coordinates.
* **Status Dropdown:** Filter by `ALL`, `ACTIVE`, `INVESTIGATING`, `RESOLVED`.
* **Telemetry Counter:** "Showing X of Y incidents".

### 7.2 Incidents Table (`IncidentsTable.tsx` & `IncidentRow.tsx`)
* **Columns:**
  1. `Incident ID` (Monospace, clickable, navigates to 3D reconstruction)
  2. `Date / UTC Time`
  3. `Location` (Sea name + precise lat/lon)
  4. `Status Badge` (`ACTIVE` green, `INVESTIGATING` amber, `RESOLVED` blue)
  5. `AI Confidence` (Percentage score)
  6. `Vessels Involved` (Candidate count)
  7. `Spill Area` (Value in `km²`)
  8. `Severity Badge` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
  9. `Actions` (Chevron / Eye button navigating to `/incident-reconstruction?id={id}`)

---

## 8. Page 4: 3D Incident Reconstruction Digital Twin (`/incident-reconstruction`)

File: `src/pages/IncidentReconstructionPage.tsx`  
Purpose: **The flagship feature of the project** — an interactive 4D digital twin (Space + Time) reconstructing the oil spill physics, ocean waves, drift trajectory, and candidate vessel attribution in 3D WebGL.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Top Evidence Chain: [ OIL DETECTED ] → [ BACKTRACKED ] → [ SOURCE ] → [ AIS ] → [ ATTRIB ]│
├──────────────────────────────────────────────────────────────┬─────────────────────────┤
│                                                              │ INTELLIGENCE PANEL:     │
│                     3D SIMULATION VIEWPORT                   │ • Incident Overview     │
│                                                              │ • Source Estimate Card  │
│  [HUD Telemetry]         [3D Scene Canvas]   [Controls]      │ • Top Candidate Vessel  │
│  • Time / Lat / Lon      • Gerstner Waves    • Day / Night   │ • Wind & Current Gauges │
│  • Drift Covered Km      • Oil Slick Mesh    • Layer Toggles │                         │
│  • Suspect Vessel Name   • 3D Trajectory     • Shader Tuning │                         │
│                          • Candidate Ships                   ├─────────────────────────┤
│                                                              │ (Collapsible on mobile) │
├──────────────────────────────────────────────────────────────┴─────────────────────────┤
│ COLLAPSIBLE ANALYSIS DOCK:                                                             │
│ ┌──────────────────────────────────────────────┬─────────────────────────────────────┐ │
│ │ Backtrack Trajectory Chart (Distance vs Time)│ Satellite SAR Imagery Viewer (ESRI) │ │
│ └──────────────────────────────────────────────┴─────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4D TIMELINE SCRUBBER: [BACKTRACK / FORWARD] [ ▶ Play / ⏸ Pause ] [════●════] 11:18 UTC  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.1 Top Evidence Chain (`EvidenceChain.tsx`)
A sticky milestone progress bar at the top of the reconstruction workspace tracking the 5-step forensic process:
1. `OIL DETECTED` (Droplet icon)
2. `BACKTRACKED` (Reverse history icon)
3. `SOURCE ESTIMATED` (Target / crosshair icon)
4. `AIS CORRELATED` (Network icon)
5. `ATTRIBUTION` (Ship icon)
* Each step displays dynamic states: `AVAILABLE` (solid primary), `PENDING` (pulsing amber), `UNAVAILABLE` (red), or `NOT RUN` (muted).

### 8.2 3D Viewport & Simulation Components (`src/components/incident/scene/`)
1. **`IncidentScene.tsx`:** R3F root canvas with scene lighting, shadows, camera rigging, and fog.
2. **`OceanSurface.tsx`:**
   * Powered by custom GLSL shaders (`systems/ocean/shaders/`).
   * Computes **Gerstner Waves** in real time with displacement, foam cresting, and specular sun reflections.
   * Supports `lite` mode for low-end devices.
3. **`OilSpill.tsx`:**
   * Renders the detected oil slick floating on the ocean surface.
   * Uses an irregular 48-point wobble polygon with iridescent dark sheen, red/orange glowing boundary, and per-vertex vertical adhesion to waves so it bobs naturally.
4. **`OilTrajectory.tsx`:**
   * 3D reverse drift path spline floating over water from source release to observation.
   * Animated dashed flow indicators depicting drift direction.
5. **`SourceEstimate.tsx`:**
   * Cylindrical glowing ring marking the calculated origin coordinates and radius of uncertainty (`radius_km`).
6. **`VesselModel.tsx`:**
   * 3D vessel model placed at candidate coordinates.
   * Bobs and tilts dynamically along the Gerstner wave normal vectors (`getWaveFollowPose`).
   * Floats name label and attribution percentage badge above the mast.
7. **`AISTrack.tsx`:**
   * 3D polyline showing the candidate vessel's historical route.
8. **`EnvironmentIndicators.tsx` (`WindIndicator.tsx`, `CurrentIndicator.tsx`):**
   * 3D directional vector arrows hovering over the ocean indicating wind speed/direction (yellow) and sea current (cyan).
9. **`SceneLighting.tsx` & `SceneCamera.tsx`:**
   * Day/Night lighting transitions with directional sun and moon positions.

### 8.3 HUD & Viewport Controls
* **`SimulationHUD.tsx`:**
  * Floating tactical glassmorphism HUD displaying: Incident ID, Trajectory provenance (`LIVE` vs `DEMO`), Elapsed Simulation UTC Time, Current Lat/Lon, Slick Area (`km²`), AI Confidence (`%`), Number of vessels, Distance Covered (`X / Y km`), Duration Covered (`X / Y hours`), Suspected vessel name, and Wind/Current speeds in knots/m/s and cardinal directions.
* **`ViewportControls.tsx`:**
  * Floating pill bar toggling: Vessels (`ais`), Oil Spill (`oil`), Wind (`wind`), Current (`current`), Day/Night mode (`night`), Grid (`grid`), and Lite Water (`lite`).
* **`OceanControlsPanel.tsx`:**
  * Drawer with live sliders adjusting wave parameters: Big wave elevation, frequencies, wave speed, foam threshold, foam strength, surface color, depth color presets (Deep Oceanic, Mediterranean Cyan, Coastal Green, Storm Gray).

### 8.4 Intelligence Panel (Right Sidebar) (`IntelligencePanel.tsx`)
1. **`IncidentInfoPanel.tsx`:** ID, observation timestamp, coordinates, priority badge, area, and "Details" modal trigger.
2. **`SourceEstimateCard.tsx`:** Origin latitude, longitude, and radius of uncertainty.
3. **`CandidateVesselPanel.tsx`:** Top candidate vessel name, IMO/MMSI, match percentage, and mock/live provenance tag.
4. **`EnvironmentPanel.tsx`:** Wind speed/direction and current speed/direction with HYCOM & ECMWF model tags.

### 8.5 Collapsible Analysis Dock (`IncidentAnalysisDock.tsx`)
* **`BacktrackTrajectoryChart.tsx`:** Interactive graph plotting trajectory drift metrics over time.
* **`SatelliteImageryPanel.tsx`:** Satellite imagery inspection tool with ESRI World Imagery export, coordinate bounds, and interactive pan/zoom.
* **`Timeline.tsx`:**
  * Master 4D scrubber controlling simulation time.
  * Play / Pause toggle with smooth 60 FPS Three.js animation and 15 FPS React UI updates.
  * Direction Toggle: `BACKTRACK` (Observation → Source) or `FORWARD` (Source → Observation).
  * Milestone nodes for Estimated Release and Satellite Observation.

---

## 9. State Management & Context Architecture

The frontend uses React Context for modular, reactive state across the application:

```text
               ┌───────────────────────┐
               │     ThemeContext      │ (Dark / Light Theme)
               └──────────┬────────────┘
                          │
               ┌──────────┴────────────┐
               │    IncidentContext    │ (Spill ID, Metadata, API data, Fallbacks)
               └──────────┬────────────┘
                          │
          ┌───────────────┼───────────────┬────────────────────────┐
          ▼               ▼               ▼                        ▼
┌──────────────────┐ ┌───────────────┐ ┌────────────────────┐ ┌────────────────────────┐
│SimulationContext │ │SceneLayersCtx │ │OceanControlsContext│ │ ViewportCameraContext  │
│(Play, Time, Ref) │ │(Toggles, Day) │ │(Shader Uniforms)   │ │ (Camera Focus/Pan)     │
└──────────────────┘ └───────────────┘ └────────────────────┘ └────────────────────────┘
```

1. **`IncidentContext.tsx`:**
   * Manages current `spillId` (synced with URL parameter).
   * Executes parallel API fetches (`spillService.getSpill`, `backtrackSpill`, `getSpillVessels`, etc.).
   * Runs `reconstructionResolver.ts` to seamlessly populate any missing backend telemetry with mathematically consistent demo fallbacks.
2. **`SimulationContext.tsx`:**
   * Manages simulation progress (`0.0` to `1.0`), direction (`FORWARD` vs `BACKTRACK`), and play/pause.
   * Employs a dual-rate architecture: mutable `progressRef` updated at **60 FPS** for butter-smooth Three.js rendering, while throttling React state updates to **15 FPS** (`~66ms`) to avoid DOM layout thrashing.
3. **`SceneLayersContext.tsx`:**
   * Boolean visibility flags for individual 3D objects (`oil`, `source`, `ais`, `wind`, `current`, `grid`, `lite`, `night`).
4. **`OceanControlsContext.tsx`:**
   * Stores live shader uniforms for water wave displacement, foam, and colors.
5. **`InteractionContext`:**
   * Manages user clicking on 3D objects (clicking a vessel opens the vessel details drawer, clicking source opens origin details).

---

## 10. Backend APIs & Data Contracts

Base URL: Configured via `VITE_API_BASE_URL` (defaults to `/api/v1` proxy).

### 10.1 Key Endpoints
* **`GET /api/v1/demo/spills?page=1&page_size=20`**
  * Returns list of all detected spills with `spill_id`, `detected_at`, centroid `{ lat, lon }`, `area_km2`, `confidence_score`, `candidate_count`.
* **`GET /api/v1/demo/spills/{spill_id}`**
  * Returns detailed metadata, polygon coordinates, satellite image URL, and initial estimates.
* **`POST /api/v1/demo/spills/{spill_id}/backtrack`**
  * Returns drift backtrack solution:
    ```json
    {
      "spill_id": "spill_dba12b",
      "backtrack": {
        "observation": { "latitude": 35.0494, "longitude": 24.0517, "timestamp": "2019-01-13T03:42:35Z" },
        "estimated_release_time": "2019-01-12T11:18:35Z",
        "source_estimate": { "latitude": 35.0292, "longitude": 24.0945, "radius_km": 0.55 },
        "trajectory": [
          { "timestamp": "2019-01-12T11:18:35Z", "latitude": 35.0292, "longitude": 24.0945 },
          { "timestamp": "2019-01-13T03:42:35Z", "latitude": 35.0494, "longitude": 24.0517 }
        ]
      },
      "attribution": { "candidate_count": 1, "top_vessel": "SYNTH-Y2019-000144", "top_score": 0.94 }
    }
    ```
* **`GET /api/v1/demo/spills/{spill_id}/vessels`**
  * Returns array of ranked candidate vessels with MMSI, IMO, vessel name, distance to origin, and attribution score.
* **`GET /api/v1/demo/spills/{spill_id}/attribution/trajectory`**
  * Returns intermediate historical AIS waypoint trajectories of suspect vessels.
* **`GET /api/v1/visualization/spills/{spill_id}`**
  * Returns environmental summary: wind speed/direction, ocean current speed/direction, and wave heights.

---

## 11. Current UI Flaws, Inconsistencies & Redesign Recommendations

When redesigning the UI, keep these specific existing shortcomings in mind:

### 11.1 Visual Hierarchy & Identity
* **Identity Conflict:** The app references both "NAUKA" (in Sidebar logo) and "OCEAN SENTINEL" (in Header and `design.md`). Standardize on one unified maritime intelligence brand.
* **Color Discord:** The dashboard currently uses Claude Terracotta Amber (`#c96442`), whereas the 3D scene and 2D map use Maritime Cyan (`#0D9488`), and the older spec uses Sea Green (`#00B894`). A unified palette (e.g. Deep Oceanic Navy `#090D16` + Vivid Cyan `#00F2FE` / `#0D9488` + Spill Warning Crimson `#EF4444`) is strongly recommended.
* **Telemetry Typography:** Ensure all coordinates, timestamps, heading angles, and vessel IDs strictly use a modern monospace font (e.g. `Geist Mono` or `JetBrains Mono`).

### 11.2 3D Reconstruction Page Ergonomics
* **Screen Estate:** The 3D viewport currently shares vertical space with the top Header, Evidence Chain, Bottom Analysis Dock, and Timeline. In your redesign:
  * Make the 3D viewport feel like a seamless command center.
  * Consider floating semi-transparent HUD widgets or collapsible bottom drawers instead of fixed vertical stack blocks that compress the 3D canvas.
  * Ensure the top Evidence Chain is sleek and does not consume excessive vertical height.

### 11.3 2D Map & 3D Reconstruction Integration
* Currently, the 2D Map (`/maritime-map`) and 3D Reconstruction (`/incident-reconstruction`) feel like two separate tools.
* **Redesign Opportunity:** Provide a seamless "Switch to 3D Digital Twin" button from the 2D map investigation drawer, and a mini 2D radar minimap in the 3D view.

### 11.4 Mobile & Responsive Behavior
* The 3D canvas and Deck.GL map require significant GPU power and screen space.
* On smaller laptop screens or tablets, panels currently overlap or push content below the fold. Ensure your new layout uses responsive drawers, floating action buttons (FABs), or tabbed analysis docks.

---

*This document contains the complete context, feature inventory, data relationships, and design guidelines for the Ocean Sentinel / NAUKA project. Use it as your definitive source of truth during the UI redesign.*
