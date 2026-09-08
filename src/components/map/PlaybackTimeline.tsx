// src/components/map/PlaybackTimeline.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { SpillEvent } from "../../types/spill";

interface PlaybackTimelineProps {
  spills: SpillEvent[];
  activeSpillId?: string | null;
  onSelectSpill: (spill: SpillEvent) => void;
}

function dayBucketKey(spill: SpillEvent) {
  return new Date(spill.detected_at).toISOString().slice(0, 10);
}

export function PlaybackTimeline({
  spills,
  activeSpillId,
  onSelectSpill,
}: PlaybackTimelineProps) {
  const sortedSpills = useMemo(
    () =>
      [...spills].sort(
        (a, b) =>
          new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
      ),
    [spills]
  );

  const dateBuckets = useMemo(() => {
    const buckets: Array<{
      key: string;
      label: string;
      start: number;
    }> = [];

    sortedSpills.forEach((spill, index) => {
      const key = dayBucketKey(spill);
      const prev = buckets[buckets.length - 1];

      if (!prev || prev.key !== key) {
        const dt = new Date(`${key}T00:00:00Z`);
        buckets.push({
          key,
          label: dt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          start: index,
        });
      }
    });

    return buckets;
  }, [sortedSpills]);

  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [speed, setSpeed] = useState(1);

  const onSelectRef = useRef(onSelectSpill);
  useEffect(() => {
    onSelectRef.current = onSelectSpill;
  }, [onSelectSpill]);

  /* Sync index if user clicks a pin on the map directly or via external selection */
  useEffect(() => {
    if (!activeSpillId) return;
    const next = sortedSpills.findIndex((s) => s.spill_id === activeSpillId);
    if (next >= 0) setIndex(next);
  }, [activeSpillId, sortedSpills]);

  /* Keep index valid if data changes */
  useEffect(() => {
    setIndex((prev) => Math.min(prev, Math.max(0, sortedSpills.length - 1)));
  }, [sortedSpills.length]);

  /* Select spill helper for explicit user interaction */
  const selectIndex = (newIndex: number) => {
    setIndex(newIndex);
    const spill = sortedSpills[newIndex];
    if (spill) {
      onSelectRef.current(spill);
    }
  };

  /* Playback loop — auto advances and selects during active playback */
  useEffect(() => {
    if (!isPlaying || sortedSpills.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => {
        let next = prev + direction;
        if (next < 0) next = sortedSpills.length - 1;
        if (next >= sortedSpills.length) next = 0;
        
        const nextSpill = sortedSpills[next];
        if (nextSpill) {
          onSelectRef.current(nextSpill);
        }
        return next;
      });
    }, 900 / speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, direction, sortedSpills]);

  const cycleSpeed = () => {
    setSpeed((s) => (s === 0.5 ? 1 : s === 1 ? 2 : s === 2 ? 4 : 0.5));
  };

  if (!sortedSpills.length) return null;

  const current = sortedSpills[index];

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-700/70 bg-slate-950/85 px-4 pb-1.5 pt-3 shadow-2xl backdrop-blur-xl">
        {/* Transport controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              setDirection(1);
              selectIndex(0);
            }}
            disabled={index === 0 && !isPlaying}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
          >
            ⏮ First
          </button>

          <button
            onClick={() => {
              setDirection(-1);
              setIsPlaying(true);
              const next = index - 1 < 0 ? sortedSpills.length - 1 : index - 1;
              selectIndex(next);
            }}
            disabled={isPlaying && direction === -1}
            className="rounded-lg border border-cyan-700 bg-cyan-950/60 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-900 disabled:opacity-40 cursor-pointer"
          >
            ◀ Reverse
          </button>

          <button
            onClick={() => {
              setDirection(1);
              const nextPlaying = !isPlaying;
              setIsPlaying(nextPlaying);
              if (nextPlaying && !activeSpillId) {
                selectIndex(index);
              }
            }}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-red-500 cursor-pointer"
          >
            {isPlaying && direction === 1 ? "⏸ Pause" : "▶ Play"}
          </button>

          <button
            onClick={() => {
              setDirection(1);
              setIsPlaying(true);
              const next = (index + 1) % sortedSpills.length;
              selectIndex(next);
            }}
            disabled={isPlaying && direction === 1}
            className="rounded-lg border border-red-700 bg-red-950/60 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-900 disabled:opacity-40 cursor-pointer"
          >
            Forward ▶
          </button>

          <button
            onClick={cycleSpeed}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-slate-700 cursor-pointer"
          >
            {speed}×
          </button>

          <div className="ml-2 min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 font-mono">
              {activeSpillId && current?.confidence_score
                ? `Confidence ${(current.confidence_score * 100).toFixed(0)}% • ${current.area_km2.toFixed(1)} km²`
                : "Select a spill on map or press Play"}
            </div>
            <div className="truncate text-xs text-slate-300 font-mono">
              {activeSpillId && current ? `${current.spill_id} — ${current.detected_at}` : "No spill selected"}
            </div>
          </div>

          <div className="rounded-md bg-slate-800/80 px-2.5 py-1 text-center font-mono text-xs text-slate-400">
            {activeSpillId ? index + 1 : 0}
            <span className="mx-0.5 text-slate-600">/</span>
            {sortedSpills.length}
          </div>
        </div>

        {/* Slider row */}
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, sortedSpills.length - 1)}
            value={index}
            onChange={(e) => {
              setIsPlaying(false);
              selectIndex(Number(e.target.value));
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-red-600"
          />
        </div>

        {/* Date bucket markers */}
        <div className="relative mt-0.5 h-6 overflow-hidden">
          {dateBuckets.map((bucket) => {
            const pct =
              sortedSpills.length > 1
                ? (bucket.start / (sortedSpills.length - 1)) * 100
                : 0;
            return (
              <button
                key={bucket.key}
                onClick={() => {
                  setDirection(1);
                  setIsPlaying(false);
                  selectIndex(bucket.start);
                }}
                style={{ left: `${pct}%` }}
                className="absolute -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                {bucket.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
