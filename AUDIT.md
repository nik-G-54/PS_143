# AUDIT.md — NAUKA frontend usage audit (SIH 2026 · PS 143)

Scope: `D:\SIH\frontend` only (branch `Alert`, clean tree). **No source files were changed.** The backend is not in this repo, so backend facts below are inferred from the endpoints the frontend calls.

## How "used" was decided

1. Entry point: `index.html` → `src/main.tsx` → `src/App.tsx` (7 real routes + 2 redirects).
2. A script walked every static and dynamic `import` from `main.tsx`. **218 source files are reachable; 173 are not** (incl. ~95 `.d.ts`/css files from a vendored `src/resources/Threejs-water-shader-main/` folder, which is git-ignored).
3. File reachability is only a first filter, so each reachable page was also read for what it actually renders, whether a toggle or button exists in the UI, and where its data comes from.
4. Every `fetch` / `apiClient` call site was listed and matched to the code that renders its result.
5. Unit tests were run: `npx vitest run` from the repo root → **14 files, 157 tests, all pass.** (Run from a different working directory, one suite fails on a relative path.)

### Routes

| Route | In sidebar? | How a judge reaches it |
|---|---|---|
| `/` (and `/dashboard` → `/`) | Yes — Dashboard | Landing page |
| `/maritime-map` | Yes — Maritime Map | Sidebar |
| `/test-image` | Yes — Test Your Image | Sidebar |
| `/3d-visualisation` | Yes — 3D Visualisation | Sidebar |
| `/incident-overview` | Yes — Incident Overview | Sidebar |
| `/incidents` | **No** | Dashboard → click a table row → preview drawer → "view incident" button |
| `/incident-reconstruction` | **No** | `/incidents` → click a row (ids starting `spill_`) → opens `?id=<spillId>` |
| `*` | – | Redirects to `/` |

`LiveMapPage`, `ComingSoonPage`, `PlaceholderPage` are not routed. Some dead links point at `/live-map`, which does not exist (see Unused table).

Backend host used everywhere: **`https://naavss.duckdns.org`** (default of `VITE_API_BASE_URL`, hard-coded in several services). Image detection uses a **separate** service: **`https://oil-spillage-detection.onrender.com/predict`** (Render, not Azure).

---

## 1. USED features

