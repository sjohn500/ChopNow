const TOKEN_STORAGE_KEY = 'chopbellyfull_session_token_v1';

// In-memory fallback in case iframe/browser privacy settings restrict localStorage
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) memoryToken = stored;
    return stored;
  } catch {
    return memoryToken;
  }
}

export function setAuthToken(token: string | null): void {
  memoryToken = token || null;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota / iframe partitioning errors; memoryToken still works
  }
}

type ApiErrorBody = {
  error?: string;
  code?: string;
  request_id?: string;
  where?: string;
  error_type?: string;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  let parsed: unknown = {};

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      if (contentType.includes('text/html') || text.trimStart().startsWith('<')) {
        throw new Error(
          `Backend API unreachable at ${path} (received HTML instead of JSON). If you are using a Shared link, republish/update the app so the Python backend is live.`
        );
      }
      if (res.ok) {
        throw new Error(
          `Unexpected non-JSON response from ${path}: ${text.slice(0, 120)}`
        );
      }
      parsed = { error: text };
    }
  }

  if (!res.ok) {
    const errBody = (parsed ?? {}) as ApiErrorBody;
    if (res.status === 401 && errBody.code === 'unauthorized') {
      if (token) setAuthToken(null);
    }
    if (errBody.where || errBody.request_id) {
      console.error('[ChopBellyFull Python API Error]', {
        status: res.status,
        path,
        request_id: errBody.request_id,
        where: errBody.where,
        error: errBody.error,
      });
    }
    throw new Error(
      errBody.error || `Request failed with HTTP ${res.status}`
    );
  }

  return parsed as T;
}
