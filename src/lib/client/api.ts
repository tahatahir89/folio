export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface Options extends Omit<RequestInit, 'body'> {
  json?: unknown;
}

/** fetch wrapper: JSON in/out, throws ApiClientError with the server's message. */
export async function api<T = unknown>(url: string, { json, headers, ...init }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiClientError('Network error. Check your connection and try again.', 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && typeof data.error === 'string' ? data.error : null) ?? `Request failed (${res.status}).`;
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiClientError(message, res.status);
  }
  return data as T;
}

export const fetcher = <T,>(url: string) => api<T>(url);
