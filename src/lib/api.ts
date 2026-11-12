import { tokenStorage } from '@/lib/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// Free ngrok domains serve an HTML "you're about to visit..." interstitial to
// every request unless this header is present — including plain <Image>
// fetches for report/NIC photos, not just our own JSON calls. Harmless to
// send to a non-ngrok host (e.g. the LAN/production API), which just ignores
// an unrecognized header.
export const REMOTE_IMAGE_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

// The language the citizen picked in the app, sent with every request so the
// API returns its messages (sign-in refusals, screening results, alerts) in
// the same language as the interface.
let currentLanguage = 'en';

export function setApiLanguage(language: string): void {
  currentLanguage = language;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]> | null;

  constructor(message: string, status: number, errors: Record<string, string[]> | null = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  firstError(): string {
    if (this.errors) {
      const first = Object.values(this.errors)[0];
      if (first?.[0]) return first[0];
    }
    return this.message;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': currentLanguage,
    ...REMOTE_IMAGE_HEADERS,
  };

  const isFormData = body instanceof FormData;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    // fetch() throws a plain (non-ApiError) error for connection failures —
    // wrap it so callers can show a message that actually points at the cause,
    // instead of a generic "something went wrong".
    const detail = cause instanceof Error ? cause.message : String(cause);
    const isAbort = cause instanceof Error && cause.name === 'AbortError';
    throw new ApiError(
      isAbort
        ? `Request to ${BASE_URL}${path} timed out after 30s. The file may be too large, or the server is too slow to respond.`
        : `Could not reach ${BASE_URL}${path}: ${detail}`,
      0
    );
  } finally {
    clearTimeout(timeout);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Server error (${response.status}). Please try again.`,
      response.status,
      payload?.errors ?? null
    );
  }

  if (!isJson) {
    // A 2xx with a non-JSON body means something between the client and the
    // API returned its own page (a tunnel's interstitial, a proxy error page,
    // etc.) instead of forwarding to Laravel — fail loudly instead of quietly
    // returning null and letting callers misbehave.
    throw new ApiError(`Expected JSON from ${BASE_URL}${path} but got "${response.headers.get('content-type')}".`, response.status);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: Record<string, unknown> | FormData, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
};
