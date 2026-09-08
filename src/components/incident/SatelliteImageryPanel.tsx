import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Activity, Map as MapIcon, Maximize2, ImageIcon } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { MAP_CONFIG } from '../../features/maritime-map/map/mapConfig';
import { useInteraction } from '../../pages/IncidentReconstructionPage';
import { computeTrajectoryStats } from '../../utils/trajectoryStats';
import { DiagnosticPlotViewer } from '../common/DiagnosticPlotViewer';
import { useDiagnosticPlot } from '../../services/diagnosticPlotService';

maplibregl.setWorkerUrl(workerUrl);

function buildEsriExportUrl(lat: number, lng: number, padDeg = 0.08) {
  const minLon = lng - padDeg;
  const minLat = lat - padDeg * 0.75;
  const maxLon = lng + padDeg;
  const maxLat = lat + padDeg * 0.75;
  const params = new URLSearchParams({
    bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
    bboxSR: '4326',
    imageSR: '4326',
    size: '900,560',
    format: 'jpg',
    f: 'image',
  });
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params.toString()}`;
}

export const SatelliteImageryPanel: React.FC = () => {
  const { spillId, spillDetails, backtrackData } = useIncident();
  const { setDrawerContent } = useInteraction();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [activeTab, setActiveTab] = useState<'diagnostic' | 'map'>('diagnostic');
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const { plotUrl } = useDiagnosticPlot(spillId, spillDetails?.image_url);

  const lat =
    backtrackData?.backtrack.observation.latitude ??
    spillDetails?.centroid?.latitude ??
    spillDetails?.centroid?.lat ??
    null;
  const lng =
    backtrackData?.backtrack.observation.longitude ??
    spillDetails?.centroid?.longitude ??
    spillDetails?.centroid?.lon ??
    null;
  const detectedAt =
    backtrackData?.backtrack.observation.timestamp ?? spillDetails?.detected_at ?? null;

  const stats = useMemo(
    () => computeTrajectoryStats(backtrackData?.backtrack.trajectory, 5),
    [backtrackData]
  );

  const staticImageUrl = useMemo(() => {
    if (lat == null || lng == null) return null;
    const pad =
      stats && stats.totalDistanceKm > 0
        ? Math.max(0.05, Math.min(0.25, (stats.totalDistanceKm / 111) * 1.4))
        : 0.08;
    return buildEsriExportUrl(lat, lng, pad);
  }, [lat, lng, stats]);

  // Interactive map layer
  useEffect(() => {
    if (activeTab !== 'map') return;
    if (!containerRef.current || lat == null || lng == null) return;

    let cancelled = false;
    setReady(false);
    setMapError(false);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styles.satellite.dark,
      center: [lng, lat],
      zoom: 11.2,
      attributionControl: false,
      interactive: true,
    });
    mapRef.current = map;

    const onLoad = () => {
      if (cancelled) return;

      requestAnimationFrame(() => {
        map.resize();
      });

      new maplibregl.Marker({ color: '#ef4444' }).setLngLat([lng, lat]).addTo(map);

      const src = backtrackData?.backtrack.source_estimate;
      if (src && typeof src.latitude === 'number' && typeof src.longitude === 'number') {
        new maplibregl.Marker({ color: '#22c55e' }).setLngLat([src.longitude, src.latitude]).addTo(map);
      }

      const traj = backtrackData?.backtrack.trajectory;
      if (traj && traj.length > 1) {
        map.addSource('oil-track', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: traj.map((p) => [p.longitude, p.latitude]),
            },
          },
        });
        map.addLayer({
          id: 'oil-track-line',
          type: 'line',
          source: 'oil-track',
          paint: {
            'line-color': '#f97316',
            'line-width': 3,
            'line-opacity': 0.95,
          },
        });

        const bounds = new maplibregl.LngLatBounds();
        traj.forEach((p) => bounds.extend([p.longitude, p.latitude]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 12.5, duration: 0 });
      }

      stats?.milestones.forEach((m) => {
        const el = document.createElement('div');
        el.className = 'sat-time-marker';
        el.innerHTML = `<div style="
          background:rgba(15,23,42,0.92);
          border:1px solid ${m.isStart ? '#34d399' : m.isEnd ? '#f87171' : '#fbbf24'};
          color:${m.isStart ? '#6ee7b7' : m.isEnd ? '#fca5a5' : '#fcd34d'};
          font:700 9px/1.2 ui-monospace,monospace;
          padding:3px 6px;border-radius:4px;white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.45);
        ">${m.isStart ? 'RELEASE' : m.isEnd ? 'OBS' : m.label}<div style="color:#e2e8f0;font-weight:500;font-size:8px">${m.timeLabel} · ${m.distanceFromStartKm.toFixed(1)}km</div></div>`;
        new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.longitude, m.latitude])
          .addTo(map);
      });

      setReady(true);
    };

    map.on('load', onLoad);
    map.on('error', () => {
      if (!cancelled) setMapError(true);
    });

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [activeTab, lat, lng, backtrackData, stats]);

  const openExpanded = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm">
        <div className="overflow-hidden rounded-xl border border-border bg-[#020813] p-2 flex items-center justify-center">
          <img
            src={plotUrl}
            alt={`Drift diagnostic plot for ${spillId}`}
            className="max-h-[60vh] w-full object-contain select-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-muted-foreground block text-[9px] tracking-wider mb-0.5">INCIDENT</span>
            {spillId}
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px] tracking-wider mb-0.5">RESOLUTION</span>
            1600 × 1440 px
          </div>
          {lat != null && lng != null && (
            <>
              <div>
                <span className="text-muted-foreground block text-[9px] tracking-wider mb-0.5">LAT</span>
                {lat.toFixed(4)}°
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] tracking-wider mb-0.5">LON</span>
                {lng.toFixed(4)}°
              </div>
            </>
          )}
          {stats && (
            <>
              <div>
                <span className="text-muted-foreground block text-[9px] tracking-wider mb-0.5">
                  PATH
                </span>
                {stats.totalDistanceKm.toFixed(1)} km
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] tracking-wider mb-0.5">
                  DURATION
                </span>
                {stats.durationLabel}
              </div>
            </>
          )}
        </div>
      </div>,
      `Diagnostic Plot · ${spillId}`
    );
  };

  return (
    <div className="h-full flex flex-col bg-card/90 border border-border rounded-lg overflow-hidden min-h-0">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={13} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold tracking-wider text-foreground truncate uppercase">
              DRIFT DIAGNOSTIC
            </h3>
            <p className="text-[9px] font-mono text-muted-foreground truncate">
              AUTHORITATIVE SOLUTION · {spillId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tab Switcher */}
          <div className="flex rounded-md border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('diagnostic')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition-colors ${
                activeTab === 'diagnostic'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity size={10} />
              <span>Plot</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition-colors ${
                activeTab === 'map'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapIcon size={10} />
              <span>Map</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openExpanded}
            className="p-1.5 rounded border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
            title="Expand Full Diagnostic"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[200px] bg-[#020813] overflow-hidden">
        {activeTab === 'diagnostic' ? (
          <div className="h-full w-full p-2 flex items-center justify-center">
            <DiagnosticPlotViewer
              spillId={spillId}
              fallbackUrl={spillDetails?.image_url}
              alt={`Diagnostic plot for ${spillId}`}
              containerClassName="h-full w-full border-0 bg-transparent"
              badgeText="Authoritative Diagnostic"
            />
          </div>
        ) : (
          <>
            {lat == null || lng == null ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <ImageIcon size={14} /> Waiting for coordinates…
              </div>
            ) : (
              <>
                {staticImageUrl && !imgError && (
                  <img
                    src={staticImageUrl}
                    alt="Spill area satellite imagery"
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                      ready && !mapError ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                )}

                <div
                  ref={containerRef}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    ready && !mapError ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                />

                {!imgLoaded && !ready && !imgError && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-[#0a1628]/80 z-10">
                    Loading satellite image…
                  </div>
                )}

                {imgError && mapError && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-destructive z-10 px-4 text-center">
                    Satellite imagery unavailable. Coordinates: {lat.toFixed(3)}, {lng.toFixed(3)}
                  </div>
                )}

                {stats && (!ready || mapError) && imgLoaded && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {stats.milestones.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="0.8"
                        strokeDasharray="2 1.2"
                        points={stats.milestones
                          .map((m, _i, arr) => {
                            const lats = arr.map((x) => x.latitude);
                            const lons = arr.map((x) => x.longitude);
                            const minLat = Math.min(...lats);
                            const maxLat = Math.max(...lats);
                            const minLon = Math.min(...lons);
                            const maxLon = Math.max(...lons);
                            const pad = 0.12;
                            const x =
                              ((m.longitude - minLon) / Math.max(maxLon - minLon, 1e-6)) *
                                (100 - 200 * pad) +
                              100 * pad;
                            const y =
                              (1 - (m.latitude - minLat) / Math.max(maxLat - minLat, 1e-6)) *
                                (100 - 200 * pad) +
                              100 * pad;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    )}
                  </svg>
                )}

                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2 pointer-events-none z-10">
                  <div className="px-2 py-1 rounded bg-black/70 backdrop-blur border border-white/10 text-[9px] font-mono text-white/90 space-y-0.5">
                    <div>
                      {lat.toFixed(3)}°{lat >= 0 ? 'N' : 'S'} · {lng.toFixed(3)}°
                      {lng >= 0 ? 'E' : 'W'}
                    </div>
                    {stats && (
                      <div className="text-amber-200">
                        {stats.totalDistanceKm.toFixed(1)} km · {stats.durationLabel}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {detectedAt && (
        <div className="px-3 py-1.5 border-t border-border text-[9px] font-mono text-muted-foreground flex justify-between shrink-0 bg-muted/20">
          <span>SOLUTION SOURCE</span>
          <span className="text-foreground">
            HYDRODYNAMIC DRIFT DIAGNOSTIC
          </span>
        </div>
      )}
    </div>
  );
};
