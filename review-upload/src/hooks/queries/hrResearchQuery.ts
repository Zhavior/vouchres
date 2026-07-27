import { queryOptions } from '@tanstack/react-query';
import { HrResearchResponseSchema } from '../../schemas/hrResearchSchema';
import type { HrResearchResponse } from '../../types/hrResearch';

type HrResearchApiPayload = {
  ok?: boolean;
  research?: unknown;
  meta?: unknown;
};

function validPlayerId(
  playerId: string | number | null | undefined,
): string | null {
  if (playerId === null || playerId === undefined) return null;

  const normalized = String(playerId).trim();

  if (
    !normalized
    || normalized === 'undefined'
    || normalized === 'null'
  ) {
    return null;
  }

  return normalized;
}

async function fetchHrResearch(
  playerId: string,
  date: string | null,
): Promise<HrResearchResponse> {
  const params = new URLSearchParams();

  if (date) {
    params.set('date', date);
  }

  const query = params.toString();

  const response = await fetch(
    `/api/mlb/hr-board/player/${encodeURIComponent(playerId)}${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    },
  );

  let payload: HrResearchApiPayload;

  try {
    payload = await response.json() as HrResearchApiPayload;
  } catch {
    throw new Error('HR research returned invalid JSON.');
  }

  if (!response.ok) {
    throw new Error(
      `HR research request failed with HTTP ${response.status}.`,
    );
  }

  const parsed = HrResearchResponseSchema.safeParse(payload.research);

  if (!parsed.success) {
    console.error(
      '[hrResearchQuery] contract validation failed',
      parsed.error.flatten(),
    );

    throw new Error('HR research response failed contract validation.');
  }

  // Runtime validation above guarantees the canonical payload shape.
  // The explicit type bridges this project's current Zod inference behavior,
  // where nullable object fields may be inferred as optional.
  return parsed.data as HrResearchResponse;
}

export function hrResearchQueryOptions(
  playerId: string | number | null | undefined,
  date?: string | null,
) {
  const normalizedPlayerId = validPlayerId(playerId);
  const normalizedDate = date?.trim() || null;

  return queryOptions({
    queryKey: [
      'mlb',
      'hr-research',
      normalizedPlayerId,
      normalizedDate,
    ] as const,

    queryFn: () => {
      if (!normalizedPlayerId) {
        throw new Error('HR research requires a valid player ID.');
      }

      // Do not consume React Query's AbortSignal here.
      // In development StrictMode briefly unmounts and remounts the profile.
      // Keeping this expensive read alive allows the remount to reuse the
      // same in-flight promise instead of starting a duplicate server job.
      return fetchHrResearch(
        normalizedPlayerId,
        normalizedDate,
      );
    },

    enabled: normalizedPlayerId !== null,

    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
