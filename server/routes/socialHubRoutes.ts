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
import {
  clearSocialControl,
  createSocialReport,
  getSocialControlState,
  setSocialControl,
  type SocialControlType,
  type SocialReportReason,
  type SocialReportSubjectType,
} from "../services/social/socialSafetyService";
import { socialReportLimiter, socialSafetyLimiter } from "../middleware/rateLimit";

export const socialHubRoutes = Router();

socialHubRoutes.get("/following-hub", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const payload = await buildFollowingHub(req.user!.id);
  return res.json(apiOkFlat(req, payload as unknown as Record<string, unknown>));
}));

const SocialControlSchema = z.object({
  target_id: z.string().uuid(),
  control_type: z.enum(["block", "mute"]),
});

socialHubRoutes.get("/social/safety", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const targetId = typeof req.query.target_id === "string" ? req.query.target_id : "";
  if (!z.string().uuid().safeParse(targetId).success) {
    throw new AppError({ status: 400, code: "bad_request", message: "A valid profile is required." });
  }
  const controls = await getSocialControlState(req.user!.id, targetId);
  return res.json(apiOkFlat(req, controls));
}));

socialHubRoutes.post("/social/safety", requireAuth, socialSafetyLimiter, validate({ body: SocialControlSchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const body = req.body as z.infer<typeof SocialControlSchema>;
  const controls = await setSocialControl({
    actorId: req.user!.id,
    targetId: body.target_id,
    controlType: body.control_type as SocialControlType,
  });
  return res.json(apiOkFlat(req, controls));
}));

socialHubRoutes.delete("/social/safety", requireAuth, socialSafetyLimiter, validate({ body: SocialControlSchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const body = req.body as z.infer<typeof SocialControlSchema>;
  const controls = await clearSocialControl({
    actorId: req.user!.id,
    targetId: body.target_id,
    controlType: body.control_type as SocialControlType,
  });
  return res.json(apiOkFlat(req, controls));
}));

const SocialReportSchema = z.object({
  subject_type: z.enum(["profile", "post", "story"]),
  subject_id: z.string().uuid(),
  reason: z.enum(["spam", "harassment", "impersonation", "harmful_content", "other"]),
  details: z.string().max(500).optional(),
});

socialHubRoutes.post("/social/reports", requireAuth, socialReportLimiter, validate({ body: SocialReportSchema }), asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const body = req.body as z.infer<typeof SocialReportSchema>;
  const report = await createSocialReport({
    reporterId: req.user!.id,
    subjectType: body.subject_type as SocialReportSubjectType,
    subjectId: body.subject_id,
    reason: body.reason as SocialReportReason,
    details: body.details,
    requestId: req.requestId,
  });
  return res.status(201).json(apiOkFlat(req, { report }));
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
  const conversationId = await findOrCreateDirectConversation(req.user!.id, user_id);
  return res.status(201).json(apiOkFlat(req, { conversationId }));
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
