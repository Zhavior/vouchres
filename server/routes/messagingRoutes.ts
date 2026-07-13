import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { directMessageLimiter } from "../middleware/rateLimit";
import {
  getOrCreateConversation,
  listConversationsForUser,
  listMessages,
  markConversationRead,
  sendMessage,
} from "../services/messaging/messagingService";

/**
 * Direct Messages — private 1:1 messaging between any two users.
 *
 *   GET  /api/messages/conversations                 — inbox for the current user
 *   POST /api/messages/conversations                  — start (or reuse) a conversation
 *   GET  /api/messages/conversations/:id/messages      — message history
 *   POST /api/messages/conversations/:id/messages      — send a message
 *   POST /api/messages/conversations/:id/read          — mark a conversation read
 */
export const messagingRoutes = Router();

type MessagingReq = AuthedRequest & RequestWithContext;

messagingRoutes.get(
  "/messages/conversations",
  requireAuth,
  asyncHandler(async (req: MessagingReq, res: Response) => {
    const conversations = await listConversationsForUser(req.user!.id);
    return res.json(apiOkFlat(req, { conversations }));
  }),
);

const StartConversationSchema = z.object({
  recipientUserId: z.string().uuid(),
});

messagingRoutes.post(
  "/messages/conversations",
  requireAuth,
  validate({ body: StartConversationSchema }),
  asyncHandler(async (req: MessagingReq, res: Response) => {
    const body = req.body as z.infer<typeof StartConversationSchema>;
    const conversation = await getOrCreateConversation(req.user!.id, body.recipientUserId);
    return res.json(apiOkFlat(req, { conversation }));
  }),
);

messagingRoutes.get(
  "/messages/conversations/:id/messages",
  requireAuth,
  asyncHandler(async (req: MessagingReq, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 200);
    const messages = await listMessages(req.params.id, req.user!.id, limit);
    return res.json(apiOkFlat(req, { messages }));
  }),
);

const SendMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

messagingRoutes.post(
  "/messages/conversations/:id/messages",
  requireAuth,
  directMessageLimiter,
  validate({ body: SendMessageSchema }),
  asyncHandler(async (req: MessagingReq, res: Response) => {
    const body = req.body as z.infer<typeof SendMessageSchema>;
    const message = await sendMessage(req.params.id, req.user!.id, body.text);
    return res.json(apiOkFlat(req, { message }));
  }),
);

messagingRoutes.post(
  "/messages/conversations/:id/read",
  requireAuth,
  asyncHandler(async (req: MessagingReq, res: Response) => {
    await markConversationRead(req.params.id, req.user!.id);
    return res.json(apiOkFlat(req, { ok: true }));
  }),
);
