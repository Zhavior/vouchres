import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Validator Convention Note:
 *
 * For any enum-like, union-typed, or bounded state persisted to localStorage,
 * always supply a pure validator function following the pattern:
 *
 *   export function validateX(val: unknown): TargetType {
 *     return isValid(val) ? val : DEFAULT_FALLBACK;
 *   }
 *
 * Examples:
 * 1. String Union / Enum:
 *    export function validateViewMode(val: unknown): ViewMode {
 *      return val === 'card' || val === 'table' || val === 'kanban' ? val : 'card';
 *    }
 *
 * 2. Bounded Numeric Range:
 *    export function validateMinScore(val: unknown): number {
 *      const num = typeof val === 'number' && Number.isFinite(val) ? val : DEFAULT_SCORE;
 *      return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(num)));
 *    }
 *
 * This ensures that outdated schemas, corrupted storage keys, or malicious browser payloads
 * cannot cause runtime crashes or illegal UI states.
 */

export type StateValidator<T> = (value: unknown) => T | null | undefined;

/**
 * A custom hook to synchronize state with localStorage safely across SSR and client renders.
 * Guaranteed to handle malformed non-JSON gracefully without throwing.
 *
 * @param key The localStorage key
 * @param defaultValue Default value if key is not found or invalid
 * @param validator Optional sanitizer/validator function that returns sanitized value or null/undefined on validation failure
 * @returns [state, setState] tuple identical to useState
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  validator?: StateValidator<T>
): [T, Dispatch<SetStateAction<T>>] {
  const readAndValidate = useCallback(
    (rawItem: string | null): T => {
      if (rawItem === null) return defaultValue;
      try {
        const parsed = JSON.parse(rawItem);
        if (validator) {
          const validated = validator(parsed);
          if (validated !== null && validated !== undefined) {
            return validated;
          }
          return defaultValue;
        }
        return parsed as T;
      } catch (e) {
        console.warn(`[usePersistedState] Failed to parse key "${key}" from localStorage:`, e);
        return defaultValue;
      }
    },
    [key, defaultValue, validator]
  );

  const [state, setInternalState] = useState<T>(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return readAndValidate(item);
    } catch (e) {
      console.warn(`[usePersistedState] Failed to read key "${key}" from localStorage:`, e);
      return defaultValue;
    }
  });

  // Keep state synchronized with localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (e) {
      console.warn(`[usePersistedState] Failed to persist key "${key}" to localStorage:`, e);
    }
  }, [key, state]);

  // Synchronize and re-validate on external window storage events (cross-tab or devtools mutation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== window.localStorage) return;
      const nextValidated = readAndValidate(e.newValue);
      setInternalState(nextValidated);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, readAndValidate]);

  // Validating setState wrapper
  const setState: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrFn) => {
      setInternalState((prev) => {
        const nextVal =
          typeof valueOrFn === 'function'
            ? (valueOrFn as (prevState: T) => T)(prev)
            : valueOrFn;
        if (validator) {
          const validated = validator(nextVal);
          return validated !== null && validated !== undefined ? validated : defaultValue;
        }
        return nextVal;
      });
    },
    [defaultValue, validator]
  );

  return [state, setState];
}
