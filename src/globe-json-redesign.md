Bilkul. Step 1 ko implementation-ready UI/UX specification ki tarah freeze karte hain. Is stage par hum code ya backend mapping nahi karenge—sirf exactly decide karenge ki user ko kya dikhega aur interact kaise karega.

STEP 1 — Incident / Oil Spill UI-UX Specification
1. Overall Information Hierarchy

Incident Reconstruction page ko 3 information levels mein divide karenge:

                 3D / Maritime Globe
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      Detection      Oil Slick    Probable Source
          │             │             │
          └────── Hover / Click ──────┘
                        ↓
                Context Detail Panel
                        ↓
              Bottom Investigation Area
                        ↓
       Complete Evidence / Reconstruction
Rule

Globe = spatial understanding

Hover = quick information

Click = detailed information

Bottom section = complete investigation

Isse globe clean rahega aur information overload nahi hoga.

2. Globe ke Main Objects

Globe par primarily 4 objects honge:

Detection Point
Oil Slick / Spill Polygon
Probable Source
Vessels

Inmein visual hierarchy bhi isi order mein nahi, balki investigation importance ke according hogi:

Oil Incident
     ↓
Detection + Slick
     ↓
Probable Source
     ↓
Candidate Vessel

Baaki vessels comparatively muted rahenge.

3. Detection Point

Detection point ko clearly identifiable marker banana hai.

Globe par

Sirf:

DETECTION

ya compact marker/label.

Globe par unnecessary:

latitude
longitude
timestamp
confidence
area

sab permanently nahi dikhana.

Hover

Detection marker par hover karne par ek animated information card aaye:

┌─────────────────────────┐
│ SATELLITE DETECTION     │
│                         │
│ Detected                │
│ 14 Aug 2026 • 08:42 UTC │
│                         │
│ 13.180° N, 80.320° E    │
└─────────────────────────┘

Exact fields final backend mapping ke time verify honge.

Hover animation

Card instant appear nahi karega.

Recommended:

opacity: 0 → 1
translateY: 6px → 0
scale: 0.97 → 1

Short duration, roughly 150–220 ms.

Marker itself bhi subtle response de sakta hai—jaise soft pulse/ring.

4. Oil Slick / Spill Polygon

Ye sabse important visual object hoga.

Backend ka actual:

polygon

use karna hai.

Fake circular red blob/sphere nahi.

Appearance

Polygon:

irregular shape
translucent fill
subtle boundary
ocean ke upar clearly visible
overly bright nahi
slight animated edge/glow possible

Goal:

User ko immediately samajh aaye ki "ye actual detected oil-covered area hai."

Polygon ke andar text nahi

❌

OIL SPILL
13.18 N
80.32 E
82%

Ye clutter create karega.

Instead hover interaction use karenge.

5. Oil Slick Hover Card

Hover:

┌─────────────────────────┐
│ OIL SPILL               │
│                         │
│ Area          12.4 km²  │
│ Confidence       91%    │
│ Detected       08:42 UTC│
│ Estimated Age   18.2 h  │
└─────────────────────────┘

Again, final field availability backend mapping mein verify hogi.

Interaction

Mouse polygon par aaye:

Polygon
   ↓
subtle highlight
   +
hover card fade/slide in

Mouse leave:

highlight ↓
card fade out

No aggressive animation.

6. Oil Slick Click

Polygon click karne par right-side Incident Detail Panel open hoga.

Example structure:

┌─────────────────────────────────┐
│ INCIDENT                    ×   │
│                                 │
│ SPILL-05B4E0                    │
│                                 │
│ Detection                       │
│ 14 Aug 2026 • 08:42 UTC         │
│                                 │
│ Location                        │
│ 13.180° N, 80.320° E            │
│                                 │
│ Spill Area                      │
│ 12.4 km²                        │
│                                 │
│ Confidence                      │
│ 91%                             │
│                                 │
│ Estimated Age                   │
│ 18.2 hours                      │
│                                 │
│ [ View Satellite Image ]        │
└─────────────────────────────────┘

Panel ka purpose:

Incident ke basic facts.

Isme source investigation ka poora data dump nahi karna.

7. Satellite Image

Incident panel mein:

View Satellite Image

button hoga.

Iska purpose hai user ko visual evidence tak direct access dena.

Button ko normal primary/secondary action ki tarah design karenge—not a raw URL.

8. Probable Source

Source ko detection se visually distinct rakhna hai.

Important terminology:

Use

PROBABLE SOURCE

ya

ESTIMATED RELEASE POINT

Avoid

❌ Culprit
❌ Confirmed Source
❌ Responsible Vessel

jab tak backend scientifically/legally establish nahi karta.

9. Source Marker

Globe par source marker ke around:

uncertainty radius

visualize karna hai.

Backend:

estimated_source_radius_km

se radius generate hoga.

Conceptually:

             uncertainty
                ring
          ┌─────────────┐
          │      ●      │
          │   SOURCE    │
          └─────────────┘

Ye user ko immediately batayega:

Source exact single point nahi hai; estimated region hai.

10. Source Hover

Hover:

┌────────────────────────────┐
│ PROBABLE SOURCE             │
│                             │
│ Estimated Release           │
│ 13 Aug 2026 • 14:12 UTC     │
│                             │
│ Location                    │
│ 13.24° N, 80.41° E          │
│                             │
│ Uncertainty Radius          │
│ ±8.2 km                     │
└────────────────────────────┘

Potentially additional evidence:

Detection → Source
Distance: 24.6 km
Time: 18.5 h

Lekin ye hover card ko overloaded nahi karega. Detailed reconstruction bottom section mein jayega.

11. Source Click

Source click:

Source Reconstruction detail state open karega.

Right-side panel ya existing detail panel ka contextual section switch ho sakta hai.

Example:

SOURCE RECONSTRUCTION

Estimated Release
13 Aug 2026 • 14:12 UTC

Source Location
13.24° N, 80.41° E

Uncertainty
±8.2 km

Detection → Source
24.6 km

Elapsed Time
18.5 hours

Globe camera smoothly source region par focus karega.

12. Vessel Visualization

Ye bahut important hai because project ka major purpose AIS correlation / vessel attribution hai.

Selected vessel

Prominent.

Other candidate vessels

Visible but muted.

Unrelated/background vessels

Even more subtle.

Conceptually:

Selected Vessel       → Strong visual emphasis
Candidate Vessels     → Medium emphasis
Other Vessels         → Low emphasis
13. Vessel Hover

Selected/other vessel par hover:

┌──────────────────────────┐
│ VESSEL                   │
│                          │
│ Vessel Name              │
│ MMSI                     │
│ Speed                    │
│ Course                   │
│ Distance to Source       │
└──────────────────────────┘

Selected vessel ke liye additional attribution context eventually show kiya ja sakta hai.

Lekin detailed attribution scores:

proximity
temporal
slowdown
loiter
approach
departure

hover mein nahi dump karne.

Ye bottom evidence section ke liye better hain.

14. Vessel Click

Click karne par selected vessel state establish hogi.

Then:

Vessel selected
      ↓
AIS trajectory highlighted
      ↓
Other vessels muted
      ↓
Camera optionally focuses vessel
      ↓
Bottom attribution evidence updates

Isse user ko clear causal investigation flow milega.

15. Forward + Backtrack Controls

Yahan final decision:

2 buttons
Button 1

Forward Reconstruction

Meaning:

PROBABLE SOURCE / ORIGIN
          ↓
       SPILL
          ↓
      DETECTION

Temporal:

Past → Present
Button 2

Backtrack to Source

Meaning:

DETECTION
    ↓
Historical trajectory
    ↓
PROBABLE SOURCE

Temporal:

Present → Past
Why two?

Because user ko instantly samajh aayega:

"Main event ko aage reconstruct kar raha hoon ya detection se peeche trace kar raha hoon?"

Toggle ke andar hidden mode rakhne ki zarurat nahi.

16. Button Interaction

Buttons static controls jaise nahi lagenge.

Normal:

[ Forward Reconstruction ] [ Backtrack to Source ]

Active state clearly visible.

Example:

[ ● Forward Reconstruction ] [ Backtrack to Source ]

Click par subtle transition:

active state transition
timeline direction change
trajectory animation reset
vessel animation synchronize
labels update

Important:

Mode change ke time animation abruptly jump nahi karegi.

State safely reset/synchronize hogi.

17. Timeline

Timeline central investigation control hoga.

Forward mode
ORIGIN ──────────────── DETECTION
Past                       Present
Backtrack mode
DETECTION ──────────────── ORIGIN
Present                       Past

Same underlying trajectory.

Sirf temporal traversal direction change hogi.

18. Critical Synchronization Rule

Oil trajectory aur vessel trajectory alag clocks use nahi karenge.

Ek authoritative:

Investigation Clock

hoga.

                 Investigation Clock
                        │
           ┌────────────┼────────────┐
           ↓            ↓            ↓
       Oil Path      Vessel AIS    Timeline

Forward:

currentTime ↑

Backtrack:

currentTime ↓

Isse vessel aur oil kabhi timeline se desync nahi honge.

19. Bottom Investigation Section

Ye page ka deep investigation layer hoga.

Globe ke neeche scrollable area.

Isko 3 primary sections mein divide karunga:

A. Incident Overview
INCIDENT OVERVIEW

Detection
Spill Area
Confidence
Estimated Age
Estimated Release
Source Radius
B. Satellite Observation
SATELLITE OBSERVATION

[ Satellite Image ]

Detection Time
Detected Area
Confidence
Observation Location
C. Source Reconstruction
SOURCE RECONSTRUCTION

Detection
      │
      │ 18.5 hours
      │ 24.6 km
      ↓
Probable Source

Release Time
Source Coordinates
Uncertainty Radius
Trajectory Evidence
20. Attribution Evidence

Selected vessel ke liye bottom section mein detailed evidence aa sakta hai:

VESSEL ATTRIBUTION

