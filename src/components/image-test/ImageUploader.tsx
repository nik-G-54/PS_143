import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024;

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onFileSelect, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): boolean {
    try {
      if (!file) {
        setValidationError('[Validation Error] No file object detected.');
        return false;
      }
      if (file.size === 0) {
        setValidationError('[Validation Error] The selected file is empty (0 bytes).');
        return false;
      }
      if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|tiff|tif|webp)$/i)) {
        setValidationError('[Type Error] Only JPEG, PNG, TIFF, and WebP image formats are allowed.');
        return false;
      }
      if (file.size > MAX_SIZE) {
        setValidationError('[Size Error] File size exceeds the maximum limit of 50MB.');
        return false;
      }
      setValidationError(null);
      return true;
    } catch (err) {
      console.error('[ImageUploader] Error during file validation:', err);
      setValidationError('[File Read Error] Failed to read file details.');
      return false;
    }
  }

  function handleFile(file: File) {
    try {
      console.log('%c[ImageUploader] File selected/dropped:', 'color: #3b82f6; font-weight: bold;', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type
      });
      if (validate(file)) {
        onFileSelect(file);
      }
    } catch (err) {
      console.error('[ImageUploader] Error in handleFile:', err);
      setValidationError('[Upload Exception] Error processing file selection.');
    }
  }

  function onDrop(e: DragEvent) {
    try {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      } else {
        setValidationError('[Drop Error] No file detected in drop event.');
      }
    } catch (err) {
      console.error('[ImageUploader] Error in onDrop handler:', err);
      setValidationError('[Drop Error] Failed to process dropped item.');
    }
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    } catch (err) {
      console.error('[ImageUploader] Error in file input change:', err);
      setValidationError('[File Input Error] Failed to read chosen file.');
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => {
          try {
            inputRef.current?.click();
          } catch (err) {
            console.error('[ImageUploader] Error clicking file input:', err);
          }
        }}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-[var(--brand)] bg-[var(--brand)]/5'
            : 'border-[var(--fg)]/20 hover:border-[var(--brand)]/50 hover:bg-[var(--card)]'
          }
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-[var(--fg)]/40" />
        <p className="text-sm font-[var(--font-sans)] text-[var(--fg)]/70">
          Drag & drop a satellite image here
        </p>
        <p className="text-xs text-[var(--fg)]/40 mt-1">or click to browse</p>
        <p className="text-xs text-[var(--fg)]/30 mt-2">JPEG, PNG, TIFF, WebP — Max 50MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.tiff,.tif,.webp"
        onChange={onChange}
        className="hidden"
      />

      {validationError && (
        <p className="text-xs mt-2 px-1 font-mono" style={{ color: 'var(--alert)' }}>{validationError}</p>
      )}
    </div>
  );
}
