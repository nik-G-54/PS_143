import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileImage, AlertCircle } from 'lucide-react';

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
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border/80 hover:border-primary/60 bg-card/60 hover:bg-card shadow-sm hover:shadow-md'
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

        {/* Floating Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold font-sans text-foreground mb-1.5 tracking-tight">
          Upload SAR Image
        </h3>
        
        <p className="text-sm text-muted-foreground font-sans max-w-sm mb-6 leading-relaxed">
          Drag & drop your satellite image here or browse from your device
        </p>

        {/* File Types & Size Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono bg-accent/60 border border-border/80 text-muted-foreground mb-6">
          <FileImage className="w-3.5 h-3.5 text-primary" />
          <span>JPG · PNG · TIFF · WEBP</span>
          <span className="opacity-40">•</span>
          <span>Max 50 MB</span>
        </div>

        {/* Browse Button */}
        <button
          type="button"
          disabled={disabled}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md group-hover:shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          Browse Image
        </button>
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