Vessel Name
MMSI
IMO
Flag / Country
Ship Type

Proximity Score
Temporal Score
Slowdown Score
Loiter Score
Approach Score
Departure Score

Closest Distance
Minimum Event Speed
Trajectory Correlation

Yahan backend ka rich attribution data actually useful hoga.

Important: score ko "guilt probability" ke form mein present nahi karna.

Better:

Attribution Evidence

rather than:

Probability of Crime

21. Hover UX — Final Rule

Har hover card same visual language follow karega.

Enter
opacity 0 → 1
translateY 6px → 0
scale .97 → 1
Exit
opacity 1 → 0
translateY 0 → 4px

Duration approximately:

150–220ms

Important

Hover card:

pointer ke bilkul neeche chipka hua nahi
object ko obscure nahi karega
screen boundary ke bahar nahi jayega
excessive animation nahi karega

Goal:

premium investigation UI, not flashy gaming UI.

22. Click Transition

Click karne par:

Object selected
      ↓
Object highlight
      ↓
Camera smooth focus
      ↓
Detail panel slide/fade in
      ↓
Bottom evidence contextual update

Right-side panel bhi instant pop nahi karega.

Subtle:

translateX(20px → 0)
opacity(0 → 1)
23. Persistent Globe Labels

Globe par permanently sirf important labels:

DETECTION
PROBABLE SOURCE
SELECTED VESSEL

Potentially:

OIL SPILL

but only if visually necessary.

Lat/Lon, timestamps, scores, area etc. permanent labels nahi.

24. Camera Behavior

Click:

Detection

→ camera detection region par smoothly focus.

Click:

Source

→ source uncertainty region par focus.

Click:

Vessel

→ selected vessel/trajectory par focus.

Camera sudden teleport nahi karega.

25. Final User Journey

User page open karta hai:

1. Globe dekhta hai
       ↓
2. Oil spill immediately identify karta hai
       ↓
3. Detection + probable source samajhta hai
       ↓
4. Vessel tracks dekhta hai
       ↓
5. Hover karke quick evidence dekhta hai
       ↓
6. Click karke detail panel kholta hai
       ↓
7. Forward Reconstruction run karta hai
       ↓
8. Backtrack to Source run karta hai
       ↓
9. Timeline scrub karta hai
       ↓
10. Bottom section mein detailed evidence inspect karta hai

Yahi complete UX flow hai.

Step 1 ka Final Freeze
Element	Globe	Hover	Click	Bottom
Detection	✅	Basic info	Detail	Full evidence
Oil Slick	✅ Polygon	Area/confidence/time	Incident panel	Full incident
Probable Source	✅ + radius	Source/time/radius	Source detail	Reconstruction
Vessel	✅	Basic AIS	Select/focus	Attribution
Timeline	—	—	—	✅
Forward Reconstruction	Control	—	✅	Timeline
Backtrack to Source	Control	—	✅	Timeline
Satellite Image	—	—	—	✅
Attribution Scores	—	Limited	—	✅
Ab Step 1 officially define karta hai:

Globe ko information dashboard nahi banana.

Globe investigation environment hoga.

Hover context dega.

Click inspection dega.

Bottom section evidence dega.

Aur Forward Reconstruction + Backtrack to Source do explicit investigation modes honge.

Ab next Step 2 mein hum backend ke actual response ko line-by-line lekar isi design ke saath map karenge—kaunsa field exactly kis UI location par jayega, kya transform hoga, kya frontend type banega, aur kya completely internal rahega.

Haan. Step 2 ka main kaam ab backend ke rich response ko UI design ke saath formally map karna hai. Maine tumhare uploaded audit + authoritative 3D plan ko basis banaya hai. Audit specifically batata hai ki kaunse fields currently consumed, partially used, fetched-but-not-visualized, ya completely unconsumed hain.

STEP 2 — Backend → Frontend Data Mapping

Sabse pehle ek important architectural decision:

Raw backend response ko component mein directly pass nahi karna.

Final flow:

Backend APIs
    ↓
API Service
    ↓
Raw API Types
    ↓
Adapter / Normalizer
    ↓
Investigation View Model
    ↓
SimulationContext
    ↓
 ┌──────────────┬───────────────┬──────────────┐
 ↓              ↓               ↓
3D Globe      Detail Panel    Bottom Evidence

Ye existing authoritative architecture ke according hai.

1. Incident Data

Backend:

spill_id
detected_at
estimated_age_hours
estimated_release_time
observation_latitude
observation_longitude
centroid
area_km2
confidence_score
source_type
source_file
polygon
image_url
estimated_source_latitude
estimated_source_longitude
estimated_source_radius_km
candidate_count
ranked_top_vessel
ranked_top_score
runtime_seconds
User-facing mapping
Backend field	UI location	Decision
spill_id	Incident panel/header	✅ Show
detected_at	Detection marker + incident panel	✅ Show
estimated_age_hours	Incident Overview	✅ Show
estimated_release_time	Source Reconstruction	✅ Show
observation_latitude	Detection details	✅ Show
observation_longitude	Detection details	✅ Show
centroid	Internal coordinate fallback	⚙️ Internal
area_km2	Oil hover + overview	✅ Show
confidence_score	Oil hover + overview	✅ Show
source_type	Satellite Observation	✅ Show
source_file	—	❌ Internal
polygon	3D Oil Slick	🔴 Critical
image_url	Satellite Image	🔴 Critical
estimated_source_latitude	Probable Source	✅ Show
estimated_source_longitude	Probable Source	✅ Show
estimated_source_radius_km	Source ring + source panel	🔴 Critical
candidate_count	Candidate summary	✅ Show
ranked_top_vessel	Selected candidate	✅ Show
ranked_top_score	Attribution summary	✅ Show
runtime_seconds	Debug only	❌ User UI

The audit confirms that polygon is currently being ignored by the 3D oil component and image_url is being bypassed in favor of a generated imagery URL.

2. Detection Object

We'll create a normalized concept:

detection
├── timestamp
├── latitude
├── longitude
└── sourceType
UI

Globe

DETECTION

Hover

SATELLITE DETECTION

Detected
14 Aug 2026 • 08:42 UTC

Location
35.0494° N
24.0517° E

Source
Sentinel-1A SAR

Click

→ Incident Detail Panel.

This also makes source_type useful instead of leaving it hidden. The audit confirms it currently exists but is not visualized.

3. Oil Slick

This is the biggest correction.

Current frontend:

area_km2
      ↓
procedural 48-point circle
      ↓
fake oil shape

We don't want this.

Final:

backend polygon
      ↓
GeoJSON normalization
      ↓
3D world coordinates
      ↓
OilPatch

The audit explicitly identifies the current procedural wobble circle as a gap and says the authentic polygon is available.

Important distinction

area_km2 still has value.

It should not generate the shape if the authentic polygon exists.

Instead:

polygon → shape
area_km2 → displayed metric / validation metadata

So:

Geometry = backend polygon

Area = backend area

4. Oil Hover Model

Normalized:

oilSlick
├── polygon
├── areaKm2
├── confidence
├── detectedAt
└── estimatedAgeHours

Hover uses:

OIL SPILL

Area             12.4 km²
Confidence       91%
Detected         08:42 UTC
Estimated Age    18.2 h

Click → Incident Detail Panel.

5. Source Estimate

Backend:

estimated_source_latitude
estimated_source_longitude
estimated_source_radius_km

Normalize:

source
├── latitude
├── longitude
└── uncertaintyRadiusKm
Globe
       uncertainty ring
          ┌─────┐
          │  ●  │
          └─────┘
       PROBABLE SOURCE
Hover
PROBABLE SOURCE

Estimated Release
13 Aug 2026 • 14:12 UTC

Uncertainty Radius
8.2 km
Click

Source detail.

The authoritative plan explicitly requires source estimate/radius visualization.

6. Historical Oil Trajectory

Backend trajectory gives:

timestamp
latitude
longitude

The important thing is direction.

Raw backend array is newest-first:

Detection
   ↓
P1
   ↓
P2
   ↓
P3
   ↓
Origin

The current adapter sorts it ascending:

Origin
   ↓
P3
   ↓
P2
   ↓
P1
   ↓
Detection

This behavior is documented in the audit.

We should retain this normalized chronological representation because it makes the shared simulation clock much cleaner.

Normalized:

trajectory[]
├── timestampMs
├── latitude
├── longitude
└── worldPosition

Then mode determines traversal.

Forward
trajectory[0] → trajectory[N]
Origin → Detection
Backtrack
trajectory[N] → trajectory[0]
Detection → Origin

We don't create two trajectories.

7. Vessel Data

Backend vessel summary contains significantly more information than current 3D uses.

Important fields:

vessel_id
vessel_name
mmsi
imo
country
shiptype
shiptype_name
vessel_type
rank
score
speed
course
heading
distance_to_origin_km
time_difference_hours
trajectory_correlation
is_mock
is_mock_comparison
trajectory[]

The audit specifically confirms many of these are currently dropped from the 3D normalization.

We'll normalize them into:

candidateVessel
├── identity
│   ├── vesselId
│   ├── name
│   ├── mmsi
│   └── imo
│
├── classification
│   ├── country
│   ├── vesselType
│   └── shipTypeName
│
├── ranking
│   ├── rank
│   └── score
│
├── kinematics
│   ├── speedKnots
│   ├── course
│   └── heading
│
├── sourceRelation
│   ├── distanceToOriginKm
│   ├── timeDifferenceHours
│   └── trajectoryCorrelation
│
└── trajectory[]
8. Vessel Hover

Ab user ko sirf:

VESSEL
Name
Score
Distance

nahi dikhana.

Better:

VESSEL

Ocean Pioneer

MMSI
123456789

Type
Crude Oil Tanker

Flag
Malta

Speed
11.8 kn

Course
274°

But hover ko overloaded nahi karna.

Detailed attribution bottom section mein.

