import { useState, useCallback, useRef } from 'react';
import type { AnalysisStatus, AnalysisResult, ImageMetadata, ScanHistoryItem } from '../types/image-analysis';
import { analyzeImage } from '../services/mlApi';

const HISTORY_KEY = 'ocean-sentinel-scan-history';
const MAX_HISTORY = 10;

function loadHistory(): ScanHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[useImageAnalysis] Local storage history is not an array. Resetting history.');
      return [];
    }
    return parsed;
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
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>(loadHistory);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (file: File, metadata: ImageMetadata) => {
    console.group('%c[NAUKA ML Pipeline] Starting Image Analysis Workflow', 'color: #00d2ff; font-weight: bold; font-size: 12px;');
    console.log('%c[Step 1/6] Selected File Received', 'color: #e2b714; font-weight: bold;', {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    console.log('%c[Step 2/6] Image Metadata Provided', 'color: #e2b714; font-weight: bold;', metadata);

    let url = '';

    // Step 1: Preview URL Creation
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setStatus('uploading');
      setError(null);
      setResult(null);
      console.log('%c[Step 3/6] Created Preview Blob URL:', 'color: #e2b714; font-weight: bold;', url);
    } catch (err) {
      console.error('[Step 3/6 Error] Failed to create object URL for preview:', err);
      console.groupEnd();
      setError(`[Preview Error] Could not read preview for file "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
      setStatus('error');
      return;
    }

    // Step 2: Upload Simulation Delay
    try {
      await new Promise(r => setTimeout(r, 1000));
      setStatus('scanning');
      console.log('%c[Step 4/6] Upload complete. Transitioning to SCANNING animation...', 'color: #e2b714; font-weight: bold;');
    } catch (err) {
      console.error('[Step 4/6 Error] Upload stage interrupted:', err);
      console.groupEnd();
      setError('[Upload Error] Upload stage was interrupted.');
      setStatus('error');
      return;
    }

    // Step 3: ML API Call & Minimum Scanning Animation Duration
    abortRef.current = new AbortController();
    const scanDelay = new Promise(r => setTimeout(r, 2000));

    try {
      console.log('%c[Step 5/6] Dispatching Request to ML Backend Service...', 'color: #00ffaa; font-weight: bold;');
      const [response] = await Promise.all([
        analyzeImage(file, metadata),
        scanDelay, // ensure scanning animation is visible
      ]);

      // Step 4: Result Assembly
      let analysisResult: AnalysisResult;
      try {
        analysisResult = {
          id: `scan-${Date.now()}`,
          prediction: response,
          image_url: url,
          analyzed_at: new Date().toISOString(),
        };
        setResult(analysisResult);
        setStatus('result');
        console.log('%c[Step 6/6] Pipeline Finished Successfully! Result Card Rendered:', 'color: #00ffaa; font-weight: bold;', analysisResult);
      } catch (err) {
        console.error('[Result Assembly Error] Failed to structure result:', err);
        throw new Error(`[Result Processing Error] Could not structure result card: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Step 5: History Persistence
      try {
        const historyItem: ScanHistoryItem = {
          id: analysisResult.id,
          is_oil_spill: Boolean(response.is_oil_spill),
          confidence: Number(response.confidence_score) || 0,
          area_km2: response.area_km2,
          thumbnail_url: url,
          analyzed_at: analysisResult.analyzed_at,
        };
        const updated = [historyItem, ...history].slice(0, MAX_HISTORY);
        setHistory(updated);
        saveHistory(updated);
        console.log('%c[History] Saved scan item to localStorage:', 'color: #a0a0a0;', historyItem);
      } catch (err) {
        console.warn('[History Warning] History save failed silently:', err);
      }

      console.groupEnd();

    } catch (err) {
      console.error('[Pipeline Failed] Error during image analysis workflow:', err);
      console.groupEnd();
      const msg = err instanceof Error ? err.message : 'Analysis failed due to an unknown error';
      setError(msg);
      setStatus('error');
    }
  }, [history, previewUrl]);

  const reset = useCallback(() => {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      console.warn('[useImageAnalysis] Error revoking blob URL on reset:', err);
    } finally {
      setStatus('idle');
      setResult(null);
      setError(null);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const clearHistory = useCallback(() => {
    try {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      console.error('[useImageAnalysis] Failed to clear history from localStorage:', err);
    }
  }, []);

  return { status, result, error, previewUrl, history, analyze, reset, clearHistory };
}
