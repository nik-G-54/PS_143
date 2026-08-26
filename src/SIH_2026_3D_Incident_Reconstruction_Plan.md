# SIH 2026 — 3D Oil Spill Incident Reconstruction
## Phase-wise Prototype Development Plan

> **Scope:** This plan is only for the 3D Incident Reconstruction / Simulation module.
> The rest of the SIH application (normal maps, dashboard, analytics, etc.) will be handled separately.
>
> **Development rule:** Complete one phase → share output/code/screenshot → review/validate → then start the next phase.

---

# 1. Final Target

The module will be an interactive **3D Incident Reconstruction** view for a selected oil-spill incident in the Bay of Bengal.

It should visually show:

- 3D ocean surface
- One selected 3D vessel
- Vessel's historical AIS track
- Oil-spill detection point/area
- Wind direction
- Ocean-current direction
- Oil drift/predicted trajectory
- Time-based incident replay
- 2D geographic overview map
- Globe/large-scale geographic context
- Investigation/sidebar UI
- Information panel
- Timeline

The goal is **not** to build a real fluid-dynamics simulation.

The goal is:

> **Interactive 3D reconstruction of an oil-spill incident using AIS vessel trajectory, detected spill location, environmental conditions, and predicted oil drift.**

---

# 2. High-level Architecture

```text
                 BACKEND / ML
                       │
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
     AIS data       Oil data        Forecast data
       │               │                │
       └───────────────┼────────────────┘
                       ↓
                  FRONTEND
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        Three.js / R3F        MapLibre
             │                   │
             ↓                   ↓
       3D Incident Scene     2D / Globe
             │
       ┌─────┼─────┬─────┐
       ↓     ↓     ↓     ↓
    Ocean  Ship   Oil  Wind/Current
                       │
                       ↓
                  Drift Replay
```

---

# 3. Recommended Technology Stack

## Core

- React
- TypeScript

## 3D

- Three.js
- React Three Fiber (R3F)
- `@react-three/drei`

## Geographic map

- MapLibre GL JS

## Styling

- Existing project styling system / Tailwind CSS if already used
- CSS for custom HUD/glass/holographic effects

## 3D model format

- `.glb` / `.gltf`

## Data during prototype

- Local `.json` files

## Later

- Replace local JSON with real backend APIs.

---

# 4. Why R3F + Three.js?

React is already the application framework.

React Three Fiber allows the 3D scene to be managed using React components.

Architecture:

```text
React
 │
 ├── Dashboard
 ├── Live Map
 ├── Incidents
 ├── Vessels
 └── Incident Reconstruction
          │
          ↓
      React Three Fiber
          │
          ↓
        Three.js
```

Three.js handles:

- Scene
- Camera
- Renderer
- Meshes
- Materials
- Lights
- Animation
- 3D models

R3F makes these manageable inside the React application.

---

# 5. Important Scope Decision

## Geographic scope

### Main application

The normal application can cover:

- India
- Arabian Sea
- Bay of Bengal
- Relevant Indian Ocean region

### 3D Incident Reconstruction

Keep the first prototype restricted to:

> **Bay of Bengal + one selected incident + one selected vessel.**

This drastically reduces risk.

Later, the same architecture can be expanded to:

```text
Bay of Bengal
    ↓
Arabian Sea
    ↓
Indian Ocean
    ↓
Global
```

---

# 6. Why Not Global 3D Simulation Initially?

| Scope | Difficulty | Recommendation |
|---|---:|---|
| One Bay of Bengal incident | ⭐⭐ | Best for POC |
| India surrounding waters | ⭐⭐⭐ | Good for main application |
| Indian Ocean | ⭐⭐⭐⭐ | Later |
| Whole world | ⭐⭐⭐⭐⭐ | Do not attempt initially |

The 3D module should demonstrate the concept, not attempt global maritime simulation.

---

# 7. Final UI Concept

Approximate layout:

```text
┌───────────────────────────────────────────────────────────────┐
│  OCEAN SENTINEL                              Incident #OS-001 │
├──────────────┬────────────────────────────────────────────────┤
│              │                                                │
│  SIDEBAR     │              3D INCIDENT SCENE                 │
│              │                                                │
│ Dashboard    │                    🚢                          │
│ Live Map     │                   ╱                            │
│ Incidents    │                  ╱                             │
│ Vessels      │                 🔴 Oil Spill                   │
│ Analytics    │        ~~~~~~~~~~~~~~~~~~~~~                   │
│ Reports      │       ~~~~~~~ OCEAN ~~~~~~~~~                 │
│              │                                                │
│              │             WIND → → →                         │
│              │                                                │
│              │  ┌──────────┐       ┌──────────┐              │
│              │  │ 2D MAP   │       │ GLOBE    │              │
│              │  │    ↗     │       │    🌎    │              │
│              │  └──────────┘       └──────────┘              │
│              │                                                │
├──────────────┴────────────────────────────────────────────────┤
│ Timeline: T-30m ─ T-15m ─ SPILL ─ T+6h ─ T+24h         ▶    │
└───────────────────────────────────────────────────────────────┘
```

