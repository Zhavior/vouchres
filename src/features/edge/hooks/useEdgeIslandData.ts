import { useEffect, useState } from 'react';
import { getEdgeIslandData } from '../services/edgeIslandService';
import type { EdgeIslandData } from '../types/edgeIslandData';

export function useEdgeIslandData() {
  const [data, setData] = useState<EdgeIslandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    getEdgeIslandData()
      .then((nextData) => {
        if (!alive) return;
        setData(nextData);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load Edge Island.');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}