9. Selected Vessel

When user clicks a vessel:

selectedVesselId
        ↓
selected vessel highlighted
        ↓
AIS trajectory highlighted
        ↓
other vessels muted
        ↓
bottom attribution updates

This is consistent with the plan's rule that rank #1/selected vessel gets detailed treatment while other candidates remain lightweight.

10. Vessel Trajectory

Backend:

trajectory[]
    latitude
    longitude
    timestamp
    speed
    course
    heading

This becomes:

AIS Track
Used for

3D

vessel position
vessel heading
AIS trail

Timeline

vessel position at current investigation time

Hover

current speed/course

Bottom

detailed vessel evidence

The audit notes that speed exists but is currently ignored during playback.

Important:

Speed will be displayed as telemetry, not used to invent or recalculate the backend trajectory.

11. Attribution Evidence

This is where backend's richer forensic information becomes valuable.

From:

verification

we want:

within_backtrack_radius
culprit_position_timestamp
origin_to_culprit_distance_km
timestamp_nearest_ais_point
timestamp_nearest_distance_from_origin_km

But not everything belongs to the user UI.

User-facing
Field	UI
within_backtrack_radius	Evidence badge
culprit_position_timestamp	Timeline milestone
origin_to_culprit_distance_km	Attribution evidence
timestamp_nearest_ais_point	Detailed evidence
timestamp_nearest_distance_from_origin_km	Detailed evidence
Internal
Field	Decision
ais_points_in_window	❌
display_trajectory_points	❌
trajectory_window	⚙️ Debug/internal
nearest_origin_ais_point	❌

The audit explicitly identifies within_backtrack_radius as an especially valuable forensic field currently not visualized.

12. Attribution Scores

This is a major opportunity.

Backend can provide:

proximity_score
temporal_score
slowdown_score
loiter_score
approach_score
departure_score

These should not be scattered around the globe.

Instead:

Bottom → Attribution Evidence
ATTRIBUTION EVIDENCE

Proximity       █████████░  91%
Temporal        ████████░░  84%
Slowdown        ███████░░░  72%
Loitering       ████████░░  81%
Approach        █████████░  89%
Departure       ████████░░  86%

Then:

Closest Distance
Minimum Event Speed
Time Difference
Trajectory Correlation

And backend explanation[] can become:

EVIDENCE

✓ Vessel entered source uncertainty zone
✓ Vessel timing aligns with estimated release
✓ Vessel slowed near probable source
...

The audit specifically recommends exposing this decomposition rather than showing only one aggregate score.

13. Critical Wording

Backend may call something:

culprit

but UI shouldn't automatically say:

Culprit Vessel

Our UI terminology:

Candidate Vessel
Potential Source Vessel
Probable Source
Estimated Release Point
Attribution Evidence

This matches the authoritative plan's requirement to avoid definite guilt claims without validated attribution.

14. Environment

Backend:

environment
├── wind
│   ├── speed
│   ├── direction
│   ├── u
│   └── v
│
└── current
    ├── speed
    ├── direction
    ├── u
    └── v

Frontend normalized model:

environment
├── wind
│   ├── speed
│   └── direction
│
└── current
    ├── speed
    └── direction

u/v stays internal.

The plan explicitly says backend supplies wind/current and frontend only visualizes them; it does not perform physics calculations.

Globe

Wind arrow.

Current arrow.

Hover/Panel
ENVIRONMENT

Wind
12.4 kn
274°

Current
1.8 kn
301°
15. Satellite Evidence

Backend:

image_url
source_type
detected_at

Final:

Satellite Observation

[ IMAGE ]

Sensor
Sentinel-1A SAR

Detected
13 Jan 2019 • 03:42 UTC

Area
12.4 km²

Confidence
91%

[ View Satellite Image ]

No generated ArcGIS replacement if authoritative image_url exists.

That is a direct correction to the audit finding.

16. What We Will NOT Bring Into UI

These remain internal:

runtime_seconds
source_file
ais_points_in_window
display_trajectory_points
nearest_origin_ais_point
u
v
pagination fields
database IDs that have no analyst value

The audit specifically recommends keeping these internal.

17. Final Investigation View Model

Ab hum raw APIs ko combine karke ek clean frontend model bana sakte hain:

Investigation
│
├── incident
│   ├── id
│   ├── detectedAt
│   ├── estimatedAgeHours
│   ├── areaKm2
│   ├── confidence
│   └── imageUrl
│
├── detection
│   ├── latitude
│   ├── longitude
│   ├── timestamp
│   └── sourceType
│
├── oilSlick
│   └── polygon
│
├── source
│   ├── latitude
│   ├── longitude
│   ├── uncertaintyRadiusKm
│   └── estimatedReleaseTime
│
├── oilTrajectory[]
│
├── vessels[]
│   ├── identity
│   ├── classification
│   ├── ranking
│   ├── kinematics
│   ├── sourceRelation
│   └── trajectory[]
│
├── selectedVessel
│
├── attribution
│   ├── overallScore
│   ├── featureScores
│   ├── explanation
│   └── verification
│
├── environment
│   ├── wind
│   └── current
│
└── playback
    ├── mode
    ├── currentTime
    ├── progress
    └── isPlaying

Ye raw backend schema nahi hai. Ye frontend ka investigation domain model hai.

18. Most Important Architecture Decision

Hum 3 different data systems nahi banayenge.

Instead:

                 Investigation Model
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
   3D Incident      Investigation     Bottom
      Scene             Panel        Evidence
        │
        ↓
  SimulationContext
        │
        ↓
   Shared Clock

Isse 3D, timeline aur evidence ek hi incident state se operate karenge.

Authoritative plan bhi one-clock architecture require karta hai.

19. Final Data Ownership

Ye bahut important hai:

Information	Owner
Oil physics	Backend
Oil historical trajectory	Backend
Source estimate	Backend
AIS correlation	Backend
Attribution scores	Backend
Vessel trajectory	Backend
Wind/current values	Backend
Interpolation between supplied points	Frontend
Lat/Lon → 3D	Frontend
Hover animation	Frontend
Camera movement	Frontend
UI transitions	Frontend
Timeline playback	Frontend
Visual oil sheen	Frontend
Ocean rendering	Frontend

Frontend science calculate nahi karega. Sirf backend result ko visually reconstruct karega.

Step 2 ka Final Result

Ab hamare paas clear mapping hai:

                     BACKEND
                        │
                        ▼
                Adapter / Normalizer
                        │
                        ▼
             INVESTIGATION MODEL
                        │
       ┌────────────────┼─────────────────┐
       ▼                ▼                 ▼
     GLOBE            HOVER             CLICK
       │                │                 │
       │                │                 ▼
       │                │          Detail Panel
       │                │
       └────────────────┼─────────────────┐
                        ▼                 ▼
                 Investigation       Evidence
                    Timeline           Section

Aur सबसे important चीज़:

Backend ka extra data ab waste nahi hoga, lekin hum har field ko UI mein force bhi nahi karenge.

polygon, image_url, source radius, vessel kinematics, verification, attribution breakdown jaise high-value fields promote honge; debug/internal fields intentionally hidden rahenge.

Ab Step 3 mein humein Interaction + State Architecture freeze karna hai—especially FORWARD vs BACKTRACK, shared clock, timeline, selected vessel, hover/click state, source milestone, aur exactly kya state change hoga jab user dono buttons press/scrub karega. Ye part implementation se pehle sabse important hai, kyunki isi se baad mein Antigravity ko clean architecture milegi.



Haan, possible hai — but ek important condition ke saath. Aur tumhare actual API response/audit ko dekhne ke baad main confidently keh sakta hoon ki iska core logic frontend mein implement ho sakta hai without inventing the vessel trajectory or oil trajectory.

Lekin tumhare proposed behavior ke do alag parts hain:

Rank-1 vessel source ke paas aate hi temporarily slow ho → possible, but carefully
Oil tabhi move kare jab vessel actual release/origin point cross kare → possible and actually much more important

Let's separate them.

1. Tumhare backend mein required data actually available hai?

Yes, largely.

Audit ke according rank-1 vessel ke AIS trajectory points mein:

latitude
longitude
timestamp
speed
course
heading

available hain.

Aur specifically backend culprit_location bhi provide karta hai:

latitude
longitude
timestamp
speed
course
heading

which represents the candidate vessel's position around the estimated release point.

Even more importantly, backend provides:

within_backtrack_radius
culprit_position_timestamp
origin_to_culprit_distance_km

and the audit calls within_backtrack_radius an extremely valuable indicator of whether the vessel actually intersected the source uncertainty area at release time.

So we don't have to guess where the vessel was.

2. "2 points before + 2 points after slow" — possible?
Technically: YES.

Suppose rank-1 AIS track is:

P1
P2
P3
P4
P5
P6
P7

and backend identifies the relevant release/source point around:

P5

Frontend can determine:

slowdown window =
P3 → P4 → P5 → P6 → P7

So vessel speed visualization can transition:

normal
  ↓
slowing
  ↓
slowest near source
  ↓
accelerating
  ↓
normal
BUT — important scientific distinction

We should not modify the actual AIS trajectory or invent new speed values.

Your backend already supplies trajectory[].speed; audit confirms it is currently stored but not visualized.

So frontend should use the actual speed values to visualize the observed slowdown.

Not:

Backend says 12 kn
Frontend changes it to 4 kn

That would be fabricated data.

Instead:

Backend AIS:
P3 = 11.8 kn
P4 = 8.4 kn
P5 = 4.2 kn
P6 = 6.7 kn
P7 = 10.9 kn

Frontend:
        ↓
visualize exactly that

If the actual data shows slowdown, excellent.

If it doesn't, frontend shouldn't manufacture one.

3. But your "oil should wait until ship crosses origin" idea is even more important

Yes, this can absolutely be done.

And conceptually it is the correct way to avoid the fake-looking situation you described.

Suppose:

