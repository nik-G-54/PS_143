Bilkul. Main tumhe complete project context + current progress + plan change + backend APIs + future implementation plan ek aise format me de raha hoon jo tum directly new ChatGPT chat me paste kar sakte ho. Isse new chat ko almost पूरा context mil jayega.

OCEAN SENTINEL — COMPLETE PROJECT CONTEXT
1. Project ka basic objective

Project SIH 2026 Problem Statement #143 — Oil Spill Detection and AIS Correlation / Vessel Attribution ke liye hai.

Initial approach tha:

Satellite se oil spill detect → nearby/historical AIS ships dekho → ship ko backtrack karo → identify karo kis ship se oil spill hua.

Lekin project discussion ke baad visualization ka main focus change hua hai.

NEW CORE APPROACH

Ab frontend ka primary objective ship ko backtrack karna nahi, balki:

Detected oil spill ko uski observed location se backward track karna hai, taaki estimate kiya ja sake ki oil kis direction/path se drift hokar current observed location tak aaya.

Backend already physics/environmental calculations karta hai.

Concept:

Satellite Observation
        ↓
Oil Spill Detection
        ↓
Environmental / Physics Calculation
        ↓
Oil Drift / Backtracking
        ↓
Estimated Source Location
        ↓
Nearby / Candidate Vessels
        ↓
Possible Vessel Attribution

Frontend ka kaam primarily backend ke calculated results ko powerful 3D visualization me present karna hai.

2. Geographic area

Initially project ko Bay of Bengal ke around design kiya gaya tha.

Lekin ab final decision:

❌ Bay of Bengal nahi
✅ Mediterranean Sea dataset use karna hai

Current backend demo data Mediterranean Sea ka hai.

Example:

Observation:
Latitude: 35.0494
Longitude: 24.0517

Estimated source:
Latitude: 35.0292075
Longitude: 24.0945721

Isliye frontend me Bay of Bengal ke hardcoded coordinates/data ko future implementation me remove/replace karna hai.

3. UI ka desired final look

User ko final UI roughly is type ka chahiye:

realistic 3D ocean
realistic 3D vessel
visible oil spill/oil slick
oil movement/backtracking
oil trajectory
environmental flow
wind/current indicators
timeline
day/night possibility
satellite observation
incident information
nearby vessels
suspected source vessel
2D map / forecast
professional maritime intelligence dashboard

Reference UI ka important visual idea:

                    INCIDENT / INFORMATION
 ┌──────────────────────────────────────────────────────────┐
 │                    3D OCEAN VIEW                         │
 │                                                          │
 │       🚢 Vessel                                           │
 │          \                                               │
 │           \ cyan vessel track                            │
 │            \                                             │
 │             🔴 oil source                                │
 │                ~~~~~ oil slick                           │
 │                   ~~~~~~~~                               │
 │                       → wind/current                      │
 │                                                          │
 │             realistic ocean waves                        │
 │                                                          │
 └──────────────────────────────────────────────────────────┘
                     Timeline

Reference screenshots specifically show:

realistic water surface
large realistic ship
oil slick floating on water
glowing oil area
wind arrows
current arrows
vessel track
oil movement forecast
day/night control
timeline
environmental information
2D forecast/map
3D ocean as primary visualization

Important: Existing zip/repository examples can be used as implementation references if they contain suitable R3F/WebGL ocean/ship/wind/day-night code.

4. Current technology stack

Current frontend:

React
Vite
TypeScript
Tailwind CSS
Three.js
React Three Fiber
@react-three/drei

3D visualization:

Three.js
        ↓
React Three Fiber
        ↓
Drei

Backend:

REST APIs already available.

Frontend should consume backend APIs instead of continuing to expand mock data.

5. What has ACTUALLY been completed

Important: Earlier generated summaries sometimes mentioned Phase 6/7/8/9/10 as completed.

Do NOT treat those as authoritative.

Based on the confirmed implementation discussions, the reliable completed state is:

✅ Phase 1 — UI Shell

Completed.

Existing page:

/incident-reconstruction

Contains:

sidebar
header
incident information
environmental panel
timeline
simulation viewport
HUD
2D map placeholder
globe placeholder

