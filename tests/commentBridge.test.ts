import { describe, expect, it } from 'vitest';
import { buildCommentTree, mapBackendComment } from '../src/lib/commentBridge';

describe('commentBridge', () => {
  it('maps backend comment rows', () => {
    const mapped = mapBackendComment(
      {
        id: 'c1',
        body: 'Great slip',
        created_at: '2026-07-11T12:00:00.000Z',
        parent_id: null,
        author: {
          id: 'u1',
          username: 'capper',
          display_name: 'Capper',
          avatar_url: null,
        },
        likes_count: [{ count: 2 }],
        liked_by_me: true,
      },
      'post-1',
    );

    expect(mapped).toMatchObject({
      id: 'c1',
      postId: 'post-1',
      userId: 'u1',
      username: 'capper',
      content: 'Great slip',
      likesCount: 2,
      isLiked: true,
    });
  });

  it('builds threaded comment trees', () => {
    const tree = buildCommentTree([
      {
        id: 'c1',
        postId: 'p1',
        userId: 'u1',
        displayName: 'A',
        username: 'a',
        timestamp: '2026-07-11T12:00:00.000Z',
        content: 'Root',
        likesCount: 0,
        parentId: null,
      },
      {
        id: 'c2',
        postId: 'p1',
        userId: 'u2',
        displayName: 'B',
        username: 'b',
        timestamp: '2026-07-11T12:01:00.000Z',
        content: 'Reply',
        likesCount: 0,
        parentId: 'c1',
        replyToUsername: 'a',
      },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].replies).toHaveLength(1);
    expect(tree[0].replies?.[0].content).toBe('Reply');
  });
});