Vessel
──────→──────→──────→
              ● Source

and vessel reaches source at:

T_release

Oil should not start its historical movement before T_release.

Instead:

TIME
────────────────────────────────────────>

             T_release
                 │
                 ▼
Vessel ──────────●──────────────→

Oil              ●────────────→
                 Source

Before T_release:

Oil = stationary at source

After T_release:

Oil = starts following backend historical trajectory

This is a frontend temporal synchronization rule, not a physics calculation.

4. And this solves exactly the problem you pointed out

Suppose the vessel passed the source before the oil started moving.

Without synchronization:

Vessel
────────●──────────────→

Oil
        ←──────●──────

It looks wrong.

Or vessel passed much later:

Oil
←──────────────●

                 Vessel
                    ─────────→

Again, visually confusing.

With the release-time gate:

             RELEASE TIME
                   │
                   ▼
Vessel ────────────●──────────→
                   │
Oil                ●──────────→
                   ↑
             movement starts

Now the event sequence is coherent.

5. But there is one critical thing we must NOT assume

You said:

"ship oil spill ke source ke pass se nikle"

We need to distinguish:

A. Exact source point
estimated_source_latitude
estimated_source_longitude
B. Source uncertainty region
estimated_source_radius_km
C. Actual rank-1 vessel release position
culprit_location.latitude
culprit_location.longitude
culprit_position_timestamp

Your backend actually gives us these concepts separately.

So the trigger should not simply be:

"ship visually crosses the center dot."

Better:

Release event is anchored to the backend's release/source correlation timestamp and source-region relationship.

That prevents the frontend camera/world-coordinate interpolation from accidentally deciding that an event happened.

6. What should determine the trigger?

I'd define the hierarchy like this:

Highest confidence
culprit_position_timestamp

Use that as the temporal event.

Then validate spatial relationship using:

within_backtrack_radius

and/or:

origin_to_culprit_distance_km

The audit specifically identifies these as available forensic signals.

So:

Backend
   │
   ├── Release timestamp
   ├── Culprit position
   ├── Source radius
   └── Verification
          ↓
Frontend
          ↓
Release Event
7. Forward Reconstruction

This becomes very interesting.

Forward mode:

SOURCE
  │
  │ Vessel approaches
  ↓
VESSEL CROSSES RELEASE ZONE
  │
  │ ← release event
  ↓
OIL STARTS MOVING
  │
  ↓
P1 → P2 → P3 → P4
  │
  ↓
DETECTION

So initially:

Oil = Source

Vessel moves toward source.

At release timestamp:

🚢 reaches source zone

💧 release event

Then:

Oil → P1 → P2 → P3 → Detection

That would look far more convincing than simply moving oil from origin immediately.

8. Backtrack Mode

Now reverse the same event.

DETECTION
    │
    ↓
P4
    ↓
P3
    ↓
P2
    ↓
P1
    ↓
SOURCE

And vessel:

Detection-time position
          ↓
historical AIS
          ↓
...
          ↓
release/source position

When timeline reaches:

culprit_position_timestamp

we arrive at:

🚢 Vessel at probable source
        +
🛢️ Oil release point

Then stop.

This is exactly consistent with the authoritative plan's requirement that frontend visualize backend-calculated historical trajectories and use one simulation clock.

9. One correction to your "2 points" idea

I would not hard-code:

±2 points

for every spill.

You said dynamic for every spill — yes, that's the correct approach.

Because one spill may have:

AIS points every 5 minutes

while another may have:

AIS points every 15 minutes

or irregular AIS sampling.

So instead of:

index - 2
index + 2

we should conceptually define:

release event
      ↓
find corresponding AIS point
      ↓
derive a dynamic event window
      ↓
previous points + release point + next points

The exact number/window should ideally be based on time around the release event, not blindly on array indexes.

10. Most important: Don't fake slowdown

This distinction is critical for your SIH demo.

❌ Wrong
Rank 1 vessel
     ↓
Frontend detects source
     ↓
Frontend forcibly changes speed to 3 knots

This creates artificial evidence.

✅ Correct
Backend AIS speed history
          ↓
Frontend reads speed
          ↓
Actual slowdown detected?
          ↓
YES → visualize it
NO  → don't manufacture it

Because your backend already provides waypoint speed, and the audit confirms the frontend currently ignores it.

11. So can the entire behavior be dynamic for every spill?
Yes.

The architecture can be:

                BACKEND DATA
                     │
                     ▼
             Release Event Data
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   Oil trajectory  Vessel AIS  Source radius
        │            │            │
        └────────────┼────────────┘
                     ↓
             Investigation Clock
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
      FORWARD               BACKTRACK
          ↓                     ↓
 Source → Detection       Detection → Source
          │                     │
          └──────────┬──────────┘
                     ↓
              Release Event
                     ↓
            Vessel/source relation

No spill-specific hardcoding required.

12. One more important limitation from the actual audit

The audit says the backend trajectory has intermediate oil points, but the frontend must not invent historical oil movement. The backend-calculated time-series is the authoritative path.

So this feature is safe if we do:

Backend trajectory → interpolation → animation

but not:

Vessel movement → frontend calculates new oil trajectory

The vessel can be used to trigger/visualize the release event, but it must not become a substitute for the backend's oil physics.

Final answer to your question

Yes — your idea is technically feasible and fits the current API/audit architecture.

And I would actually refine your idea into this:

The rank-1 vessel's backend-provided AIS history and release-time metadata determine the release event. The frontend dynamically identifies the vessel's temporal neighborhood around that event, displays the actual AIS speed changes, and keeps the oil stationary until the release timestamp. After release, the oil follows only the backend-calculated historical trajectory.

That gives us:

Forward

Vessel approaches → Release Event → Oil starts moving → Detection

Backtrack

Detection → Oil rewinds → Release Event → Vessel reaches probable source

And crucially:

No fabricated AIS speed, no fabricated oil path, no fixed coordinates, no fixed spill-specific logic.

The current audit gives us enough data to support this architecture, although the exact release-event matching rule should be finalized against the actual live payload/schema before implementation.

So I would not implement this yet. We should carry this as a requirement into Step 3 (State + Interaction Architecture), where we'll precisely define the release-event state and synchronization logic.

Bilkul. Step 3 mein main ab tak ki poori conversation ko requirement ke roop mein include kar raha hoon, especially jo tumne abhi release-event + vessel slowdown + oil-start synchronization wali requirement clarify ki hai.

Is step ka purpose hai: UI ke har interaction aur internal state ka exact behavior freeze karna, taaki Step 4 mein frontend view model/schema aur uske baad Antigravity implementation prompt banate waqt ambiguity na rahe.

STEP 3 — State + Interaction Architecture
1. Core Principle: One Investigation State

Sabse important decision:

Forward aur Backtrack ke liye separate animation systems nahi banenge.

Ek single investigation state hogi:

Investigation State
│
├── incident
├── detection
├── oilSlick
├── source
├── oilTrajectory
├── vessels
├── selectedVessel
├── attribution
├── environment
└── playback

Aur playback:

playback
├── mode
│   ├── FORWARD
│   └── BACKTRACK
│
├── currentTime
├── progress
├── isPlaying
└── releaseEvent
2. Two Investigation Modes

Final UI:

[ Forward Reconstruction ]   [ Backtrack to Source ]
Forward Reconstruction

Actual event sequence:

PROBABLE SOURCE
       ↓
Vessel approaches
       ↓
RELEASE EVENT
       ↓
Oil starts moving
       ↓
Historical trajectory
       ↓
DETECTION

Temporal direction:

Past → Present

Backtrack to Source

Forensic investigation sequence:

DETECTION
    ↓
Oil trajectory rewinds
    ↓
Historical time
    ↓
RELEASE EVENT
    ↓
Vessel reaches probable source

Temporal direction:

Present → Past

This preserves the distinction we established earlier: current Maritime Map playback is effectively forward reconstruction even though it was labelled “Backtrack”; genuine backtracking must reverse the investigation clock. The audit supports that distinction.

3. One Authoritative Investigation Clock

Everything follows:

currentTime

Not:

oilTime
vesselTime
timelineTime

separately.

Instead:

                 currentTime
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
      Oil          Vessel       Timeline
       ↓             ↓             ↓
 trajectory       AIS track    UI position

This follows the existing architecture requirement that one simulation clock controls the visual state.

4. Forward Clock

Forward:

startTime = releaseTime
endTime   = detectionTime

Conceptually:

progress 0
   ↓
release
   ↓
   ↓
progress 0.5
   ↓
   ↓
progress 1
   ↓
detection

So:

currentTime =
releaseTime + duration × progress
5. Backtrack Clock

Backtrack:

startTime = detectionTime
endTime   = releaseTime

Conceptually:

progress 0
   ↓
detection
   ↓
   ↓
progress 0.5
   ↓
   ↓
progress 1
   ↓
probable source / release

So the conceptual traversal is:

currentTime =
detectionTime - duration × progress

The important point:

Same timestamps, opposite traversal.

We don't reverse or mutate the backend data itself.

6. Release Event — New Critical State

Tumhari latest requirement ko Step 3 ka first-class state banana chahiye.

releaseEvent
├── timestamp
├── latitude
├── longitude
├── sourceRadius
├── vesselId
└── validated

But one caution:

validated frontend khud scientifically decide nahi karega.

It should represent backend-supported information such as the backend verification/release correlation.

Backend already exposes release-related vessel position/timestamp and verification information.

7. The Oil Start Gate

This is your key visual requirement.

Before release
currentTime < releaseTime

Oil:
     ●
     │
     stationary
     │
     SOURCE

Vessel can be moving.

Oil does not start travelling backward/forward prematurely.

At release
currentTime === releaseTime

        🚢
         ↓
     RELEASE EVENT
         ↓
        🛢️

This becomes an investigation milestone.

After release
currentTime > releaseTime

Oil:
Source → P1 → P2 → P3 → Detection

