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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const buildUrl = (path: string) => {
  const base = String(API_BASE_URL).replace(/\/+$/, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${safePath}`;
};

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
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