The existing UI should be preserved wherever possible.

✅ Phase 2 — 3D Scene + Camera Foundation

Completed.

Implemented:

src/utils/coordinates.ts

src/components/incident/scene/
    IncidentScene.tsx
    SceneCamera.tsx
    SceneLighting.tsx
    SceneGrid.tsx
    IncidentMarker.tsx
    TestPointMarker.tsx
    OrientationIndicator.tsx

Coordinate system:

Origin:
13.18° N
80.32° E

(0,0,0)

Axes:

X → East
-X → West

-Z → North
+Z → South

Y → Up

Scale:

METERS_PER_WORLD_UNIT = 100

Utility:

latLonToWorld(...)

This was successfully validated.

✅ Phase 3 — 3D Ocean Foundation

Completed.

File:

OceanSurface.tsx

Used:

MeshDistortMaterial

Ocean is placed on XZ plane.

Current ocean is functional but not yet the final realistic ocean.

Current implementation is a lightweight procedural foundation.

This is important:

Phase 3 ocean should NOT simply be considered final.

It will later need to be upgraded toward the realistic ocean shown in the reference screenshots.

✅ Phase 4 — Static 3D Vessel

Completed.

File:

VesselModel.tsx

Current vessel is procedural geometry:

BoxGeometry
ConeGeometry
CylinderGeometry

It is a lightweight ship.

Current implementation is useful for architecture/testing but:

It is NOT the final realistic ship visual.

Future plan may replace/improve it using:

GLTF/GLB
existing public GitHub 3D ship asset
suitable repository code
optimized Three.js model
✅ Phase 5A — Historical AIS Track

Completed.

Files:

src/data/mockAIS.ts

src/components/incident/scene/AISTrack.tsx

Current implementation:

AIS coordinates
      ↓
latLonToWorld()
      ↓
3D line

The track was originally designed around a mock vessel route.

Important:

This is where project direction changed.

Previously:

Ship route → backtrack ship → identify polluter

Now:

Oil location → oil backtrack → source estimate
                         ↓
                    nearby vessels
                         ↓
                 possible attribution

Therefore AISTrack should not blindly remain the central visualization.

It can still be useful for:

suspect vessel track
nearby vessel movement
attribution evidence

but oil trajectory becomes the primary track.

✅ Phase 5B — Timeline + Vessel Movement

Completed.

Created:

src/context/SimulationContext.tsx

Modified:

IncidentReconstructionPage.tsx
Timeline.tsx
VesselModel.tsx
IncidentScene.tsx

Current system:

Timeline
   ↓
SimulationContext
   ↓
progress
   ↓
3D vessel

Vessel moves according to AIS track.

Timeline supports:

play
pause
scrub
interpolation
vessel rotation

Later bug fix:

Automatic looping was removed.

When:

progress = 1

simulation stops.

User must scrub backwards before playing again.

This behavior should remain unless future oil simulation requires different behavior.

6. CURRENT ARCHITECTURE

Current 3D scene approximately:

IncidentReconstructionPage
        │
        ├── SimulationProvider
        │
        ├── Timeline
        │
        └── SimulationViewport
                │
                └── Canvas
                     │
                     └── IncidentScene
                          │
                          ├── SceneLighting
                          ├── SceneGrid
                          ├── OceanSurface
                          ├── IncidentMarker
                          ├── TestPointMarker
                          ├── OrientationIndicator
                          ├── VesselModel
                          └── AISTrack

This architecture is reusable.

We should extend it, not rewrite the entire project from scratch.

7. BACKEND APIs AVAILABLE

Backend already calculates most important things.

API 1 — Oil Backtrack
POST /api/v1/demo/spills/{spill_id}/backtrack

Example:

{
  "spill_id": "spill_dba12b",

  "backtrack": {
    "observation": {
      "latitude": 35.0494,
      "longitude": 24.0517,
      "timestamp": "2019-01-13T03:42:35+00:00"
    },

    "estimated_release_time": "2019-01-12T11:18:35+00:00",

    "source_estimate": {
      "latitude": 35.02920753859703,
      "longitude": 24.094572171576818,
      "radius_km": 0.5515652743393171
    }
  },

  "attribution": {
    "candidate_count": 1,
    "top_vessel": "SYNTH-Y2019-000144",
    "top_score": null
  }
}

