import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, optionalAuth, requireAuth, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { worldChatLimiter } from "../middleware/rateLimit";
import {
  getChatProfile,
  honestWinRate,
  listWorldChatMessages,
  postWorldChatMessage,
  putChatProfile,
} from "../services/worldChat/worldChatService";

/**
 * World Chat — public read, authenticated write.
 *
 *   GET  /api/world-chat/messages      — recent messages (no fake seed data)
 *   POST /api/world-chat/messages      — post a message (auth required)
 *   GET  /api/profile/chat-profile     — user's chat profile customizations
 *   PUT  /api/profile/chat-profile     — update chat profile customizations
 */
export const worldChatRoutes = Router();

worldChatRoutes.get(
  "/world-chat/messages",
  optionalAuth,
  asyncHandler(async (req, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const items = listWorldChatMessages(limit);
    return res.json({ ok: true, messages: items, preview: items.length === 0 });
  }),
);

const PostMessageSchema = z.object({
  text: z.string().min(1).max(500),
  accentColor: z.string().max(24).optional(),
  statusLine: z.string().max(80).optional(),
  borderId: z.string().max(64).optional().nullable(),
});

worldChatRoutes.post(
  "/world-chat/messages",
  requireAuth,
  worldChatLimiter,
  validate({ body: PostMessageSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
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

    const storedChat = getChatProfile(userId);
    const accentColor = body.accentColor ?? storedChat?.accentColor ?? "cyan";
    const statusLine = body.statusLine ?? storedChat?.statusLine ?? "Researching edges";

    const message = postWorldChatMessage({
      userId,
      username: profileRow.username,
      displayName: profileRow.display_name || profileRow.username,
      avatarUrl: profileRow.avatar_url,
      borderId: body.borderId ?? null,
      accentColor,
      statusLine,
      winRate: honestWinRate(profileRow.won_picks, profileRow.total_picks),
      text: body.text,
    });

    return res.json({ ok: true, message });
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
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const chatProfile = getChatProfile(req.user!.id);
    return res.json({ ok: true, chatProfile });
  }),
);

worldChatRoutes.put(
  "/profile/chat-profile",
  requireAuth,
  validate({ body: ChatProfileSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const body = req.body as z.infer<typeof ChatProfileSchema>;
    const existing = getChatProfile(req.user!.id);
    const chatProfile = putChatProfile(req.user!.id, {
      statusLine: body.statusLine ?? existing?.statusLine ?? "Researching edges",
      accentColor: body.accentColor ?? existing?.accentColor ?? "cyan",
      tag: body.tag ?? existing?.tag,
    });
    return res.json({ ok: true, chatProfile });
  }),
);