## Sidebar

Create the tabs visually, but do not implement their actual functionality yet.

Example:

- Dashboard
- Live Map
- Incidents
- Vessels
- Analytics
- Reports

These can simply show a placeholder such as:

> Coming soon

Only the **3D Incident Reconstruction** page is in scope for this work.

---

# 8. Development Roadmap

```text
PHASE 0
Project Foundation
      ↓
PHASE 1
Page + Sidebar + HUD
      ↓
PHASE 2
3D Scene + Camera
      ↓
PHASE 3
Ocean
      ↓
PHASE 4
3D Ship + Movement
      ↓
PHASE 5
AIS Track
      ↓
PHASE 6
Oil Spill
      ↓
PHASE 7
Wind + Current
      ↓
PHASE 8
Oil Drift Simulation
      ↓
PHASE 9
2D Map + Globe Synchronization
      ↓
PHASE 10
Timeline + Replay + Polish
      ↓
FINAL
Mock JSON → Real Backend API
```

---

# PHASE 0 — Project Foundation

## Goal

Prepare the technical environment only.

Install/configure:

- React
- TypeScript
- Three.js
- React Three Fiber
- `@react-three/drei`
- MapLibre

## Do NOT build yet

- Ocean
- Ship
- Oil
- Wind
- Current
- Animation

## Expected output

```text
React project
+
R3F working
+
Three.js working
+
MapLibre installed
```

## Acceptance criteria

- Project starts successfully
- No dependency errors
- R3F can render a basic scene
- MapLibre can be imported
- No unnecessary libraries are added

## Output to review

Share:

- `package.json`
- relevant folder structure
- terminal output
- screenshot if useful

---

# PHASE 1 — Page Shell / UI

## Goal

Build the final page structure before implementing 3D.

Create:

- Sidebar
- Header
- Main simulation container
- Right-side incident information panel
- Bottom timeline
- 2D map placeholder
- Globe placeholder

## Sidebar

```text
Dashboard
Live Map
Incidents
Vessels
Analytics
Reports
```

These are only UI placeholders.

## Incident panel

Example:

```text
INCIDENT
OS-001

VESSEL
MT Example

STATUS
UNDER INVESTIGATION

CONFIDENCE
92%
```

## Timeline

Static initially:

```text
T-30m ─ T-15m ─ SPILL ─ T+6h ─ T+24h
```

## Acceptance criteria

- UI matches intended structure
- Sidebar works visually
- Main 3D area exists as a container
- No backend dependency
- Responsive enough for the intended demo screen

## Output to review

Provide screenshot/video of the page.

---

# PHASE 2 — 3D Scene Foundation

## Goal

Create a working interactive 3D world.

Structure:

```text
Scene
 ├── Camera
 ├── Lights
 ├── Controls
 └── Ocean Placeholder
```

Initially, a simple plane is enough.

## Required controls

- Rotate
- Zoom
- Pan
- Reset camera

## Acceptance criteria

- 3D scene renders
- Camera works
- No severe performance issue
- Scene is correctly positioned inside the page
- 3D module is isolated from the rest of the application

## Output

Working 3D scene screenshot/video.

---

# PHASE 3 — 3D Ocean

## Goal

Turn the simple plane into a visually convincing animated ocean.

## Important

Do NOT build real fluid dynamics.

Do:

```text
3D plane
+
wave displacement/shader
+
water material
+
subtle animation
```

## Desired visual direction

- Dark background
- Dark blue/cyan ocean
- Subtle glow
- Holographic/wireframe feel
- Animated surface
- Scientific/technical appearance

Avoid excessive neon effects.

## Acceptance criteria

- Ocean surface is visibly 3D
- Subtle wave motion works
- Camera movement still works
- FPS remains acceptable
- No complex physics simulation

## Output

Ocean-only scene screenshot/video.

---

# PHASE 4 — 3D Ship

## Goal

Load ONE ship model.

Use a `.glb` or `.gltf` model.

Do NOT create different 3D models for every vessel.

The same model can later be reused as multiple instances.

## Architecture

```text
ShipModel.glb
      ↓
React Three Fiber
      ↓
Ship component
```

