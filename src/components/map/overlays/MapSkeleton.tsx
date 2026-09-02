export function MapSkeleton() {
  return (
    <div className="absolute inset-0 z-50 bg-background flex items-center justify-center transition-colors duration-300 font-sans">
      <div className="text-center">
        {/* Animated rings */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full border-2 border-primary/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
          </div>
        </div>
        <p className="text-foreground text-sm font-medium">Loading Mediterranean Map...</p>
        <p className="text-muted-foreground text-xs mt-1">Initializing deck.gl + MapLibre</p>
      </div>
    </div>
  );
}
export default MapSkeleton;