| # | Feature | What the user sees / does | Key files | Data source |
|---|---|---|---|---|
| U1 | **Globe → regional map (MapLibre globe + deck.gl overlay)** | `/maritime-map` opens on a globe (Mediterranean-centred), camera flies into the detection region after load. Basemap switch Satellite (Esri World Imagery + Carto labels) / Standard (Carto Dark Matter / Voyager). Navigation + fullscreen controls. "Globe view" resets camera. | `features/maritime-map/map/MaritimeMap.tsx`, `map/mapConfig.ts`, `map/cameraController.ts`, `deck/DeckOverlay.ts` | Third-party tile servers (Esri, Carto) |
| U2 | **Detected-spill markers** | All detected spills drawn as scaled dots; click one to select it; count shown in toolbar with reload button. | `layers/SpillLayer.ts`, `layers/spillEncoding.ts`, `hooks/useSpills.ts`, `api/spillsApi.ts` | **Backend** `GET /api/v1/demo/spills?page=&page_size=` (paginated, `/demo/` dataset) |
| U3 | **Spill detail enrichment** | Selected spill gets extra fields (age, source type, release time, observation point, etc.). | `hooks/useSpillDetails.ts`, `adapters/spillAdapter.ts` | **Backend** `GET /api/v1/demo/spills/{id}` (via `services/spillService.ts`) |
| U4 | **Backtracked drift trajectory** | "Investigation → Backtrack": drift path from detection back to probable source, with probable-source and detection badges, `T-Nh` time-tick badges, uncertainty radius, and a source-estimate marker. | `layers/TrajectoryLayer.ts`, `layers/trajectoryEncoding.ts`, `deck/deckLayers.ts`, `map/timeTickMarkers.ts`, `hooks/useSpillTrajectory.ts` | **Backend** `GET /api/v1/visualization/spills/{id}` (trajectory + environment + source estimate). Physics runs server-side; frontend only renders. |
| U5 | **Investigation timeline playback + Focus Mode** | "Investigate vessels" arms a play/scrub timeline (0.5–4× speed, forward origin→detection or backtrack detection→origin). An organic oil-slick polygon morphs along the path ("Focus mode"). | `controls/InvestigationTimeline.tsx`, `timeline/useInvestigationTimeline.ts`, `utils/oilSlickKeyframes.ts`, `utils/organicPolygon.ts`, `components/map/layers/DriftTrajectory.ts` | Derived from U4/U6 data. The slick **shape is procedurally generated in the browser** (seeded organic polygon from the path + backend area), not an observed footprint. |
| U6 | **AIS vessel attribution layer** | Candidate vessel tracks + moving markers synced to the timeline; vessels coloured by rank; hover tooltip (name, MMSI, source "Observed AIS" / "Synthetic AIS"). | `layers/VesselLayer.ts`, `adapters/vesselAdapter.ts`, `hooks/useSpillAttribution.ts`, `services/spillService.ts` | **Backend** `GET /api/v1/demo/spills/{id}/vessels` (candidate metadata, fetched on selection) and `GET /api/v1/demo/spills/{id}/attribution/trajectory` (tracks, fetched when backtrack is armed or an alert preview opens). Ranking/scoring is computed by the backend. Dataset flags `is_mock` / `identifiers_synthetic`; UI labels these "Synthetic IDs" / "comparison". |
| U7 | **"Who did this" vessel reveal** | When timeline finishes naturally, scripted camera sequence (frame origin+vessel → fly to ship → close-up → settle) shows a 3D ship mesh, info card (name, MMSI, type, speed, distance, time offset) and a distance ruler; "Replay reconstruction" button. | `investigation/useVesselRevealStage.ts`, `layers/VesselInvestigationLayer.ts`, `layers/shipMesh.ts`, `map/vesselRevealMarker.ts`, `map/vesselDistanceRuler.ts` | Rank-1 vessel from U6 |
| U8 | **Forward drift forecast + coastal-impact alert** | "Forecast" mode shows predicted forward path (heat/path layer with `T+Nh` ticks, "Predicted position" badge) and a coastal-alert banner/legend (severity levels, ETA to coast, distance to coast). | `layers/ForecastLayer.ts`, `layers/forecastEncoding.ts`, `hooks/useSpillForecast.ts`, `utils/coastalAlert.ts`, `controls/AlertSeverityLegend.tsx`, `controls/InvestigationPanel.tsx` | **Backend** `GET /api/v1/demo/spills/{id}/predict`; coastal distance/ETA computed in-browser with Turf against a bundled **Natural Earth 10m Mediterranean coastline extract** (`data/coastline-mediterranean.geojson`) |
| U9 | **Top-bar investigation modules** | Cards: Investigation, Incident details, Image (drift diagnostic plot), Vessel details (score breakdown, MMSI/IMO/flag/speed/course, track correlation), Time & drift (release time, path length, wind/current at detection), Alert log. | `controls/MapTopBar.tsx`, `controls/sidebarModules.tsx`, `components/common/DiagnosticPlotViewer.tsx`, `services/diagnosticPlotService.ts` | Backend (U4/U6) + `GET /api/v1/drift/{id}/diagnostic-plot` |
| U10 | **Regional 2D inset map** | Small flat map in the corner (separate MapLibre instance) with the detection-region outline, spill dots and selected drift path; click to expand to full 2D view. | `map/RegionInsetMap.tsx` | Same spill/trajectory data as above |
| U11 | **Evidence dossier** | "Evidence" button slides up a multi-section dossier (Detection, Drift, Attribution, Prime candidate, Forecast, Regional context) with charts (Recharts) — signal matrix, radar overlay, lead margins, drift/forecast profiles, forcing compass, detection-over-time, size distribution. Map docks into a mini-map. | `evidence/EvidenceDashboard.tsx`, `evidence/evidenceCharts.tsx`, `evidence/EvidenceMiniMap.tsx`, `charts/*` | Backend (all U-series endpoints) + client-side aggregation over the spill list |
| U12 | **PDF evidence report** | "Report" button downloads a multi-page PDF (prepared in the background so click is usually instant). | `evidence/report/buildEvidenceReport.ts`, `evidence/report/useReportPreparation.ts` (jsPDF + jspdf-autotable) | Built in-browser from backend data above |
| U13 | **Nearest coast-guard layer** | Toggle "Nearest coast guard": station icons, line from selected spill to nearest station with distance label, clickable station card (organisation, source link, attributed photo). | `layers/StationLayer.ts`, `utils/nearestStation.ts`, `controls/StationCard.tsx`, `map/stationMarkers.ts`, `config/stationsConfig.ts` | **Static asset** `public/data/coast-guard-stations.json` — **6 Hellenic Coast Guard (Crete) port stations**, coordinates from OSM/official addresses with provenance fields; photos bundled in `public/data/station-photos/` with author/licence. Not a live registry. |
| U14 | **Drill alert (Send Alert)** | From station card or Investigation panel: preview modal (spill, nearest station, coastal severity/ETA, top non-mock vessel) → send. Logged in "Alert log" (localStorage); alerted spills get a badge on the map. Labelled **drill**: always goes to a demo inbox, never the station. | `alerts/*` (`sendAlert.ts`, `alertDetails.ts`, `AlertPreviewModal.tsx`, `AlertLogModule.tsx`, `alertLog.ts`) | EmailJS (`@emailjs/browser`) when `VITE_EMAILJS_*` set; otherwise opens a `mailto:` draft. Log is browser-local. |
| U15 | **Dark / light theme** | Theme toggle (header, or sidebar footer on the map page); persisted in `localStorage`; map basemap, colours and UI follow. | `context/ThemeContext.tsx`, `components/layout/ThemeToggle.tsx`, `features/maritime-map/map/mapConfig.ts` | Local |
| U16 | **Dashboard (`/`)** | Filter bar (date range, confidence, area, size bucket), filter chips, 4 KPI cards (total spills, total area, avg confidence, largest spill → opens drawer), **Detection trend** chart, **Size distribution** chart, **Detection-activity heatmap**, spill table (7 rows, link to full table). | `pages/DashboardPage.tsx`, `components/dashboard/{DashboardFilters,ActiveFilterChips,KpiGrid,SpillDetectionTrend,SpillSizeDistribution,DetectionHeatmap,SpillTable}.tsx`, `context/DashboardContext.tsx` | **Backend** `GET /api/v1/demo/spills?page=N` (all pages), aggregated client-side. KPIs are computed in the browser, not served. |
| U17 | **Spill preview drawer** | Click a table row / "largest spill" → slide-in drawer: SAR detection image, area, confidence, detection time, diagnostic plot, button to `/incidents`. | `components/dashboard/SpillPreviewDrawer.tsx` | **Backend** `GET /api/v1/demo/spills/{id}` + diagnostic-plot endpoint |
| U18 | **Investigation preview dock (Dashboard)** | Same selection also opens a right panel: drift trajectory sketch, environment summary, detection evidence image, top candidate vessel. | `components/investigation/InvestigationDock.tsx`, `hooks/useInvestigationPreview.ts`, `services/spillsApi.ts` | **Backend** `/api/v1/visualization/spills/{id}` + `/api/v1/demo/spills/{id}/vessels` |
| U19 | **Incident Overview (`/incident-overview`)** | Same filter bar + full paginated spill table. | `pages/IncidentOverviewPage.tsx`, `SpillTable isFullPage` | **Backend** (as U16) |
| U20 | **Incidents list (`/incidents`)** | Searchable / status-filterable table; row click opens the 3D reconstruction. **Falls back to bundled mock list** if the backend call fails (banner says so). | `pages/IncidentsPage.tsx`, `components/incidents/*`, `hooks/useIncidentFilters.ts`, `mocks/spillsData.ts` | Backend, **mock fallback** |
| U21 | **3D incident reconstruction (`/incident-reconstruction`)** | React-Three-Fiber scene: animated Gerstner-wave ocean (custom shaders), 3D vessel model, AIS tracks, oil-slick trajectory, source estimate, culprit marker, wind/current indicators, ocean controls, orientation cube, camera presets, fullscreen, playback timeline/HUD, evidence chain, intelligence panel (source estimate, candidate vessels, optical corroboration card, environment panel, satellite imagery, backtrack chart), incident selector dropdown. Header shows a **DEMO DATA / LIVE DATA** provenance pill. | `pages/IncidentReconstructionPage.tsx`, `components/incident/**`, `systems/ocean/**`, `context/Incident*.tsx`, `services/spillService.ts`, `services/reconstructionResolver.ts` | Backend (`/demo/spills/{id}`, `/vessels`, `/visualization/spills/{id}`, `/attribution/trajectory`, `POST /demo/spills/{id}/backtrack`). **Missing pieces are filled with simulated data** from `utils/demoGenerator.ts` and the pill shows "DEMO DATA" when that happens. |
| U22 | **Image test lab (`/test-image`) — upload path** | Drag-drop/choose a satellite image → animated sonar-style scan → result card (spill yes/no, confidence, detected regions with area, "audit report" HTML download). Last 10 scans kept in `localStorage`. | `pages/ImageTestPage.tsx`, `features/image-detection/{hooks/useImageAnalysis,services/mlApi,components/*}` | **External ML service** `POST https://oil-spillage-detection.onrender.com/predict` (multipart). The 1 s "upload" and 3 s "scan" delays in `useImageAnalysis.ts` are **cosmetic**. Image corner coordinates and capture time sent are **hard-coded** (Mumbai area). |
| U23 | **Image test lab — sample images** | "Try Sample Images": 10 oil-spill + 7 clean-sea SAR thumbnails; click runs the same flow. | `components/SampleImagesPicker.tsx` | Images from Cloudinary / `public/samples/clean/`. **Result is hard-coded, not model output**: `mlApi.ts` short-circuits and returns canned numbers (confidence 94.2 % / 99.3 %, 1 region, centroid 18.92 N 72.83 E, area from a table) when the file carries sample metadata. |
| U24 | **3D Visualisation (`/3d-visualisation`)** | Full-page iframe of a standalone **vanilla-WebGL** "Ocean Sentinel" scene: timeline, tanker animation, oil track, layers panel, camera presets, session export. Theme follows the app. | `pages/ThreeDVisualisationPage.tsx`, `public/3d-visualisation/*` | **Synthetic demo scene** (its own README says "synthetic demonstration… not georeferenced… no confidence scores"). `api-data.js` overlays only **text/labels** (dates, spill id, top vessel, environment) from `GET /api/v1/demo/spills/spill_05b4e0` — a single hard-coded spill. |
| U25 | **Layout shell** | Collapsible sidebar (Ctrl+B in header tooltip), header with page title, NAUKA branding. | `components/layout/*`, `context/SidebarContext.tsx` | Local |

