import { Trash2, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';

interface Props {
  file: File;
  previewUrl: string;
  fileSizeFormatted: string;
  dimensionsFormatted?: string;
  onRemove: () => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

export function ImagePreview({
  file,
  previewUrl,
  fileSizeFormatted,
  dimensionsFormatted,
  onRemove,
  onAnalyze,
  disabled,
}: Props) {
  const ext = file.name.split('.').pop()?.toUpperCase() || 'SAR';

  return (
    <div className="rounded-2xl p-6 bg-card border border-border shadow-lg space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-sans text-foreground">
            Image Selected
          </h2>
          <p className="text-xs text-muted-foreground font-sans">
            Review your SAR satellite image before starting detection
          </p>
        </div>
        <button
          onClick={onRemove}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
      </div>

      {/* Image Preview Box */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/90 border border-border/80 group">
        <img
          src={previewUrl}
          alt={file.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          <span>SAR IMAGE</span>
        </div>
      </div>

      {/* Technical Metadata Line */}
      <div className="p-3.5 rounded-xl bg-accent/40 border border-border/60 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 truncate text-foreground font-medium">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate max-w-[240px]" title={file.name}>
            {file.name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground shrink-0 font-semibold">
          <span>{ext}</span>
          <span className="opacity-30">•</span>
          <span>{dimensionsFormatted || 'Dimensions Loading...'}</span>
          <span className="opacity-30">•</span>
          <span>{fileSizeFormatted}</span>
        </div>
      </div>

      {/* Primary Action CTA */}
      <div className="pt-2">
        <button
          onClick={onAnalyze}
          disabled={disabled}
          className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>Analyze Image</span>
        </button>
      </div>
    </div>
  );
}
