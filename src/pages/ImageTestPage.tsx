import { useRef, useEffect } from 'react';
import { AlertTriangle, Satellite } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import {
  useImageAnalysis,
  ImageUploader,
  ScanningPreview,
  AnalysisResultCard as AnalysisResult,
  SampleImagesPicker,
  USE_MOCK,
} from '../features/image-detection';

export default function ImageTestPage() {
  const {
    status,
    previewUrl,
    result,
    error,
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
    <div className="flex h-screen w-full bg-slate-100/80 dark:bg-slate-950 text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Header Title Banner */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <Satellite className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
                      SAR Oil Spill Detection Lab
                    </h1>
                    <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
                      CSIRO Sentinel-1 SAR Binary Classification • ONNX Runtime WebAssembly Inference
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs font-sans text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONNX Model Loaded (WASM)</span>
                </div>
              </div>

              {/* Mock Mode Tag if Active */}
              {USE_MOCK && (
                <div className="shrink-0">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-mono border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold shadow-xs">
                    Mock Mode Active
                  </span>
                </div>
              )}
            </div>

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

            {/* TOP GRID: Left Dropzone + Right Try Sample Images (ALWAYS UNCHANGED & VISIBLE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Dropzone ALWAYS mounted */}
              <div className="lg:col-span-7">
                <ImageUploader onFileSelect={analyzeSelectedFile} />
              </div>

              {/* Right Sidebar: Try Sample Images ALWAYS mounted */}
              <div className="lg:col-span-5">
                <SampleImagesPicker onSelectSample={analyzeSelectedFile} />
              </div>
            </div>

            {/* BOTTOM SECTION: Analysis Results / Scanning Indicator below top grid with smooth scroll into view */}
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
