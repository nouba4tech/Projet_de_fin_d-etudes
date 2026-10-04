type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Calls in this file pass paths that already include the "/api" prefix (e.g.
// '/api/accounting/accounts'), so the base must be the backend's ROOT -- unlike
// services/api.ts, whose baseURL already ends in "/api" and whose callers omit it.
// VITE_API_URL (the only API env var actually set on Vercel) is configured as that
// "/api"-suffixed root, so it's stripped back down to the bare root here.
const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE_URL = rawApiUrl
  ? rawApiUrl.replace(/\/api\/?$/, '')
  : 'http://localhost:8080';

const buildUrl = (path: string) => {
  const base = String(API_BASE_URL).replace(/\/+$/, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${safePath}`;
};

const getAuthToken = (): string | null => {
  let token = localStorage.getItem('token');
  if (!token) {
    try {
      const authTokens = sessionStorage.getItem('authTokens');
      if (authTokens) {
        const parsed = JSON.parse(authTokens);
        token = parsed.accessToken || null;
      }
    } catch { /* ignore */ }
  }
  return token;
};

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (body != null) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(buildUrl(path), {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body == null ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const parsed = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message = typeof parsed === 'string' && parsed.trim() ? parsed : `HTTP ${response.status}`;
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}
