import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  DEPLOY_POLL_INTERVAL_MS,
  fetchDeployedBuildId,
  isBuildIdStale,
  LOCAL_BUILD_ID,
} from '../src/lib/deployVersion';

describe('deploy version polling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects when remote build id differs from local bundle', () => {
    expect(isBuildIdStale('abc123', 'def456')).toBe(true);
    expect(isBuildIdStale('abc123', 'abc123')).toBe(false);
    expect(isBuildIdStale(null, LOCAL_BUILD_ID)).toBe(false);
  });

  it('fetches build id from no-store build-id.txt endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'remote-build\n',
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDeployedBuildId()).resolves.toBe('remote-build');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/build-id\.txt\?_/),
      { cache: 'no-store' },
    );
  });

  it('polls on a five-minute interval constant', () => {
    expect(DEPLOY_POLL_INTERVAL_MS).toBe(5 * 60 * 1000);
  });
});
