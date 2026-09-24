// PDF evidence report for one spill — the evidence dossier's content plus the
// underlying tables (drift samples, AIS track, forecast points, full candidate
// register with every sub-score, search parameters) and extra charts.
//
// Drawn directly with jsPDF (vector text, lines and shapes — no screenshots),
// so charts stay sharp at any zoom and the file stays small. Every figure is
// read from backend responses; the only derivations are geometry (distance /
// speed between reported positions) and archive counts, same as the dossier.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MapSpill } from '../../types/spillTypes';
import type { SpillEnvironment, SpillTrajectory } from '../../types/trajectoryTypes';
import type { AttributedVessel, SpillAttribution, VesselSubScores } from '../../types/attributionTypes';
import type { SpillForecast } from '../../types/forecastTypes';
import { fetchSpillForecast } from '../../api/forecastApi';
import { adaptSpillForecast } from '../../adapters/forecastAdapter';
import { adaptSpillAttribution } from '../../adapters/vesselAdapter';
import { spillService } from '../../../../services/spillService';
import { DEFAULT_DIAGNOSTIC_PLOT_URL, fetchDiagnosticPlotUrl } from '../../../../services/diagnosticPlotService';
import { haversineKm } from '../../utils/geo';
import { loadCoastline } from '../../config/coastlineConfig';
import {
  ALERT_SEVERITY_LABEL,
  computeDistanceToCoast,
  computeForecastAlertSeverity,
  type CoastlineGeoJSON,
} from '../../utils/coastalAlert';

export interface EvidenceReportInput {
  spill: MapSpill;
  spills: MapSpill[];
  trajectory: SpillTrajectory | null;
  environment: SpillEnvironment | null;
  attribution: SpillAttribution | null;
  forecast: SpillForecast | null;
  coastline: CoastlineGeoJSON | null;
}

/* ------------------------------------------------------------------ */
/* Palette & page geometry                                             */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];
const INK: RGB = [22, 27, 38];
const MUTED: RGB = [98, 108, 124];
const RULE: RGB = [219, 223, 230];
const PANEL: RGB = [246, 247, 250];
const PRIMARY: RGB = [56, 80, 190];
const NAVY: RGB = [14, 22, 42];
const AMBER: RGB = [200, 140, 40];
const GREEN: RGB = [60, 140, 95];
const TEAL: RGB = [36, 160, 150];
const COMPETITORS: RGB[] = [
  [148, 163, 184],
  [200, 150, 62],
  [94, 170, 168],
  [167, 139, 250],
];
const vesselRgb = (i: number): RGB => (i === 0 ? PRIMARY : COMPETITORS[(i - 1) % COMPETITORS.length]);

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16; // side margin
const CONTENT_W = PAGE_W - 2 * M;
const TOP = 24; // below running header
const BOTTOM = PAGE_H - 18; // above running footer

const SIGNALS: { key: keyof VesselSubScores; label: string }[] = [
  { key: 'proximity', label: 'Proximity' },
  { key: 'approach', label: 'Approach' },
  { key: 'temporal', label: 'Timing' },
  { key: 'departure', label: 'Departure' },
  { key: 'loiter', label: 'Loiter' },
  { key: 'slowdown', label: 'Slowdown' },
];

/* ------------------------------------------------------------------ */
/* Formatting (ASCII / WinAnsi-safe for the built-in PDF fonts)        */
/* ------------------------------------------------------------------ */

