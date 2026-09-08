// src/services/diagnosticPlotService.ts

import { useState, useEffect } from 'react';
import { apiClient } from './apiClient';

export interface DiagnosticPlotResponse {
  spill_id: string;
  diagnostic_plot_url: string;
}

export const DEFAULT_DIAGNOSTIC_PLOT_URL =
  'https://res.cloudinary.com/dll6vk0kp/image/upload/v1788703004/oil_spill_diagnostics/diagnostic_spill_ea0e3f.png';

// In-memory cache to avoid duplicate network calls
const diagnosticPlotCache = new Map<string, string>();

/**
 * Fetch diagnostic plot URL for a given spill ID.
 * Calls GET /api/v1/drift/{spill_id}/diagnostic-plot
 * Falls back gracefully to the reference diagnostic plot if not found.
 */
export async function fetchDiagnosticPlotUrl(
  spillId: string | null | undefined,
  signal?: AbortSignal
): Promise<string> {
  if (!spillId) {
    return DEFAULT_DIAGNOSTIC_PLOT_URL;
  }

  const cached = diagnosticPlotCache.get(spillId);
  if (cached) {
    return cached;
  }

  // Handle mock spill IDs that do not exist in the backend
  if (spillId.startsWith('mock') || spillId === 'spill_A' || spillId === 'spill_F' || spillId === 'OS-001') {
    diagnosticPlotCache.set(spillId, DEFAULT_DIAGNOSTIC_PLOT_URL);
    return DEFAULT_DIAGNOSTIC_PLOT_URL;
  }

  try {
    const res = await apiClient.get<DiagnosticPlotResponse>(
      `/api/v1/drift/${encodeURIComponent(spillId)}/diagnostic-plot`,
      signal
    );

    if (res && res.diagnostic_plot_url) {
      diagnosticPlotCache.set(spillId, res.diagnostic_plot_url);
      return res.diagnostic_plot_url;
    }
  } catch (err: any) {
    console.warn(`[diagnosticPlotService] Failed to fetch diagnostic plot for ${spillId}:`, err?.message);
  }

  // Fallback to reference diagnostic plot so an image is always available
  diagnosticPlotCache.set(spillId, DEFAULT_DIAGNOSTIC_PLOT_URL);
  return DEFAULT_DIAGNOSTIC_PLOT_URL;
}

/**
 * React hook to retrieve the diagnostic plot URL with loading and error handling.
 */
export function useDiagnosticPlot(spillId: string | null | undefined, fallbackUrl?: string | null) {
  const [plotUrl, setPlotUrl] = useState<string | null>(() => {
    if (!spillId) return fallbackUrl || DEFAULT_DIAGNOSTIC_PLOT_URL;
    return diagnosticPlotCache.get(spillId) || fallbackUrl || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!diagnosticPlotCache.has(spillId || ''));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spillId) {
      setPlotUrl(fallbackUrl || DEFAULT_DIAGNOSTIC_PLOT_URL);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (diagnosticPlotCache.has(spillId)) {
      setPlotUrl(diagnosticPlotCache.get(spillId)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchDiagnosticPlotUrl(spillId, controller.signal)
      .then((url) => {
        setPlotUrl(url);
        setError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setPlotUrl(fallbackUrl || DEFAULT_DIAGNOSTIC_PLOT_URL);
        setError(err?.message || 'Failed to load diagnostic plot');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [spillId, fallbackUrl]);

  return { plotUrl: plotUrl || DEFAULT_DIAGNOSTIC_PLOT_URL, isLoading, error };
}
