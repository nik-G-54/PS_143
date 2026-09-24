import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EvidenceReportInput, ReportData, ReportStep } from './buildEvidenceReport';

// Staged, intent-driven preparation of the PDF evidence report, so a click on
// "Report" is usually an instant download instead of a wait:
//
//   stage 0  spill clicked (browsing)        → nothing
//   stage 1  dwell ≥ 3 s / investigation on  → light data: forecast + AIS tracks
//                                               (small JSON the map reuses anyway,
//                                               via the shared request cache)
//   stage 2  dossier open / Report hovered   → SAR image, then build the PDF in
//                                               browser idle time
//   click                                    → instant if ready, otherwise a
//                                               non-blocking in-place build
//
// Guard rails: work for a spill is cancelled when the selection changes; only
// the current spill's PDF is kept; background stages are skipped on Data
// Saver / slow connections (the click still works, on demand); the PDF build
// never runs while the map is animating (timeline playback, vessel reveal).
//
// The generator module (and jsPDF) is only imported once stage 1 is reached,
// so pure browsing never downloads it.

const DWELL_MS = 3000;
/** Let an opening transition (e.g. the dossier's) finish before building. */
const BUILD_SETTLE_MS = 1000;

export type ReportStatus = 'idle' | 'preparing' | 'ready' | 'generating';

export interface ReportPreparation {
  status: ReportStatus;
  /** What an in-progress click is waiting on, for the button's inline label. */
  stepLabel: string | null;
  /** Transient confirmation after a download (or failure), for a toast. */
  notice: { text: string; tone: 'ok' | 'warn' } | null;
  download: () => void;
  /** Call on hover/focus of a Report button — strong intent (stage 2). */
  noteIntent: () => void;
}

const STEP_LABEL: Record<ReportStep, string> = {
  tracks: 'Fetching AIS tracks',
  forecast: 'Fetching forecast',
  image: 'Fetching SAR image',
  build: 'Building PDF',
};

function constrainedConnection(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

function whenIdle(fn: () => void): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout: 4000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}

type ReportModule = typeof import('./buildEvidenceReport');
let modulePromise: Promise<ReportModule> | null = null;
const loadModule = () => (modulePromise ??= import('./buildEvidenceReport'));