### Honest-labelling notes for README (derived from evidence above)

- Spill data comes from the backend's **`/api/v1/demo/...`** endpoints → describe as the backend's **demo dataset**, not a live national feed.
- Vessel candidates include **synthetic comparison baselines** and **synthetic identifiers** (flagged in UI). Do not claim "real vessels identified".
- Drift/forecast physics, vessel scoring, "verification checks" are all **backend-computed**; the frontend visualises them. There is no ML or physics code in this repo other than the image-detection call.
- The word **"real-time" is not supported**: no polling, websocket, or live AIS stream anywhere in the frontend.
- Mediterranean (Crete) is the demo region: map camera, coastline extract, and all six stations are Crete/Greece-centred.

---

## 2. IMPLEMENTED BUT UNUSED

| Feature | Files | Why it's considered unused (evidence) |
|---|---|---|
| **Wind & ocean-current particle overlay (windy-style)** | `hooks/useOceanFlow.ts`, `api/oceanFlowApi.ts`, `layers/OceanFlowLayer.ts`, `layers/oceanFlowParticles.ts`, `controls/OceanFlowLegend.tsx`, `public/ocean-flow-data.json`, `scripts/generateOceanFlowData.js` | `MaritimeMap.tsx` calls `useOceanFlow()` and pushes `oceanFlow.layers` into the deck, but **nothing ever calls `oceanFlow.toggle()`** — `MapTopBar` has no wind/current prop or button. `visible` stays `false`, the JSON is never fetched, legend never renders. Header comment still says "click-toggled", so the button was likely removed in a toolbar redesign. |
| **On-map wind/current arrows at detection point** | `layers/EnvironmentLayer.ts`, `components/incident/scene/environment/*` (the 2D one only) | `showWind` / `showCurrent` state in `MaritimeMap.tsx` is initialised `false` and only ever set to `false` (reset handlers); no UI sets it `true`. Wind/current **values** are still shown as text in the "Time & drift → Forcing" card and Evidence dossier (those are used). |
| Alternate map stack in `components/map/**` (`DeckGLOverlay`, `SpillLayer`, `HindcastParticlesLayer`, `WindOverlay`, `WindArrows`, `WindCurrentArrows`, `AttributionPanel`, `PlaybackTimeline`, `TimelineStrip`, `StatsHUD`, `VesselMarkerLayer`, `VesselTrackLayer`, `SpillDetailPanel`, `JobProgress`, `LayerToggle`, `controls/*`, `overlays/*`, `layers/{AnimatedVessel,PulseMarker,PulsingOrigin,SourceRadiusCircle,SpiderifierCluster,SpillPolygonLayers,VesselMarkers}`) | listed | Only `components/map/layers/DriftTrajectory.ts` is imported (by `MaritimeMap.tsx`). Everything else is reachable only from `pages/LiveMapPage.tsx`, which **has no route**. |
| `LiveMapPage` (older live map with job-progress, hindcast particles, shortcuts help, search bar) | `pages/LiveMapPage.tsx` + the stack above, `hooks/{useMapLayers,useEnvironmentLayers,useVesselTracks,useVesselAnimation,useKeyboardShortcuts,useSpillDetail,useDebounce}.ts`, `lib/windTextureGenerator.ts`, `layers/spillPinLayer.ts` | No route in `App.tsx`; no sidebar link. `/live-map` is referenced by `RecentIncidents.tsx` and `Header.tsx` titles but resolves to the catch-all redirect. |
| Dashboard widgets: `CaseStatusChart`, `ConfidenceDistribution`, `MonthlyTrend`, `SeverityDistribution`, `RecentIncidents`, `SatelliteRadar`, `SystemStatusWidget`, `MagicBento`, `DashboardHeader` | `components/dashboard/*` | Not imported by `DashboardPage` or any reachable file. |
| `hooks/useDashboardStats.ts` (`GET /api/v1/dashboard`) | – | Never imported. Dashboard KPIs are computed client-side from the spill list instead. |
| `lib/exportUtils.ts` (CSV/export helpers) | – | Not imported. |
| Old image-test components `components/image-test/*`, `hooks/useImageAnalysis.ts` (root), `services/mlApi.ts` (root), `types/image-analysis.ts` | – | Superseded by `features/image-detection/**`; page imports only the feature folder. |
| Incident scene extras: `EnvironmentGauges`, `GlobePreview`, `PathTimelineStrip`, `scene/TestPointMarker` | `components/incident/*` | Not imported by any reachable file. |
| Globe widgets: `components/ui/wireframe-dotted-globe.tsx` (d3 + fetch), `cobe` dependency | – | Not imported. |
| `components/investigation/{InvestigationCTA,SpillDetails}.tsx` | – | Not imported. |
| `features/maritime-map/layers/{AISTrackLayer,IncidentLayer}.ts`, `controls/SpillLegend.tsx`, `api/attributionApi.ts` | listed | `AISTrackLayer` / `IncidentLayer` never imported. `SpillLegend` import and JSX are commented out in `MaritimeMap.tsx`. `attributionApi.ts` is not imported — `useSpillAttribution` calls `services/spillService.ts` instead. |
| `features/maritime-map/mocks/forecastFixture.ts`, `data/mock*.ts` (mockAIS, mockDashboard, mockIncident(s), mockMapData, mockOilSpill, mockPredictions), `mocks/spillMock.ts` | – | Not imported by reachable code. (`mocks/spillsData.ts` **is** used — see Unclear.) |
| `public/sidebar-demo/*` | – | Static HTML experiment; no link, no route. |
| Dead dependencies | `package.json` | `cobe`, `d3`, `gsap`, `react-map-gl`, `@deck.gl/react`, `deck.gl` (umbrella), `@types/turf`, `@types/d3`, `@types/supercluster`, `puppeteer` are never imported by reachable code (some by dead code only). |
| Repo clutter (not features) | root | `scratch_spills.json`, `frontend_integration_contract.docx`, `carto.json`, `design.md`, `src/SIH_2026_3D_Incident_Reconstruction_Plan.md`, `src/globe-json-redesign.md`, `src/docs/PROPOSED_BACKEND_CONTRACT.md`, `.agents/skills/**` (UI-design tooling for coding agents). |

