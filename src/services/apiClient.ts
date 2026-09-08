const DEFAULT_API_BASE = 'https://naavss.duckdns.org';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

export const apiClient = {
  async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, { signal });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`GET ${path} failed (${response.status} ${response.statusText}): ${errText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`GET ${path} returned non-JSON response: ${text.slice(0, 100)}`);
    }
    return response.json();
  },
  async post<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`POST ${path} failed (${response.status} ${response.statusText}): ${errText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`POST ${path} returned non-JSON response: ${text.slice(0, 100)}`);
    }
    return response.json();
  }
};
