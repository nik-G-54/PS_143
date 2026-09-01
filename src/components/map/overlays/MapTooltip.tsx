import { TooltipData } from '../../../types/ui';

interface MapTooltipProps {
  hoverInfo: TooltipData | null;
  theme: 'light' | 'dark';
}

export function MapTooltip({ hoverInfo, theme }: MapTooltipProps) {
  if (!hoverInfo) return null;

  const { x, y, type, data } = hoverInfo;
  const cardBg = theme === 'dark' ? 'bg-[#151F33] border-[#64748B]/30' : 'bg-white border-[#E5E7EB]';
  const textHeading = theme === 'dark' ? 'text-[#F8FAFC]' : 'text-[#1A1D23]';
  const textBody = theme === 'dark' ? 'text-[#94A3B8]' : 'text-[#4B5563]';
  const textPrimary = theme === 'dark' ? 'text-[#0EA5E9]' : 'text-[#00B894]';

  return (
    <div
      className={`absolute z-40 pointer-events-none ${cardBg} border rounded-lg p-3 shadow-lg flex flex-col gap-1 text-xs`}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -105%)', // Center horizontally and display above coordinates
        marginTop: '-10px'
      }}
    >
      {type === 'spill' && (
        <>
          <div className={`font-mono font-bold ${textHeading} text-sm`}>{data.id}</div>
          {data.confidence !== undefined && (
            <div className={textBody}>
              Confidence:{' '}
              <span className={`font-semibold ${textPrimary}`}>
                {Math.round(data.confidence * 100)}%
              </span>
            </div>
          )}
          {data.status && (
            <div className={textBody}>
              Status: <span className="capitalize font-medium">{data.status}</span>
            </div>
          )}
        </>
      )}

      {type === 'vessel' && (
        <>
          <div className={`font-mono font-bold ${textPrimary} text-sm`}>{data.id}</div>
          {data.vesselType && (
            <div className={textBody}>
              Type: <span className="font-medium">{data.vesselType}</span>
            </div>
          )}
          {data.speed !== undefined && (
            <div className={textBody}>
              Speed: <span className="font-mono font-semibold">{data.speed.toFixed(1)} kn</span>
            </div>
          )}
        </>
      )}

      {type === 'source-region' && (
        <>
          <div className={`font-bold ${textHeading}`}>Source Region</div>
          <div className={textBody}>Computed origin area of the oil spill.</div>
        </>
      )}
    </div>
  );
}
export default MapTooltip;
