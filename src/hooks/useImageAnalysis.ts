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
    } catch (err) {
      console.error('[useImageAnalysis] Failed to create object URL for file preview:', err);
      setError(`[Preview Error] Could not read preview for file "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
      setStatus('error');
      return;
    }

    // Step 2: Upload Simulation Delay
    try {
      await new Promise(r => setTimeout(r, 1000));
      setStatus('scanning');
    } catch (err) {
      console.error('[useImageAnalysis] Upload phase interrupted:', err);
      setError('[Upload Error] Upload stage was interrupted.');
      setStatus('error');
      return;
    }

    // Step 3: ML API Call & Minimum Scanning Animation Duration
    abortRef.current = new AbortController();
    const scanDelay = new Promise(r => setTimeout(r, 2000));

    try {
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
      } catch (err) {
        console.error('[useImageAnalysis] Failed to process analysis response:', err);
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
      } catch (err) {
        console.warn('[useImageAnalysis] History save failed silently:', err);
      }

    } catch (err) {
      console.error('[useImageAnalysis] Error during image analysis workflow:', err);
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