Ship state:

```ts
{
  position,
  rotation,
  scale
}
```

## Step 1

Static ship:

```text
~~~~~~~~~~~~~~~~~~~~
        🚢
~~~~~~~~~~~~~~~~~~~~
```

## Step 2

Move between hardcoded positions:

```text
P1 → P2 → P3 → P4
```

## Step 3

Rotate according to heading.

## Acceptance criteria

- GLB loads successfully
- Correct scale relative to ocean
- Ship can move
- Ship can rotate
- No major loading/performance issue

## Output

Ocean + one moving ship.

---

# PHASE 5 — AIS Historical Track

## Goal

Show where the vessel came from.

Mock data:

```json
{
  "vessel": {
    "id": "IMO1234567",
    "name": "MT Example"
  },
  "track": [
    {
      "time": "08:00",
      "lat": 13.10,
      "lng": 80.20,
      "speed": 11.2,
      "heading": 87
    },
    {
      "time": "08:10",
      "lat": 13.12,
      "lng": 80.24,
      "speed": 11.5,
      "heading": 88
    },
    {
      "time": "08:20",
      "lat": 13.15,
      "lng": 80.28,
      "speed": 11.3,
      "heading": 90
    }
  ]
}
```

## Processing

```text
AIS coordinates
       ↓
Coordinate conversion
       ↓
3D positions
       ↓
Track line
       ↓
Ship movement
```

## Visual

```text
START
  🚢
   \
    \
     🚢
      \
       🔴
```

## Acceptance criteria

- Historical track visible
- Ship follows track
- Ship heading changes correctly
- Track and ship remain synchronized

---

# PHASE 6 — Oil Spill

## Goal

Introduce the incident.

Mock data:

```json
{
  "spill": {
    "lat": 13.18,
    "lng": 80.32,
    "area": 2.8,
    "confidence": 0.91,
    "detectedAt": "08:30"
  }
}
```

## Visual

```text
                 🚢
                /
               /
              /
             🔴
        OIL SPILL
~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~
```

## Initial oil implementation

Use:

- Irregular polygon
- Transparent material
- Red/orange edge
- Slight animated distortion

Do NOT build fluid dynamics.

## Acceptance criteria

- Spill appears at correct location
- Spill has visible area
- Ship track reaches/relates to spill location
- Spill styling fits the visual theme

---

# PHASE 7 — Wind + Ocean Current

## Goal

Show environmental forces.

Mock data:

```json
{
  "environment": {
    "wind": {
      "direction": 120,
      "speed": 14
    },
    "current": {
      "direction": 105,
      "speed": 1.8
    }
  }
}
```

## Visual

```text
                 → → → → →
              WIND

                    ↗
                  ↗
                ↗
             🔴
```

Current can be shown using:

```text
↗ ↗ ↗ ↗ ↗
↗ ↗ ↗ ↗ ↗
↗ ↗ ↗ ↗ ↗
```

Use a clear visual distinction between wind and current.

## Acceptance criteria

- Wind direction is visible
- Wind speed can be shown in UI
- Current direction is visible
- Current speed can be shown
- Direction indicators are synchronized with data

---

# PHASE 8 — Oil Drift Simulation

## Goal

Make oil move according to predicted trajectory.

This is the core simulation visualization.

## Important architectural rule

Initially, the frontend should NOT calculate complex oil physics.

Backend/ML should eventually provide the predicted trajectory.

Frontend should visualize it.

## Mock prediction

```json
{
  "drift": {
    "trajectory": [
      {
        "time": "08:30",
        "lat": 13.18,
        "lng": 80.32
      },
      {
        "time": "14:30",
        "lat": 13.22,
        "lng": 80.37
      },
      {
        "time": "20:30",
        "lat": 13.27,
        "lng": 80.43
      }
    ]
  }
}
```

## Visual concept

```text
T0

🔴


T+6h

  🟠
 🔴🟠
  🟠


T+12h

    🟠🟠
  🟠🟠🟠
 🔴🟠🟠


T+24h

       🟠🟠
     🟠🟠🟠
   🟠🟠🟠
```

The exact visual can be implemented with particles, polygons, animated textures, or a combination.

## Acceptance criteria

- Oil moves over time
- Direction matches mock prediction
- Oil position is synchronized with timeline
- Animation is smooth
- No claim of real fluid physics

---

# PHASE 9 — 2D Map + Globe Synchronization

## Goal

Connect the 3D incident scene with geographic context.

The same incident should appear in:

1. 3D Incident Scene
2. 2D Map
3. Globe/large-scale view

Architecture:

```text
              3D SCENE
                  │
             Incident 🔴
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
      2D MAP              GLOBE
```

