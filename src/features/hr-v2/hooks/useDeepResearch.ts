import { useState, useEffect } from 'react';
import { ChunkB, ChunkC } from '../api/contracts';
import { mockChunkBData, mockChunkCData } from '../api/mockData';

export function useDeepResearch(playerId: string, enabled: boolean = false) {
  const [chunkB, setChunkB] = useState<ChunkB | null>(() => (enabled && playerId ? (mockChunkBData[playerId] || null) : null));
  const [chunkC, setChunkC] = useState<ChunkC | null>(() => (enabled && playerId ? (mockChunkCData[playerId] || null) : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !playerId) return;

    try {
      const bData = mockChunkBData[playerId] || null;
      const cData = mockChunkCData[playerId] || null;
      setChunkB(bData);
      setChunkC(cData);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load deep research'));
      setLoading(false);
    }
  }, [playerId, enabled]);

  return {
    chunkB,
    chunkC,
    loading,
    error,
  };
}
