import { AlertTriangle } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import {
  useImageAnalysis,
  ImageUploader,
  ImagePreview,
  ScanningPreview,
  AnalysisResult,
  ScanHistory,
  USE_MOCK,
} from '../features/image-detection';

export default function ImageTestPage() {
  const {
    status,
    selectedFile,
    dimensions,
    fileSizeFormatted,
    previewUrl,
    result,
    error,
    history,
    handleFileSelect,
    handleRemoveSelected,
    startAnalysis,
    reset,
    loadHistoricalScan,
    clearHistory,
  } = useImageAnalysis();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Mock Mode Tag if Active */}
            {USE_MOCK && (
              <div className="flex justify-end">
                <span className="px-3 py-1 rounded-full text-xs font-mono border border-amber-500/40 text-amber-500 bg-amber-500/10 font-semibold">
                  Mock Mode Active
                </span>
              </div>
            )}

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

            {/* 70% Main Workspace / 30% Scan History Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Main Workspace (~70% = col-span-8) */}
              <div className="lg:col-span-8">
                {status === 'idle' && (
                  <ImageUploader onFileSelect={handleFileSelect} />
                )}

                {status === 'selected' && selectedFile && previewUrl && (
                  <ImagePreview
                    file={selectedFile}
                    previewUrl={previewUrl}
                    fileSizeFormatted={fileSizeFormatted}
                    dimensionsFormatted={dimensions}
                    onRemove={handleRemoveSelected}
                    onAnalyze={startAnalysis}
                  />
                )}

                {(status === 'uploading' || status === 'scanning') && previewUrl && (
                  <ScanningPreview imageUrl={previewUrl} />
                )}

                {status === 'result' && result && (
                  <AnalysisResult result={result} onReset={reset} />
                )}
              </div>

              {/* Right Sidebar Scan History (~30% = col-span-4) */}
              <div className="lg:col-span-4 min-h-[500px] h-full">
                <ScanHistory
                  history={history}
                  onSelectScan={loadHistoricalScan}
                  onClear={clearHistory}
                  activeScanId={result?.id}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
