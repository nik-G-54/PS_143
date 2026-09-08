import { useState } from 'react';
import type { ImageMetadata } from '../../types/image-analysis';

interface Props {
  onSubmit: (metadata: ImageMetadata) => void;
  disabled?: boolean;
}

const defaultCorner = (latOffset: number, lonOffset: number) => ({
  lat: +(35.05 + latOffset).toFixed(4),
  lon: +(24.04 + lonOffset).toFixed(4),
});

export function ImageMetadataForm({ onSubmit, disabled }: Props) {
  const [corners, setCorners] = useState({
    topLeft: defaultCorner(0.01, -0.01),
    topRight: defaultCorner(0.01, 0.01),
    bottomLeft: defaultCorner(-0.01, -0.01),
    bottomRight: defaultCorner(-0.01, 0.01),
  });
  const [datetime, setDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [formError, setFormError] = useState<string | null>(null);

  function updateCorner(
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight',
    field: 'lat' | 'lon',
    value: string
  ) {
    try {
      const parsed = parseFloat(value);
      setCorners(prev => ({
        ...prev,
        [corner]: { ...prev[corner], [field]: isNaN(parsed) ? 0 : parsed },
      }));
      setFormError(null);
    } catch (err) {
      console.error('[ImageMetadataForm] Error updating corner input:', err);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    try {
      // Validate latitude and longitude values
      const cornerKeys = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
      for (const key of cornerKeys) {
        const { lat, lon } = corners[key];
        if (isNaN(lat) || lat < -90 || lat > 90) {
          throw new Error(`[Validation Error] ${key} latitude (${lat}) must be between -90 and 90.`);
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
          throw new Error(`[Validation Error] ${key} longitude (${lon}) must be between -180 and 180.`);
        }
      }

      // Validate date
      if (!datetime) {
        throw new Error('[Validation Error] Capture Date & Time is required.');
      }
      const parsedDate = new Date(datetime);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('[Validation Error] Invalid Capture Date & Time value.');
      }

      onSubmit({ corners, capturedAt: parsedDate.toISOString() });
    } catch (err) {
      console.error('[ImageMetadataForm] Validation error during submit:', err);
      setFormError(err instanceof Error ? err.message : 'Invalid metadata inputs');
    }
  }

  const inputClass = `
    w-full px-3 py-2 rounded-lg text-sm
    bg-[var(--card)] text-[var(--fg)] border border-[var(--fg)]/10
    focus:outline-none focus:border-[var(--brand)]
    font-[var(--font-mono)]
  `;

  const labelClass = 'text-xs font-[var(--font-sans)] text-[var(--fg)]/60 mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold font-[var(--font-sans)] text-[var(--fg)]">
        Image Metadata
      </h3>

      {/* Corner coordinates grid */}
      <div className="grid grid-cols-2 gap-3">
        {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map(corner => (
          <div key={corner} className="space-y-1">
            <label className={labelClass}>
              {corner.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="number"
              step="any"
              placeholder="Lat"
              value={corners[corner].lat}
              onChange={e => updateCorner(corner, 'lat', e.target.value)}
              className={inputClass}
              disabled={disabled}
            />
            <input
              type="number"
              step="any"
              placeholder="Lon"
              value={corners[corner].lon}
              onChange={e => updateCorner(corner, 'lon', e.target.value)}
              className={inputClass}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {/* Datetime */}
      <div>
        <label className={labelClass}>Capture Date & Time</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={e => setDatetime(e.target.value)}
          className={inputClass}
          disabled={disabled}
        />
      </div>

      {formError && (
        <p className="text-xs px-1 font-mono" style={{ color: 'var(--alert)' }}>
          {formError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled}
        className={`
          w-full py-2.5 rounded-lg text-sm font-semibold font-[var(--font-sans)] text-white
          transition-all hover:opacity-90 active:scale-[0.98]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{ backgroundColor: 'var(--brand)' }}
      >
        Analyze Image
      </button>
    </form>
  );
}