export function useReportPreparation(options: {
  input: EvidenceReportInput | null;
  /** Investigation under way (backtrack armed, dossier open…) — counts as stage 1 without waiting for the dwell. */
  engaged: boolean;
  /** Dossier open — stage 2. */
  evidenceOpen: boolean;
  /** Map animating — hold any background PDF build until it's done. */
  mapBusy: boolean;
}): ReportPreparation {
  const { input, engaged, evidenceOpen, mapBusy } = options;
  const spillId = input?.spill.spillId ?? null;

  const [dwelled, setDwelled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [status, setStatus] = useState<ReportStatus>('idle');
  const [stepLabel, setStepLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<ReportPreparation['notice']>(null);
  /** Bumped when background collection lands, to trigger the idle build. */
  const [dataVersion, setDataVersion] = useState(0);

  const inputRef = useRef(input);
  inputRef.current = input;
  const abortRef = useRef<AbortController | null>(null);
  const dataRef = useRef<{ key: string; data: ReportData } | null>(null);
  const blobRef = useRef<{ key: string; blob: Blob } | null>(null);
  const generatingRef = useRef(false);

  // Anything that changes the report's content invalidates a prepared PDF.
  const contentKey = useMemo(() => {
    if (!input) return null;
    const tracks = input.attribution?.vessels.reduce((n, v) => n + v.track.length, 0) ?? 0;
    return [
      input.spill.spillId,
      input.trajectory?.points.length ?? 0,
      input.attribution?.vessels.length ?? 0,
      tracks,
      input.forecast ? input.forecast.points.length : 0,
      input.coastline ? 1 : 0,
      input.spills.length,
    ].join('|');
  }, [input]);

  // New spill: cancel everything for the old one and restart the dwell clock.
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = spillId ? new AbortController() : null;
    dataRef.current = null;
    blobRef.current = null;
    setDwelled(false);
    setHovered(false);
    setStatus('idle');
    setStepLabel(null);
    if (!spillId) return;
    const t = window.setTimeout(() => setDwelled(true), DWELL_MS);
    return () => window.clearTimeout(t);
  }, [spillId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // A prepared PDF for stale content is dropped (rebuilt below if still wanted).
  useEffect(() => {
    if (blobRef.current && blobRef.current.key !== contentKey) {
      blobRef.current = null;
      if (!generatingRef.current) setStatus('idle');
    }
  }, [contentKey]);

  const stage1 = Boolean(spillId) && (dwelled || engaged || evidenceOpen || hovered);
  const stage2 = Boolean(spillId) && (evidenceOpen || hovered);
  const background = !constrainedConnection();

  // Stage 1 + 2 data collection.
  useEffect(() => {
    if (!background || !stage1 || !contentKey || generatingRef.current) return;
    const current = inputRef.current;
    const signal = abortRef.current?.signal;
    if (!current || !signal) return;
    const key = contentKey;
    let cancelled = false;
    if (stage2) setStatus((s) => (s === 'idle' ? 'preparing' : s));
    loadModule()
      .then((mod) => mod.collectReportData(current, { includeImage: stage2, signal }))
      .then((data) => {
        if (cancelled || signal.aborted) return;
        if (stage2) {
          dataRef.current = { key, data };
          setDataVersion((n) => n + 1);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [background, stage1, stage2, contentKey]);

  // Stage 2 build: once data is in, the map is calm and the browser is idle.
  useEffect(() => {
    if (!stage2 || !background || mapBusy || generatingRef.current) return;
    const prepared = dataRef.current;
    if (!prepared || prepared.key !== contentKey) return;
    if (blobRef.current?.key === contentKey) return;
    let cancelIdle: (() => void) | null = null;
    const settle = window.setTimeout(() => {
      cancelIdle = whenIdle(() => {
        if (generatingRef.current || blobRef.current?.key === contentKey) return;
        loadModule().then((mod) => {
          if (dataRef.current?.key !== contentKey) return;
          blobRef.current = { key: prepared.key, blob: mod.buildReportPdf(prepared.data) };
          setStatus('ready');
        });
      });
    }, BUILD_SETTLE_MS);
    return () => {
      window.clearTimeout(settle);
      cancelIdle?.();
    };
  }, [stage2, background, mapBusy, contentKey, dataVersion]);

  // Transient notices clear themselves.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const download = useCallback(() => {
    const current = inputRef.current;
    if (!current || generatingRef.current) return;
    const id = current.spill.spillId;

    // Instant path.
    if (blobRef.current && blobRef.current.key === contentKey) {
      const blob = blobRef.current.blob;
      loadModule().then((mod) => {
        mod.saveReportBlob(blob, id);
        setNotice({ text: 'Evidence report downloaded', tone: 'ok' });
      });
      return;
    }

    // On-demand path: build in place, UI stays fully usable.
    generatingRef.current = true;
    setStatus('generating');
    const signal = abortRef.current?.signal;
    const key = contentKey;
    (async () => {
      try {
        const mod = await loadModule();
        const data =
          dataRef.current && dataRef.current.key === key
            ? dataRef.current.data
            : await mod.collectReportData(current, {
                includeImage: true,
                signal,
                onStep: (step) => setStepLabel(STEP_LABEL[step]),
              });
        if (signal?.aborted) return;
        setStepLabel(STEP_LABEL.build);
        // Yield a frame so the label paints before the (sub-second) build.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const blob = mod.buildReportPdf(data);
        if (signal?.aborted) return;
        if (key) blobRef.current = { key, blob };
        mod.saveReportBlob(blob, id);
        const names: Record<string, string> = { tracks: 'AIS tracks', forecast: 'forecast', image: 'SAR image' };
        const missing = Object.keys(data.unavailable).map((k) => names[k] ?? k);
        setNotice(
          missing.length
            ? { text: `Report downloaded — ${missing.join(', ')} unavailable (noted in the report)`, tone: 'warn' }
            : { text: 'Evidence report downloaded', tone: 'ok' }
        );
        setStatus('ready');
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          console.error('[useReportPreparation] report generation failed', cause);
          setNotice({ text: 'Report could not be generated — try again', tone: 'warn' });
        }
        setStatus('idle');
      } finally {
        generatingRef.current = false;
        setStepLabel(null);
      }
    })();
  }, [contentKey]);

  const noteIntent = useCallback(() => setHovered(true), []);

  return { status, stepLabel, notice, download, noteIntent };
}