This prevents exactly the visual issue you described:

Vessel pehle nikal gaya aur oil already move kar raha tha, ya vessel baad mein aaya aur oil pehle hi move kar gaya.

8. Forward Mode + Release Event

Forward playback:

SOURCE
  │
  │
  │ Vessel approaches
  ↓
RELEASE EVENT
  │
  ├── vessel is at release/source region
  │
  └── oil movement begins
          ↓
       P1 → P2 → P3
          ↓
       DETECTION

This is the intended event reconstruction.

9. Backtrack Mode + Release Event

Backtrack:

DETECTION
    │
    ↓
P3
    ↓
P2
    ↓
P1
    ↓
RELEASE EVENT
    │
    ├── Oil reaches release origin
    │
    └── Rank-1 vessel reaches source region

At the end:

VESSEL AT PROBABLE SOURCE

Not:

CULPRIT CONFIRMED
10. Vessel Speed Behavior

Tumhari requirement:

Rank-1 vessel source ke around slow ho — 2 points before + 2 points after.

Architecture decision

Do not hard-code index - 2 / index + 2.

Instead:

Release Event
      ↓
Find corresponding AIS temporal position
      ↓
Determine surrounding AIS points
      ↓
Visualize actual speed values

The API already provides vessel speed, course, and heading per trajectory point.

11. Actual Speed vs Artificial Speed

This is a strict rule.

If backend says:
P-2    12 kn
P-1     9 kn
P      4 kn
P+1     7 kn
P+2    11 kn

Frontend visualizes:

12 → 9 → 4 → 7 → 11

Perfect.

But if backend says:
12 → 12 → 12 → 12 → 12

Frontend must not invent:

12 → 8 → 4 → 8 → 12

That would create false evidence.

The audit specifically says speed is present but currently unused; the correct opportunity is to visualize the actual backend telemetry.

12. What "Slowdown Window" Actually Means

There are two different concepts we must keep separate:

A. Data window

Which AIS points are displayed around the release event.

B. Visual speed behavior

How actual backend speed values are represented.

They are not the same thing.

So:

Release Event
      │
      ├── AIS context window
      │      P-2 P-1 P P+1 P+2
      │
      └── Actual speeds
             ↓
        visual vessel motion

This distinction prevents us from accidentally fabricating speed.

13. Dynamic Per Spill

Yes.

No:

SPILL_01 → hard-coded P5
SPILL_02 → hard-coded P7
SPILL_03 → hard-coded P4

Instead:

Any Spill
   ↓
Backend data
   ↓
release event
   ↓
AIS trajectory
   ↓
dynamic temporal relationship
   ↓
visual behavior

So every spill gets its behavior from its own API response.

14. But Frontend Must Not Determine Scientific Release Time

This is a critical boundary.

Frontend can:

consume release timestamp
find corresponding trajectory position
synchronize animation
render event
interpolate between known points

Frontend should not:

calculate oil release time from vessel proximity
decide which vessel caused spill
calculate source physics
alter backend trajectory
generate a new drift path

Backend owns scientific attribution/physics. The project architecture explicitly requires that separation.

15. Hover State

Hover is transient.

hoveredObject
├── detection
├── oil
├── source
├── vessel
└── null

Only one contextual hover card should normally be active.

On enter
hoveredObject = X
On leave
hoveredObject = null

Animation:

opacity
translateY
scale

~150–220ms.

16. Selection State

Hover and click are different.

hoveredObject ≠ selectedObject

Example:

User hovers vessel A:

hovered = vesselA

Then clicks:

selectedVessel = vesselA

Mouse leaves:

hovered = null
selectedVessel = vesselA

So selected vessel remains active.

This is important for a professional investigation UI.

17. Selected Vessel State
selectedVesselId

When selected:

selected vessel
       ↓
highlight
       ↓
AIS track highlight
       ↓
other vessels muted
       ↓
attribution panel updates

The bottom evidence section becomes contextual to that vessel.

18. Panel State

We shouldn't create separate random panels.

Use one contextual detail panel:

detailPanel
├── CLOSED
├── INCIDENT
├── SOURCE
└── VESSEL
Oil click
detailPanel = INCIDENT
Source click
detailPanel = SOURCE
Vessel click
detailPanel = VESSEL

This keeps the UI consistent.

19. Camera State

Camera is another independent UI state:

cameraTarget
├── detection
├── oil
├── source
├── vessel
└── none

Clicking an object:

selected object
      ↓
cameraTarget
      ↓
smooth camera transition

Camera doesn't change scientific state.

20. Timeline State

Timeline needs:

progress
currentTime
isPlaying
mode

When user scrubs:

progress changes
       ↓
currentTime recalculated
       ↓
oil position updates
       ↓
vessel position updates
       ↓
timeline marker updates

Not:

scrub
 ↓
oil moves
 ↓
vessel independently guesses position
21. Timeline Milestones

Timeline should have meaningful events.

At minimum:

RELEASE
DETECTION

Potentially:

SOURCE
RELEASE EVENT
DETECTION

In Backtrack:

DETECTION
──────────────
RELEASE

In Forward:

RELEASE
──────────────
DETECTION

This makes the investigation understandable even when paused.

22. Mode Switching

Suppose user is playing Forward at 65%.

They click:

Backtrack to Source

We should not continue from an arbitrary transformed state.

Recommended:

Mode change
   ↓
pause
   ↓
switch mode
   ↓
recalculate temporal position
   ↓
synchronize oil + vessel + timeline
   ↓
ready to play

This avoids jumps/desynchronization.

23. What Happens When Backtrack Completes?

At progress = 1:

Detection
   ↓
...
   ↓
Release Event
   ↓
Probable Source

Then:

isPlaying = false

And UI can show:

Vessel at Probable Source

with source uncertainty region visible.

24. What Happens When Forward Completes?

At progress = 1:

Release
   ↓
...
   ↓
Detection

Then:

isPlaying = false

The user has reconstructed the event from source to observation.

25. Important State Dependency

This is the complete relationship:

                  INVESTIGATION
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
        MODE                    DATA
   FORWARD/BACKTRACK        backend normalized
          │                         │
          └────────────┬────────────┘
                       ↓
                INVESTIGATION CLOCK
                       │
          ┌────────────┼─────────────┐
          ↓            ↓             ↓
         OIL         VESSEL       TIMELINE
          │            │             │
          └────────────┼─────────────┘
                       ↓
                  RELEASE EVENT
                       │
              ┌────────┴────────┐
              ↓                 ↓
        Oil movement        Vessel context
26. The Most Important Safety/Correctness Rule

There are three different directions we must never confuse:

Geographic direction

Where the object physically travels.

Data direction

Order of points in the API/normalized array.

Temporal playback direction

How the user is traversing the event.

For example:

Normalized trajectory:

Source → P1 → P2 → P3 → Detection

Forward:

play:
Source → P1 → P2 → P3 → Detection

Backtrack:

play:
Detection → P3 → P2 → P1 → Source

Same data.

Different traversal.

The audit specifically recommends keeping these dimensions separate.

27. Complete Interaction Flow

Ab user ka complete experience:

OPEN INCIDENT
      ↓
Globe loads
      ↓
Detection + Oil + Source + Vessels
      ↓
Hover
      ↓
Quick contextual card
      ↓
Click
      ↓
Detail panel
      ↓
Select Rank-1 vessel
      ↓
AIS track highlighted
      ↓
Forward Reconstruction
      ↓
Source → Release → Oil movement → Detection
      ↓
Backtrack to Source
      ↓
Detection → Oil rewind → Release → Source
      ↓
Bottom Evidence
      ↓
Attribution + Environment + Satellite evidence
Step 3 — Final Frozen Architecture
                 BACKEND
                    │
                    ▼
              NORMALIZED DATA
                    │
                    ▼
          ┌─────────────────────┐
          │ INVESTIGATION STATE │
          └──────────┬──────────┘
                     │
        ┌────────────┼─────────────┐
        ↓            ↓             ↓
      MODE        CLOCK          SELECTION
        │            │             │
   Forward/       currentTime   vessel/object
   Backtrack         │
                     │
        ┌────────────┼─────────────┐
        ↓            ↓             ↓
       OIL         VESSEL       TIMELINE
        │            │             │
        └────────────┼─────────────┘
                     ↓
              RELEASE EVENT
                     │
            ┌────────┴────────┐
            ↓                 ↓
     Oil movement gate   Vessel context
And the key behavior we are freezing from this conversation is:

Forward:

Vessel approaches probable source → release event occurs → oil begins moving → oil follows backend trajectory → detection.

Backtrack:

Detection → oil rewinds through backend trajectory → release event → rank-1 vessel reaches probable source region.

Vessel slowdown:

Use the actual backend AIS speed values around the release event. Dynamically identify the relevant temporal neighborhood for each spill; don't hard-code a universal ±2 array-index rule and don't fabricate speed.

Oil movement:

Oil cannot begin moving before the backend-supported release event.

That last point is particularly important because it solves the visual inconsistency you identified.

Step 3 complete.

Next Step 4 should be the final Frontend Data Contract / TypeScript View Model. There we'll convert everything from Steps 1–3 into exact objects/types—IncidentViewModel, OilSlickViewModel, SourceViewModel, VesselViewModel, ReleaseEvent, PlaybackState, AttributionViewModel, etc.—and explicitly map every backend field to those objects.

Uske baad hi Antigravity ke liye implementation prompt banana sensible hoga.Yes. Step 4 mein ab hum implementation-ready Frontend Data Contract freeze karenge. Ye wahi layer hai jo backend ke raw responses aur UI/3D components ke beech rahegi.

Important: ye backend schema ko replace nahi karega. Ye frontend ka normalized/view model hoga.

STEP 4 — Frontend Data Contract
1. Final Architecture
Backend APIs
     ↓
API Response Types
     ↓
Adapters / Normalizers
     ↓
InvestigationViewModel
     ↓
