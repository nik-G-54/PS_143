import type { DetectionRegion } from '../types/image-analysis';
import { MapPin } from 'lucide-react';

interface Props {
  regions: DetectionRegion[];
}

export function DetectionRegionList({ regions }: Props) {
  if (!regions || regions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Row-Column Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/80 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-4">Spill ID</th>
              <th className="py-2.5 px-4 text-right">Surface Area</th>
              <th className="py-2.5 px-4 text-center">Confidence</th>
              <th className="py-2.5 px-4 text-center">Est. Age</th>
              <th className="py-2.5 px-4">Centroid Coordinates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {regions.map((region, idx) => {
              const confPct = Math.round(Number(region.confidence || 0) * 100);
              const areaVal = Number(region.area_km2 || 0).toFixed(2);
              const ageVal = region.estimated_age_hours != null ? `${Number(region.estimated_age_hours).toFixed(1)} h` : 'N/A';
              const latLon = region.centroid
                ? `${region.centroid.lat.toFixed(4)}° N, ${region.centroid.lon.toFixed(4)}° E`
                : 'N/A';

              return (
                <tr key={region.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {region.id}
                  </td>
                  <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                    {areaVal} km²
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      {confPct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                    {ageVal}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{latLon}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
