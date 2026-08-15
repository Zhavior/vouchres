import { describe, expect, it } from 'vitest';
import { resolveMlbPersonId } from '../src/lib/mlbPersonId';

describe('resolveMlbPersonId', () => {
  it('accepts a positive integer', () => {
    expect(resolveMlbPersonId(676130)).toBe(676130);
  });

  it('strips the mlbapi_ roster stub prefix', () => {
    expect(resolveMlbPersonId('mlbapi_676130')).toBe(676130);
    expect(resolveMlbPersonId('MLBAPI_683679')).toBe(683679);
  });

  it('accepts a numeric string', () => {
    expect(resolveMlbPersonId('694514')).toBe(694514);
  });

  it('reads the person id from an MLB headshot URL', () => {
    expect(resolveMlbPersonId('unknown', 'https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/660271/headshot/67/current')).toBe(660271);
  });

  it('returns null for junk so Stats API is never called with it', () => {
    expect(resolveMlbPersonId('mlbapi_')).toBeNull();
    expect(resolveMlbPersonId('player_676130')).toBeNull();
    expect(resolveMlbPersonId(0)).toBeNull();
    expect(resolveMlbPersonId(-1)).toBeNull();
    expect(resolveMlbPersonId(null)).toBeNull();
    expect(resolveMlbPersonId(undefined)).toBeNull();
  });
});
