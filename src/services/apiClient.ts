const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = {
  async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, { signal });
    if (!response.ok) throw new Error(`GET ${path} failed: ${response.statusText}`);
    return response.json();
  },
  async post<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`POST ${path} failed: ${response.statusText}`);
    return response.json();
  }
};
