/**
 * My HR List CRUD + share intent.
 *
 * Sharing is deliberately two-step: flipping `visibility` to 'public' is the
 * only thing that makes a list readable at /l/:id, and the client must do that
 * explicitly before it can hand the user a share link. Nothing here posts to an
 * external network — the client opens X's own composer with a prefilled draft,
 * so the user always confirms the post inside X.
 */
import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import { getSafePublicOrigin } from "../lib/publicOrigin";
import {
  createHrList,
  deleteHrList,
  getHrListForOwner,
  listHrListsForUser,
  recordHrListShare,
  updateHrList,
  type HrListRecord,
} from "../services/hr-list/hrListService";
import { buildHrListShareText } from "../services/hr-list/hrListShareText";

export const hrListRoutes = Router();

type Req = AuthedRequest & RequestWithContext;

function requireUserId(req: Req): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({
      status: 401,
      code: "missing_token",
      message: "Sign in to manage HR lists.",
    });
  }
  return String(userId);
}

/** Client-facing DTO — snake_case columns stay server-side. */
function toDto(list: HrListRecord, origin: string) {
  return {
    id: list.id,
    title: list.title,
    slateDate: list.slate_date,
    entries: list.entries,
    visibility: list.visibility,
    firstSharedAt: list.first_shared_at,
    shareCount: list.share_count,
    createdAt: list.created_at,
    updatedAt: list.updated_at,
    // Only surface links once the list is actually public, so the UI cannot
    // hand out a URL that would 404 for the recipient.
    permalink: list.visibility === "public" ? `${origin}/l/${list.id}` : null,
    cardImageUrl: list.visibility === "public"
      ? `${origin}/api/share/hr-list/${list.id}/card.png`
      : null,
  };
}

hrListRoutes.get("/hr-lists", requireAuth, asyncHandler(async (req: Req, res: Response) => {
  const lists = await listHrListsForUser(requireUserId(req));
  const origin = getSafePublicOrigin();
  return res.json(apiOkFlat(req, { lists: lists.map((list) => toDto(list, origin)) }));
}));

hrListRoutes.post("/hr-lists", requireAuth, asyncHandler(async (req: Req, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const list = await createHrList({
    userId: requireUserId(req),
    title: body.title,
    slateDate: body.slateDate,
    entries: body.entries,
  });
  return res.status(201).json(apiOkFlat(req, { list: toDto(list, getSafePublicOrigin()) }));
}));

hrListRoutes.get("/hr-lists/:id", requireAuth, asyncHandler(async (req: Req, res: Response) => {
  const list = await getHrListForOwner(requireUserId(req), req.params.id);
  return res.json(apiOkFlat(req, { list: toDto(list, getSafePublicOrigin()) }));
}));

hrListRoutes.patch("/hr-lists/:id", requireAuth, asyncHandler(async (req: Req, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const list = await updateHrList({
    userId: requireUserId(req),
    listId: req.params.id,
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.slateDate !== undefined ? { slateDate: body.slateDate } : {}),
    ...(body.entries !== undefined ? { entries: body.entries } : {}),
    ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
  });
  return res.json(apiOkFlat(req, { list: toDto(list, getSafePublicOrigin()) }));
}));

hrListRoutes.delete("/hr-lists/:id", requireAuth, asyncHandler(async (req: Req, res: Response) => {
  await deleteHrList(requireUserId(req), req.params.id);
  return res.json(apiOkFlat(req, { deleted: true, id: req.params.id }));
}));

/**
 * POST /api/hr-lists/:id/share
 *
 * Publishes the list (so /l/:id resolves) and returns everything the client
 * needs to open a share sheet: the permalink, the card image URL, prefilled
 * post text, and a ready X intent URL. It does NOT post anything — the intent
 * URL opens X's composer and the user confirms there.
 */
hrListRoutes.post("/hr-lists/:id/share", requireAuth, asyncHandler(async (req: Req, res: Response) => {
  const userId = requireUserId(req);
  const origin = getSafePublicOrigin();

  const list = await updateHrList({
    userId,
    listId: req.params.id,
    visibility: "public",
  });

  if (list.entries.length === 0) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Add at least one player before sharing this list.",
      expose: true,
    });
  }

  await recordHrListShare(userId, list.id);

  const permalink = `${origin}/l/${list.id}`;
  const text = buildHrListShareText({
    title: list.title,
    entries: list.entries,
    slateDate: list.slate_date,
  });

  return res.json(apiOkFlat(req, {
    list: toDto(list, origin),
    share: {
      permalink,
      cardImageUrl: `${origin}/api/share/hr-list/${list.id}/card.png`,
      text,
      // X's own composer. The user reviews and presses Post — we never call the
      // X API on their behalf (and posting a link via the API is billed
      // per-post, so intent is both safer and free).
      xIntentUrl: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(permalink)}`,
    },
  }));
}));
