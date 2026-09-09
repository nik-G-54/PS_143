# Ocean Sentinel

Interactive 3D oil-spill incident reconstruction prototype, inspired by the supplied maritime investigation reference. Built with HTML, CSS, JavaScript and native WebGL. No framework, CDN, installation, network request, external model or API key is required.

## Run

Open `index.html` in a modern browser with WebGL enabled. The separate `Ocean-Sentinel.html` download is the same standalone application. Use a desktop browser for the best investigation experience. If an embedded preview restricts WebGL, downloads or fullscreen, open the downloaded HTML directly.

## Controls

- Drag the timeline to synchronize vessel position, course, historical AIS track and reconstructed oil track.
- Play/pause; restart; select 0.5×, 1×, 2× or 4×. A full reconstruction lasts 45 seconds at 1×.
- Jump to vessel approach, possible release or observation.
- Drag the ocean to orbit; Shift-drag/right-drag to pan; scroll to zoom.
- Touch: one finger orbits; two fingers pan/pinch zoom.
- Focus the canvas: arrow keys orbit; + / - zoom.
- Perspective, Top and Low camera presets; reset; fullscreen.
- Scene layers: oil, vessel, environmental arrows, full-path context, grid, labels, waves.
- On desktop, the right evidence/layer panel scrolls independently. The sidebar Layers icon jumps directly to layer controls.
- Export session downloads the synthetic input data, selected UTC time, camera and layer state as JSON. Session re-import is not implemented.

## Evidence semantics

This is a **synthetic demonstration**, not a scientific reconstruction or operational attribution tool.

- Observation and source estimate have different markers and timestamps.
- The oil track is supplied demonstration data, not calculated from wind/current.
- A moving ring denotes a reconstructed oil position before detection. The dark irregular slick appears only at the observation time; earlier footprints are not invented.
- Dashed paths show full-window context, including future positions relative to the playhead. Solid paths show positions up to the playhead. Disable context for a past-only view.
- The tanker follows time-interpolated AIS points and rotates by segment course. Its geometry and wave scale are exaggerated for legibility.
- Source-time proximity is shown as illustrative association, never proof of responsibility. No confidence scores are calculated.
- Ocean elevation, markers, tracks and slick use the same procedural wave-height function; tiny render offsets prevent depth flicker. Wave animation is visual and independent of reconstruction time.
- Environmental values are illustrative constants; no bathymetry, weather service, satellite product or hydrodynamic engine is connected.

## Files and development

- `index.html`: prebuilt standalone application.
- `template.html`: semantic interface and placeholders for inline assets.
- `style.css`: dark responsive investigation interface.
- `app.js`: data, temporal interpolation, native WebGL meshes/shaders, camera, interactions and export.
- `demo-data.json`: example timestamped incident and AIS data.
- `build.py`: regenerates index.html from editable sources. Run `python build.py` after editing.
- `qa-results.json`: automated prototype checks, tested in Chromium at desktop and mobile dimensions.

## Connecting real data later

The current scene is an illustrative local Cartesian frame (x east, z south), **not georeferenced**. Changing only the latitude/longitude in the UI will not reposition the scene correctly.

For production integration:
1. Define a metric local tangent-plane or suitable map projection for all incident, AIS and model coordinates.
2. Replace `DATA`, `START` and `DURATION` in app.js with validated UTC timestamps and consistently projected waypoints. Tracks must be strictly chronological; interpolation must not bridge unapproved data gaps.
3. Replace the hardcoded demonstration slick in `slickMesh()` with the observed footprint geometry. Replace the source encounter connector and bound the ocean/camera from actual data.
4. Bind the static incident labels, timeline ticks, event shortcuts and environmental panels in template.html to the real record. They are deliberately demo-specific in this prototype.
5. Add provenance, missing-data states, uncertainties, release-time windows and verified candidate identities. Do not turn proximity into automatic blame.
6. Add data loading, validation, error handling and any server-side model/API integration separately. There is no real-data import UI in this version.

This delivery is an editable working frontend prototype, not a deployed hosted service.