Simulation / Investigation State
     ↓
┌───────────┬────────────┬──────────────┐
│ 3D Globe  │ Detail UI  │ Evidence UI  │
└───────────┴────────────┴──────────────┘

Raw API JSON directly OilPatch, Vessel, Timeline, etc. ko nahi diya jayega.

2. InvestigationViewModel

Top-level object:

interface InvestigationViewModel {
  incident: IncidentViewModel;
  detection: DetectionViewModel;
  oilSlick: OilSlickViewModel;
  source: SourceViewModel;
  oilTrajectory: TrajectoryPoint[];
  vessels: VesselViewModel[];
  selectedVesselId: string | null;
  attribution: AttributionViewModel | null;
  environment: EnvironmentViewModel | null;
  playback: PlaybackState;
}

Ye page ke liye single source of normalized data hoga.

3. Incident
interface IncidentViewModel {
  id: string;
  detectedAt: string;
  estimatedAgeHours: number | null;
  areaKm2: number | null;
  confidenceScore: number | null;
  estimatedReleaseTime: string | null;
  imageUrl: string | null;
  sourceType: string | null;
  candidateCount: number | null;
}
UI usage
id
   → Incident header

detectedAt
   → Detection + Incident panel

estimatedAgeHours
   → Incident Overview

areaKm2
   → Oil hover + Incident Overview

confidenceScore
   → Oil hover + Incident Overview

estimatedReleaseTime
   → Source Reconstruction

imageUrl
   → Satellite Evidence

sourceType
   → Satellite Observation

candidateCount
   → Candidate summary
4. Detection
interface DetectionViewModel {
  latitude: number;
  longitude: number;
  timestamp: string;
  sourceType: string | null;
}

Detection coordinates should come from the appropriate observation/detection fields from the backend response.

Used by
3D Detection Marker
        ↓
Hover
        ↓
Detail Panel
5. Oil Slick
interface OilSlickViewModel {
  polygon: GeoJSONPolygon;
  areaKm2: number | null;
  confidenceScore: number | null;
  detectedAt: string;
  estimatedAgeHours: number | null;
}
Critical rule
polygon → geometry
areaKm2 → metric

Never:

areaKm2 → generate fake circle

The audit specifically identified that the current 3D implementation uses a procedural wobble circle instead of the authoritative polygon.

6. Source
interface SourceViewModel {
  latitude: number;
  longitude: number;
  uncertaintyRadiusKm: number | null;
  estimatedReleaseTime: string | null;
}
Globe
latitude
longitude
      ↓
source marker
      +
uncertaintyRadiusKm
      ↓
uncertainty ring
UI
estimatedReleaseTime
      ↓
Source Reconstruction
7. Generic Trajectory Point

Oil aur vessel trajectory ke liye conceptually same temporal model use karenge.

interface TrajectoryPoint {
  timestamp: string;
  timestampMs: number;
  latitude: number;
  longitude: number;
}

For 3D rendering, normalized world position can be derived by the frontend:

interface RenderTrajectoryPoint extends TrajectoryPoint {
  worldPosition: [number, number, number];
}

But worldPosition backend se nahi aayega.

Frontend coordinate adapter generate karega.

8. Oil Trajectory
oilTrajectory: TrajectoryPoint[];

Chronological normalized representation:

P0 = Source / oldest
P1
P2
P3
...
Pn = Detection / newest

The existing audit says the frontend adapter sorts the backend trajectory ascending by timestamp, which produces exactly this chronological representation.

Forward
P0 → P1 → P2 → ... → Pn
Backtrack
Pn → ... → P2 → P1 → P0

Array itself mutate/reverse nahi karna.

9. Vessel View Model

Backend vessel data is richer, so normalize it.

interface VesselViewModel {
  vesselId: string;
  name: string | null;
  mmsi: string | null;
  imo: string | null;

  country: string | null;
  vesselType: string | null;
  shipTypeName: string | null;

  rank: number | null;
  score: number | null;

  currentSpeedKnots: number | null;
  currentCourse: number | null;
  currentHeading: number | null;

  distanceToOriginKm: number | null;
  timeDifferenceHours: number | null;
  trajectoryCorrelation: number | null;

  isMock: boolean;
  isMockComparison: boolean;

  trajectory: VesselTrajectoryPoint[];
}

The backend/audit support vessel identity, ranking, speed/course/heading, source distance, time difference and trajectory correlation.

10. Vessel Trajectory Point

Because speed matters for your new requirement:

interface VesselTrajectoryPoint extends TrajectoryPoint {
  speedKnots: number | null;
  course: number | null;
  heading: number | null;
}

This means we don't throw away backend telemetry.

11. Release Event

This is the new important object from our latest discussion.

interface ReleaseEventViewModel {
  timestamp: string;
  timestampMs: number;

  latitude: number;
  longitude: number;

  vesselId: string | null;

  sourceRadiusKm: number | null;

  withinBacktrackRadius: boolean | null;

  originToVesselDistanceKm: number | null;
}

But one architectural nuance:

The frontend doesn't calculate whether this was scientifically a release event.

It consumes backend-supported release/correlation information.

The audit confirms backend provides release-related vessel position/timestamp and verification fields.

12. Attribution
interface AttributionViewModel {
  overallScore: number | null;

  proximityScore: number | null;
  temporalScore: number | null;
  slowdownScore: number | null;
  loiterScore: number | null;
  approachScore: number | null;
  departureScore: number | null;

  closestDistanceKm: number | null;
  minimumEventSpeedKnots: number | null;

  trajectoryCorrelation: number | null;

  verification: VerificationViewModel | null;

  explanation: string[];
}

The backend's granular attribution metrics are specifically identified in the audit as valuable but currently underused.

13. Verification
interface VerificationViewModel {
  withinBacktrackRadius: boolean | null;
  culpritPositionTimestamp: string | null;
  originToCulpritDistanceKm: number | null;
  timestampNearestAisPoint: string | null;
  timestampNearestDistanceFromOriginKm: number | null;
}
UI

This becomes evidence.

Example:

BACKTRACK VERIFICATION

✓ Vessel entered source uncertainty region

Closest distance
4.8 km

Release-time AIS position
14:12 UTC

No "culprit confirmed" language.

14. Environment
interface EnvironmentViewModel {
  wind: EnvironmentVector | null;
  current: EnvironmentVector | null;
}

interface EnvironmentVector {
  speed: number | null;
  direction: number | null;
}

Backend u/v values can remain internal because UI only needs direction/speed for the visual layer.

The authoritative architecture states that backend owns the environmental/scientific calculations and frontend visualizes them.

15. Playback State

This is the heart of Step 3 → Step 4.

type InvestigationMode =
  | "FORWARD"
  | "BACKTRACK";

interface PlaybackState {
  mode: InvestigationMode;

  progress: number;
  currentTimeMs: number;

  isPlaying: boolean;

  releaseEvent: ReleaseEventViewModel | null;
}
16. Forward Mode

Normalized trajectory remains:

Source → P1 → P2 → P3 → Detection

Playback:

progress = 0
      ↓
releaseTime
      ↓
      ↓
      ↓
progress = 1
      ↓
detectionTime

Conceptually:

currentTimeMs =
  releaseTimeMs +
  (detectionTimeMs - releaseTimeMs) * progress;
17. Backtrack Mode

Same trajectory.

Opposite temporal traversal:

Detection → P3 → P2 → P1 → Source

Conceptually:

currentTimeMs =
  detectionTimeMs -
  (detectionTimeMs - releaseTimeMs) * progress;

So:

Same data
+
same clock
+
different traversal direction
18. Oil Movement Gate

This needs to be represented explicitly.

The oil renderer should conceptually receive:

oilTrajectory
currentTime
releaseTime
mode

Then:

Forward

If:

currentTime < releaseTime

then:

Oil = Source Position

When:

currentTime >= releaseTime

then:

Oil = interpolated backend trajectory position
19. Backtrack Oil Behavior

Backtrack starts at detection.

Oil naturally follows:

Detection → historical points → Source

When:

currentTime <= releaseTime

oil reaches/holds at the release/source state.

So:

Forward:
Source → Detection

Backtrack:
Detection → Source

No second oil trajectory.

20. Vessel Position

Vessel position is obtained from its own backend AIS trajectory:

vessel.trajectory
       +
currentTime
       ↓
interpolated AIS position

The frontend may interpolate between known AIS points for smooth animation, which is allowed by the architecture.

It must not create a new route.

21. Dynamic Slowdown Window

This should not become a field like:

slowdownStartIndex: index - 2
slowdownEndIndex: index + 2

That's too implementation-specific and potentially wrong for irregular AIS sampling.

Instead:

interface ReleaseEventContext {
  releaseTimeMs: number;
  vesselId: string;
  relevantTrajectoryPoints: VesselTrajectoryPoint[];
}

The adapter/selector derives the relevant points from the release event and actual AIS timestamps.

Visual intent
      Release Event
           │
     ┌─────┼─────┐
     ↓     ↓     ↓
   prior  event  after
   AIS    AIS    AIS

Then actual speed values determine what is shown.

22. Speed Visualization Rule

If backend:

12 → 10 → 5 → 7 → 11 knots

show:

normal → slowing → minimum → recovering → normal

If backend:

12 → 12 → 12 → 12 → 12

don't create artificial slowdown.

The backend already provides speed telemetry, and the audit notes that the current frontend does not use it.

23. UI State

Separately from scientific data:

interface InvestigationUIState {
  hoveredObject:
    | "DETECTION"
    | "OIL"
    | "SOURCE"
    | "VESSEL"
    | null;

  selectedObject:
    | "DETECTION"
    | "OIL"
    | "SOURCE"
    | "VESSEL"
    | null;

  selectedVesselId: string | null;

  detailPanel:
    | "CLOSED"
    | "INCIDENT"
    | "SOURCE"
    | "VESSEL";
}

This prevents UI interaction state from contaminating backend data models.

