import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import {
  buildFollowingHub,
  clearStatusNote,
  createStory,
  findOrCreateDirectConversation,
  listConversationMessages,
  listConversations,
  markStoryViewed,
  sendDirectMessage,
  upsertStatusNote,
} from "../services/social/followingHubService";

export const socialHubRoutes = Router();

socialHubRoutes.get("/following-hub", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const payload = await buildFollowingHub(req.user!.id);
  return res.json(apiOkFlat(req, payload as unknown as Record<string, unknown>));
}));

const StatusNoteSchema = z.object({
  body: z.string().min(1).max(120),
  emoji: z.string().max(8).optional().nullable(),
});

socialHubRoutes.put("/status-note", requireAuth, validate({ body: StatusNoteSchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const body = req.body as z.infer<typeof StatusNoteSchema>;
  const note = await upsertStatusNote({
    userId: req.user!.id,
    body: body.body,
    emoji: body.emoji,
  });
  return res.json(apiOkFlat(req, { note }));
}));

socialHubRoutes.delete("/status-note", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  await clearStatusNote(req.user!.id);
  return res.json(apiOkFlat(req, {}));
}));

const CreateStorySchema = z.object({
  kind: z.enum(["text", "image"]).optional(),
  body: z.string().max(280).optional().nullable(),
  media_url: z.string().url().optional().nullable(),
  background: z.string().max(32).optional().nullable(),
});

socialHubRoutes.post("/stories", requireAuth, validate({ body: CreateStorySchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const body = req.body as z.infer<typeof CreateStorySchema>;
  const story = await createStory({
    userId: req.user!.id,
    kind: body.kind,
    body: body.body,
    mediaUrl: body.media_url,
    background: body.background,
  });
  return res.status(201).json(apiOkFlat(req, { story }));
}));

socialHubRoutes.post("/stories/:id/view", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  await markStoryViewed({ storyId: req.params.id, viewerId: req.user!.id });
  return res.json(apiOkFlat(req, {}));
}));

socialHubRoutes.get("/messages/conversations", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const conversations = await listConversations(req.user!.id);
  return res.json(apiOkFlat(req, { conversations }));
}));

const StartConversationSchema = z.object({
  user_id: z.string().uuid(),
});

socialHubRoutes.post("/messages/conversations", requireAuth, validate({ body: StartConversationSchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const { user_id } = req.body as z.infer<typeof StartConversationSchema>;
  try {
    const conversationId = await findOrCreateDirectConversation(req.user!.id, user_id);
    return res.status(201).json(apiOkFlat(req, { conversationId }));
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";
    if (code === "dm_requires_mutual_follow") {
      throw new AppError({
        status: 403,
        code: "forbidden",
        message: "You can only message mutual followers.",
        details: { reason: "dm_requires_mutual_follow" },
      });
    }
    throw error;
  }
}));

socialHubRoutes.get("/messages/conversations/:id", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const messages = await listConversationMessages(req.params.id, req.user!.id);
  return res.json(apiOkFlat(req, { messages }));
}));

const SendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

socialHubRoutes.post("/messages/conversations/:id", requireAuth, validate({ body: SendMessageSchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  try {
    const message = await sendDirectMessage({
      conversationId: req.params.id,
      senderId: req.user!.id,
      body: (req.body as z.infer<typeof SendMessageSchema>).body,
    });
    return res.status(201).json(apiOkFlat(req, { message }));
  } catch (error: any) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: error?.message ?? "Cannot send message.",
    });
  }
}));
