import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  MAX_CONFIDENCE_ALPHA,
  MAX_RADIUS_PX,
  MIN_CONFIDENCE_ALPHA,
  MIN_RADIUS_PX,
  SPILL_RGB,
} from '../layers/spillEncoding';

const rgba = (alpha: number) => `rgba(${SPILL_RGB.join(', ')}, ${alpha / 255})`;

const MID_RADIUS_PX = (MIN_RADIUS_PX + MAX_RADIUS_PX) / 2;
const MID_CONFIDENCE_ALPHA = (MIN_CONFIDENCE_ALPHA + MAX_CONFIDENCE_ALPHA) / 2;

/** Swatch rendered at the same pixel radius the map uses, so the legend is a true sample. */
function Dot({ radiusPx, alpha }: { radiusPx: number; alpha: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: radiusPx * 2,
        height: radiusPx * 2,
        backgroundColor: rgba(alpha),
        border: '1px solid rgba(255, 255, 255, 0.6)',
      }}
    />
  );
}

/** Explains the spill mark encoding. Collapsed by default to keep the map clear. */
export function SpillLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-11 left-4 z-10 w-[228px] overflow-hidden rounded-lg border border-border bg-card shadow-md backdrop-blur-md">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Legend
        {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-border px-3 pb-3 pt-2.5 text-[11px]">
          <div>
            <p className="mb-1.5 font-medium text-foreground">Mark size — spill area</p>
            <div className="flex items-center gap-3 pl-0.5">
              <div className="flex h-11 items-center gap-2.5">
                <Dot radiusPx={MIN_RADIUS_PX} alpha={MAX_CONFIDENCE_ALPHA} />
                <Dot radiusPx={MID_RADIUS_PX} alpha={MAX_CONFIDENCE_ALPHA} />
                <Dot radiusPx={MAX_RADIUS_PX} alpha={MAX_CONFIDENCE_ALPHA} />
              </div>
              <span className="text-muted-foreground">small → large km²</span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 font-medium text-foreground">Opacity — detection confidence</p>
            <div className="flex items-center gap-3 pl-0.5">
              <div className="flex items-center gap-2.5">
                <Dot radiusPx={MID_RADIUS_PX} alpha={MIN_CONFIDENCE_ALPHA} />
                <Dot radiusPx={MID_RADIUS_PX} alpha={MID_CONFIDENCE_ALPHA} />
                <Dot radiusPx={MID_RADIUS_PX} alpha={MAX_CONFIDENCE_ALPHA} />
              </div>
              <span className="text-muted-foreground">low → high</span>
            </div>
          </div>

          <p className="border-t border-border pt-2 leading-relaxed text-muted-foreground">
            Confidence scores the <span className="text-foreground">oil detection</span> — it is
            not a measure of vessel responsibility. Marks are proportional symbols, not the
            spill&apos;s true footprint.
          </p>
        </div>
      )}
    </div>
  );
}