---

## 3. UNCLEAR / needs your call

| Item | Reasoning |
|---|---|
| **Wind & current overlay: delete, or restore the toggle?** | You described it as a pre-generated static JSON grid; the code agrees (Open-Meteo fetched offline by `scripts/generateOceanFlowData.js`, 24×14 world grid, stylised particle speed — `SIMULATED_SECONDS_PER_TICK`). But with no toggle it is **invisible to judges**. I will leave it out of "Features" unless you tell me the button exists in a branch you demo from. If you plan to re-add the button, I can list it under Future scope or Features at your direction. |
| **Hard-coded claims on `/test-image` ("CSIRO SAR Neural Model · 96.8 % Model Accuracy", "ONNX WebAssembly Engine · 38 ms WASM Inference", "client-side privacy-preserved", "8-Step Verification")** | These are static text in `ImageTestPage.tsx`. **No ONNX/WASM exists anywhere in `src/`**; inference is a network POST to a Render server (which can also be slow on cold start). The 38 ms figure and the accuracy figure are not computed or sourced in this repo. README will **not** repeat them. Recommend you either substantiate (model card / eval notebook) or change the UI text before the demo — a judge reading the Network tab will see the contradiction. |
| **8-step verification pipeline on image results (`StepVerificationPipeline.tsx`, `generateDetectionReport.ts`)** | Wind speed, current speed, Sentinel-2 tile id, cloud cover, release hours, vessel counts, **suspect vessel name / MMSI ("PACIFIC-RUBY-9" etc.)** and a "Open in 2D map" coordinate near Chennai (13.08 N, 80.18 E) are all **derived from the last character code of the spill id** (`charCode % n`), not from any backend/model. It looks like a real attribution result but is illustrative. README will describe it only as an "illustrative walkthrough of the intended pipeline", or omit it — your choice. Same logic is in the downloadable audit report. |
| `/test-image` default coordinates sent to ML service | `ul/ur/bl/br_lat/lon` are fixed to a Mumbai-area box (18.80–18.92 N, 72.83–72.95 E) for every upload. Fine for demo, but the detection centroid shown for uploads is therefore not the image's true location. |
| **Dashboard shows two drawers at once?** | `DashboardPage` renders both `SpillPreviewDrawer` and `InvestigationDock`; both open on the same `selectedSpillId`, both `fixed inset-0 z-50`. Likely the dock overlays the drawer (or vice-versa). I haven't opened it in a browser. Please confirm what you see; I'll describe whichever is visible, and the screenshot checklist will say which state to capture. |
| `mocks/spillsData.ts` | Reachable via `IncidentsPage` (fallback when backend fails) and `spillService` (when `VITE_USE_MOCK_API=true`). Default is off, so with a working backend you never see it. Treated as a **fallback**, mentioned once in "Data sources". |
| `/incident-reconstruction` default spill | If no `?id=`, falls back to hard-coded `spill_dba12b` (or `spill_A` in mock mode). Fine; just note judges should reach it via `/incidents` or the incident selector. |
| Backend platform | You said "Azure". In code the host is `naavss.duckdns.org` (DuckDNS dynamic DNS — could point at an Azure VM). The ML service is on **Render**, not Azure. `vercel.json` rewrites `/api/*` to the DuckDNS host, but the app uses absolute URLs, so the rewrite is effectively unused. Please confirm the Azure URL and whether the frontend is on Vercel. |
| Backend facts I can't verify | The backend source is not in this repo. README will say "backend (Node.js on Azure)" only if you confirm Node.js (the frontend can't tell; endpoints look like FastAPI-style 422 validation errors, e.g. in `spillsApi.ts` comment: "rejected with HTTP 422" → **possibly Python/FastAPI, not Node**). I'll avoid naming the backend language unless you confirm. |
| Reported figures | Station count = **6** (Crete, Hellenic Coast Guard). Spill count is whatever the backend returns at runtime — I did not call the backend, so I can't state a number. Tell me if you want a figure in the README (e.g. "N detections in the demo set"). |
| Dependency hygiene | `ForecastLayer.ts` imports `@deck.gl/aggregation-layers` and some scene files import `three-stdlib`; neither is in `package.json` (they resolve transitively via `deck.gl` / `@react-three/drei`). Works today after `npm install`, but is fragile. Not changing it (read-only phase); mentioned in case a clean install ever fails. |
| `vitest` runs from wrong cwd | `stationsConfig.test.ts` reads `public/data/...` relative to `process.cwd()`; run `npm test` from the repo root. |

