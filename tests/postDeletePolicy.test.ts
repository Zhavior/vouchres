import { describe, expect, it } from 'vitest';
import {
  canDeleteFeedPost,
  isParlayFeedPost,
  PARLAY_POST_DELETE_WINDOW_MS,
  parlayPostDeleteLockedReason,
  parlayPostDeleteRemainingMs,
} from '../src/lib/postDeletePolicy';

describe('postDeletePolicy', () => {
  const createdAt = '2026-07-09T12:00:00.000Z';

  it('treats non-parlay posts as always deletable', () => {
    const now = new Date('2026-07-09T14:00:00.000Z');
    expect(canDeleteFeedPost({ postType: 'RESEARCH_NOTE', timestamp: createdAt }, now)).toBe(true);
    expect(canDeleteFeedPost({ postType: 'VOUCH', timestamp: createdAt }, now)).toBe(true);
  });

  it('allows parlay delete inside the 30-minute window', () => {
    const now = new Date(new Date(createdAt).getTime() + PARLAY_POST_DELETE_WINDOW_MS - 1);
    expect(isParlayFeedPost({ postType: 'PARLAY' })).toBe(true);
    expect(canDeleteFeedPost({ postType: 'PARLAY', timestamp: createdAt }, now)).toBe(true);
  });

  it('locks parlay delete after 30 minutes', () => {
    const now = new Date(new Date(createdAt).getTime() + PARLAY_POST_DELETE_WINDOW_MS);
    expect(canDeleteFeedPost({ postType: 'PARLAY', timestamp: createdAt }, now)).toBe(false);
    expect(parlayPostDeleteLockedReason()).toBe('Locked in your history after 30 minutes');
    expect(parlayPostDeleteRemainingMs({ postType: 'PARLAY', timestamp: createdAt }, now)).toBe(0);
  });
});
