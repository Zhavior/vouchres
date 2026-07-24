import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, optionalAuth, requireAuth, requireStaff, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import { worldChatLimiter } from "../middleware/rateLimit";
import {
  getResolvedWorldChatStorageMeta,
  getBlockedWorldChatTerms,
  getChatProfile,
  honestWinRate,
  listWorldChatChannels,
  listWorldChatEmojis,
  listWorldChatMessages,
  postWorldChatMessage,
  toggleWorldChatReaction,
  upsertWorldChatEmoji,
  validateWorldChatMessage,
  putChatProfile,
} from "../services/worldChat/worldChatService";

/**
 * World Chat — public read, authenticated write.
 *
 *   GET  /api/world-chat/messages      — recent messages (no fake seed data)
 *   POST /api/world-chat/messages      — post a message (auth required)
 *   POST /api/world-chat/reactions     — add/remove an approved emoji reaction
 *   GET  /api/world-chat/emojis        — approved custom emoji pack
 *   POST /api/world-chat/emojis        — staff-only emoji management
 *   GET  /api/profile/chat-profile     — user's chat profile customizations
 *   PUT  /api/profile/chat-profile     — update chat profile customizations
 */
export const worldChatRoutes = Router();

type WorldChatReq = AuthedRequest & RequestWithContext;

worldChatRoutes.get(
  "/world-chat/messages",
  optionalAuth,
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const channelId = typeof req.query.channelId === "string" ? req.query.channelId : undefined;
    const items = await listWorldChatMessages(limit, {
      channelId,
      viewerId: req.user?.id,
    });
    const storage = await getResolvedWorldChatStorageMeta();
    const [channels, emojis] = await Promise.all([
      listWorldChatChannels(),
      listWorldChatEmojis(),
    ]);
    return res.json(apiOkFlat(req, {
      messages: items,
      channels,
      emojis,
      blockedTerms: getBlockedWorldChatTerms(),
      preview: items.length === 0,
      storage,
    }));
  }),
);

const PostMessageSchema = z.object({
  text: z.string().min(1).max(500),
  channelId: z.string().max(80).optional(),
  replyToMessageId: z.string().max(80).optional().nullable(),
  accentColor: z.string().max(24).optional(),
  statusLine: z.string().max(80).optional(),
  borderId: z.string().max(64).optional().nullable(),
});

worldChatRoutes.post(
  "/world-chat/messages",
  requireAuth,
  worldChatLimiter,
  validate({ body: PostMessageSchema }),
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    const body = req.body as z.infer<typeof PostMessageSchema>;
    const userId = req.user!.id;

    const { data: profileRow, error } = await supabaseAdmin
      .from("profiles")
      .select("username, display_name, avatar_url, won_picks, total_picks")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profileRow) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Could not load profile for chat message.",
        cause: error,
      });
    }

    const storedChat = await getChatProfile(userId);
    const accentColor = body.accentColor ?? storedChat?.accentColor ?? "cyan";
    const statusLine = body.statusLine ?? storedChat?.statusLine ?? "Researching edges";
    const moderationFailure = validateWorldChatMessage(body.text);
    if (moderationFailure) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "World Chat blocked that message. Remove the blocked word and try again.",
        details: {
          reason: moderationFailure.code,
          blockedTerm: moderationFailure.term,
        },
      });
    }

    let message;
    try {
      message = await postWorldChatMessage({
        userId,
        username: profileRow.username,
        displayName: profileRow.display_name || profileRow.username,
        avatarUrl: profileRow.avatar_url,
        borderId: body.borderId ?? null,
        accentColor,
        statusLine,
        winRate: honestWinRate(profileRow.won_picks, profileRow.total_picks),
        channelId: body.channelId,
        replyToMessageId: body.replyToMessageId ?? null,
        text: body.text,
      });
    } catch (error) {
      if ((error as Error)?.message === "invalid_world_chat_reply_target") {
        throw new AppError({
          status: 400,
          code: "bad_request",
          message: "That reply target is no longer available in this room.",
        });
      }
      if ((error as Error)?.message === "world_chat_durable_unavailable") {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message: "World Chat durable storage is unavailable. Try again shortly.",
          details: { reason: "world_chat_durable_unavailable" },
          expose: true,
        });
      }
      throw error;
    }

    return res.json(apiOkFlat(req, {
      message,
      storage: await getResolvedWorldChatStorageMeta(),
    }));
  }),
);

const ReactionSchema = z.object({
  messageId: z.string().min(1).max(80),
  emojiId: z.string().min(1).max(64),
});

worldChatRoutes.post(
  "/world-chat/reactions",
  requireAuth,
  worldChatLimiter,
  validate({ body: ReactionSchema }),
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    const body = req.body as z.infer<typeof ReactionSchema>;
    try {
      const reactions = await toggleWorldChatReaction({
        messageId: body.messageId,
        emojiId: body.emojiId,
        userId: req.user!.id,
      });

      return res.json(apiOkFlat(req, { messageId: body.messageId, reactions }));
    } catch (error) {
      const message = (error as Error)?.message;
      if (message === "inactive_world_chat_emoji") {
        throw new AppError({
          status: 400,
          code: "bad_request",
          message: "That emoji is not available in the approved World Chat pack.",
        });
      }
      if (message === "world_chat_message_not_found") {
        throw new AppError({
          status: 404,
          code: "not_found",
          message: "That World Chat message could not be found.",
        });
      }
      if (message === "world_chat_durable_unavailable") {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message: "World Chat durable storage is unavailable. Try again shortly.",
          details: { reason: "world_chat_durable_unavailable" },
          expose: true,
        });
      }
      throw error;
    }
  }),
);

worldChatRoutes.get(
  "/world-chat/emojis",
  optionalAuth,
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    return res.json(apiOkFlat(req, {
      emojis: await listWorldChatEmojis(),
      blockedTerms: getBlockedWorldChatTerms(),
    }));
  }),
);

const UpsertEmojiSchema = z.object({
  id: z.string().min(1).max(64),
  shortcode: z.string().min(1).max(32),
  imageUrl: z.string().url().max(500),
  altText: z.string().min(1).max(80),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

worldChatRoutes.post(
  "/world-chat/emojis",
  requireAuth,
  requireStaff,
  validate({ body: UpsertEmojiSchema }),
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    const body = req.body as z.infer<typeof UpsertEmojiSchema>;
    const emoji = await upsertWorldChatEmoji(body);
    return res.json(apiOkFlat(req, { emoji }));
  }),
);

const ChatProfileSchema = z.object({
  statusLine: z.string().max(80).optional(),
  accentColor: z.string().max(24).optional(),
  tag: z.string().max(32).optional(),
});

worldChatRoutes.get(
  "/profile/chat-profile",
  requireAuth,
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    const chatProfile = await getChatProfile(req.user!.id);
    return res.json(apiOkFlat(req, { chatProfile }));
  }),
);

worldChatRoutes.put(
  "/profile/chat-profile",
  requireAuth,
  validate({ body: ChatProfileSchema }),
  asyncHandler(async (req: WorldChatReq, res: Response) => {
    const body = req.body as z.infer<typeof ChatProfileSchema>;
    const existing = await getChatProfile(req.user!.id);
    const chatProfile = await putChatProfile(req.user!.id, {
      statusLine: body.statusLine ?? existing?.statusLine ?? "Researching edges",
      accentColor: body.accentColor ?? existing?.accentColor ?? "cyan",
      tag: body.tag ?? existing?.tag,
    });
    return res.json(apiOkFlat(req, { chatProfile }));
  }),
);