---

## 4. Tech stack actually in use (reachable imports ∩ `package.json`)

| Layer | Technology | Used for |
|---|---|---|
| UI framework | React 19, React Router 7, TypeScript, Vite 8 | App shell, routing (`/incident-overview`, `/incidents`, etc. lazy-loaded), build |
| Styling | Tailwind CSS 3 (+ PostCSS/Autoprefixer), custom CSS (`maritime-map.css`), Lucide icons, framer-motion (2 files) | Layout, theming (class-based dark mode), icons, animations |
| 2D/globe map | MapLibre GL 6 (globe projection) | Basemap, camera, HTML marker badges, inset map |
| Map data layers | deck.gl 9 (`@deck.gl/core`, `layers`, `mapbox` `MapboxOverlay`, `extensions`, `mesh-layers`; `aggregation-layers` transitively) | Spill dots, paths, forecast heat, vessels, stations, 3D ship mesh |
| Geo maths | `@turf/turf` | Distances, hulls/buffers (inset), nearest station, coastline proximity |
| 3D reconstruction | three.js, `@react-three/fiber`, `@react-three/drei` (+ `three-stdlib`) | `/incident-reconstruction` scene, custom ocean shaders |
| 3D page (iframe) | Hand-written WebGL (no framework) | `/3d-visualisation` |
| Charts | Recharts 3 | Dashboard charts + evidence dossier |
| Reports | jsPDF + jspdf-autotable | PDF evidence report |
| Alerts | `@emailjs/browser` (dynamic import) | Drill alert email (with `mailto:` fallback) |
| Testing / lint | Vitest 5 (14 files, 157 tests), oxlint | `npm test`, `npm run lint` |
| Hosting hints | Vercel (`vercel.json`) | SPA rewrite |

