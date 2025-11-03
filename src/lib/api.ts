import { INTERVIEWS_API_BASE } from '@/config';

// Build full API URL from a path like '/api/interview/create'
export function buildApiUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  const base = INTERVIEWS_API_BASE.replace(/\/$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

// Normalize server error messages
export async function handleApiError(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return `HTTP ${res.status}`;
    try {
      const data = JSON.parse(raw);
      return data?.message || data?.error || JSON.stringify(data);
    } catch {
      return raw;
    }
  } catch {
    return `HTTP ${res.status}`;
  }
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err);
  return (
    err?.name === 'AbortError' ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network timeout')
  );
}

export async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}
