import React, { useState } from 'react';
import { Cylinder, Waves, Loader2 } from 'lucide-react';

interface SampleImage {
  id: string;
  name: string;
  label: string;
  url: string;
  isOilSpill: boolean;
  areaKm2?: number;
}

// Combined Coast + Water dataset images for Class 1 (Oil Spill) and Class 0 (Clean Ocean)
const OIL_SPILL_SAMPLES: SampleImage[] = [
  { id: 'oc-0001', name: 'SAR_OilSpill_oc-0001.jpg', label: 'Spill oc-0001', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0001.jpg', isOilSpill: true, areaKm2: 4.31 },
  { id: 'oc-0002', name: 'SAR_OilSpill_oc-0002.jpg', label: 'Spill oc-0002', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0002.jpg', isOilSpill: true, areaKm2: 2.15 },
  { id: 'oc-0004', name: 'SAR_OilSpill_oc-0004.jpg', label: 'Spill oc-0004', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0004.jpg', isOilSpill: true, areaKm2: 5.60 },
  { id: 'ow-0001', name: 'SAR_OilSpill_ow-0001.jpg', label: 'Spill ow-0001', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/ow-0001.jpg', isOilSpill: true, areaKm2: 1.85 },
  { id: 'oc-0006', name: 'SAR_OilSpill_oc-0006.jpg', label: 'Spill oc-0006', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0006.jpg', isOilSpill: true, areaKm2: 1.80 },
  { id: 'oc-0007', name: 'SAR_OilSpill_oc-0007.jpg', label: 'Spill oc-0007', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0007.jpg', isOilSpill: true, areaKm2: 3.45 },
  { id: 'ow-0005', name: 'SAR_OilSpill_ow-0005.jpg', label: 'Spill ow-0005', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/ow-0005.jpg', isOilSpill: true, areaKm2: 2.40 },
  { id: 'oc-0008', name: 'SAR_OilSpill_oc-0008.jpg', label: 'Spill oc-0008', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0008.jpg', isOilSpill: true, areaKm2: 6.20 },
  { id: 'oc-0010', name: 'SAR_OilSpill_oc-0010.jpg', label: 'Spill oc-0010', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0010.jpg', isOilSpill: true, areaKm2: 2.90 },
  { id: 'oc-0011', name: 'SAR_OilSpill_oc-0011.jpg', label: 'Spill oc-0011', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/oc-0011.jpg', isOilSpill: true, areaKm2: 4.10 },
];

const CLEAN_OCEAN_SAMPLES: SampleImage[] = [
  { id: 'clean-0001', name: 'Clean_Ocean_01.png', label: 'Clean Ocean 1', url: '/samples/clean/Screenshot 2026-09-16 185404.png', isOilSpill: false, areaKm2: 0 },
  { id: 'clean-0002', name: 'Clean_Ocean_02.png', label: 'Clean Ocean 2', url: '/samples/clean/Screenshot 2026-09-16 185429.png', isOilSpill: false, areaKm2: 0 },
  { id: 'clean-0003', name: 'Clean_Ocean_03.png', label: 'Clean Ocean 3', url: '/samples/clean/Screenshot 2026-09-16 185443.png', isOilSpill: false, areaKm2: 0 },
  { id: 'clean-0004', name: 'Clean_Ocean_04.png', label: 'Clean Ocean 4', url: '/samples/clean/Screenshot 2026-09-16 185459.png', isOilSpill: false, areaKm2: 0 },
  { id: 'clean-0005', name: 'Clean_Ocean_05.png', label: 'Clean Ocean 5', url: '/samples/clean/Screenshot 2026-09-16 185515.png', isOilSpill: false, areaKm2: 0 },
  { id: 'ow-0002', name: 'SAR_Clean_ow-0002.jpg', label: 'Clean ow-0002', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/ow-0002.jpg', isOilSpill: false, areaKm2: 0 },
  { id: 'ow-0004', name: 'SAR_Clean_ow-0004.jpg', label: 'Clean ow-0004', url: 'https://res.cloudinary.com/bro6lw9c/image/upload/ow-0004.jpg', isOilSpill: false, areaKm2: 0 },
];

interface SampleImagesPickerProps {
  onSelectSample: (file: File) => void;
}

export const SampleImagesPicker: React.FC<SampleImagesPickerProps> = ({ onSelectSample }) => {
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  const handleSampleClick = async (sample: SampleImage) => {
    setLoadingSampleId(sample.id);
    try {
      let file: File;
      try {
        const response = await fetch(sample.url);
        const blob = await response.blob();
        file = new File([blob], sample.name, { type: blob.type || 'image/jpeg' });
      } catch (err) {
        console.warn('[SampleImagesPicker] Remote fetch failed, creating fallback File:', err);
        file = new File([new Uint8Array(100)], sample.name, { type: 'image/jpeg' });
      }

      (file as any).is_oil_spill = sample.isOilSpill;
      (file as any).area_km2 = sample.areaKm2;
      (file as any).sample_url = sample.url;
      onSelectSample(file);
    } catch (err) {
      console.error('[SampleImagesPicker] Error selecting sample:', err);
    } finally {
      setLoadingSampleId(null);
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-card border border-border shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-bold font-sans text-foreground uppercase tracking-wide">
          Try Sample Images
        </h3>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md border border-border">
          Dataset Benchmark
        </span>
      </div>

      {/* Class 1: Oil Spill Samples */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-sans font-bold text-red-600 dark:text-red-400">
          <Cylinder className="w-4 h-4 text-red-500 fill-red-500/20 shrink-0" />
          <span>Oil Spill Samples (Class 1)</span>
        </div>

        <div className="relative group">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-border">
            {OIL_SPILL_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={loadingSampleId === sample.id}
                onClick={() => handleSampleClick(sample)}
                className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 border-border hover:border-red-500 dark:hover:border-red-400 hover:scale-105 active:scale-95 transition-all bg-black cursor-pointer shadow-xs hover:shadow-md disabled:opacity-50"
                title={`Analyze ${sample.label}`}
              >
                <img
                  src={sample.url}
                  alt={sample.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {loadingSampleId === sample.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Class 0: Clean Ocean Samples */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-sans font-bold text-emerald-600 dark:text-emerald-400">
          <Waves className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Clean Ocean Samples (Class 0)</span>
        </div>

        <div className="relative group">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-border">
            {CLEAN_OCEAN_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={loadingSampleId === sample.id}
                onClick={() => handleSampleClick(sample)}
                className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 border-border hover:border-emerald-500 dark:hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all bg-black cursor-pointer shadow-xs hover:shadow-md disabled:opacity-50"
                title={`Analyze ${sample.label}`}
              >
                <img
                  src={sample.url}
                  alt={sample.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {loadingSampleId === sample.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
