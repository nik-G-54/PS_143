// src/components/map/WindOverlay.tsx — REWRITTEN, ACTUALLY VISIBLE & ACCURATE
import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { WindField } from '../../types/wind';

interface WindOverlayProps {
  wind: WindField | null;
  current: WindField | null;
  spillCenter: { lon: number; lat: number } | null;
  visible: boolean;
  numParticles?: number;
  particleCount?: number;
}

const FIELD_SIZE = 0.12; // degrees around spill (~12km)

function lngLatToPixel(
  lng: number,
  lat: number,
  map: any
): [number, number] | null {
  try {
    const point = map.project([lng, lat]);
    return [point.x, point.y];
  } catch {
    return null;
  }
}

function getFieldVelocity(field: WindField | null) {
  if (!field) return { u: 0, v: 0 };
  if (field.u !== undefined && field.v !== undefined && (field.u !== 0 || field.v !== 0)) {
    return { u: field.u, v: field.v };
  }
  // Meteorological origin angle -> Flowing TOWARDS vector components
  const rad = (field.direction * Math.PI) / 180;
  return {
    u: -field.speed * Math.sin(rad),
    v: -field.speed * Math.cos(rad),
  };
}

export function WindOverlay({
  wind,
  current,
  spillCenter,
  visible,
  numParticles = 8000,
  particleCount,
}: WindOverlayProps) {
  const effectiveCount = particleCount || numParticles;
  let mapContext: any = null;
  try {
    mapContext = useMap();
  } catch (e) {
    console.warn('WindOverlay rendered outside Map context:', e);
  }

  const mapRef = mapContext;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Float32Array | null>(null);
  const trailsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailsCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Combined velocity field (70% Wind + 30% Ocean Current)
  const velocityField = useCallback(() => {
    if (!wind && !current) return { u: 0, v: 0, maxSpeed: 0.01 };
    
    const windVel = getFieldVelocity(wind);
    const currVel = getFieldVelocity(current);

    const u = windVel.u * 0.7 + currVel.u * 0.3;
    const v = windVel.v * 0.7 + currVel.v * 0.3;

    const maxSpeed = Math.max(Math.sqrt(u * u + v * v) * 2, 0.02);
    return { u, v, maxSpeed };
  }, [wind, current]);

  useEffect(() => {
    const map = mapRef?.current || mapRef?.getMap?.() || null;
    if (!map || !visible || !wind || !spillCenter) {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      return;
    }

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';
      const container = map.getContainer ? map.getContainer() : map._container;
      if (container) {
        container.appendChild(canvas);
      }
      canvasRef.current = canvas;
    }

    const container = map.getContainer ? map.getContainer() : map._container;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d')!;
    ctxRef.current = ctx;

    let trailsCanvas = trailsCanvasRef.current;
    if (!trailsCanvas) {
      trailsCanvas = document.createElement('canvas');
      trailsCanvasRef.current = trailsCanvas;
    }
    trailsCanvas.width = canvas.width;
    trailsCanvas.height = canvas.height;
    const trailsCtx = trailsCanvas.getContext('2d')!;
    trailsCtxRef.current = trailsCtx;

    const n = effectiveCount;
    if (!particlesRef.current || particlesRef.current.length !== n * 4) {
      const particles = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const lon = spillCenter.lon + (Math.random() - 0.5) * FIELD_SIZE * 2;
        const lat = spillCenter.lat + (Math.random() - 0.5) * FIELD_SIZE * 2;
        particles[i * 4] = lon;
        particles[i * 4 + 1] = lat;
        particles[i * 4 + 2] = lon;
        particles[i * 4 + 3] = lat;
      }
      particlesRef.current = particles;
    }

    const vel = velocityField();

    function render() {
      if (!canvas || !ctx || !trailsCanvas || !trailsCtx) return;

      const w = canvas.width;
      const h = canvas.height;
      const particles = particlesRef.current!;
      const projection = map;

      trailsCtx.globalCompositeOperation = 'destination-out';
      trailsCtx.fillStyle = 'rgba(0,0,0,0.06)';
      trailsCtx.fillRect(0, 0, w, h);
      trailsCtx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < n; i++) {
        const lon = particles[i * 4];
        const lat = particles[i * 4 + 1];

        const screen = lngLatToPixel(lon, lat, projection);
        if (!screen) continue;

        const [sx, sy] = screen;
        const prevScreen = lngLatToPixel(
          particles[i * 4 + 2],
          particles[i * 4 + 3],
          projection
        );

        if (prevScreen) {
          const dx = sx - prevScreen[0];
          const dy = sy - prevScreen[1];
          const speed = Math.sqrt(dx * dx + dy * dy);
          const t = Math.min(speed / 8, 1);

          const r = Math.round(6 + t * 28);
          const g = Math.round(182 + t * 15);
          const b = Math.round(212 - t * 60);
          const alpha = 0.4 + t * 0.6;

          trailsCtx.beginPath();
          trailsCtx.moveTo(prevScreen[0], prevScreen[1]);
          trailsCtx.lineTo(sx, sy);
          trailsCtx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.5})`;
          trailsCtx.lineWidth = 1 + t;
          trailsCtx.stroke();
        }

        const screenSpeed = prevScreen
          ? Math.sqrt(
              (sx - prevScreen[0]) ** 2 + (sy - prevScreen[1]) ** 2
            )
          : 0;
        const t = Math.min(screenSpeed / 8, 1);

        const r = Math.round(6 + t * 28);
        const g = Math.round(182 + t * 15);
        const b = Math.round(212 - t * 60);
        const dotSize = 1.5 + t * 2;

        trailsCtx.beginPath();
        trailsCtx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        trailsCtx.fillStyle = `rgba(${r},${g},${b},${0.6 + t * 0.4})`;
        trailsCtx.fill();
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(trailsCanvas, 0, 0);

      for (let i = 0; i < n; i++) {
        particles[i * 4 + 2] = particles[i * 4];
        particles[i * 4 + 3] = particles[i * 4 + 1];

        const lon = particles[i * 4] + vel.u * 0.00003;
        const lat = particles[i * 4 + 1] + vel.v * 0.00003;

        const inBounds =
          lon >= spillCenter.lon - FIELD_SIZE &&
          lon <= spillCenter.lon + FIELD_SIZE &&
          lat >= spillCenter.lat - FIELD_SIZE &&
          lat <= spillCenter.lat + FIELD_SIZE;

        if (!inBounds || Math.random() < 0.002) {
          particles[i * 4] = spillCenter.lon + (Math.random() - 0.5) * FIELD_SIZE * 2;
          particles[i * 4 + 1] = spillCenter.lat + (Math.random() - 0.5) * FIELD_SIZE * 2;
          particles[i * 4 + 2] = particles[i * 4];
          particles[i * 4 + 3] = particles[i * 4 + 1];
        } else {
          particles[i * 4] = lon;
          particles[i * 4 + 1] = lat;
        }
      }

      animRef.current = requestAnimationFrame(render);
    }

    render();

    const onResize = () => {
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (trailsCanvas) {
          trailsCanvas.width = canvas.width;
          trailsCanvas.height = canvas.height;
        }
      }
    };
    if (map.on) {
      map.on('resize', onResize);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      if (map.off) {
        map.off('resize', onResize);
      }
      if (canvas) {
        canvas.remove();
        canvasRef.current = null;
      }
    };
  }, [mapRef, wind, current, spillCenter, visible, effectiveCount, velocityField]);

  return null;
}
