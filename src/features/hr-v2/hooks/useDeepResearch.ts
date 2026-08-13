import { useState, useEffect } from 'react';
import { ChunkB, ChunkC } from '../api/contracts';
import { mockChunkBData, mockChunkCData } from '../api/mockData';

export function useDeepResearch(playerId: string, enabled: boolean = false) {
  const [chunkB, setChunkB] = useState<ChunkB | null>(null);
  const [chunkC, setChunkC] = useState<ChunkC | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !playerId) return;

    // Check if already cached in memory
    if (chunkB && chunkC) return;

    let mounted = true;
    setLoading(true);

    // Simulate async API fetch for deep telemetry
    const timer = setTimeout(() => {
      if (mounted) {
        try {
          const bData = mockChunkBData[playerId] || null;
          const cData = mockChunkCData[playerId] || null;
          setChunkB(bData);
          setChunkC(cData);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load deep research'));
          setLoading(false);
        }
      }
    }, 450);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [playerId, enabled, chunkB, chunkC]);

  return {
    chunkB,
    chunkC,
    loading,
    error,
  };
}
