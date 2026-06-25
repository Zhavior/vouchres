import { useState, useEffect, useCallback } from 'react';

/** Beginner (plain-English) vs Advanced (stats/model fields) mode, persisted to localStorage. */
export type AppMode = 'beginner' | 'advanced';
const KEY = 'vouchedge_mode';

export function useMode(): [AppMode, (m: AppMode) => void, () => void] {
  const [mode, setModeState] = useState<AppMode>(() => {
    try { return (localStorage.getItem(KEY) as AppMode) || 'beginner'; } catch { return 'beginner'; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, mode); } catch {} }, [mode]);
  const setMode = useCallback((m: AppMode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState((m) => (m === 'beginner' ? 'advanced' : 'beginner')), []);
  return [mode, setMode, toggle];
}