**Installed but not used by reachable code (do NOT list in README):** `cobe`, `d3`, `gsap`, `react-map-gl`, `@deck.gl/react`, `deck.gl` umbrella package (code imports sub-packages), `puppeteer`, `@types/turf`, `@types/d3`, `@types/supercluster`.

---

## 5. Environment variables actually read

| Variable | Read in | Effect | Needed? |
|---|---|---|---|
| `VITE_API_BASE_URL` | `services/apiClient.ts` | Backend base URL; default `https://naavss.duckdns.org` | Optional |
| `VITE_EMAILJS_SERVICE_ID` | `alerts/sendAlert.ts` | EmailJS service | Optional (else `mailto:`) |
| `VITE_EMAILJS_TEMPLATE_ID` | same | EmailJS template | Optional |
| `VITE_EMAILJS_PUBLIC_KEY` | same | EmailJS public key | Optional |
| `VITE_EMAILJS_TO_EMAIL` (alias `VITE_EMAILJS_RECIPIENT`) | same | Demo inbox for drill alerts | Optional |
| `VITE_USE_MOCK_API` | `services/spillService.ts`, `context/IncidentContext.tsx` | `'true'` → reconstruction uses mock scenarios | Optional (default off) |
| `import.meta.env.DEV`, `BASE_URL` | `alerts/sendAlert.ts`, `config/stationsConfig.ts` | Vite built-ins | – |

