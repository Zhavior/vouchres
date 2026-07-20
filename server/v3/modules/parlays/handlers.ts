import type { Response } from "express";
import { AppError } from "../../../errors/AppError";
import { apiOkFlat } from "../../../lib/apiResponse";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { assertUserOwnsResource } from "../../../middleware/ownership";
import { commitParlayTrustLedger, finalizeParlayTrustLock, getUserParlay, listUserParlays } from "../../../services/parlays/userParlayService";
import { previewUserParlaySave, saveUserParlay } from "../../../services/parlays/parlayCreationService";
import type { SaveMeParlayInput } from "../../../validators/parlaySchemas";

export async function buildV3ParlayDetailPayload(input: {
  userId: string;
  parlayId: string;
}): Promise<{ parlay: Awaited<ReturnType<typeof getUserParlay>> }> {
  const parlay = await getUserParlay({
    userId: input.userId,
    parlayId: input.parlayId,
  });

  return { parlay };
}

export async function buildV3ParlayListPayload(input: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<Awaited<ReturnType<typeof listUserParlays>>> {
  return listUserParlays({
    userId: input.userId,
    limit: input.limit,
    offset: input.offset,
  });
}

export async function buildV3ParlaySavePayload(input: {
  userId: string;
  body: SaveMeParlayInput;
}) {
  return saveUserParlay({
    userId: input.userId,
    body: input.body,
  });
}

export async function buildV3ParlaySavePreviewPayload(input: {
  userId: string;
  body: SaveMeParlayInput;
}) {
  return previewUserParlaySave({
    userId: input.userId,
    body: input.body,
  });
}

async function assertOwnedParlay(userId: string, parlayId: string): Promise<void> {
  const owned = await assertUserOwnsResource(userId, "parlay", parlayId);
  if (owned.ok === false) {
    if (owned.warning === "resource not found for authenticated user") {
      throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Ownership check failed.",
      details: { warning: owned.warning },
    });
  }
}

export async function sendV3ParlayDetailResponse(
  req: RequestWithContext & { user?: { id: string } },
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." });
  }

  await assertOwnedParlay(userId, req.params.id);
  const payload = await buildV3ParlayDetailPayload({
    userId,
    parlayId: req.params.id,
  });

  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    ...payload,
  }));
}

export async function sendV3ParlayListResponse(
  req: RequestWithContext & { user?: { id: string } },
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." });
  }

  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const payload = await buildV3ParlayListPayload({
    userId,
    limit,
    offset,
  });

  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    ...payload,
  }));
}

export async function sendV3ParlaySaveResponse(
  req: RequestWithContext & { user?: { id: string } },
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." });
  }

  const result = await buildV3ParlaySavePayload({
    userId,
    body: req.body as SaveMeParlayInput,
  });

  return res.status(result.statusCode).json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    ...(result.body as unknown as Record<string, unknown>),
  }));
}

export async function sendV3ParlaySavePreviewResponse(
  req: RequestWithContext & { user?: { id: string } },
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." });
  }

  const preview = await buildV3ParlaySavePreviewPayload({
    userId,
    body: req.body as SaveMeParlayInput,
  });

  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    preview: preview as unknown as Record<string, unknown>,
  }));
}

export async function buildV3ParlayTrustCommitPayload(input: {
  userId: string;
  parlayId: string;
  audience?: "private" | "public" | "subscriber";
}) {
  return commitParlayTrustLedger(input);
}

export async function sendV3ParlayTrustCommitResponse(
  req: RequestWithContext & { user?: { id: string } },
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." });
  }

  await assertOwnedParlay(userId, req.params.id);
  const audience = typeof (req.body as { audience?: unknown } | undefined)?.audience === "string"
    ? (req.body as { audience?: "private" | "public" | "subscriber" }).audience
    : "private";

  const parlay = await buildV3ParlayTrustCommitPayload({
    userId,
    parlayId: req.params.id,
    audience,
  });

  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    parlay,
  }));
}

export async function buildV3ParlayTrustFinalizePayload(input: {
  userId: string;
  parlayId: string;
}) {
  return finalizeParlayTrustLock(input);
}

export async function sendV3ParlayTrustFinalizeResponse(
  req: RequestWithContext & { user?: { id: string } },
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." });
  }

  await assertOwnedParlay(userId, req.params.id);
  const parlay = await buildV3ParlayTrustFinalizePayload({
    userId,
    parlayId: req.params.id,
  });

  if (!parlay?.locked_at) {
    throw new AppError({
      status: 409,
      code: "domain_state_error",
      message: "Parlay is not ready to lock yet.",
    });
  }

  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    parlay,
  }));
}