Backend is already doing:

source estimation
release time estimation
physics calculations
attribution information

Frontend should visualize these results.

8. API 2 — Nearby Vessels
GET /api/v1/demo/spills/spill_dba12b/vessels

Returns ranked vessels.

Example:

{
  "spill_id": "spill_dba12b",

  "vessels": [
    {
      "vessel_id": "SYNTH-Y2019-000144",
      "is_mock": false,
      "rank": 1,
      "score": null,
      "vessel_name": null,
      "mmsi": null,
      "imo": null,
      "distance_to_origin_km": null
    },

    {
      "vessel_id": "TEST-VESSEL-01",
      "is_mock": true,
      "rank": 2,
      "score": null,
      "vessel_name": "Demo Cargo ShipAlpha",
      "mmsi": "000000001",
      "imo": "IMO0000001",
      "distance_to_origin_km": 12.5
    },

    {
      "vessel_id": "TEST-VESSEL-02",
      "is_mock": true,
      "rank": 3,
      "vessel_name": "Demo Tanker Beta",
      "mmsi": "000000002",
      "imo": "IMO0000002",
      "distance_to_origin_km": 15.3
    },

    {
      "vessel_id": "TEST-VESSEL-03",
      "is_mock": true,
      "rank": 4,
      "vessel_name": "Demo Fishing Vessel Gamma",
      "mmsi": "000000003",
      "imo": "IMO0000003",
      "distance_to_origin_km": 19.8
    }
  ]
}

This is useful for:

Oil backtrack
       ↓
nearby vessels
       ↓
show them around oil trajectory
       ↓
rank candidate vessels
9. API 3 — All Detected Spills
GET /api/v1/demo/spills

Example:

{
  "total": 97,
  "page": 1,
  "page_size": 20,

  "items": [
    {
      "spill_id": "spill_dba12b",
      "detected_at": "2019-01-13T03:42:35Z",

      "centroid": {
        "lon": 24.0517,
        "lat": 35.0494
      },

      "area_km2": 2.37,
      "confidence_score": 0.88,
      "candidate_count": 1,

      "image_url":
      "https://res.cloudinary.com/bro6lw9c/image/upload/oc-0010.jpg"
    }
  ]
}

Useful for:

incident list
selecting an incident
satellite observation list
map markers
historical incidents
10. API 4 — Detailed Spill
GET /api/v1/demo/spills/spill_dba12b

Provides:

spill_id
source_type
source_file
detected_at
estimated_age_hours
estimated_release_time

observation latitude/longitude

centroid

polygon

area
confidence

satellite image

estimated source latitude
estimated source longitude
source radius

candidate count
ranked top vessel

This is extremely useful for the incident reconstruction UI.

11. One IMPORTANT missing API

For:

"Why did oil move this way?"

frontend needs environmental summary.

Recommended backend response:

{
  "environment": {
    "wind_speed": 12.4,
    "wind_direction": 285,
    "current_speed": 0.7,
    "current_direction": 310
  }
}

Could later include:

{
  "wave_height": 1.2,
  "temperature": 18.4,
  "rainfall": 0.0
}

But raw environmental data is NOT required.

Summary values are enough for frontend visualization.

12. Another recommended backend requirement

The current backtrack API gives:

Observation point
       ↓
Source estimate

But it does NOT currently give intermediate oil positions.

Example:

P0 → P1 → P2 → P3 → P4 → Observation

For a convincing 3D animation, intermediate trajectory data is highly recommended.

Recommended structure:

{
  "trajectory": [
    {
      "latitude": 35.0292,
      "longitude": 24.0945,
      "timestamp": "..."
    },
    {
      "latitude": 35.0330,
      "longitude": 24.0850,
      "timestamp": "..."
    },
    {
      "latitude": 35.0370,
      "longitude": 24.0750,
      "timestamp": "..."
    },
    {
      "latitude": 35.0430,
      "longitude": 24.0640,
      "timestamp": "..."
    },
    {
      "latitude": 35.0494,
      "longitude": 24.0517,
      "timestamp": "..."
    }
  ]
}