Read only by **dead** code (ignore): `VITE_API_BASE` (`useVesselTracks`, `useSpillDetail`), `VITE_MAP_STYLE_DARK/LIGHT` (`LiveMapPage`).
`.env.example` currently documents only the four `VITE_EMAILJS_*` keys.
No secrets are present in the repo's tracked files (EmailJS keys come from `.env`, git-ignored).

---

## 6. Real run / build commands

From `package.json` (`"type": "module"`, Node 24 used here; no `engines` field):

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | `vite` dev server (`.claude/launch.json` uses port 5174; Vite default is 5173) |
| `npm run build` | `vite build` → `dist/` |
| `npm run preview` | `vite preview` |
| `npm test` | `vitest run` (run from repo root) |
| `npm run typecheck` | `tsc --noEmit` — **currently exits non-zero: 49 type errors** (e.g. `StepVerificationPipeline.tsx` 7, `WindOverlay.tsx` 6, `AnalysisResult.tsx` 6, `VesselTrackLayer.tsx` 5, `SpillPreviewDrawer.tsx` 4; several in dead files). `vite build` does not typecheck, so the build still works. README will not advertise a clean typecheck. |
| `npm run lint` | `oxlint` |
| `node scripts/generateOceanFlowData.js` | Regenerates `public/ocean-flow-data.json` from Open-Meteo (only matters if the wind/current overlay is restored) |
| `node scripts/analyze-spill-locations.mjs [--cached]` | Dev utility: fetches the spill list and reports distance to nearest station |

Vite dev server proxies `/predict` → `https://oil-spillage-detection.onrender.com` (used only as a fallback if the direct ML call fails). Repo: `https://github.com/nik-G-54/PS_143.git` (branch with latest work: `Alert`; default: `main`).

---

## Please confirm / correct before I write the README

1. Is the **wind & current overlay** meant to be demo-able? (Currently unreachable — omit, or you'll restore the button?)
2. For **`/test-image`**: shall the README describe it only as "upload a SAR image → remote model returns spill/no-spill + regions", and treat the 8-step panel as an **illustrative walkthrough** (or omit it)? And will you fix/remove the ONNX/38 ms/96.8 % card text?
3. **Two drawers** on the dashboard — what do you see when you click a table row?
4. Provide: team name, members/roles, live URL, **Azure backend URL**, demo video, PPT; confirm backend language (Node vs Python/FastAPI) and whether the frontend is on Vercel.
5. OK to describe data as "the backend's demo dataset (Mediterranean/Crete) with synthetic comparison vessels"?
