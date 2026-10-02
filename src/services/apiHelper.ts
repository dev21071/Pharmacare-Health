/**
 * Safe API response wrapper and helper for handling JSON parsing,
 * network errors, and preventing "Unexpected token '<'" crashes.
 */

export interface SafeApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<SafeApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: unknown) {
    const msg = netErr instanceof Error ? netErr.message : 'Network request failed';
    return {
      ok: false,
      status: 0,
      error: `Unable to connect to backend server (${url}). Please check internet connection or server availability. (${msg})`,
    };
  }

  const contentType = res.headers.get('content-type') || '';
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (readErr: unknown) {
    const msg = readErr instanceof Error ? readErr.message : 'Failed to read response';
    return {
      ok: false,
      status: res.status,
      error: `Failed to read server response (Status ${res.status}): ${msg}`,
    };
  }

  const trimmed = rawText.trim();

  // Guard against HTML responses (fallback SPA index.html or server error pages)
  if (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    contentType.includes('text/html')
  ) {
    const preview = trimmed.slice(0, 100).replace(/\s+/g, ' ');
    return {
      ok: false,
      status: res.status,
      error: `Server at ${url} returned an HTML document instead of JSON (Status ${res.status} ${res.statusText || ''}). Preview: "${preview}...". This occurs when the backend URL is pointing to a static web host (e.g. Vercel SPA) instead of the active PharmaCare backend server.`,
    };
  }

  // Parse JSON safely
  try {
    const data = JSON.parse(rawText) as T;
    if (!res.ok) {
      const serverError =
        (data as Record<string, any>)?.message ||
        (data as Record<string, any>)?.error ||
        `Request failed with status ${res.status}`;
      return {
        ok: false,
        status: res.status,
        data,
        error: serverError,
      };
    }
    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      error: `Invalid JSON response received from ${url} (Status ${res.status}). Expected JSON format.`,
    };
  }
}
