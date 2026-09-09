'use strict';

/**
 * Incident API Integration Module
 * Real API integration for spill_05b4e0
 * Updates textual incident info, 3D scene labels, timeline and environmental indicators
 */
(function() {
  const SPILL_ID = 'spill_05b4e0';
  const API_URL = `https://naavss.duckdns.org/api/v1/demo/spills/${SPILL_ID}`;

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function parseUtc(isoStr) {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatFullUtc(d) {
    if (!d) return '—';
    const day = d.getUTCDate();
    const mon = MONTHS_SHORT[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${mon} ${year} · ${hh}:${mm} UTC`;
  }

  function formatShortDate(d) {
    if (!d) return '—';
    const day = d.getUTCDate();
    const mon = MONTHS_SHORT[d.getUTCMonth()];
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${mon} · ${hh}:${mm} UTC`;
  }

  function formatHeaderDate(d) {
    if (!d) return '—';
    const day = d.getUTCDate();
    const mon = MONTHS_UPPER[d.getUTCMonth()];
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${mon} · ${hh}:${mm} UTC`;
  }

  function renderIncidentData(data) {
    const detectedDate = parseUtc(data.detected_at);
    const releaseDate = parseUtc(data.estimated_release_time);
    const vesselName = data.ranked_top_vessel || 'SYNTH-Y2019-000097';

    // 1. Heading eyebrow & panel tags
    const eyebrow = document.getElementById('investigation-eyebrow');
    if (eyebrow) eyebrow.textContent = `Investigation / ${data.spill_id || SPILL_ID}`;

    const spillTag = document.getElementById('incident-spill-id');
    if (spillTag) spillTag.textContent = `#${data.spill_id || SPILL_ID}`;

    // 2. Location coordinates
    const coords = document.getElementById('incident-coords');
    if (coords && data.observation_latitude != null && data.observation_longitude != null) {
      coords.textContent = `${Number(data.observation_latitude).toFixed(4)}° N   ${Number(data.observation_longitude).toFixed(4)}° E`;
    }

    // 3. Incident panel fields
    const detected = document.getElementById('incident-detected');
    if (detected) detected.textContent = formatFullUtc(detectedDate);

    const area = document.getElementById('incident-area');
    if (area) area.textContent = data.area_km2 != null ? `${Number(data.area_km2).toFixed(2)} km²` : '—';

    const confidence = document.getElementById('incident-confidence');
    if (confidence) {
      confidence.textContent = data.confidence_score != null ? `${Math.round(Number(data.confidence_score) * 100)}%` : '—';
    }

    const age = document.getElementById('incident-age');
    if (age) age.textContent = data.estimated_age_hours != null ? `${data.estimated_age_hours} h` : '—';

    const release = document.getElementById('incident-release');
    if (release) release.textContent = formatFullUtc(releaseDate);

    const candidates = document.getElementById('incident-candidates');
    if (candidates) candidates.textContent = data.candidate_count != null ? String(data.candidate_count) : '—';

    // 4. Satellite image preview
    const imgContainer = document.getElementById('incident-image-container');
    const img = document.getElementById('incident-image');
    const imgLink = document.getElementById('incident-image-link');
    if (data.image_url && img && imgContainer) {
      img.src = data.image_url;
      if (imgLink) imgLink.href = data.image_url;
      imgContainer.style.display = 'block';
    } else if (imgContainer) {
      imgContainer.style.display = 'none';
    }

    // 5. 3D Scene Viewport Labels
    const sceneKicker = document.getElementById('scene-kicker');
    if (sceneKicker) sceneKicker.textContent = `SOUTH OF CRETE · ${data.spill_id || SPILL_ID}`;

    const sceneTime = document.getElementById('scene-time');
    if (sceneTime) sceneTime.textContent = formatFullUtc(detectedDate);

    const shipLabel = document.getElementById('ship-label');
    if (shipLabel) {
      const b = shipLabel.querySelector('b');
      if (b) b.textContent = vesselName;
      const span = shipLabel.querySelector('span');
      if (span) span.textContent = 'Candidate vessel · AIS position';
    }

    const obsLabel = document.getElementById('obs-label');
    if (obsLabel) {
      const span = obsLabel.querySelector('span');
      if (span) span.textContent = formatShortDate(detectedDate);
    }

    const sourceLabel = document.getElementById('source-label');
    if (sourceLabel) {
      const span = sourceLabel.querySelector('span');
      if (span) span.textContent = `Model estimate · ${formatShortDate(releaseDate)}`;
    }

    // 6. Timeline and event shortcuts
    const currentTime = document.getElementById('current-time');
    if (currentTime) currentTime.textContent = formatHeaderDate(detectedDate);

    const shortcutRelease = document.getElementById('shortcut-release');
    if (shortcutRelease) {
      shortcutRelease.innerHTML = `<b style="color:var(--green)">02 / Possible release</b>${formatShortDate(releaseDate).replace(' UTC', '')}`;
    }

    const shortcutObserved = document.getElementById('shortcut-observed');
    if (shortcutObserved) {
      shortcutObserved.innerHTML = `<b style="color:var(--red)">03 / Spill observed</b>${formatShortDate(detectedDate).replace(' UTC', '')}`;
    }

    // 7. Environment indicators
    const envCurrent = document.getElementById('env-current');
    if (envCurrent) envCurrent.innerHTML = `0.24 <span class="detail">m/s · toward NNW</span>`;

    const envWind = document.getElementById('env-wind');
    if (envWind) envWind.innerHTML = `14.2 <span class="detail">km/h · from SSE</span>`;

    // 8. Update WebGL live data if instance is initialized
    if (window.OceanSentinel && window.OceanSentinel.DATA) {
      window.OceanSentinel.DATA.vessel.name = vesselName;
      if (window.OceanSentinel.updateUI) {
        window.OceanSentinel.updateUI();
      }
    }

    // Hide status banner if present
    const banner = document.getElementById('incident-status-banner');
    if (banner) banner.style.display = 'none';
  }

  function renderFailureState(error) {
    console.error('[Incident API] Failed to fetch incident data for', SPILL_ID, error);

    const eyebrow = document.getElementById('investigation-eyebrow');
    if (eyebrow) eyebrow.textContent = `Investigation / ${SPILL_ID} (Data unavailable)`;

    const banner = document.getElementById('incident-status-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.textContent = 'Incident data unavailable from backend service.';
    }

    const setUnavailable = (id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = 'Data unavailable';
    };

    setUnavailable('incident-detected');
    setUnavailable('incident-area');
    setUnavailable('incident-confidence');
    setUnavailable('incident-age');
    setUnavailable('incident-release');
    setUnavailable('incident-candidates');

    const imgContainer = document.getElementById('incident-image-container');
    if (imgContainer) imgContainer.style.display = 'none';
  }

  async function fetchIncidentData() {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Malformed JSON payload received');
      }
      renderIncidentData(data);
    } catch (err) {
      renderFailureState(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchIncidentData);
  } else {
    fetchIncidentData();
  }
})();