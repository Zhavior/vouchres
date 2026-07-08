export type SafeApiResult<T> = {
  ok: boolean;
  data: T;
  error: string | null;
  status: number | null;
  source: 'network' | 'fallback';
};

type SafeFetchOptions<T> = {
  fallbackData: T;
  timeoutMs?: number;
};

export async function safeJsonFetch<T>(
  url: string,
  options: SafeFetchOptions<T>,
): Promise<SafeApiResult<T>> {
  const timeoutMs = options.timeoutMs ?? 12000;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    window.clearTimeout(timeout);

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        data: options.fallbackData,
        error: `Expected JSON but received ${contentType || 'unknown content type'}`,
        status: response.status,
        source: 'fallback',
      };
    }

    const json = (await response.json()) as T;

    if (!response.ok) {
      return {
        ok: false,
        data: options.fallbackData,
        error: `Request failed with status ${response.status}`,
        status: response.status,
        source: 'fallback',
      };
    }

    return {
      ok: true,
      data: json,
      error: null,
      status: response.status,
      source: 'network',
    };
  } catch (error) {
    window.clearTimeout(timeout);

    return {
      ok: false,
      data: options.fallbackData,
      error: error instanceof Error ? error.message : 'Unknown API error',
      status: null,
      source: 'fallback',
    };
  }
}

export function getSafeApiErrorMessage(result: SafeApiResult<unknown>) {
  if (!result.error) return null;

  if (result.error.toLowerCase().includes('abort')) {
    return 'Request timed out';
  }

  return result.error;
}
