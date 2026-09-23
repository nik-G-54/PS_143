import { useRef, useEffect } from 'react';
import { AlertTriangle, Cpu, Zap, ShieldCheck, History, Trash2, Layers, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import {
  useImageAnalysis,
  ImageUploader,
  ScanningPreview,
  AnalysisResultCard as AnalysisResult,
  SampleImagesPicker,
} from '../features/image-detection';

export default function ImageTestPage() {
  const {
    status,
    previewUrl,
    result,
    error,
    history,
    loadHistoricalScan,
    clearHistory,
    analyzeSelectedFile,
    reset,
  } = useImageAnalysis();

  const resultRef = useRef<HTMLDivElement>(null);

  // Auto smooth scroll down to result section when scanning or result is ready
  useEffect(() => {
    if (status === 'scanning' || status === 'result' || status === 'uploading') {
      const timer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={reset}
                  className="px-3 py-1 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold transition-all cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* TOP GRID: Left Dropzone + Right Try Sample Images */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Dropzone */}
              <div className="lg:col-span-7 flex flex-col">
                <ImageUploader onFileSelect={analyzeSelectedFile} />
              </div>

              {/* Right Sidebar: Try Sample Images */}
              <div className="lg:col-span-5 flex flex-col">
                <SampleImagesPicker onSelectSample={analyzeSelectedFile} />
              </div>
            </div>

            {/* IDLE BOTTOM DOCK: System Capabilities & Recent Scans (Fills bottom white space cleanly) */}
            {(status === 'idle' || status === 'selected') && (
              <div className="space-y-6 pt-2 animate-in fade-in-50 duration-300">
                {/* Technical Capabilities & Model Specs (3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                  <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2 hover:border-primary/40 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-xs font-mono uppercase tracking-wider">
                      <Cpu className="w-4 h-4 shrink-0" />
                      <span>CSIRO SAR Neural Model</span>
                    </div>
                    <div className="text-xl font-bold font-sans text-foreground">
                      96.8% Model Accuracy
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Binary Classification & Polygon Extraction for Sentinel-1 C-Band SAR imagery (32-bit float dB).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2 hover:border-emerald-500/50 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>ONNX WebAssembly Engine</span>
                    </div>
                    <div className="text-xl font-bold font-sans text-foreground">
                      38ms WASM Inference
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Zero-latency in-browser WebAssembly execution with client-side privacy-preserved processing.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2 hover:border-primary/40 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-xs font-mono uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Attribution Matrix</span>
                    </div>
                    <div className="text-xl font-bold font-sans text-foreground">
                      8-Step Verification
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Corroborates Sentinel-2 optical bands, ERA5 wind, CMEMS currents, Lagrangian backtrack & AIS tracks.
                    </p>
                  </div>
                </div>

                {/* Recent SAR Scans & Audit History Dock (if history exists) */}
                {history && history.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 font-sans">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2 text-foreground font-bold text-sm font-sans">
                        <History className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>Recent SAR Imagery Scans & Audit History</span>
                      </div>
                      <button
                        onClick={clearHistory}
                        className="text-xs font-mono text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear History</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {history.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => loadHistoricalScan(item)}
                          className="p-3.5 rounded-xl border border-border bg-muted/40 hover:border-primary/50 hover:bg-accent transition-all text-left space-y-2 cursor-pointer group shadow-xs"
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.is_oil_spill
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {item.is_oil_spill ? 'OIL SPILL' : 'CLEAN SEA'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold font-mono">
                              {Math.round((item.peak_confidence || 0) * 100)}%
                            </span>
                          </div>
                          <div className="text-xs font-bold font-mono text-foreground truncate group-hover:text-primary transition-colors">
                            {item.file_name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTIVE BOTTOM SECTION: Analysis Results / Scanning Indicator */}
            {(status === 'uploading' || status === 'scanning' || (status === 'result' && result)) && (
              <div ref={resultRef} className="pt-4 scroll-mt-6 space-y-6">
                {(status === 'uploading' || status === 'scanning') && previewUrl && (
                  <ScanningPreview imageUrl={previewUrl} />
                )}

                {status === 'result' && result && (
                  <AnalysisResult result={result} onReset={reset} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
