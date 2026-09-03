import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, AlertTriangle, Bug } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import { USE_MOCK } from '../services/mlApi';
import { ImageUploader } from '../components/image-test/ImageUploader';
import { ImageMetadataForm } from '../components/image-test/ImageMetadataForm';
import { ScanningPreview } from '../components/image-test/ScanningPreview';
import { AnalysisResultCard } from '../components/image-test/AnalysisResultCard';
import { ScanHistory } from '../components/image-test/ScanHistory';
import type { ImageMetadata } from '../types/image-analysis';

export default function ImageTestPage() {
  const navigate = useNavigate();
  const { status, result, error, previewUrl, history, analyze, reset, clearHistory } = useImageAnalysis();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  function handleFileSelect(file: File) {
    try {
      setPageError(null);
      setSelectedFile(file);
    } catch (err) {
      console.error('[ImageTestPage] Error setting selected file:', err);
      setPageError('[Page Error] Failed to select file.');
    }
  }

  function handleMetadataSubmit(metadata: ImageMetadata) {
    try {
      setPageError(null);
      if (!selectedFile) {
        setPageError('[Validation Error] Please select an image file before analyzing.');
        return;
      }
      analyze(selectedFile, metadata);
    } catch (err) {
      console.error('[ImageTestPage] Error submitting metadata:', err);
      setPageError(`[Submit Exception] ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleViewMap(lat: number, lon: number) {
    try {
      navigate(`/live-map?lat=${lat}&lon=${lon}`);
    } catch (err) {
      console.error('[ImageTestPage] Navigation error:', err);
      setPageError('[Navigation Error] Failed to navigate to live map.');
    }
  }

  function handleReset() {
    try {
      setPageError(null);
      setSelectedFile(null);
      reset();
    } catch (err) {
      console.error('[ImageTestPage] Reset error:', err);
    }
  }

  const isProcessing = status === 'uploading' || status === 'scanning';

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scan className="w-6 h-6" style={{ color: 'var(--brand)' }} />
                <div>
                  <h1 className="text-2xl font-semibold font-[var(--font-sans)] text-[var(--fg)]">
                    Test Your Image
                  </h1>
                  <p className="text-sm text-[var(--fg)]/50 font-[var(--font-sans)]">
                    Upload a satellite image to verify oil spill detection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {USE_MOCK && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-[var(--brand)] text-[var(--brand)] bg-[var(--brand)]/10 font-medium">
                    Mock Mode Active
                  </span>
                )}
                {/* Debug / Test Mode Toggle */}
                <button
                  onClick={() => setShowDiagnostics(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-border bg-card hover:bg-accent text-muted-foreground transition-all cursor-pointer"
                  title="Toggle test mode / diagnostics"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>{showDiagnostics ? 'Hide Debug' : 'Debug Mode'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostics Bar (Visible when toggled or error present) */}
            {showDiagnostics && (
              <div className="mb-6 p-4 rounded-xl bg-card border border-border text-xs font-mono space-y-1.5 text-foreground/80">
                <p className="font-semibold text-primary">System Diagnostic State (Testing mode):</p>
                <p>Status: <span className="text-foreground font-bold">{status}</span></p>
                <p>Selected File: {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'None'}</p>
                <p>Preview URL: {previewUrl ? 'Active Blob' : 'None'}</p>
                <p>History Items Count: {history.length}</p>
              </div>
            )}

            {/* Page Level Error Alert */}
            {pageError && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-mono">{pageError}</span>
              </div>
            )}

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column — Upload + Form + Result */}
              <div className="lg:col-span-2 space-y-6">
                {status === 'idle' && (
                  <>
                    <ImageUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
                    {selectedFile && (
                      <ImageMetadataForm onSubmit={handleMetadataSubmit} disabled={isProcessing} />
                    )}
                  </>
                )}

                {(status === 'uploading' || status === 'scanning') && previewUrl && (
                  <ScanningPreview imageUrl={previewUrl} status={status} />
                )}

                {status === 'result' && result && (
                  <AnalysisResultCard result={result} onReset={handleReset} onViewMap={handleViewMap} />
                )}

                {status === 'error' && (
                  <div className="rounded-xl p-5 text-center bg-[var(--card)] border border-[var(--fg)]/10 space-y-2">
                    <p className="text-sm font-[var(--font-sans)] text-destructive font-mono">
                      {error}
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-3 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-semibold font-[var(--font-sans)] cursor-pointer hover:opacity-90 transition-all inline-block"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Right column — History */}
              <div>
                <ScanHistory history={history} onClear={clearHistory} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
