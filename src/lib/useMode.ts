import { useState, useEffect, useCallback } from 'react';

/** Beginner (plain-English) vs Advanced (stats/model fields) mode, persisted to localStorage. */
export type AppMode = 'beginner' | 'advanced';
const KEY = 'vouchedge_mode';

/**
 * Validator and sanitizer for persisted AppMode
 */
export function validateAppMode(val: unknown): AppMode {
  return val === 'beginner' || val === 'advanced' ? val : 'beginner';
}

export function useMode(): [AppMode, (m: AppMode) => void, () => void] {
  const [mode, setModeState] = useState<AppMode>(() => {
    try {
      return validateAppMode(localStorage.getItem(KEY));
    } catch {
      return 'beginner';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
  }, [mode]);

  const setMode = useCallback((m: AppMode) => setModeState(validateAppMode(m)), []);
  const toggle = useCallback(
    () => setModeState((m) => (m === 'beginner' ? 'advanced' : 'beginner')),
    []
  );

  return [mode, setMode, toggle];
}
