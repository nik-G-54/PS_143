import type { DetectionRegion } from '../types/image-analysis';
import { DetectionRegionItem } from './DetectionRegionItem';

interface Props {
  regions: DetectionRegion[];
}

export function DetectionRegionList({ regions }: Props) {
  if (!regions || regions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold font-mono text-muted-foreground tracking-wider uppercase">
          DETECTED REGIONS
        </h3>
        <span className="text-xs font-mono text-muted-foreground font-semibold">
          {regions.length} region{regions.length > 1 ? 's' : ''} identified
        </span>
      </div>

      <div className="space-y-2.5">
        {regions.map(region => (
          <DetectionRegionItem key={region.id} region={region} />
        ))}
      </div>
    </div>
  );
}
