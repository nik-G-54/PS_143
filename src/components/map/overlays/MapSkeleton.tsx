import { useTheme } from '../../../hooks/useTheme';

export function MapSkeleton() {
  const { theme } = useTheme();
  
  const bg = theme === 'dark' ? 'bg-[#0F1117]' : 'bg-slate-50';
  const textTitle = theme === 'dark' ? 'text-[#94A3B8]' : 'text-slate-600';
  const textSub = theme === 'dark' ? 'text-[#64748B]' : 'text-slate-400';
  const primaryColor = theme === 'dark' ? 'bg-[#00D9A6]' : 'bg-[#00B894]';
  const ring1 = theme === 'dark' ? 'border-[#00D9A6]/20' : 'border-[#00B894]/20';
  const ring2 = theme === 'dark' ? 'border-[#00D9A6]/40' : 'border-[#00B894]/40';
  const ring3 = theme === 'dark' ? 'border-[#00D9A6]/60' : 'border-[#00B894]/60';

  return (
    <div className={`absolute inset-0 z-50 ${bg} flex items-center justify-center transition-colors duration-300`}>
      <div className="text-center">
        {/* Animated rings */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className={`absolute inset-0 rounded-full border-2 ${ring1} animate-ping`} />
          <div className={`absolute inset-2 rounded-full border-2 ${ring2} animate-pulse`} />
          <div className={`absolute inset-4 rounded-full border-2 ${ring3}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${primaryColor} animate-pulse`} />
          </div>
        </div>
        <p className={`${textTitle} text-sm font-medium`}>Loading Mediterranean Map...</p>
        <p className={`${textSub} text-xs mt-1`}>Initializing deck.gl + MapLibre</p>
      </div>
    </div>
  );
}
export default MapSkeleton;