24. Camera State
interface CameraState {
  target:
    | "DETECTION"
    | "OIL"
    | "SOURCE"
    | "VESSEL"
    | null;

  targetId?: string;
}

Camera state is purely presentation.

It doesn't alter the investigation model.

25. Final Separation

This is the architecture I want us to preserve:

SCIENTIFIC DATA
────────────────────────
Incident
Detection
Oil polygon
Oil trajectory
Source estimate
AIS trajectory
Attribution
Environment
Release event
        │
        ▼
INVESTIGATION STATE
────────────────────────
Mode
Current time
Progress
Selected vessel
        │
        ▼
PRESENTATION STATE
────────────────────────
Hover
Selection
Panel
Camera
Animations
        │
        ▼
UI / 3D

This separation is extremely important.

26. Complete Field Ownership
Directly visible
spill_id
detected_at
area_km2
confidence_score
estimated_age_hours
estimated_release_time
image_url
source_type

source coordinates
source radius

vessel name
MMSI
IMO
country
ship type
speed
course
heading
rank
score

attribution scores
verification
environment
Used for rendering but not necessarily displayed
polygon
trajectory timestamps
trajectory coordinates
world positions
AIS interpolation data
Internal/debug
runtime_seconds
source_file
raw u/v
internal processing metadata
27. One Important Correction Before Implementation

There is one thing I would not freeze yet as a hard frontend contract:

ReleaseEvent.timestamp

We know the backend exposes release/correlation-related timestamps and vessel position information, but before implementation we should inspect the actual current response shape and establish exactly which field is authoritative for the release event.

The audit tells us these fields exist, but it doesn't justify inventing a new backend field called release_event.timestamp.

So the adapter should eventually say something like:

backend authoritative release field
        ↓
ReleaseEventViewModel.timestamp

—not the frontend deriving a new scientific timestamp.

That's an important distinction.

Step 4 Final Contract

At this point our frontend has four clean layers:

                    API
                     │
                     ▼
              Raw API Types
                     │
                     ▼
          Adapter / Normalizer
                     │
                     ▼
        InvestigationViewModel
                     │
        ┌────────────┼─────────────┐
        ↓            ↓             ↓
     3D Scene     Detail UI     Evidence UI
                     │
                     ↓
              Playback State
                     │
                     ▼
            Shared Investigation Clock

And the most important new capability from our discussion is now formally represented:

Rank-1 Vessel AIS
       +
Release Event
       +
Actual Speed History
       +
Oil Trajectory
       +
Shared Investigation Clock
       ↓
Forward / Backtrack reconstruction

Step 4 complete.

Ab humare paas UI design + backend mapping + interaction/state architecture + frontend data contract — chaaron freeze ho gaye hain.

Next logical step: Step 5

Ab hum actual existing frontend structure ko compare karenge:

Current codebase → required architecture

Yaani identify karenge:

kaunse existing files/components retain karne hain
kaunse modify honge
kaunse new adapter/state files chahiye
current timeline mein kya change hoga
current vessel component mein kya change hoga
oil polygon kahan integrate hoga
hover/panel system kahan add hoga
Forward/Backtrack controls kahan fit honge
aur sabse important, backend APIs ko exactly kis sequence mein consume karna hai

Uske baad hi main tumhe Antigravity ke liye final production-grade implementation prompt dunga.

okay move to step  5 

Bilkul. Step 5 ab actual existing architecture ko dekhkar plan banayega, generic greenfield architecture nahi. Maine tumhare current audit, authoritative FINAL plan, aur pehle discuss ki hui UI/state requirements ko saath mein compare kiya hai.

Sabse important conclusion pehle:

Humein existing project rebuild nahi karna hai. Existing 3D foundation, API/service layer, context, coordinate system, timeline aur vessel/AIS infrastructure ko preserve karke controlled refactor karna hai. Authoritative plan bhi explicitly existing completed work preserve karne ko kehta hai.

STEP 5 — Current Codebase → Target Architecture
1. Current Architecture

Audit ke according current system already roughly ye hai:

                    Backend APIs
                         │
                         ▼
                   apiClient.ts
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        spillService.ts       trajectoryApi.ts
              │                     │
              ↓                     ↓
 reconstructionResolver     trajectoryAdapter
              │                     │
              ↓                     ↓
       IncidentContext       Maritime Map state
              │
              ▼
       SimulationContext
              │
              ▼
        3D Scene Components

2D Maritime Map separately:

MaritimeMap.tsx
      ↓
useSpills
useSpillTrajectory
useSpillAttribution
      ↓
spillAdapter
trajectoryAdapter
vesselAdapter
      ↓
Deck.GL

Audit explicitly confirms these two pipelines currently coexist.

2. What We Should NOT Do
❌ Don't merge the entire 2D and 3D codebase

They have different rendering responsibilities.

❌ Don't rebuild Incident Reconstruction

The 3D foundation already exists.

❌ Don't replace SimulationContext

It already has the bidirectional concept we need.

❌ Don't create a second timeline engine

We need to extend the existing one.

❌ Don't create another API layer

Use existing services and expand them where necessary.

❌ Don't let components consume raw backend JSON

The authoritative architecture explicitly requires:

API → Service → Adapter → Frontend Types → Context → Components

3. Preserve These Existing Files

These are valuable existing pieces.

Existing file	Decision
SimulationContext.tsx	🟢 Preserve + extend
IncidentContext.tsx	🟢 Preserve + extend
reconstructionResolver.ts	🟢 Preserve + expand
types/api.ts	🟢 Expand
coordinates.ts	🟢 Preserve
trajectory.ts	🟢 Preserve + extend carefully
vesselTrack.ts	🟢 Preserve + extend carefully
IncidentScene.tsx	🟢 Preserve
SceneCamera.tsx	🟢 Preserve
SceneLighting.tsx	🟢 Preserve
AISTrack.tsx	🟢 Preserve
IncidentMarker.tsx	🟢 Preserve
SourceEstimate.tsx	🟢 Preserve
Timeline.tsx	🟡 Refactor
VesselModel.tsx	🟡 Refactor
OilSpill.tsx	🟡 Refactor
SimulationHUD.tsx	🟡 Refactor
CandidateVesselPanel.tsx	🟡 Refactor
IncidentInfoPanel.tsx	🟡 Refactor
EnvironmentPanel.tsx	🟡 Refactor

This aligns closely with the existing preservation/refactor assessment in your audit material.

4. reconstructionResolver.ts Becomes Very Important

Currently this is already the normalization boundary.

Audit says it currently drops/underuses things like:

country
vessel_type
shiptype_name
speed
course
heading
verification

while some of those are available from backend.

So we don't replace the resolver.

We expand it:

Raw API
   ↓
reconstructionResolver.ts
   ↓
Complete normalized reconstruction data

It should become the single place where backend-specific naming gets converted to frontend domain terminology.

5. types/api.ts

Current types need expansion.

Specifically:

VesselCandidate
    ↓
+ speed
+ course
+ heading
+ country
+ vesselType
+ shipTypeName
+ timeDifference
+ trajectoryCorrelation

And:

Verification
    ↓
withinBacktrackRadius
culpritPositionTimestamp
originToCulpritDistance
nearestAIS...

The audit explicitly identifies these as missing/untyped/dropped fields.

6. New Domain Types

Rather than making api.ts responsible for UI concepts, create normalized domain types.

Recommended:

src/types/
├── api.ts
├── incident.ts
├── trajectory.ts
├── vessel.ts
├── attribution.ts
├── environment.ts
└── investigation.ts
Why?

Because:

Backend field names
      ≠
Frontend UI concepts

For example:

estimated_source_radius_km
        ↓
uncertaintyRadiusKm

That's a domain transformation.

7. InvestigationViewModel

Create one composed model:

InvestigationViewModel
│
├── incident
├── detection
├── oilSlick
├── source
├── oilTrajectory
├── vessels
├── attribution
├── environment
└── releaseEvent

Then UI doesn't care whether information came from:

/spills/{id}
/backtrack
/vessels
/visualization
/attribution/trajectory

That complexity stays behind the adapter/service layer.

8. API Layer

Current available APIs from the authoritative plan include:

GET  /api/v1/demo/spills
GET  /api/v1/demo/spills/{spill_id}
POST /api/v1/demo/spills/{spill_id}/backtrack
GET  /api/v1/demo/spills/{spill_id}/vessels

and the current audit additionally confirms the visualization and attribution-trajectory endpoints are already consumed.

So don't invent another endpoint unless the actual backend requires it.

9. Recommended Fetch Flow

For one selected incident:

spillId
  ↓
Incident data
  ↓
Backtrack / reconstruction data
  ↓
Visualization trajectory + environment
  ↓
Candidate vessels
  ↓
Attribution trajectory / verification
  ↓
Adapter
  ↓
InvestigationViewModel

Then:

InvestigationViewModel
        ↓
IncidentContext
        ↓
SimulationContext
        ↓
Scene + UI
10. SimulationContext.tsx

This is one of the most valuable existing assets.

Audit confirms that the 3D context already supports:

direction:
  FORWARD
  BACKTRACK

and computes the current timestamp differently according to direction.

Therefore:

Don't create:
ForwardSimulationContext
BacktrackSimulationContext

Instead:

SimulationContext
       +
direction

Exactly what we discussed.

11. Extend SimulationContext

It should conceptually own:

SimulationContext
│
├── mode
├── progress
├── currentTimeMs
├── isPlaying
├── startTimeMs
├── endTimeMs
├── releaseEvent
│
├── oilPosition
├── vesselPositions
│
└── selectedVesselId

But calculated positions shouldn't necessarily be stored as React state every frame. Your audit warns about the 60 FPS rendering loop versus throttled React updates.

So:

Three.js frame loop
       ↓
mutable refs
       ↓
smooth animation

React state
       ↓
throttled UI updates

This is important for performance.

12. Timeline.tsx

