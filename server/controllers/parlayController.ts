import type { Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { assertUserOwnsResource } from "../middleware/ownership";
import {
  getUserParlay,
  getParlayAuditHistory,
  hideUserParlay,
  listUserParlayRows,
  listUserParlays,
  repairUserParlayIdentity,
  updateParlaySummary,
  commitParlayTrustLedger,
  finalizeParlayTrustLock,
} from "../services/parlays/userParlayService";
import { saveUserParlay } from "../services/parlays/parlayCreationService";
import type { ListParlaysQuery, SaveMeParlayInput, UpdateParlayInput } from "../validators/parlaySchemas";

type ParlayReq = AuthedRequest & RequestWithContext;

export const getParlayHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
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

  const parlay = await getUserParlay({ userId: req.user!.id, parlayId: req.params.id });
  return res.json(apiOkFlat(req, { parlay }));
});

export const listMyParlaysHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const query = req.query as unknown as ListParlaysQuery;
  const result = await listUserParlays({
    userId: req.user!.id,
    limit: query.limit,
    offset: query.offset,
  });
  return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
});

export const listLegacyParlaysHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const query = req.query as unknown as ListParlaysQuery;
  if (query.user_id && query.user_id !== req.user!.id) {
    throw new AppError({ status: 403, code: "forbidden", message: "You cannot read another user's parlays." });
  }

  const result = await listUserParlayRows({
    userId: req.user!.id,
    limit: query.limit,
    offset: query.offset,
  });
  return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
});

export const saveMeParlayHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const result = await saveUserParlay({
    userId: req.user!.id,
    body: req.body as SaveMeParlayInput,
  });
  return res.status(result.statusCode).json(apiOkFlat(req, result.body as unknown as Record<string, unknown>));
});

export const updateParlayHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
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

  const body = req.body as UpdateParlayInput;
  const parlay = await updateParlaySummary({
    userId: req.user!.id,
    parlayId: req.params.id,
    title: body.title,
    stakeUnits: body.stake_units,
  });
  return res.json(apiOkFlat(req, { parlay }));
});

export const getParlayAuditHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
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

  const history = await getParlayAuditHistory({
    userId: req.user!.id,
    parlayId: req.params.id,
    limit: 50,
  });
  return res.json(apiOkFlat(req, history as unknown as Record<string, unknown>));
});

export const repairParlayIdentityHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
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

  const payload = await repairUserParlayIdentity({
    userId: req.user!.id,
    parlayId: req.params.id,
  });
  return res.json(apiOkFlat(req, payload as unknown as Record<string, unknown>));
});

export const hideParlayHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
  if (owned.ok === false) {
    if (owned.warning === "resource not found for authenticated user") {
      throw new AppError({ status: 404, code: "not_found", message: "Parlay not found or already hidden." });
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Ownership check failed.",
      details: { warning: owned.warning },
    });
  }

  const result = await hideUserParlay({ userId: req.user!.id, parlayId: req.params.id });
  return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
});

export const commitParlayTrustHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
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

  const audience = typeof req.body?.audience === "string" ? req.body.audience : "private";
  const parlay = await commitParlayTrustLedger({
    userId: req.user!.id,
    parlayId: req.params.id,
    audience: audience as "private" | "public" | "subscriber",
  });
  return res.json(apiOkFlat(req, { parlay }));
});

export const finalizeParlayTrustLockHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "parlay", req.params.id);
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

  const parlay = await finalizeParlayTrustLock({
    userId: req.user!.id,
    parlayId: req.params.id,
  });
  if (!parlay?.locked_at) {
    throw new AppError({
      status: 409,
      code: "domain_state_error",
      message: "Parlay is not ready to lock yet.",
    });
  }
  return res.json(apiOkFlat(req, { parlay }));
});