This is much better than frontend inventing the path.

Backend already performs physics calculations, so backend-generated trajectory points should be treated as authoritative.

13. Core conceptual difference: Ship vs Oil

This is the most important change.

OLD
AIS
 ↓
Ship route
 ↓
Ship backtrack
 ↓
Suspected ship
NEW
Satellite
 ↓
Detected oil
 ↓
Observed oil location
 ↓
Physics + wind + current
 ↓
Oil backward trajectory
 ↓
Estimated source region
 ↓
Nearby vessels
 ↓
Candidate attribution

Therefore:

PRIMARY 3D OBJECT

🛢️ Oil

SECONDARY OBJECT

🚢 Vessels

SUPPORTING OBJECTS

🌬️ Wind
🌊 Current
🛰️ Satellite observation
🗺️ Map
⏱️ Timeline

14. How oil should be visualized

Oil cannot be visualized like a normal ship moving through space.

It should appear as an oil slick floating on the ocean surface.

Recommended visual:

Ocean surface
~~~~~~~~~~~~~~~~~~~~~~~~~~

       dark/translucent oil
          ███████
       ███████████
     ███████████████
       ███████████
          █████

       glowing boundary

Use:

semi-transparent dark oil material
irregular polygon/blob
multiple overlapping patches
subtle animated distortion
surface-level positioning
red/orange edge highlight
low-height floating layer

As timeline changes:

t0 → source area
t1 → oil patch
t2 → oil patch
t3 → oil patch
t4 → observed spill

The oil should drift across the water surface, not move through the air.

15. Do we need Day/Night?
Day/night is NOT necessary for the core PS-143 functionality.

But it is a useful presentation feature.

Priority:

Oil trajectory       HIGH
Realistic ocean      HIGH
Vessel visualization HIGH
Wind/current         HIGH
Timeline             HIGH

Day/night            MEDIUM

So don't block the core implementation waiting for day/night.

It can be added later.

16. Wind + Current visualization

Should appear directly inside 3D ocean.

Example:

→ → → → → → → → → 
→ → → → → → → → → 

Wind:

yellow/orange arrows

Current:

cyan/blue arrows

And UI:

WIND
12.4 km/h
285°

CURRENT
0.7 m/s
310°

These explain why the oil trajectory bends.

17. Realistic ocean requirement

Current MeshDistortMaterial ocean is only a foundation.

Final desired ocean should be closer to reference:

visible waves
reflective water
foam/highlights
depth feeling
large ocean surface
realistic lighting
oil sitting visibly on water
ship sitting naturally on waves

Possible implementation:

R3F
 +
Three.js
 +
custom shader / improved water material
 +
normal/displacement textures
 +
environment lighting
 +
GLTF ship

We should avoid unnecessary physics engines.

18. GitHub/public repository reuse

Yes, this is absolutely acceptable for the prototype.

Instead of building every visual element from scratch, we can reuse suitable public examples for:

realistic ocean
water shader
GLTF ships
ocean waves
day/night lighting
wind particles
current visualization

But:

Don't blindly copy an entire repository.

When a suitable ZIP is provided:

GitHub repo
     ↓
inspect
     ↓
identify useful components/shaders/assets
     ↓
adapt to current R3F architecture
     ↓
keep our backend/data architecture

The existing Ocean Sentinel project architecture should remain the source of truth.

19. What should happen to the OLD .md plan?

Do NOT keep modifying the old plan indefinitely.

Because the original plan was based on:

Ship backtracking

while the project is now based on:

Oil backtracking + vessel attribution

Best approach:

old plan
   ↓
archive / keep as historical reference

NEW MASTER PLAN
   ↓
current architecture + new direction

Recommended structure:

docs/
│
├── SIH_2026_3D_Incident_Reconstruction_Plan.md
│      ← OLD / historical plan
│
└── SIH_2026_Oil_Drift_3D_Visualization_Plan.md
       ← NEW authoritative plan

The new file should clearly say:

This document supersedes the previous ship-centric reconstruction plan.

This avoids Antigravity/AI agent confusion.

20. NEW PHASE STRUCTURE

The previous phases should NOT simply continue as if nothing changed.

Recommended new roadmap:

Phase 6 — Backend API Integration Foundation

Connect:

GET /spills
GET /spills/{spill_id}
POST /spills/{spill_id}/backtrack
GET /spills/{spill_id}/vessels

Create clean API service layer.

Example:

src/services/
    spillApi.ts

and types:

src/types/
    spill.ts
    backtrack.ts
    vessel.ts

No direct fetch calls scattered throughout components.

Phase 7 — Oil Backtrack Data Model

Create frontend model:

OilObservation
OilSourceEstimate
OilTrajectoryPoint
OilTrajectory

Example:

Observation
    ↓
Trajectory[]
    ↓
Source Estimate

Backend trajectory data becomes the source of truth.

Phase 8 — 3D Oil Slick Visualization

Create:

OilSpill3D.tsx
OilTrajectory.tsx
OilSourceMarker.tsx

Visual:

source
  ↓
oil trajectory
  ↓
oil slick
  ↓
observed spill

This becomes the main 3D reconstruction.

Phase 9 — Oil Timeline Synchronization

Reuse existing:

SimulationContext
Timeline

But change primary animation from:

Vessel progress

to:

Oil progress

At time t:

oilPosition = trajectory[t]

Vessel can independently move according to its AIS data if available.

Phase 10 — Vessel Context Around Oil

Show:

candidate vessels
nearby vessels
vessel rank
vessel ID
vessel movement
suspect vessel

Important:

Ship should support the oil investigation.

Ship is no longer the main animation.

Phase 11 — Wind + Current 3D Visualization

Create:

WindField.tsx
CurrentField.tsx

Use arrows/particles/flow lines.

These should visually explain:

Why oil moved this way
Phase 12 — Realistic Ocean Upgrade

Upgrade:

OceanSurface.tsx

from basic procedural surface to a more realistic WebGL/R3F ocean.

Possible reuse from provided GitHub ZIP.

Also upgrade:

VesselModel.tsx

to a realistic GLTF/GLB vessel if a suitable model is available.

Phase 13 — 2D Map + Globe

Only after core 3D reconstruction works.

Possible:

MapLibre

for 2D.

Globe can be:

Three.js / R3F

or another appropriate globe library.

Both should synchronize with:

spill location
source location
oil trajectory
vessels
timeline
Phase 14 — Day/Night + Environment Polish

Optional but valuable:

Day
Night
Sun position
Moon
Ambient lighting

Timeline can control lighting if historical time is available.

Phase 15 — Final Investigation UI

Final UI should answer visually:

What happened?

Oil spill detected.

Where is it now?

Observed spill location.

Where did it come from?

Backtracked trajectory + source estimate.

Why did it move this way?

Wind + current.

Which ships were nearby?

Vessel layer.

Which vessel is the strongest candidate?

Ranked attribution.

What evidence supports it?

Satellite + trajectory + AIS + environmental data.

21. Final desired 3D scene

The ideal final scene:

                    WIND → → → →


                  🚢
                 /│\
                / │ \
       AIS ────/  │  \


             •
          •
       •
    •
  🔴 SOURCE
      \
       \   ~~~~~~~~~
        \ ~~~~~~~~~~~
         ~~~ OIL ~~~~~
           ~~~~~~~~~~~~~
                 🔴
             OBSERVATION


        ← CURRENT FLOW

With realistic ocean underneath.

Timeline:

SOURCE ──────── BACKTRACK ───────── OBSERVATION
  -8h             -4h                    NOW
22. MOST IMPORTANT IMPLEMENTATION RULE

Do not make frontend calculate physics.

Frontend should NOT decide:

wind drift
current drift
source position
oil trajectory
release time

Backend already calculates these.

Frontend responsibility:

Backend
   ↓
JSON
   ↓
normalize/adapt
   ↓
3D visualization
   ↓
Timeline
   ↓
UI

This keeps the system scientifically and architecturally clean.

23. Current project status in one line
Abhi tak:
UI Shell
   ✅