const UTC_FMT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});
const utc = (ms: number | null | undefined) => (ms == null || !Number.isFinite(ms) ? '-' : `${UTC_FMT.format(ms)} UTC`);
const pct = (v: number | null | undefined) => (v == null ? '-' : `${Math.round(v * 100)}%`);
const num = (v: number | null | undefined, d = 2, unit = '') => (v == null || !Number.isFinite(v) ? '-' : `${v.toFixed(d)}${unit}`);
const latLon = (lon: number | null | undefined, lat: number | null | undefined) =>
  lon == null || lat == null ? '-' : `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
function offset(hours: number | null | undefined): string {
  if (hours == null) return '-';
  const abs = Math.abs(hours);
  if (abs < 1 / 60) return 'at release';
  const mag = abs < 1 ? `${Math.round(abs * 60)} min` : `${abs.toFixed(1)} h`;
  return `${mag} ${hours < 0 ? 'before' : 'after'} release`;
}

function niceStep(range: number, target = 5): number {
  if (!(range > 0)) return 1;
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function niceDomain(min: number, max: number, target = 5): { lo: number; hi: number; step: number } {
  if (min === max) {
    max = min + 1;
    min = Math.min(0, min);
  }
  const step = niceStep(max - min, target);
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
}

function sample<T>(items: T[], maxRows: number): T[] {
  if (items.length <= maxRows) return items;
  const out: T[] = [];
  for (let i = 0; i < maxRows; i += 1) out.push(items[Math.round((i * (items.length - 1)) / (maxRows - 1))]);
  return out;
}

/* ------------------------------------------------------------------ */
/* Document builder                                                    */
/* ------------------------------------------------------------------ */

class Report {
  doc: jsPDF;
  y = TOP;
  private toc: { title: string; page: number }[] = [];

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    this.doc.setFont('helvetica', 'normal');
  }

  color(c: RGB, kind: 'text' | 'draw' | 'fill' = 'text') {
    if (kind === 'text') this.doc.setTextColor(c[0], c[1], c[2]);
    else if (kind === 'draw') this.doc.setDrawColor(c[0], c[1], c[2]);
    else this.doc.setFillColor(c[0], c[1], c[2]);
  }

  font(size: number, style: 'normal' | 'bold' = 'normal', c: RGB = INK) {
    this.doc.setFont('helvetica', style);
    this.doc.setFontSize(size);
    this.color(c);
  }

  alpha(a: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GState = (this.doc as any).GState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.doc as any).setGState(new GState({ opacity: a, 'stroke-opacity': a }));
  }

  newPage() {
    this.doc.addPage();
    this.y = TOP;
  }

  ensure(h: number) {
    if (this.y + h > BOTTOM) this.newPage();
  }

  gap(h = 4) {
    this.y += h;
  }

  paragraph(text: string, size = 9, c: RGB = INK, width = CONTENT_W, x = M) {
    this.font(size, 'normal', c);
    const lines = this.doc.splitTextToSize(text, width) as string[];
    const lh = size * 0.42;
    this.ensure(lines.length * lh + 1);
    this.doc.text(lines, x, this.y + lh * 0.8);
    this.y += lines.length * lh + 1.5;
  }

  section(index: string, title: string, summary: string, source: string) {
    this.ensure(26);
    this.toc.push({ title: `${index}  ${title}`, page: this.doc.getNumberOfPages() });
    this.font(9, 'bold', PRIMARY);
    this.doc.text(index, M, this.y + 5);
    this.font(14, 'bold', INK);
    this.doc.text(title, M + 9, this.y + 5);
    this.font(7, 'normal', MUTED);
    this.doc.text(`Source: ${source}`, PAGE_W - M, this.y + 5, { align: 'right' });
    this.y += 8;
    this.paragraph(summary, 8.5, MUTED);
    this.color(RULE, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.line(M, this.y, PAGE_W - M, this.y);
    this.y += 5;
  }

  subheading(text: string) {
    this.ensure(10);
    this.font(8, 'bold', MUTED);
    this.doc.text(text.toUpperCase(), M, this.y + 3);
    this.y += 6;
  }

  kpis(items: { label: string; value: string; sub?: string; accent?: RGB }[], cols = 3) {
    const gap = 3;
    const w = (CONTENT_W - gap * (cols - 1)) / cols;
    const h = 17;
    const rows = Math.ceil(items.length / cols);
    this.ensure(rows * (h + gap));
    items.forEach((item, i) => {
      const x = M + (i % cols) * (w + gap);
      const y = this.y + Math.floor(i / cols) * (h + gap);
      this.color(PANEL, 'fill');
      this.color(RULE, 'draw');
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
      this.font(6.5, 'bold', MUTED);
      this.doc.text(item.label.toUpperCase(), x + 3, y + 5);
      this.font(12, 'bold', item.accent ?? INK);
      this.doc.text(item.value, x + 3, y + 11.5);
      if (item.sub) {
        this.font(6.5, 'normal', MUTED);
        this.doc.text(this.doc.splitTextToSize(item.sub, w - 6)[0] as string, x + 3, y + 15);
      }
    });
    this.y += rows * (h + gap) + 2;
  }

  keyValues(rows: [string, string][], width = CONTENT_W, x = M) {
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: x, right: PAGE_W - x - width, top: TOP, bottom: PAGE_H - BOTTOM },
      tableWidth: width,
      body: rows,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: { top: 1.3, bottom: 1.3, left: 2, right: 2 }, textColor: INK, lineColor: RULE, lineWidth: { bottom: 0.15 } },
      columnStyles: { 0: { textColor: MUTED, cellWidth: width * 0.42 }, 1: { halign: 'right', font: 'courier', fontStyle: 'bold' } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.y = (this.doc as any).lastAutoTable.finalY + 5;
  }

  table(head: string[], body: (string | number)[][], opts: { fontSize?: number; highlightFirst?: boolean; colStyles?: Record<number, object> } = {}) {
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: M, right: M, top: TOP + 2, bottom: PAGE_H - BOTTOM },
      head: [head],
      body: body.map((r) => r.map(String)),
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: (opts.fontSize ?? 7.5) - 0.5, fontStyle: 'bold' },
      styles: { fontSize: opts.fontSize ?? 7.5, cellPadding: 1.4, textColor: INK, lineColor: RULE, lineWidth: 0.15 },
      alternateRowStyles: { fillColor: PANEL },
      columnStyles: opts.colStyles,
      didParseCell: (data) => {
        if (opts.highlightFirst && data.section === 'body' && data.row.index === 0) {
          data.cell.styles.fillColor = [232, 236, 252];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.y = (this.doc as any).lastAutoTable.finalY + 5;
  }

  /** Card frame around a chart: title, caption, returns plot rect. */
  chartCard(title: string, caption: string, h: number, w = CONTENT_W, x = M, extraBottom = 0) {
    this.ensure(h + 16 + extraBottom);
    const top = this.y;
    this.color(RULE, 'draw');
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(x, top, w, h + 14 + extraBottom, 1.5, 1.5, 'S');
    this.font(7.5, 'bold', INK);
    this.doc.text(title.toUpperCase(), x + 3, top + 5);
    this.font(6.8, 'normal', MUTED);
    this.doc.text(this.doc.splitTextToSize(caption, w - 6)[0] as string, x + 3, top + 9);
    this.y = top + h + 17 + extraBottom;
    return { x: x + 3, y: top + 12, w: w - 6, h };
  }

  /** Axes + grid; returns value→mm mappers. */
  axes(
    r: { x: number; y: number; w: number; h: number },
    xd: { lo: number; hi: number; step: number },
    yd: { lo: number; hi: number; step: number },
    fx: (v: number) => string,
    fy: (v: number) => string,
    yRight?: { lo: number; hi: number; step: number; f: (v: number) => string }
  ) {
    const padL = 12;
    const padR = yRight ? 12 : 3;
    const padB = 7;
    const plot = { x: r.x + padL, y: r.y, w: r.w - padL - padR, h: r.h - padB };
    const px = (v: number) => plot.x + ((v - xd.lo) / (xd.hi - xd.lo)) * plot.w;
    const py = (v: number) => plot.y + plot.h - ((v - yd.lo) / (yd.hi - yd.lo)) * plot.h;
    const pyR = yRight ? (v: number) => plot.y + plot.h - ((v - yRight.lo) / (yRight.hi - yRight.lo)) * plot.h : py;
    this.doc.setLineWidth(0.1);
    this.font(6, 'normal', MUTED);
    for (let v = yd.lo; v <= yd.hi + 1e-9; v += yd.step) {
      this.color(RULE, 'draw');
      this.doc.line(plot.x, py(v), plot.x + plot.w, py(v));
      this.doc.text(fy(v), plot.x - 1.5, py(v) + 1, { align: 'right' });
    }
    if (yRight) {
      for (let v = yRight.lo; v <= yRight.hi + 1e-9; v += yRight.step) {
        this.doc.text(yRight.f(v), plot.x + plot.w + 1.5, pyR(v) + 1);
      }
    }
    for (let v = xd.lo; v <= xd.hi + 1e-9; v += xd.step) {
      this.doc.text(fx(v), px(v), plot.y + plot.h + 4, { align: 'center' });
    }
    this.color(MUTED, 'draw');
    this.doc.setLineWidth(0.2);
    this.doc.line(plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h);
    return { plot, px, py, pyR };
  }

  polyline(points: [number, number][], c: RGB, width = 0.5, dash?: number[]) {
    if (points.length < 2) return;
    this.color(c, 'draw');
    this.doc.setLineWidth(width);
    if (dash) this.doc.setLineDashPattern(dash, 0);
    for (let i = 1; i < points.length; i += 1) this.doc.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    if (dash) this.doc.setLineDashPattern([], 0);
  }

  area(points: [number, number][], baseY: number, c: RGB, opacity = 0.15) {
    if (points.length < 2) return;
    const path: [number, number][] = [[points[0][0], baseY], ...points, [points[points.length - 1][0], baseY]];
    const deltas = path.slice(1).map((p, i) => [p[0] - path[i][0], p[1] - path[i][1]]);
    this.alpha(opacity);
    this.color(c, 'fill');
    this.doc.lines(deltas, path[0][0], path[0][1], [1, 1], 'F', true);
    this.alpha(1);
  }

  /** Rows a legend needs at the given width (items wrap onto new rows). */
  legendRows(items: { label: string }[], maxW = CONTENT_W - 6): number {
    this.font(6.5, 'normal', INK);
    let rows = 1;
    let w = 0;
    for (const it of items) {
      const iw = 10 + this.doc.getTextWidth(it.label);
      if (w > 0 && w + iw > maxW) {
        rows += 1;
        w = 0;
      }
      w += iw;
    }
    return rows;
  }

  legend(items: { label: string; c: RGB; kind?: 'line' | 'box' }[], x: number, y: number, maxW = CONTENT_W - 6) {
    let cx = x;
    this.font(6.5, 'normal', INK);
    for (const it of items) {
      const iw = 10 + this.doc.getTextWidth(it.label);
      if (cx > x && cx + iw > x + maxW) {
        cx = x;
        y += 4;
      }
      this.color(it.c, 'fill');
      this.color(it.c, 'draw');
      if (it.kind === 'line') {
        this.doc.setLineWidth(0.6);
        this.doc.line(cx, y - 1, cx + 4, y - 1);
      } else this.doc.rect(cx, y - 2.2, 2.6, 2.6, 'F');
      this.doc.text(it.label, cx + 5, y);
      cx += 7 + this.doc.getTextWidth(it.label) + 3;
    }
  }

  finalize(spill: MapSpill, generatedMs: number) {
    const pages = this.doc.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      this.doc.setPage(i);
      if (i > 1) {
        this.font(7, 'bold', PRIMARY);
        this.doc.text('NAUKA MARITIME INTELLIGENCE', M, 12);
        this.font(7, 'normal', MUTED);
        this.doc.text(`Oil-spill evidence report  ·  ${spill.spillId}`, PAGE_W - M, 12, { align: 'right' });
        this.color(RULE, 'draw');
        this.doc.setLineWidth(0.3);
        this.doc.line(M, 15, PAGE_W - M, 15);
      }
      this.color(RULE, 'draw');
      this.doc.setLineWidth(0.3);
      this.doc.line(M, PAGE_H - 13, PAGE_W - M, PAGE_H - 13);
      this.font(6.5, 'normal', MUTED);
      this.doc.text(`Generated ${utc(generatedMs)}  ·  Figures reported by the NAUKA backend`, M, PAGE_H - 8.5);
      this.doc.text(`Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 8.5, { align: 'right' });
    }
  }

  writeToc(page: number, y: number) {
    this.doc.setPage(page);
    this.font(8, 'bold', MUTED);
    this.doc.text('CONTENTS', M, y);
    let cy = y + 6;
    for (const entry of this.toc) {
      this.font(9, 'normal', INK);
      this.doc.text(entry.title, M, cy);
      this.font(9, 'normal', MUTED);
      this.doc.text(String(entry.page), PAGE_W - M, cy, { align: 'right' });
      this.color(RULE, 'draw');
      this.doc.setLineWidth(0.1);
      this.doc.setLineDashPattern([0.5, 1], 0);
      this.doc.line(M + this.doc.getTextWidth(entry.title) + 3, cy - 1, PAGE_W - M - 8, cy - 1);
      this.doc.setLineDashPattern([], 0);
      cy += 6;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Data completion                                                     */
/* ------------------------------------------------------------------ */

async function completeData(input: EvidenceReportInput): Promise<{ attribution: SpillAttribution | null; forecast: SpillForecast | null }> {
  let { attribution, forecast } = input;
  const hasTracks = attribution?.vessels.some((v) => v.track.length > 1);
  const tasks: Promise<void>[] = [];
  if (!hasTracks) {
    tasks.push(
      Promise.all([
        spillService.getAttributionTrajectory(input.spill.spillId).catch(() => null),
        spillService.getSpillVessels(input.spill.spillId).catch(() => null),
      ]).then(([rawTrajectory, rawVessels]) => {
        const adapted = adaptSpillAttribution(input.spill.spillId, rawTrajectory, rawVessels);
        if (adapted && adapted.vessels.length > 0) attribution = adapted;
      })
    );
  }
  if (!forecast) {
    tasks.push(
      fetchSpillForecast(input.spill.spillId)
        .then((raw) => {
          forecast = adaptSpillForecast(input.spill.spillId, raw);
        })
        .catch(() => undefined)
    );
  }
  await Promise.all(tasks);
  return { attribution, forecast };
}

async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = data;
    });
    return { data, ...dims };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export async function downloadEvidenceReport(input: EvidenceReportInput): Promise<void> {
  const { spill, spills, trajectory, environment } = input;
  const coastline = input.coastline ?? (await loadCoastline('mediterranean').catch(() => null));
  const [{ attribution, forecast }, plotUrl] = await Promise.all([
    completeData(input),
    fetchDiagnosticPlotUrl(spill.spillId).catch(() => DEFAULT_DIAGNOSTIC_PLOT_URL),
  ]);
  // The service falls back to a reference plot of another spill — never present that as this spill's evidence.
  const ownPlot = plotUrl && (plotUrl !== DEFAULT_DIAGNOSTIC_PLOT_URL || spill.spillId === 'spill_ea0e3f') ? plotUrl : spill.imageUrl;
  const image = ownPlot ? await loadImage(ownPlot) : null;

  const generated = Date.now();
  const r = new Report();
  const doc = r.doc;

  const vessels = [...(attribution?.vessels ?? [])].sort((a, b) => a.rank - b.rank);
  const prime: AttributedVessel | null = vessels[0] ?? null;
  const search = attribution?.searchParameters ?? null;
  const releaseMs = spill.estimatedReleaseTime ? Date.parse(spill.estimatedReleaseTime) : (trajectory?.points[0]?.timestampMs ?? null);
  const origin =
    trajectory?.source ??
    (spill.estimatedSourceLatitude != null && spill.estimatedSourceLongitude != null
      ? { longitude: spill.estimatedSourceLongitude, latitude: spill.estimatedSourceLatitude, radiusKm: spill.estimatedSourceRadiusKm }
      : null);

  // Lead margins: #1 minus best competitor per signal.
  const leadRows: { signal: string; margin: number; mine: number; theirs: number; who: string }[] = [];
  if (prime && vessels.length > 1) {
    const signals = [{ label: 'Overall', get: (v: AttributedVessel) => v.score }, ...SIGNALS.map((s) => ({ label: s.label, get: (v: AttributedVessel) => v.subScores[s.key] }))];
    for (const s of signals) {
      const mine = s.get(prime);
      if (mine == null) continue;
      let best: AttributedVessel | null = null;
      for (const v of vessels.slice(1)) {
        const val = s.get(v);
        if (val != null && (best == null || val > (s.get(best) as number))) best = v;
      }
      if (best) leadRows.push({ signal: s.label, margin: Math.round((mine - (s.get(best) as number)) * 100), mine, theirs: s.get(best) as number, who: best.vesselName });
    }
  }
  const signalLeads = leadRows.filter((l) => l.signal !== 'Overall');
  const leads = signalLeads.filter((l) => l.margin > 0).length;
  const strongest = [...signalLeads].sort((a, b) => b.margin - a.margin)[0];

  const areas = spills.map((s) => s.areaKm2).filter((a): a is number => a != null);
  const percentile = spill.areaKm2 != null && areas.length ? Math.round((areas.filter((a) => a <= spill.areaKm2!).length / areas.length) * 100) : null;
  const severity = computeForecastAlertSeverity(forecast, coastline);
  const coastKm = forecast?.predictedPosition && coastline ? computeDistanceToCoast(forecast.predictedPosition, coastline) : null;

  /* ---------------- Cover ---------------- */
  r.color(NAVY, 'fill');
  doc.rect(0, 0, PAGE_W, 74, 'F');
  r.font(8, 'bold', [150, 170, 240]);
  doc.text('NAUKA MARITIME INTELLIGENCE', M, 18);
  r.font(24, 'bold', [255, 255, 255]);
  doc.text('Oil Spill Evidence Report', M, 34);
  r.font(13, 'normal', [210, 218, 240]);
  doc.text(spill.spillId, M, 44);
  r.font(8.5, 'normal', [170, 182, 210]);
  doc.text(`Detected ${utc(spill.detectedAtMs)}   ·   Report generated ${utc(generated)}`, M, 54);
  doc.text(`Centroid ${latLon(spill.longitude, spill.latitude)}`, M, 60);
  r.y = 86;

  r.font(8, 'bold', MUTED);
  doc.text('ASSESSMENT', M, r.y);
  r.y += 3;
  const assessment = prime
    ? `Prime candidate ${prime.vesselName}${prime.vesselType ? ` (${prime.vesselType}${prime.country ? `, ${prime.country}` : ''})` : ''} scores ${pct(prime.score)}` +
      (signalLeads.length ? ` and out-scores every other candidate on ${leads} of ${signalLeads.length} signals${strongest && strongest.margin > 0 ? `, most strongly on ${strongest.signal.toLowerCase()} (+${strongest.margin} pts)` : ''}` : '') +
      `. It passed the estimated origin ${offset(prime.timeDifferenceHours)}, ${prime.distanceFromOriginKm != null ? `${prime.distanceFromOriginKm.toFixed(2)} km` : 'at an unreported distance'} from the estimate. ` +
      `The slick (${num(spill.areaKm2, 2, ' km²')}, detection confidence ${pct(spill.confidenceScore)}) was backtracked ${trajectory ? `${trajectory.totalDistanceKm.toFixed(1)} km over ${trajectory.durationHours.toFixed(1)} h` : '(no drift solution)'} to its probable release point.`
    : 'No candidate vessels were recorded for this detection.';
  r.paragraph(assessment, 10, INK);
  if (attribution?.attributionQualification) r.paragraph(`Backend qualification: ${attribution.attributionQualification}`, 8.5, MUTED);
  r.gap(2);
  r.kpis([
    { label: 'Slick area', value: num(spill.areaKm2, 2, ' km²'), sub: percentile != null ? `larger than ${percentile}% of archive` : undefined },
    { label: 'Detection confidence', value: pct(spill.confidenceScore), sub: spill.sourceType ?? undefined },
    { label: 'Estimated age', value: num(spill.estimatedAgeHours, 1, ' h'), sub: 'at detection' },
    { label: 'Drift backtracked', value: trajectory ? `${trajectory.totalDistanceKm.toFixed(1)} km` : '-', sub: trajectory ? `over ${trajectory.durationHours.toFixed(1)} h` : undefined },
    { label: 'Candidates', value: String(vessels.length || spill.candidateCount || '-'), sub: `${vessels.filter((v) => v.isMock).length} comparison baselines` },
    { label: 'Prime match', value: pct(prime?.score ?? spill.rankedTopScore), sub: prime?.vesselName ?? spill.rankedTopVessel ?? undefined, accent: PRIMARY },
  ]);
  const tocY = r.y + 4;

  /* ---------------- 01 Detection ---------------- */
  r.newPage();
  r.section('01', 'Detection & imagery', 'The satellite observation that flagged the slick and the detection record it produced.', 'GET /demo/spills/{id}');
  if (image) {
    const w = CONTENT_W;
    const h = Math.min(120, (w * image.h) / image.w);
    const iw = (h * image.w) / image.h;
    r.ensure(h + 8);
    doc.addImage(image.data, image.data.startsWith('data:image/png') ? 'PNG' : 'JPEG', M + (CONTENT_W - iw) / 2, r.y, iw, h);
    r.y += h + 2;
    r.font(7, 'normal', MUTED);
    doc.text('SAR observation / drift diagnostic plot published for this detection.', M, r.y + 2);
    r.y += 7;
  } else {
    r.paragraph('No diagnostic plot is published for this detection.', 8.5, MUTED);
  }
  r.subheading('Detection record');
  r.keyValues([
    ['Spill ID', spill.spillId],
    ['Detected', utc(spill.detectedAtMs)],
    ['Centroid', latLon(spill.longitude, spill.latitude)],
    ['Observation point', latLon(spill.observationLongitude, spill.observationLatitude)],
    ['Slick area', num(spill.areaKm2, 3, ' km²')],
    ['Detection confidence', pct(spill.confidenceScore)],
    ['Source type', spill.sourceType ?? '-'],
    ['Estimated age at detection', num(spill.estimatedAgeHours, 2, ' h')],
    ['Estimated release time', utc(releaseMs)],
    ['Polygon vertices', spill.polygon ? String(spill.polygon.length) : '-'],
    ['Backend-ranked top vessel', spill.rankedTopVessel ?? '-'],
    ['Backend-ranked top score', pct(spill.rankedTopScore)],
  ]);

  /* ---------------- 02 Drift ---------------- */
  r.newPage();
  r.section('02', 'Drift reconstruction', 'The slick integrated backwards through wind and current to its probable release point.', 'GET /visualization/spills/{id}');
  if (trajectory && trajectory.points.length > 1) {
    const pts = trajectory.points;
    const t0 = pts[0].timestampMs;
    const rows = pts.map((p, i) => {
      const prev = pts[i - 1];
      const dtH = prev ? (p.timestampMs - prev.timestampMs) / 3_600_000 : 0;
      return {
        h: (p.timestampMs - t0) / 3_600_000,
        km: p.cumulativeKm,
        spd: prev && dtH > 0 ? haversineKm(prev.longitude, prev.latitude, p.longitude, p.latitude) / dtH : null,
      };
    });
    const rect = r.chartCard('Drift profile', 'Distance drifted (area) and drift speed per segment (line), release to detection.', 62);
    const xd = niceDomain(0, rows[rows.length - 1].h, 6);
    const yd = niceDomain(0, Math.max(...rows.map((d) => d.km)), 4);
    const spds = rows.map((d) => d.spd).filter((v): v is number => v != null);
    const sd = niceDomain(0, Math.max(0.01, ...spds), 4);
    const { px, py, pyR, plot } = r.axes(rect, xd, yd, (v) => `${v.toFixed(0)}h`, (v) => `${v.toFixed(v < 10 ? 1 : 0)} km`, { ...sd, f: (v) => v.toFixed(1) });
    const kmPts = rows.map((d) => [px(d.h), py(d.km)] as [number, number]);
    r.area(kmPts, plot.y + plot.h, PRIMARY, 0.14);
    r.polyline(kmPts, PRIMARY, 0.55);
    r.polyline(rows.filter((d) => d.spd != null).map((d) => [px(d.h), pyR(d.spd as number)] as [number, number]), AMBER, 0.4);
    r.legend([{ label: 'Cumulative distance (km)', c: PRIMARY, kind: 'line' }, { label: 'Drift speed (km/h, right axis)', c: AMBER, kind: 'line' }], rect.x, r.y - 2);
    r.gap(3);
  }
  r.subheading('Probable origin & forcing');
  r.keyValues([
    ['Origin position', origin ? latLon(origin.longitude, origin.latitude) : '-'],
    ['Origin uncertainty radius', origin?.radiusKm != null ? `± ${origin.radiusKm.toFixed(2)} km` : '-'],
    ['Estimated release', utc(releaseMs)],
    ['Backtrack duration', trajectory ? `${trajectory.durationHours.toFixed(2)} h` : '-'],
    ['Path length', trajectory ? `${trajectory.totalDistanceKm.toFixed(2)} km` : '-'],
    ['Net displacement (origin to detection)', trajectory && trajectory.points.length > 1 ? `${haversineKm(trajectory.points[0].longitude, trajectory.points[0].latitude, trajectory.points[trajectory.points.length - 1].longitude, trajectory.points[trajectory.points.length - 1].latitude).toFixed(2)} km` : '-'],
    ['Wind at detection', environment?.wind ? `${environment.wind.speed.toFixed(2)} ${environment.wind.unit} · ${environment.wind.directionDeg.toFixed(0)}° (u ${environment.wind.u.toFixed(2)}, v ${environment.wind.v.toFixed(2)})` : '-'],
    ['Surface current at detection', environment?.current ? `${environment.current.speed.toFixed(3)} ${environment.current.unit} · ${environment.current.directionDeg.toFixed(0)}° (u ${environment.current.u.toFixed(3)}, v ${environment.current.v.toFixed(3)})` : '-'],
  ]);
  if (trajectory && trajectory.points.length > 0) {
    r.subheading(`Drift samples (${Math.min(30, trajectory.points.length)} of ${trajectory.points.length})`);
    r.table(
      ['Time (UTC)', 'Hours before detection', 'Latitude', 'Longitude', 'Cumulative km'],
      sample(trajectory.points, 30).map((p) => [utc(p.timestampMs).replace(' UTC', ''), p.hoursBeforeDetection.toFixed(2), p.latitude.toFixed(5), p.longitude.toFixed(5), p.cumulativeKm.toFixed(2)]),
      { fontSize: 7 }
    );
  }

  /* ---------------- 03 Attribution ---------------- */
  r.newPage();
  r.section('03', 'Vessel attribution', 'Every candidate the backend scored, compared signal by signal, and why rank #1 stands apart.', 'GET /demo/spills/{id}/vessels');
  if (vessels.length === 0) {
    r.paragraph('No candidate vessels recorded for this spill.', 9, MUTED);
  } else {
    // Grouped bars
    const signalLegend = vessels.map((v, i) => ({ label: `#${v.rank} ${v.vesselName}${v.isMock ? ' (comparison)' : ''}`, c: vesselRgb(i) }));
    const legendExtra = (r.legendRows(signalLegend) - 1) * 4;
    const rect = r.chartCard('Signal comparison: all candidates', 'Overall match score and its six component signals for each candidate (0-100).', 64, CONTENT_W, M, legendExtra);
    const cats = ['Overall', ...SIGNALS.map((s) => s.label)];
    const getters = [(v: AttributedVessel) => v.score, ...SIGNALS.map((s) => (v: AttributedVessel) => v.subScores[s.key])];
    const { py, plot } = r.axes(rect, { lo: 0, hi: cats.length, step: 100 }, { lo: 0, hi: 100, step: 20 }, () => '', (v) => `${v}%`);
    const groupW = plot.w / cats.length;
    const barW = Math.min(4, (groupW * 0.72) / vessels.length);
    cats.forEach((cat, ci) => {
      const gx = plot.x + ci * groupW + (groupW - barW * vessels.length) / 2;
      vessels.forEach((v, vi) => {
        const val = getters[ci](v);
        if (val == null) return;
        r.color(vesselRgb(vi), 'fill');
        doc.rect(gx + vi * barW, py(val * 100), barW * 0.9, plot.y + plot.h - py(val * 100), 'F');
      });
      r.font(6.2, 'normal', INK);
      doc.text(cat, plot.x + ci * groupW + groupW / 2, plot.y + plot.h + 4, { align: 'center' });
    });
    r.legend(signalLegend, rect.x, r.y - 2 - legendExtra, rect.w);
    r.gap(3);

    // Radar + lead margins side by side
    const half = (CONTENT_W - 4) / 2;
    r.ensure(84);
    const rowTop = r.y;
    const radar = r.chartCard('Evidence profiles', 'Rank #1 filled; other candidates outlined.', 64, half, M);
    r.y = rowTop;
    const lead = r.chartCard('Why rank #1', 'Rank #1 minus the best other candidate, per signal (points).', 64, half, M + half + 4);
    // radar
    const cx = radar.x + radar.w / 2;
    const cy = radar.y + radar.h / 2 + 1;
    const R = Math.min(radar.w, radar.h) / 2 - 7;
    doc.setLineWidth(0.1);
    r.color(RULE, 'draw');
    for (const f of [0.25, 0.5, 0.75, 1]) {
      const ring = SIGNALS.map((_, i) => {
        const a = -Math.PI / 2 + (i / SIGNALS.length) * Math.PI * 2;
        return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f] as [number, number];
      });
      r.polyline([...ring, ring[0]], RULE, 0.1);
    }
    SIGNALS.forEach((s, i) => {
      const a = -Math.PI / 2 + (i / SIGNALS.length) * Math.PI * 2;
      r.polyline([[cx, cy], [cx + Math.cos(a) * R, cy + Math.sin(a) * R]], RULE, 0.1);
      r.font(6, 'normal', INK);
      doc.text(s.label, cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4) + 1, { align: 'center' });
    });
    [...vessels].reverse().forEach((v) => {
      const vi = vessels.indexOf(v);
      const poly = SIGNALS.map((s, i) => {
        const a = -Math.PI / 2 + (i / SIGNALS.length) * Math.PI * 2;
        const val = v.subScores[s.key] ?? 0;
        return [cx + Math.cos(a) * R * val, cy + Math.sin(a) * R * val] as [number, number];
      });
      if (vi === 0) {
        const deltas = poly.slice(1).map((p, i) => [p[0] - poly[i][0], p[1] - poly[i][1]]);
        r.alpha(0.25);
        r.color(PRIMARY, 'fill');
        doc.lines(deltas, poly[0][0], poly[0][1], [1, 1], 'F', true);
        r.alpha(1);
      }
      r.polyline([...poly, poly[0]], vesselRgb(vi), vi === 0 ? 0.6 : 0.35, vi === 0 ? undefined : [1, 0.8]);
    });
    // lead margins
    if (leadRows.length) {
      const ext = Math.max(20, ...leadRows.map((l) => Math.abs(l.margin)));
      const labelW = 16;
      const zeroX = lead.x + labelW + (lead.w - labelW - 4) / 2;
      const scale = (lead.w - labelW - 4) / 2 / ext;
      const rowH = Math.min(8, lead.h / leadRows.length);
      r.polyline([[zeroX, lead.y], [zeroX, lead.y + rowH * leadRows.length]], MUTED, 0.2);
      leadRows.forEach((l, i) => {
        const yy = lead.y + i * rowH;
        r.font(6.2, 'normal', INK);
        doc.text(l.signal, lead.x, yy + rowH / 2 + 1);
        r.color(l.margin >= 0 ? GREEN : AMBER, 'fill');
        const w = l.margin * scale;
        doc.rect(w >= 0 ? zeroX : zeroX + w, yy + rowH * 0.2, Math.abs(w) || 0.3, rowH * 0.6, 'F');
        r.font(5.8, 'bold', l.margin >= 0 ? GREEN : AMBER);
        doc.text(`${l.margin > 0 ? '+' : ''}${l.margin}`, w >= 0 ? zeroX + w + 1 : zeroX + w - 1, yy + rowH / 2 + 1, { align: w >= 0 ? 'left' : 'right' });
      });
    }

    // Spatio-temporal scatter
    const withPos = vessels.filter((v) => v.timeDifferenceHours != null && v.distanceFromOriginKm != null);
    if (withPos.length) {
      const sc = r.chartCard('Spatio-temporal fit', 'Time offset from release vs distance from origin; marker size = match score. Box = backend search window.', 60);
      const maxT = Math.max(1, search?.temporalWindowHours ?? 0, ...withPos.map((v) => Math.abs(v.timeDifferenceHours as number)));
      const xd = niceDomain(-maxT, maxT, 6);
      const yd = niceDomain(0, Math.max(search?.candidateSearchCorridorRadiusKm ?? 0, ...withPos.map((v) => v.distanceFromOriginKm as number)), 4);
      const { px, py } = r.axes(sc, xd, yd, (v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}h`, (v) => `${v.toFixed(0)} km`);
      if (search?.temporalWindowHours != null && search.candidateSearchCorridorRadiusKm != null) {
        r.alpha(0.1);
        r.color(GREEN, 'fill');
        doc.rect(px(-search.temporalWindowHours), py(search.candidateSearchCorridorRadiusKm), px(search.temporalWindowHours) - px(-search.temporalWindowHours), py(0) - py(search.candidateSearchCorridorRadiusKm), 'F');
        r.alpha(1);
        r.color(GREEN, 'draw');
        doc.setLineDashPattern([1, 0.8], 0);
        doc.setLineWidth(0.2);
        doc.rect(px(-search.temporalWindowHours), py(search.candidateSearchCorridorRadiusKm), px(search.temporalWindowHours) - px(-search.temporalWindowHours), py(0) - py(search.candidateSearchCorridorRadiusKm), 'S');
        doc.setLineDashPattern([], 0);
      }
      r.polyline([[px(0), py(yd.lo)], [px(0), py(yd.hi)]], MUTED, 0.2, [1, 1]);
      withPos.forEach((v) => {
        const vi = vessels.indexOf(v);
        const rad = 1.2 + (v.score ?? 0) * 2.8;
        r.color(vesselRgb(vi), 'fill');
        r.color([255, 255, 255], 'draw');
        doc.setLineWidth(0.3);
        doc.circle(px(v.timeDifferenceHours as number), py(v.distanceFromOriginKm as number), rad, 'FD');
        r.font(6, 'bold', INK);
        doc.text(`#${v.rank}`, px(v.timeDifferenceHours as number) + rad + 0.8, py(v.distanceFromOriginKm as number) + 1);
      });
      r.gap(1);
    }

    // Verification
    r.subheading('Verification of the prime candidate');
    const inWindow =
      prime?.timeDifferenceHours == null || search?.temporalWindowHours == null ? 'Not reported' : Math.abs(prime.timeDifferenceHours) <= search.temporalWindowHours ? 'PASS' : 'FAIL';
    r.table(
      ['Check', 'Result', 'Detail'],
      [
        ['Inside transit search corridor', attribution?.candidateWithinCorridor == null ? 'Not reported' : attribution.candidateWithinCorridor ? 'PASS' : 'FAIL', `${num(prime?.distanceFromOriginKm, 2, ' km')} from origin · corridor ${num(search?.candidateSearchCorridorRadiusKm, 1, ' km')}`],
        ['Inside drift-uncertainty radius', attribution?.withinBacktrackRadius == null ? 'Not reported' : attribution.withinBacktrackRadius ? 'PASS' : 'FAIL', `Origin estimate ± ${num(search?.driftUncertaintyRadiusKm, 2, ' km')}`],
        ['Inside release-time window', inWindow, `${offset(prime?.timeDifferenceHours)} · window ± ${num(search?.temporalWindowHours, 1, ' h')}`],
      ],
      {
        colStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 26 } },
      }
    );

    // Candidate register (full)
    r.subheading('Candidate register');
    r.table(
      ['Rank', 'Vessel', 'Type', 'Flag', 'MMSI', 'IMO', 'Speed', 'Course', 'Dist. km', 'Timing', 'Corr.', 'Score', 'Status'],
      vessels.map((v, i) => [
        `#${v.rank}`,
        v.vesselName,
        v.vesselType ?? v.shiptypeName ?? '-',
        v.country ?? '-',
        v.mmsi ?? '-',
        v.imo ?? '-',
        num(v.speed, 1, ' kn'),
        v.course != null ? `${Math.round(v.course)}°` : '-',
        num(v.distanceFromOriginKm, 2),
        v.timeDifferenceHours != null ? `${v.timeDifferenceHours > 0 ? '+' : ''}${v.timeDifferenceHours.toFixed(2)} h` : '-',
        pct(v.trajectoryCorrelation),
        pct(v.score),
        i === 0 ? 'Prime' : v.isMock ? 'Comparison' : 'Candidate',
      ]),
      { fontSize: 6.4, highlightFirst: true }
    );
    r.subheading('Sub-score matrix');
    r.table(
      ['Rank', 'Vessel', ...SIGNALS.map((s) => s.label), 'Overall'],
      vessels.map((v) => [`#${v.rank}`, v.vesselName, ...SIGNALS.map((s) => pct(v.subScores[s.key])), pct(v.score)]),
      { fontSize: 7, highlightFirst: true }
    );
    r.subheading('Search parameters');
    r.keyValues([
      ['Drift-uncertainty radius', num(search?.driftUncertaintyRadiusKm, 2, ' km')],
      ['Candidate search corridor radius', num(search?.candidateSearchCorridorRadiusKm, 2, ' km')],
      ['Temporal window', search?.temporalWindowHours != null ? `± ${search.temporalWindowHours} h` : '-'],
      ['Candidates evaluated', String(attribution?.candidateCount ?? vessels.length)],
    ]);
    if (attribution?.attributionQualification) {
      r.subheading('Backend qualification');
      r.paragraph(attribution.attributionQualification, 8.5, INK);
    }
  }

  /* ---------------- 04 Prime candidate ---------------- */
  if (prime) {
    r.newPage();
    r.section('04', 'Prime candidate', 'Identity and movement of the rank #1 vessel around the release time.', 'GET /demo/spills/{id}/attribution/trajectory');
    r.keyValues([
      ['Vessel', prime.vesselName],
      ['Vessel ID', prime.vesselId],
      ['MMSI / IMO', `${prime.mmsi ?? '-'} / ${prime.imo ?? '-'}`],
      ['Identifiers', prime.identifiersSynthetic ? 'Synthetic placeholders (not registry identifiers)' : 'As reported'],
      ['Type / flag', `${prime.shiptypeName ?? prime.vesselType ?? '-'} / ${prime.country ?? '-'}`],
      ['Speed / course / heading', `${num(prime.speed, 1, ' kn')} / ${prime.course != null ? `${Math.round(prime.course)}°` : '-'} / ${prime.heading != null ? `${Math.round(prime.heading)}°` : '-'}`],
      ['Position at release', prime.culpritLocation ? latLon(prime.culpritLocation.longitude, prime.culpritLocation.latitude) : '-'],
      ['Distance to origin', num(prime.distanceFromOriginKm, 2, ' km')],
      ['Timing vs release', offset(prime.timeDifferenceHours)],
      ['Track correlation', pct(prime.trajectoryCorrelation)],
      ['Match score', pct(prime.score)],
      ['AIS samples', String(prime.track.length)],
    ]);
    if (origin && releaseMs != null && prime.track.length > 1) {
      const rows = prime.track.map((p) => ({
        h: (p.timestampMs - releaseMs) / 3_600_000,
        d: haversineKm(origin.longitude, origin.latitude, p.longitude, p.latitude),
        s: p.speed,
      }));
      const rect = r.chartCard('Approach & departure', 'Distance to the estimated origin and speed across the AIS track, relative to release. Shaded band = drift-uncertainty radius.', 60);
      const xd = niceDomain(Math.min(...rows.map((x) => x.h)), Math.max(...rows.map((x) => x.h)), 6);
      const yd = niceDomain(0, Math.max(...rows.map((x) => x.d)), 4);
      const speeds = rows.map((x) => x.s).filter((v): v is number => v != null);
      const sd = niceDomain(0, Math.max(1, ...speeds), 4);
      const { px, py, pyR, plot } = r.axes(rect, xd, yd, (v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}h`, (v) => `${v.toFixed(0)} km`, speeds.length ? { ...sd, f: (v) => `${v.toFixed(0)} kn` } : undefined);
      const radius = search?.driftUncertaintyRadiusKm ?? origin.radiusKm;
      if (radius != null) {
        r.alpha(0.12);
        r.color(GREEN, 'fill');
        doc.rect(plot.x, py(Math.min(radius, yd.hi)), plot.w, plot.y + plot.h - py(Math.min(radius, yd.hi)), 'F');
        r.alpha(1);
      }
      if (xd.lo <= 0 && xd.hi >= 0) r.polyline([[px(0), plot.y], [px(0), plot.y + plot.h]], INK, 0.2, [1, 1]);
      r.polyline(rows.map((x) => [px(x.h), py(x.d)] as [number, number]), PRIMARY, 0.6);
      if (speeds.length) r.polyline(rows.filter((x) => x.s != null).map((x) => [px(x.h), pyR(x.s as number)] as [number, number]), AMBER, 0.4, [1.2, 0.6]);
      r.legend([{ label: 'Distance to origin', c: PRIMARY, kind: 'line' }, { label: 'Speed (right axis)', c: AMBER, kind: 'line' }, { label: 'Drift radius', c: GREEN }], rect.x, r.y - 2);
      r.gap(3);
      r.subheading(`AIS track (${Math.min(25, prime.track.length)} of ${prime.track.length} samples)`);
      r.table(
        ['Time (UTC)', 'From release', 'Latitude', 'Longitude', 'Speed', 'Course', 'Dist. to origin'],
        sample(prime.track, 25).map((p) => [
          utc(p.timestampMs).replace(' UTC', ''),
          `${((p.timestampMs - releaseMs) / 3_600_000).toFixed(2)} h`,
          p.latitude.toFixed(5),
          p.longitude.toFixed(5),
          num(p.speed, 1, ' kn'),
          p.course != null ? `${Math.round(p.course)}°` : '-',
          `${haversineKm(origin.longitude, origin.latitude, p.longitude, p.latitude).toFixed(2)} km`,
        ]),
        { fontSize: 7 }
      );
    } else {
      r.paragraph('No AIS track was returned for this vessel around the release time.', 8.5, MUTED);
    }
  }

  /* ---------------- 05 Forecast ---------------- */
  r.newPage();
  r.section('05', 'Drift forecast', 'Where the slick is predicted to travel next, and how close that brings it to the coast.', 'GET /demo/spills/{id}/predict');
  if (!forecast) {
    r.paragraph('No forecast was available for this spill.', 9, MUTED);
  } else {
    r.kpis([
      { label: 'Horizon', value: `+${forecast.durationHours.toFixed(0)} h` },
      { label: 'Net displacement', value: num(forecast.totalDisplacementKm, 2, ' km') },
      { label: 'Net heading', value: forecast.netHeadingDeg != null ? `${Math.round(forecast.netHeadingDeg)}°` : '-' },
      { label: 'Average drift speed', value: num(forecast.averageSpeedKnots, 2, ' kn') },
      { label: 'Distance to coastline', value: num(coastKm, 1, ' km'), sub: 'from predicted position' },
      { label: 'Coastal alert', value: severity ? ALERT_SEVERITY_LABEL[severity] : '-', accent: severity === 'critical' ? [200, 50, 50] : severity === 'watch' ? AMBER : undefined },
    ]);
    if (forecast.points.length > 1) {
      const rect = r.chartCard('Forecast profile', 'Predicted cumulative drift (area) and drift speed (line) across the horizon.', 58);
      const pts = forecast.points;
      const xd = niceDomain(0, pts[pts.length - 1].hoursFromNow, 6);
      const yd = niceDomain(0, Math.max(...pts.map((p) => p.cumulativeKm)), 4);
      const spd = pts.map((p) => p.driftSpeedKnots).filter((v): v is number => v != null);
      const sd = niceDomain(0, Math.max(0.01, ...spd), 4);
      const { px, py, pyR, plot } = r.axes(rect, xd, yd, (v) => `+${v.toFixed(0)}h`, (v) => `${v.toFixed(v < 10 ? 1 : 0)} km`, spd.length ? { ...sd, f: (v) => v.toFixed(2) } : undefined);
      const line = pts.map((p) => [px(p.hoursFromNow), py(p.cumulativeKm)] as [number, number]);
      r.area(line, plot.y + plot.h, TEAL, 0.15);
      r.polyline(line, TEAL, 0.55);
      if (spd.length) r.polyline(pts.filter((p) => p.driftSpeedKnots != null).map((p) => [px(p.hoursFromNow), pyR(p.driftSpeedKnots as number)] as [number, number]), AMBER, 0.4);
      r.legend([{ label: 'Predicted drift (km)', c: TEAL, kind: 'line' }, { label: 'Drift speed (kn, right axis)', c: AMBER, kind: 'line' }], rect.x, r.y - 2);
      r.gap(3);
    }
    r.keyValues([
      ['Predicted position', forecast.predictedPosition ? latLon(forecast.predictedPosition.longitude, forecast.predictedPosition.latitude) : '-'],
      ['Forecast samples', String(forecast.points.length)],
    ]);
    r.subheading(`Forecast points (${Math.min(25, forecast.points.length)} of ${forecast.points.length})`);
    r.table(
      ['Time (UTC)', 'Hours ahead', 'Latitude', 'Longitude', 'Cumulative km', 'Speed', 'Heading'],
      sample(forecast.points, 25).map((p) => [
        utc(p.timestampMs).replace(' UTC', ''),
        `+${p.hoursFromNow.toFixed(1)}`,
        p.latitude.toFixed(5),
        p.longitude.toFixed(5),
        p.cumulativeKm.toFixed(2),
        num(p.driftSpeedKnots, 2, ' kn'),
        p.driftHeadingDeg != null ? `${Math.round(p.driftHeadingDeg)}°` : '-',
      ]),
      { fontSize: 7 }
    );
  }

  /* ---------------- 06 Regional context ---------------- */
  r.newPage();
  r.section('06', 'Regional context', `This detection against all ${spills.length} detections in the archive.`, 'GET /demo/spills');
  {
    const monthly = new Map<string, { t: number; n: number }>();
    for (const s of spills) {
      if (s.detectedAtMs == null) continue;
      const d = new Date(s.detectedAtMs);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      const row = monthly.get(key) ?? { t: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), n: 0 };
      row.n += 1;
      monthly.set(key, row);
    }
    const present = [...monthly.values()].sort((a, b) => a.t - b.t);
    const months: { t: number; n: number }[] = [];
    if (present.length) {
      const byT = new Map(present.map((m) => [m.t, m.n]));
      const first = new Date(present[0].t);
      const last = present[present.length - 1].t;
      for (let d = new Date(first); d.getTime() <= last; d.setUTCMonth(d.getUTCMonth() + 1)) {
        months.push({ t: d.getTime(), n: byT.get(d.getTime()) ?? 0 });
      }
    }
    const selMonth = spill.detectedAtMs != null ? Date.UTC(new Date(spill.detectedAtMs).getUTCFullYear(), new Date(spill.detectedAtMs).getUTCMonth(), 1) : null;
    if (months.length) {
      const rect = r.chartCard('Detections over time', "Monthly detection count across the archive (empty months included); this spill's month highlighted.", 44);
      const yd = niceDomain(0, Math.max(...months.map((m) => m.n)), 4);
      const { py, plot } = r.axes(rect, { lo: 0, hi: months.length, step: months.length + 1 }, yd, () => '', (v) => v.toFixed(0));
      const bw = plot.w / months.length;
      const fmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      const labelEvery = Math.ceil(months.length / 12);
      months.forEach((m, i) => {
        r.color(m.t === selMonth ? PRIMARY : [170, 178, 192], 'fill');
        doc.rect(plot.x + i * bw + bw * 0.12, py(m.n), bw * 0.76, plot.y + plot.h - py(m.n), 'F');
        if (i % labelEvery === 0) {
          r.font(5.8, 'normal', MUTED);
          doc.text(fmt.format(m.t), plot.x + i * bw + bw / 2, plot.y + plot.h + 4, { align: 'center' });
        }
      });
    }
    const bins = [0, 1, 2, 5, 10, 20, 50, Infinity];
    const counts = bins.slice(0, -1).map((lo, i) => ({
      label: bins[i + 1] === Infinity ? `${lo}+` : `${lo}-${bins[i + 1]}`,
      n: spills.filter((s) => s.areaKm2 != null && s.areaKm2 >= lo && s.areaKm2 < bins[i + 1]).length,
      sel: spill.areaKm2 != null && spill.areaKm2 >= lo && spill.areaKm2 < bins[i + 1],
    }));
    const rect2 = r.chartCard('Slick size distribution', percentile != null ? `This slick is larger than ${percentile}% of archived detections (highlighted bin). Area in km².` : 'Area not reported.', 44);
    const yd2 = niceDomain(0, Math.max(1, ...counts.map((c) => c.n)), 4);
    const { py: py2, plot: plot2 } = r.axes(rect2, { lo: 0, hi: counts.length, step: counts.length + 1 }, yd2, () => '', (v) => v.toFixed(0));
    const bw2 = plot2.w / counts.length;
    counts.forEach((c, i) => {
      r.color(c.sel ? PRIMARY : [170, 178, 192], 'fill');
      doc.rect(plot2.x + i * bw2 + bw2 * 0.15, py2(c.n), bw2 * 0.7, plot2.y + plot2.h - py2(c.n), 'F');
      r.font(6.2, 'normal', INK);
      doc.text(c.label, plot2.x + i * bw2 + bw2 / 2, plot2.y + plot2.h + 4, { align: 'center' });
      r.font(5.8, 'bold', MUTED);
      doc.text(String(c.n), plot2.x + i * bw2 + bw2 / 2, py2(c.n) - 1, { align: 'center' });
    });
    const confs = spills.map((s) => s.confidenceScore).filter((c): c is number => c != null);
    r.keyValues([
      ['Detections in archive', String(spills.length)],
      ['Area percentile of this slick', percentile != null ? `${percentile}th` : '-'],
      ['Median slick area (archive)', areas.length ? `${[...areas].sort((a, b) => a - b)[Math.floor(areas.length / 2)].toFixed(2)} km²` : '-'],
      ['Mean detection confidence (archive)', confs.length ? pct(confs.reduce((a, b) => a + b, 0) / confs.length) : '-'],
    ]);
  }

  /* ---------------- Method & sources ---------------- */
  r.gap(2);
  r.subheading('Method & data sources');
  r.table(
    ['Endpoint', 'Used for'],
    [
      ['GET /api/v1/demo/spills', 'Archive of detections — regional context'],
      ['GET /api/v1/demo/spills/{id}', 'Detection record, polygon, release/age estimates'],
      ['GET /api/v1/visualization/spills/{id}', 'Backtracked drift path, origin estimate, wind/current'],
      ['GET /api/v1/demo/spills/{id}/vessels', 'Candidate vessels and sub-scores'],
      ['GET /api/v1/demo/spills/{id}/attribution/trajectory', 'AIS tracks, verification checks, search parameters'],
      ['GET /api/v1/demo/spills/{id}/predict', 'Forward drift forecast'],
      ['GET /api/v1/drift/{id}/diagnostic-plot', 'Diagnostic / SAR plot'],
    ],
    { fontSize: 7.5, colStyles: { 0: { font: 'courier', cellWidth: 82 } } }
  );
  r.paragraph(
    'Ranking, scoring and verification are computed by the backend. This report only derives geometry (great-circle distances and speeds between reported positions) and archive counts. Candidates marked "Comparison" are synthetic baselines included for contrast; identifiers flagged as synthetic are generated placeholders, not registry identifiers.',
    7.5,
    MUTED
  );

  r.writeToc(1, tocY);
  r.finalize(spill, generated);

  const stamp = new Date(generated).toISOString().slice(0, 16).replace(/[-:T]/g, '');
  doc.save(`NAUKA_evidence_${spill.spillId}_${stamp}.pdf`);
}
