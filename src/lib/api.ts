const TOKEN_STORAGE_KEY = 'chopbellyfull_session_token_v1';

export function getAuthToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
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

  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: text };
    }
  }

  if (!res.ok) {
    const errBody = (parsed ?? {}) as ApiErrorBody;
    if (res.status === 401 && errBody.code === 'unauthorized') {
      // Token expired or invalid on server; clear stale local token if present
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
