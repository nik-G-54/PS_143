import React from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Waves } from 'lucide-react';
import {
  DEPTH_COLOR_OPTIONS,
  FOAM_COLOR_OPTIONS,
  OCEAN_PALETTES,
  SURFACE_COLOR_OPTIONS,
  useOceanControls,
  type OceanControlValues,
} from '../../../context/OceanControlsContext';

type SliderKey = {
  [K in keyof OceanControlValues]: OceanControlValues[K] extends number ? K : never;
}[keyof OceanControlValues];

const SLIDERS: {
  key: SliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: 'uBig', label: 'uBig', min: 0, max: 1, step: 0.001 },
  { key: 'uFrequencyX', label: 'uFrequencyX', min: 0, max: 10, step: 0.001 },
  { key: 'uFrequencyY', label: 'uFrequencyY', min: 0, max: 10, step: 0.001 },
  { key: 'uSpeed', label: 'uSpeed', min: 0, max: 4, step: 0.01 },
  { key: 'uColorOffset', label: 'uColorOffset', min: 0, max: 1, step: 0.001 },
  { key: 'uColorMultiplier', label: 'uColorMultiplier', min: 0, max: 10, step: 0.001 },
  { key: 'uSmallWavesElevation', label: 'uSmallWavesElevation', min: 0, max: 1, step: 0.001 },
  { key: 'uSmallWavesFrequency', label: 'uSmallWavesFrequency', min: 0, max: 30, step: 0.001 },
  { key: 'uSmallWavesSpeed', label: 'uSmallWavesSpeed', min: 0, max: 4, step: 0.001 },
  { key: 'uSmallIterations', label: 'uSmallIterations', min: 0, max: 5, step: 1 },
  { key: 'uFoamThreshold', label: 'uFoamThreshold', min: 0, max: 1, step: 0.001 },
  { key: 'uFoamStrength', label: 'uFoamStrength', min: 0, max: 1, step: 0.001 },
];

function ColorSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string; hex: string }[];
  onChange: (hex: string) => void;
}) {
  const matched = options.find((o) => o.hex.toLowerCase() === value.toLowerCase());
  const selectValue = matched?.hex ?? value;

  return (
    <label className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/[0.04] rounded-md">
      <span className="w-[108px] shrink-0 text-[11px] text-slate-300/90 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <span
          className="w-4 h-4 rounded-sm border border-white/25 shrink-0 shadow-inner"
          style={{ backgroundColor: value }}
          aria-hidden
        />
        <select
          value={selectValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-slate-900/90 border border-white/10 rounded-md text-[10px] text-slate-100 px-1.5 py-1 outline-none focus:border-sky-400/50 cursor-pointer"
        >
          {!matched && (
            <option value={value}>Custom ({value})</option>
          )}
          {options.map((o) => (
            <option key={o.id} value={o.hex}>
              {o.label} · {o.hex}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const display =
    step >= 1 ? String(Math.round(value)) : Number(value).toFixed(step < 0.01 ? 3 : 2);

  return (
    <label className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/[0.04] rounded-md">
      <span className="w-[108px] shrink-0 text-[11px] text-slate-300/90 truncate" title={label}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-sky-400 cursor-pointer"
      />
      <span className="w-10 text-right text-[10px] font-mono text-sky-200/90 tabular-nums">
        {display}
      </span>
    </label>
  );
}

/**
 * lil-gui–style ocean Controls panel (from Threejs-water-shader reference).
 * Colors use corner dropdown menus instead of color pickers.
 */
export const OceanControlsPanel: React.FC = () => {
  const {
    controls,
    panelOpen,
    enabled,
    setPanelOpen,
    setEnabled,
    setControl,
    applyPalette,
    resetControls,
  } = useOceanControls();

  return (
    <div className="absolute top-3 right-3 z-40 pointer-events-auto max-w-[calc(100vw-1.5rem)]">
      <div className="w-[300px] sm:w-[320px] rounded-xl overflow-hidden border border-white/12 bg-[#1a1f24]/92 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border-b border-white/10 text-left"
        >
          <span className="flex items-center gap-2 text-[12px] font-semibold tracking-wide text-slate-100">
            <Waves size={14} className="text-sky-300" />
            Controls
          </span>
          {panelOpen ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </button>

        {panelOpen && (
          <div className="max-h-[min(70vh,520px)] overflow-y-auto custom-scrollbar py-1.5">
            <div className="px-2.5 pb-1.5 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="accent-sky-400"
                />
                Live ocean
              </label>
              <button
                type="button"
                onClick={resetControls}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-200 transition-colors"
                title="Reset to reference defaults"
              >
                <RotateCcw size={11} />
                Reset
              </button>
            </div>

            {/* Palette dropdown at the corner of the panel */}
            <div className="px-2.5 pb-2">
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Color palette
              </label>
              <div className="flex items-center gap-2">
                <span className="flex shrink-0">
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-white/20"
                    style={{ backgroundColor: controls.depthColor }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-white/20 -ml-1"
                    style={{ backgroundColor: controls.surfaceColor }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-white/20 -ml-1"
                    style={{ backgroundColor: controls.foamColor }}
                  />
                </span>
                <select
                  value={controls.paletteId}
                  onChange={(e) => applyPalette(e.target.value)}
                  className="flex-1 bg-slate-900/90 border border-white/10 rounded-md text-[11px] text-slate-100 px-2 py-1.5 outline-none focus:border-sky-400/50 cursor-pointer"
                >
                  {OCEAN_PALETTES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-px bg-white/8 mx-2 mb-1" />

            {SLIDERS.slice(0, 4).map((s) => (
              <ControlSlider
                key={s.key}
                label={s.label}
                value={controls[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => setControl(s.key, v)}
              />
            ))}

            <div className="h-px bg-white/8 mx-2 my-1" />

            <ColorSelect
              label="depthColor"
              value={controls.depthColor}
              options={DEPTH_COLOR_OPTIONS}
              onChange={(hex) => setControl('depthColor', hex)}
            />
            <ColorSelect
              label="surfaceColor"
              value={controls.surfaceColor}
              options={SURFACE_COLOR_OPTIONS}
              onChange={(hex) => setControl('surfaceColor', hex)}
            />

            {SLIDERS.slice(4, 6).map((s) => (
              <ControlSlider
                key={s.key}
                label={s.label}
                value={controls[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => setControl(s.key, v)}
              />
            ))}

            <div className="h-px bg-white/8 mx-2 my-1" />

            {SLIDERS.slice(6, 10).map((s) => (
              <ControlSlider
                key={s.key}
                label={s.label}
                value={controls[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => setControl(s.key, v)}
              />
            ))}

            <div className="h-px bg-white/8 mx-2 my-1" />

            <ColorSelect
              label="foamColor"
              value={controls.foamColor}
              options={FOAM_COLOR_OPTIONS}
              onChange={(hex) => setControl('foamColor', hex)}
            />

            {SLIDERS.slice(10).map((s) => (
              <ControlSlider
                key={s.key}
                label={s.label}
                value={controls[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => setControl(s.key, v)}
              />
            ))}

            <p className="px-3 pt-2 pb-1 text-[9px] text-slate-500 leading-relaxed">
              Mapped to Gerstner ocean · wind still follows backend environment
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
