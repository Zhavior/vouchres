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
import { tailParlayForUser } from "../services/social/parlayTailService";
import type { ListParlaysQuery, SaveMeParlayInput, UpdateParlayInput } from "../validators/parlaySchemas";
import { sendV3ParlayDetailResponse, sendV3ParlayListResponse, sendV3ParlaySaveResponse, sendV3ParlayTrustCommitResponse, sendV3ParlayTrustFinalizeResponse } from "../v3/modules/parlays/handlers";

type ParlayReq = AuthedRequest & RequestWithContext;

export const getParlayHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  return sendV3ParlayDetailResponse(req, res);
});

export const listMyParlaysHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  return sendV3ParlayListResponse(req, res);
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
  return sendV3ParlaySaveResponse(req, res);
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

export const tailParlayHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  const sourcePostId = typeof req.body?.source_post_id === "string" ? req.body.source_post_id : null;
  const result = await tailParlayForUser({
    userId: req.user!.id,
    sourcePickId: req.params.id,
    sourcePostId,
  });
  return res.status(201).json(apiOkFlat(req, result as unknown as Record<string, unknown>));
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
  return sendV3ParlayTrustCommitResponse(req, res);
});

export const finalizeParlayTrustLockHandler = asyncHandler(async (req: ParlayReq, res: Response) => {
  return sendV3ParlayTrustFinalizeResponse(req, res);
});
