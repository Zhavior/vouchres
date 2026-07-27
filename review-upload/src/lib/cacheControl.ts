export type ParsedCacheControl = {
  maxAgeSec?: number;
  staleWhileRevalidateSec?: number;
};

/**
 * Parses a subset of Cache-Control directives used by VouchEdge APIs.
 * Example: "private, max-age=30, stale-while-revalidate=120"
 */
export function parseCacheControl(header: string | null | undefined): ParsedCacheControl {
  if (!header) return {};

  const directives = header
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const parsed: ParsedCacheControl = {};

  for (const directive of directives) {
    const maxAgeMatch = directive.match(/^max-age=(\d+)$/);
    if (maxAgeMatch) {
      parsed.maxAgeSec = Number.parseInt(maxAgeMatch[1], 10);
      continue;
    }

    const swrMatch = directive.match(/^stale-while-revalidate=(\d+)$/);
    if (swrMatch) {
      parsed.staleWhileRevalidateSec = Number.parseInt(swrMatch[1], 10);
    }
  }

  return parsed;
}

export function cacheControlToMs(parsed: ParsedCacheControl): {
  maxAgeMs?: number;
  staleWhileRevalidateMs?: number;
} {
  return {
    maxAgeMs:
      typeof parsed.maxAgeSec === "number" ? parsed.maxAgeSec * 1000 : undefined,
    staleWhileRevalidateMs:
      typeof parsed.staleWhileRevalidateSec === "number"
        ? parsed.staleWhileRevalidateSec * 1000
        : undefined,
  };
}