3D Scene
   ✅
Ocean Foundation
   ✅
Procedural Ship
   ✅
AIS Track
   ✅
Timeline
   ✅
Vessel Movement
   ✅
But project direction has changed.

Now:

Ship-centric reconstruction
          ❌ OLD

Oil-centric reconstruction
          ✅ NEW

So existing work waste nahi hua.

It becomes supporting infrastructure.

24. What should NOT be deleted

Do not immediately delete:

SimulationContext
Timeline
latLonToWorld
IncidentScene
OceanSurface
VesselModel
AISTrack
IncidentMarker
SceneCamera
SceneLighting

Instead:

existing infrastructure
        ↓
adapt
        ↓
oil-centric visualization

Especially:

latLonToWorld

This remains extremely important.

SimulationContext

Can become the global simulation clock.

Timeline

Can become oil backtrack/replay timeline.

VesselModel

Can become supporting vessel visualization.

25. What should eventually be changed

Most important changes:

OLD:
AIS Track = main track

NEW:
Oil Trajectory = main track
OLD:
Vessel = primary animated object

NEW:
Oil = primary animated object
Vessel = contextual evidence
OLD:
Mock AIS-centric data

NEW:
Backend spill/backtrack/environment APIs
OLD:
Simple ocean

NEW:
Realistic WebGL/R3F ocean
OLD:
Bay of Bengal assumptions

NEW:
Mediterranean dataset
26. Next immediate step

Abhi Phase 6 ka coding prompt dena immediately sahi nahi hoga.

Pehle new architecture ko freeze karna better hai:

1. Backend API contract finalize
2. Oil trajectory response finalize
3. Environment response finalize
4. Vessel track response finalize
5. New master .md create
6. Existing code audit
7. Then Phase 6 implementation

Backend se especially ye 3 cheezein confirm karni hain:

A. Oil intermediate trajectory points
B. Wind/current summary
C. Vessel historical track

Tumne already kaha hai ki backend team ye APIs provide kar sakti hai, so frontend ko mock assumptions banane ki zaroorat nahi hai.

🚨 NEW CHAT KO YE SHORT CONTEXT BHI DE SAKTE HO

Agar tumhe poora upar wala context paste nahi karna hai, to new chat me minimum ye bolna:

Ocean Sentinel SIH 2026 PS #143 project hai. Frontend React + Vite + TypeScript + Tailwind + Three.js + R3F + Drei par bana hai. Phase 1, 2, 3, 4, 5A and 5B complete hain. Current architecture me SimulationContext, Timeline, IncidentScene, OceanSurface, VesselModel, AISTrack aur coordinate conversion already implemented hain.

Project direction ab change ho chuki hai: old ship-centric backtracking ko primary visualization nahi banana. New goal oil-centric reconstruction hai. Backend physics calculations already karta hai. Frontend ko backend ke oil observation, estimated source, intermediate oil trajectory, release time, wind/current aur nearby/candidate vessel data ko 3D realistic ocean scene me visualize karna hai. Dataset Mediterranean Sea ka hai, Bay of Bengal ka nahi.

Available APIs:
GET /api/v1/demo/spills
GET /api/v1/demo/spills/{spill_id}
POST /api/v1/demo/spills/{spill_id}/backtrack
GET /api/v1/demo/spills/{spill_id}/vessels

Need additional backend data: intermediate oil trajectory points, environmental summary (wind speed/direction + current speed/direction), and ideally historical vessel tracks.

Final 3D UI should show: realistic R3F/WebGL ocean, floating oil slick, oil backtrack trajectory, estimated source area, observed spill, nearby moving vessels, candidate/suspect vessel, wind/current flow, timeline, satellite image/info, and optionally day/night. Oil is the primary animated object; vessels are supporting evidence.

Do not delete existing architecture. Reuse/adapt it. The current MeshDistortMaterial ocean and procedural ship are foundations, not final visuals. Public GitHub R3F/WebGL ocean/ship/wind/day-night repositories can be reused if suitable.

Create a new authoritative master plan .md instead of continuously modifying the old ship-centric plan. Archive the old plan.



