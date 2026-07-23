import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/repositories/socialOutboxRepository", () => ({
  socialOutboxRepository: {
    getPendingEvents: vi.fn(async () => []),
    markProcessed: vi.fn(async () => undefined),
    markFailed: vi.fn(async () => undefined),
    queueEvent: vi.fn(async () => null),
  },
}));

vi.mock("../server/services/notifications/notificationService", () => ({
  createNewFollowerNotification: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../server/services/social/followService", () => ({
  notifyFollowersOfAuthorPost: vi.fn(async () => undefined),
}));

describe("socialOutboxWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fans out FOLLOW events to new-follower notifications", async () => {
    const { socialOutboxRepository } = await import("../server/repositories/socialOutboxRepository");
    const notifications = await import("../server/services/notifications/notificationService");
    vi.mocked(socialOutboxRepository.getPendingEvents).mockResolvedValueOnce([
      {
        id: "outbox_1",
        user_id: "profile_followed",
        event_type: "FOLLOW",
        payload: {
          followerId: "follower_1",
          followingProfileId: "profile_followed",
          relationshipType: "follow",
        },
        processed: false,
      },
    ]);

    const { processSocialOutboxBatch } = await import("../server/services/social/socialOutboxWorker");
    const count = await processSocialOutboxBatch();

    expect(count).toBe(1);
    expect(notifications.createNewFollowerNotification).toHaveBeenCalledWith({
      followerId: "follower_1",
      followingProfileId: "profile_followed",
      relationshipType: "follow",
    });
    expect(socialOutboxRepository.markProcessed).toHaveBeenCalledWith("outbox_1");
  });

  it("fans out NOTE_UPSERT to follower post notifications", async () => {
    const { socialOutboxRepository } = await import("../server/repositories/socialOutboxRepository");
    const followService = await import("../server/services/social/followService");
    vi.mocked(socialOutboxRepository.getPendingEvents).mockResolvedValueOnce([
      {
        id: "outbox_2",
        user_id: "author_1",
        event_type: "NOTE_UPSERT",
        payload: {
          authorId: "author_1",
          postId: "post_1",
          body: "hello board",
          pickId: null,
        },
        processed: false,
      },
    ]);

    const { processSocialOutboxBatch } = await import("../server/services/social/socialOutboxWorker");
    const count = await processSocialOutboxBatch();

    expect(count).toBe(1);
    expect(followService.notifyFollowersOfAuthorPost).toHaveBeenCalledWith({
      authorId: "author_1",
      postId: "post_1",
      body: "hello board",
      pickId: null,
    });
  });
});
