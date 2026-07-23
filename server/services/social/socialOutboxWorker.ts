import {
  createNewFollowerNotification,
} from "../notifications/notificationService";
import { socialOutboxRepository, type SocialOutboxEvent } from "../../repositories/socialOutboxRepository";
import { notifyFollowersOfAuthorPost } from "../social/followService";

async function processOutboxEvent(event: SocialOutboxEvent): Promise<void> {
  const payload = event.payload ?? {};

  switch (event.event_type) {
    case "FOLLOW": {
      const followerId = String(payload.followerId ?? "");
      const followingProfileId = String(payload.followingProfileId ?? event.user_id);
      const relationshipType = String(payload.relationshipType ?? "follow");
      if (!followerId || !followingProfileId) {
        throw new Error("follow_payload_incomplete");
      }
      await createNewFollowerNotification({
        followerId,
        followingProfileId,
        relationshipType,
      });
      return;
    }
    case "NOTE_UPSERT":
    case "STORY_CREATE": {
      const authorId = String(payload.authorId ?? event.user_id);
      const postId = String(payload.postId ?? "");
      const body = String(payload.body ?? "");
      if (!authorId || !postId) {
        throw new Error("note_payload_incomplete");
      }
      await notifyFollowersOfAuthorPost({
        authorId,
        postId,
        body,
        pickId: payload.pickId ? String(payload.pickId) : null,
      });
      return;
    }
    case "DM_SENT":
      // Reserved for Phase 3+ DM fanout.
      return;
    default:
      throw new Error(`unsupported_social_outbox_type:${event.event_type}`);
  }
}

export async function processSocialOutboxBatch(): Promise<number> {
  const pending = await socialOutboxRepository.getPendingEvents(50);
  if (pending.length === 0) return 0;

  let processed = 0;
  for (const event of pending) {
    if (!event.id) continue;
    try {
      await processOutboxEvent(event);
      await socialOutboxRepository.markProcessed(event.id);
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "social_outbox_failed";
      console.error(`[socialOutboxWorker] event=${event.id} type=${event.event_type} failed:`, message);
      await socialOutboxRepository.markFailed(event.id, message);
    }
  }
  return processed;
}

export function startSocialOutboxWorker(pollMs = 2500): { stop: () => void } {
  console.log("[socialOutboxWorker] starting polling loop...");
  const timer = setInterval(() => {
    processSocialOutboxBatch().catch((err) => {
      console.error("[socialOutboxWorker] fatal loop error", err);
    });
  }, pollMs);

  return {
    stop: () => clearInterval(timer),
  };
}
