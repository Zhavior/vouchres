import { useEffect, useState } from 'react';
import { fetchRealGameLog, type RealGameLog } from '../utils/realGameLogs';

export type RealGameLogState = 'idle' | 'loading' | 'ready' | 'unavailable';

export function useRealGameLog(
  playerId: string | number | null | undefined,
  enabled: boolean,
): { logs: RealGameLog[] | null; state: RealGameLogState } {
  const [logs, setLogs] = useState<RealGameLog[] | null>(null);
  const [state, setState] = useState<RealGameLogState>('idle');

  useEffect(() => {
    if (!enabled || playerId == null) {
      setLogs(null);
      setState('idle');
      return;
    }

    let alive = true;
    setState('loading');

    fetchRealGameLog(playerId).then((data) => {
      if (!alive) return;
      if (data && data.length > 0) {
        setLogs(data);
        setState('ready');
      } else {
        setLogs(null);
        setState('unavailable');
      }
    });

    return () => {
      alive = false;
    };
  }, [enabled, playerId]);

  return { logs, state };
}
