import { useState, useCallback, useRef } from 'react';
import type { UIState, AnalysisResult, ScanHistoryItem } from '../types/image-analysis';
import { analyzeImage } from '../services/mlApi';

const HISTORY_KEY = 'nauka-sar-scan-history';
const MAX_HISTORY = 10;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function loadHistory(): ScanHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[useImageAnalysis] Failed to load history from localStorage:', err);
    return [];
  }
}

function saveHistory(items: ScanHistoryItem[]) {
  try {
    const sliced = items.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sliced));
  } catch (err) {
    console.error('[useImageAnalysis] Failed to save history to localStorage:', err);
  }
}

export function useImageAnalysis() {
  const [status, setStatus] = useState<UIState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<string | undefined>(undefined);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>(loadHistory);

  const abortRef = useRef<AbortController | null>(null);

  // Step 1: Handle File Selection (State 1 -> State 2)
  const handleFileSelect = useCallback((file: File) => {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setFileSizeFormatted(formatFileSize(file.size));
      setResult(null);
      setError(null);
      setStatus('selected');

      // Dynamically extract image dimensions (Width x Height px)
      const img = new Image();
      img.onload = () => {
        setDimensions(`${img.width} × ${img.height} px`);
        console.log(`[useImageAnalysis] Loaded image dimensions: ${img.width} × ${img.height} px`);
      };
      img.onerror = () => {
        setDimensions(undefined);
      };
      img.src = url;

      console.log('[useImageAnalysis] State transition: idle -> selected', { fileName: file.name, size: formatFileSize(file.size) });
    } catch (err) {
      console.error('[useImageAnalysis] Error during file selection:', err);
      setError(`Failed to process selected file: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('error');
    }
  }, [previewUrl]);

  // Step 2: Remove Selected File (State 2 -> State 1)
  const handleRemoveSelected = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDimensions(undefined);
    setResult(null);
    setError(null);
    setStatus('idle');
    console.log('[useImageAnalysis] State transition: selected -> idle');
  }, [previewUrl]);

  // Step 3: Start Analysis Workflow (State 2 -> State 3 uploading/scanning -> State 4 result)
  const startAnalysis = useCallback(async () => {
    if (!selectedFile || !previewUrl) {
      setError('Please select an image before starting analysis.');
      return;
    }

    try {
      setStatus('uploading');
      setError(null);
      console.log('[useImageAnalysis] State transition: selected -> uploading');

      // Phase 1: Upload simulation delay (1s)
      await new Promise(r => setTimeout(r, 1000));
      setStatus('scanning');
      console.log('[useImageAnalysis] State transition: uploading -> scanning');

      // Phase 2: Dispatch to ML API + Scanning animation delay (minimum 2.5s)
      const scanDelay = new Promise(r => setTimeout(r, 2500));
      const [prediction] = await Promise.all([
        analyzeImage(selectedFile),
        scanDelay,
      ]);

      // Phase 3: Construct Analysis Result
      const analysisResult: AnalysisResult = {
        id: `scan-${Date.now()}`,
        prediction,
        image_url: previewUrl,
        file_name: selectedFile.name,
        file_size_formatted: fileSizeFormatted,
        dimensions_formatted: dimensions,
        analyzed_at: new Date().toISOString(),
      };

      setResult(analysisResult);
      setStatus('result');
      console.log('[useImageAnalysis] State transition: scanning -> result', analysisResult);

      // Phase 4: History Update & Local Storage Persistence
      const historyItem: ScanHistoryItem = {
        id: analysisResult.id,
        is_oil_spill: prediction.is_oil_spill,
        peak_confidence: prediction.peak_confidence,
        total_spills: prediction.total_spills,
        total_area_km2: prediction.total_area_km2,
        thumbnail_url: previewUrl,
        file_name: selectedFile.name,
        analyzed_at: analysisResult.analyzed_at,
        full_result: analysisResult,
      };

      setHistory(prev => {
        const updated = [historyItem, ...prev.filter(h => h.id !== historyItem.id)].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });

    } catch (err) {
      console.error('[useImageAnalysis] Analysis pipeline failed:', err);
      const msg = err instanceof Error ? err.message : 'Analysis failed due to an unexpected error.';
      setError(msg);
      setStatus('error');
    }
  }, [selectedFile, previewUrl, fileSizeFormatted, dimensions]);

  // Reset to initial clean state (State 4 -> State 1)
  const reset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDimensions(undefined);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, [previewUrl]);

  // Load a historical scan from right sidebar
  const loadHistoricalScan = useCallback((historyItem: ScanHistoryItem) => {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setResult(historyItem.full_result);
      setPreviewUrl(historyItem.full_result.image_url || historyItem.thumbnail_url);
      setSelectedFile(null);
      setDimensions(historyItem.full_result.dimensions_formatted);
      setFileSizeFormatted(historyItem.full_result.file_size_formatted);
      setError(null);
      setStatus('result');
      console.log('[useImageAnalysis] Loaded historical scan:', historyItem.id);
    } catch (err) {
      console.error('[useImageAnalysis] Error loading historical scan:', err);
    }
  }, [previewUrl]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return {
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
  };
}
