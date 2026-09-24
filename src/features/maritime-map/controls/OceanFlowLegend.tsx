/**
 * Colour key for the ambient wind + current particle overlay. The toggle
 * itself lives in `MapRightSidebar`; this stays on the map so the key sits
 * next to what it explains instead of inside the control rail.
 */
export function OceanFlowLegend() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground shadow-md backdrop-blur-md">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-4 rounded-full bg-sky-400" />
        Wind
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-4 rounded-full bg-teal-400" />
        Current
      </span>
    </div>
  );
}
