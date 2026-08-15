import { ChunkB, ChunkC } from '../api/contracts';

/**
 * Deep research is not on the validated HR board payload.
 * Never return mockChunkB/C as if they were live Statcast.
 */
export function useDeepResearch(_playerId: string, _enabled: boolean = false): {
  chunkB: ChunkB | null;
  chunkC: ChunkC | null;
  loading: boolean;
  error: Error | null;
} {
  return {
    chunkB: null,
    chunkC: null,
    loading: false,
    error: null,
  };
}
