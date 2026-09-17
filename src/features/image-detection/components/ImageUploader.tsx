import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onFileSelect, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): boolean {
    if (!file) {
      setValidationError('No file selected.');
      return false;
    }
    if (file.size === 0) {
      setValidationError('Selected file is empty (0 bytes).');
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|tiff|tif|webp)$/i)) {
      setValidationError('Invalid file format. Only JPG, PNG, TIFF, and WEBP formats are supported.');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setValidationError('File size exceeds the 50MB maximum limit.');
      return false;
    }
    setValidationError(null);
    return true;
  }

  function handleFile(file: File) {
    if (validate(file)) {
      onFileSelect(file);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone Container */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`group relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[360px] ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-900/90 shadow-md hover:shadow-xl'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.tiff,.tif,.webp"
          onChange={onChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Floating Upload Cloud Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-all duration-300 shadow-sm">
          <Upload className="w-7 h-7 stroke-[1.75]" />
        </div>

        <h3 className="text-base font-bold font-sans text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
          Drop a SAR image or GeoTIFF (.tif) here or click to upload
        </h3>
        
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans max-w-md leading-relaxed font-medium">
          Accepts .tif, .tiff, .jpg, .png (Auto-calibrates 32-bit Sentinel-1 dB)
        </p>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
