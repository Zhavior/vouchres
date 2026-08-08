import { describe, expect, it } from 'vitest';
import {
  compareLegacyImporters,
  validateAurora,
} from '../scripts/aurora/compliance';

describe('Aurora compliance enforcement', () => {
  it('passes the repository migration manifest and Z8 ratchet', () => {
    const result = validateAurora();

    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.metrics.trackedFlows).toBeGreaterThan(0);
    expect(result.metrics.compliantFlows).toBeGreaterThan(0);
    expect(result.metrics.z8Importers).toBe(0);
  });

  it('detects both new importers and stale baseline entries', () => {
    expect(compareLegacyImporters(
      ['src/legacy.ts', 'src/new-debt.ts'],
      ['src/legacy.ts', 'src/already-migrated.ts'],
    )).toEqual({
      newImporters: ['src/new-debt.ts'],
      staleBaseline: ['src/already-migrated.ts'],
    });
  });
});