Current timeline structure should stay.

But it needs three major changes.

Change 1

Two explicit modes:

[ Forward Reconstruction ]
[ Backtrack to Source ]
Change 2

Mode-dependent labels.

Forward:

RELEASE ─────────────── DETECTION

Backtrack:

DETECTION ───────────── SOURCE
Change 3

Release milestone.

● Detection
│
│
● Release Event
│
│
● Probable Source

The audit already identifies the missing culprit/release timestamp milestone as a gap.

13. OilSpill.tsx

This is one of the main refactor targets.

Current
area_km2
   ↓
48-point procedural wobble
   ↓
fake circular oil patch
Required
backend polygon
      ↓
normalizer
      ↓
OilSpill
      ↓
actual irregular geometry

The audit explicitly identifies this current procedural override.

14. Oil Animation

OilSpill should no longer own the investigation clock.

Instead:

SimulationContext
      ↓
currentTime
      ↓
OilSpill
      ↓
position / visual state

And:

currentTime < releaseTime
        ↓
Oil stays at source/release position

currentTime >= releaseTime
        ↓
Oil follows backend trajectory

This is the requirement we added during this conversation.

15. OilTrajectory.tsx

Preserve the component, but make it consume normalized trajectory.

oilTrajectory[]
      ↓
currentTime
      ↓
visible historical path

Forward:

Source → Detection

Backtrack:

Detection → Source

The underlying array remains chronological.

16. VesselModel.tsx

Current vessel movement is already synchronized with timeline.

So preserve the movement architecture.

Add:

AIS trajectory
+
speed
+
course
+
heading
+
release context
Selected rank-1 vessel

Detailed GLB/procedural model.

Other candidates

Lightweight representation.

This is consistent with the authoritative plan.

17. Rank-1 Slowdown Feature

This becomes a visualization layer, not a new physics system.

Flow:

Release Event
      ↓
Rank-1 vessel trajectory
      ↓
Find temporal neighborhood
      ↓
Read actual backend speed
      ↓
Visualize observed speed variation

Not:

Release Event
      ↓
Frontend invents speed reduction

The backend already provides speed telemetry.

And we should avoid hardcoding exactly ±2 array indexes; use the actual timestamps/trajectory sampling.

18. AISTrack.tsx

Keep it.

But its state should come from:

selectedVessel
      ↓
selectedVessel.trajectory
      ↓
AIS track

When rank-1 selected:

highlight

Others:

muted
19. SourceEstimate.tsx

Keep the existing source visualization.

Enhance:

source coordinates
+
radius_km
+
estimated release timestamp

Current audit says the radius already exists visually but is omitted from the main information card.

So this is a small enhancement, not a rebuild.

20. IncidentMarker.tsx

Preserve.

It becomes the dedicated:

Detection marker

with:

hover
click
camera focus

No need to replace it.

21. New Interaction Layer

We need a small UI interaction abstraction rather than putting hover logic into every 3D component.

Conceptually:

useInvestigationInteraction
│
├── hoveredObject
├── selectedObject
├── selectedVessel
├── detailPanel
└── cameraTarget

Then:

OilSpill
   ↓
onHover("OIL")
onSelect("OIL")

and:

Vessel
   ↓
onHover("VESSEL")
onSelect("VESSEL")

This keeps the components clean.

22. New Detail Panel

Current panels exist, so don't throw them away.

Instead create a composition layer:

ReconstructionSidebar
│
├── IncidentInfoPanel
├── SourceEstimateCard
├── CandidateVesselPanel
├── EnvironmentPanel
└── contextual detail

The audit already identified these components as existing pieces.

23. Bottom Evidence Dock

Existing:

IncidentAnalysisDock

is a good place for the richer information.

Use:

IncidentAnalysisDock
│
├── Incident Overview
├── Satellite Observation
├── Source Reconstruction
├── Attribution Evidence
└── Environment

This matches the progressive-disclosure UX we finalized.

24. Satellite Imagery

Current:

SatelliteImageryPanel
       ↓
constructs ArcGIS URL

Required:

image_url
   ↓
SatelliteImageryPanel

The audit explicitly identifies bypassing the authoritative backend image_url as a current gap.

ArcGIS can remain a fallback only if the application explicitly needs one.

25. Attribution

Current:

aggregate score

Target:

overall score
+
proximity
+
temporal
+
slowdown
+
loiter
+
approach
+
departure
+
verification

The audit says granular attribution currently exists in backend but is underutilized in the live 3D experience.

26. Environment

Current environment system is already useful.

Preserve:

WindIndicator
CurrentIndicator
EnvironmentPanel

Only ensure:

        ↓
normalizer
        ↓
visualization

u/v remain internal.

27. Camera

Preserve:

SceneCamera

Add interaction-driven target:

Detection
Oil
Source
Vessel

with smooth fly-to.

No scientific state should depend on camera position.

28. Final File-Level Plan
🟢 PRESERVE
SimulationContext.tsx
IncidentContext.tsx
coordinates.ts
trajectory.ts
vesselTrack.ts
IncidentScene.tsx
SceneCamera.tsx
SceneLighting.tsx
AISTrack.tsx
IncidentMarker.tsx
SourceEstimate.tsx
EnvironmentIndicators/*
🟡 REFACTOR
reconstructionResolver.ts
types/api.ts
Timeline.tsx
OilSpill.tsx
OilTrajectory.tsx
VesselModel.tsx
SimulationHUD.tsx
CandidateVesselPanel.tsx
IncidentInfoPanel.tsx
EnvironmentPanel.tsx
SatelliteImageryPanel.tsx
IncidentAnalysisDock.tsx
🟢 EXISTING API/SERVICE — EXTEND
apiClient.ts
spillService.ts
trajectoryApi.ts
attributionApi.ts
🆕 ADD
types/investigation.ts
types/attribution.ts
types/vessel.ts
types/trajectory.ts

adapters/investigationAdapter.ts
adapters/attributionAdapter.ts

hooks/useInvestigationInteraction.ts

components/incident/
    ReconstructionSidebar.tsx
    HoverCard.tsx
    ReleaseEventMarker.tsx
    AttributionEvidence.tsx

Exact file names can be adapted to the existing folder conventions rather than blindly creating duplicates.

29. The New Data Flow

Final architecture:

                  BACKEND
                     │
       ┌─────────────┼──────────────┐
       ↓             ↓              ↓
    Spill API    Trajectory API   Vessel API
       │             │              │
       └─────────────┼──────────────┘
                     ↓
                API Services
                     ↓
                API Types
                     ↓
              Adapter / Resolver
                     ↓
          InvestigationViewModel
                     ↓
              IncidentContext
                     ↓
             SimulationContext
                     ↓
              Investigation Clock
                     │
        ┌────────────┼─────────────┐
        ↓            ↓             ↓
       OIL         VESSEL       TIMELINE
        ↓            ↓             ↓
   Polygon +     AIS + Speed    Direction
   trajectory    + heading      + milestones
        │            │             │
        └────────────┼─────────────┘
                     ↓
              Investigation UI
30. What Happens to the 2D Maritime Map?

We don't touch it unnecessarily right now.

The audit found that 2D and 3D currently have different pipelines.

For this particular work, focus first on the Incident Reconstruction experience.

Later, we can make both consume the same normalized domain model where beneficial.

The authoritative plan itself places synchronized 2D/globe integration as a later phase.

31. Implementation Order After Step 5

Now we have enough information to implement safely.

I would use this order:

01
Expand API Types
        ↓
02
Expand Resolver / Adapters
        ↓
03
Build InvestigationViewModel
        ↓
04
Extend SimulationContext
        ↓
05
Implement Forward / Backtrack
        ↓
06
Implement Release Event synchronization
        ↓
07
Fix Oil Polygon
        ↓
08
Synchronize Oil + Vessel
        ↓
09
Add actual vessel telemetry / slowdown visualization
        ↓
10
Upgrade Timeline + milestones
        ↓
11
Hover + Click interactions
        ↓
12
Right Detail Panel
        ↓
13
Bottom Evidence Dock
        ↓
14
Attribution breakdown
        ↓
15
Satellite image_url
        ↓
16
Final UX + performance validation

This also respects the existing audit's recommended staged order of types → adapters → HUD/panels → forensic visualization → timeline → advanced evidence.

32. One Important Performance Rule

Tumhari new hover/panel/attribution requirements ke saath ye especially important hai:

3D animation 60 FPS par chale, React UI har frame rerender na ho.

60 FPS
  ↓
Three.js / mutable refs
  ↓
ship + oil + camera

5–15 FPS / event-based
  ↓
React state
  ↓
HUD + panels + charts

Audit explicitly warns that heavy React DOM/Recharts updates tied directly to rapid simulation progress can cause frame drops.

33. One More Critical Rule — Coordinate System

Existing 3D world origin:

observation
     ↓
(0, 0, 0)

Do not change this casually.

The audit identifies this as a critical coupling: changing/re-centering the coordinate reference can detach oil, source, vessel and AIS meshes.

So:

Detection/Observation
        ↓
fixed scene origin
        ↓
all lat/lon converted relative to it

Source is not the new world origin.

34. Final Decision After Step 5

We are not creating a new Incident Reconstruction application.

We're evolving the current one:

CURRENT
──────────────────────
Existing 3D foundation
        +
Existing API integration
        +
Existing timeline
        +
Existing vessel/AIS
        +
Existing source/ocean

into:

TARGET
──────────────────────
Existing foundation
        +
Complete backend data
        +
Normalized investigation model
        +
True Forward mode
        +
True Backtrack mode
        +
Release-event synchronization
        +
Actual AIS telemetry
        +
Authentic oil polygon
        +
Hover/click UX
        +
Evidence dock
        +
Attribution breakdown

This is the right approach because your current project already has most of the difficult infrastructure; the audit's core conclusion is that the major issue is data under-consumption and temporal/design mismatch, not that the whole architecture is wrong.