For example, if the incident is:

```text
13.18 N
80.32 E
```

then:

- 3D scene → oil location
- 2D map → Bay of Bengal location
- Globe → India/world context

## Acceptance criteria

- Same incident coordinates are used
- Maps are geographically consistent
- Selecting incident updates all views
- 3D view and geographic overview tell the same story

---

# PHASE 10 — Timeline + Replay + Polish

## Goal

Create the final incident replay experience.

Timeline:

```text
T-30m
  ↓
T-15m
  ↓
SPILL
  ↓
T+6h
  ↓
T+12h
  ↓
T+24h
```

Play button:

```text
▶ PLAY
```

## Expected behavior

### T-30m

Ship is moving along AIS route.

### T-15m

Ship approaches incident area.

### Spill

Oil detection appears.

### T+6h

Oil begins drifting.

### T+12h

Oil spreads further.

### T+24h

Predicted/observed drift is visible.

## Final polish

Only after all core functionality works:

- Camera transitions
- Hover effects
- HUD
- Glow
- Loading states
- Smooth transitions
- Labels
- Tooltips
- Incident information
- Better materials
- Performance optimization

---

# 9. Backend Requirements

Backend is not ready yet, so the prototype will use JSON files.

The JSON structure should be designed to match the future API response.

Recommended APIs:

---

## API 1 — Incident

```http
GET /api/incidents/:incidentId
```

Example response:

```json
{
  "id": "OS-001",
  "status": "UNDER_INVESTIGATION",
  "detectedAt": "2026-08-26T08:30:00Z",
  "location": {
    "lat": 13.18,
    "lng": 80.32
  },
  "confidence": 0.91
}
```

---

## API 2 — Vessel

```http
GET /api/incidents/:incidentId/vessel
```

Example:

```json
{
  "id": "IMO1234567",
  "name": "MT Example",
  "type": "TANKER",
  "speed": 11.3,
  "heading": 90
}
```

---

## API 3 — AIS Track

```http
GET /api/incidents/:incidentId/track
```

Example:

```json
{
  "points": [
    {
      "time": "08:00",
      "lat": 13.10,
      "lng": 80.20,
      "speed": 11.2,
      "heading": 87
    },
    {
      "time": "08:10",
      "lat": 13.12,
      "lng": 80.24,
      "speed": 11.5,
      "heading": 88
    }
  ]
}
```

---

# API 4 — Oil Spill

```http
GET /api/incidents/:incidentId/spill
```

Example:

```json
{
  "location": {
    "lat": 13.18,
    "lng": 80.32
  },
  "area": 2.8,
  "confidence": 0.91,
  "polygon": []
}
```

---

# API 5 — Environment

```http
GET /api/incidents/:incidentId/environment
```

Example:

```json
{
  "wind": {
    "direction": 120,
    "speed": 14
  },
  "current": {
    "direction": 105,
    "speed": 1.8
  }
}
```

---

# API 6 — Predicted Drift

```http
GET /api/incidents/:incidentId/drift
```

Example:

```json
{
  "prediction": [
    {
      "time": "08:30",
      "lat": 13.18,
      "lng": 80.32
    },
    {
      "time": "14:30",
      "lat": 13.22,
      "lng": 80.37
    },
    {
      "time": "20:30",
      "lat": 13.27,
      "lng": 80.43
    }
  ]
}
```

---

# 10. Mock JSON Structure

Until backend is ready:

```text
simulation/
│
├── data/
│   ├── incident.json
│   ├── vessel.json
│   ├── track.json
│   ├── spill.json
│   ├── environment.json
│   └── drift.json
│
├── components/
│   ├── Scene/
│   ├── Ocean/
│   ├── Ship/
│   ├── OilSpill/
│   ├── Wind/
│   ├── Current/
│   ├── Track/
│   ├── Timeline/
│   ├── MiniMap/
│   └── Globe/
│
├── hooks/
│   ├── useIncident.ts
│   ├── useVessel.ts
│   ├── useTrack.ts
│   └── useDrift.ts
│
└── services/
    └── incidentApi.ts
```

---

# 11. Mock JSON → Real Backend

The frontend should not directly depend on the JSON files.

Use a service layer.

Initially:

```text
incidentApi.ts
      ↓
mock JSON
```

Later:

```text
incidentApi.ts
      ↓
REAL BACKEND API
```

The 3D components should not care whether data comes from:

- JSON
- REST API
- ML service
- Database

They should only receive structured data.

This makes backend integration much easier.

---

# 12. Example Data Flow

```text
Mock JSON
    ↓
Service Layer
    ↓
React Hook / State
    ↓
Simulation State
    ↓
┌──────────┬──────────┬──────────┬──────────┐
↓          ↓          ↓          ↓
Ship      Track      Oil       Wind/Current
↓          ↓          ↓          ↓
──────────── 3D Scene ─────────────────────
                     ↓
                  Timeline
```

Later:

```text
Backend API
    ↓
Same Service Layer
    ↓
Same Components
```

Ideally, the visualization components should not need major changes.

---

# 13. Risk Management

## Risk 1 — 3D simulation fails

The main application must continue working.

Keep the simulation module isolated.

Example:

```text
Simulation Available?
       │
    ┌──┴──┐
   YES    NO
    ↓      ↓
3D Tab   Hide Tab
```

The rest of the prototype should never depend on the 3D module.

---

# Risk 2 — Realistic ocean becomes too difficult

Do not attempt:

- Real fluid dynamics
- CFD
- Real oil-water interaction
- Physically accurate wave simulation

Use:

- Shader/displacement
- Animated surface
- Particles/polygons
- Data-driven movement

---

# Risk 3 — Too many ships

For the detailed 3D reconstruction:

> Use one selected vessel.

The same 3D model can be reused for other vessels if needed.

Do not create a separate 3D model for every vessel.

---

# Risk 4 — Performance

Do not render:

- Thousands of detailed 3D ships
- Heavy particles everywhere
- Complex fluid simulation
- High-poly assets

For the SIH prototype:

```text
Selected vessel = detailed
Other vessels = simple representation
```

---

# Risk 5 — Scope creep

Do not add these until the core simulation works:

- Photorealistic ocean
- Complex physics
- Global real-time AIS
- Thousands of ships
- Real-time satellite streaming
- Advanced fluid simulation

---

# 14. Suggested 3D Simulation Concept

The 3D scene should communicate:

> **What happened at this incident?**

The 2D map should communicate:

> **Where did it happen geographically?**

The timeline should communicate:

> **When did it happen?**

The wind/current visualization should communicate:

> **Why did the oil move in that direction?**

The predicted trajectory should communicate:

> **Where is the oil expected to go next?**

---

# 15. Final Architecture

```text
                 OCEAN SENTINEL
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
     MAIN APPLICATION          3D INCIDENT
     (other teammate)          RECONSTRUCTION
          │                         │
    ┌─────┼─────┐              R3F / Three.js
    ↓     ↓     ↓                    │
  2D Map Globe deck.gl               │
                                    │
                       ┌────────────┼────────────┐
                       ↓            ↓            ↓
                    Ocean         Ship         Oil
                       │            │            │
                       └────────────┼────────────┘
                                    ↓
                              Wind / Current
                                    ↓
                              Drift Prediction
                                    ↓
                                 Timeline
```

---

# 16. Development Rules

## Rule 1

Do not build all phases at once.

## Rule 2

Every phase must produce a visible output.

## Rule 3

Do not move to the next phase until the current phase is reviewed.

## Rule 4

If a phase becomes unexpectedly difficult, stop and evaluate before adding more code.

## Rule 5

Keep the 3D module isolated from the main application.

## Rule 6

Use mock data until backend APIs are ready.

## Rule 7

Keep mock JSON structures compatible with future backend responses.

## Rule 8

Prefer simple, convincing visualization over unrealistic physics.

## Rule 9

One selected vessel is enough for the first 3D incident.

## Rule 10

The 3D module is a high-value visualization layer, not the entire project.

---

# 17. Immediate Next Step

Do **only Phase 0** first.

Target:

```text
React
+
TypeScript
+
Three.js
+
React Three Fiber
+
Drei
+
MapLibre
```

After Phase 0 is complete, provide:

- `package.json`
- relevant folder structure
- terminal output
- screenshot if available

Then review the result before starting Phase 1.

---

# 18. One-line Roadmap

```text
SETUP
  ↓
PAGE UI
  ↓
3D SCENE
  ↓
OCEAN
  ↓
SHIP
  ↓
AIS TRACK
  ↓
OIL SPILL
  ↓
WIND + CURRENT
  ↓
DRIFT
  ↓
2D MAP + GLOBE
  ↓
TIMELINE
  ↓
POLISH
  ↓
MOCK JSON → REAL API
```

## Final Goal

A judge should be able to see:

```text
Ship started here
       ↓
Ship followed AIS route
       ↓
Oil spill detected here
       ↓
Wind/current affected movement
       ↓
Oil drifted this way
       ↓
Future trajectory was predicted
       ↓
Incident can be replayed in 3D
```

This is the core of the 3D Incident Reconstruction module.
