import type { Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import type { AuthedRequest } from "../middleware/auth";
import {
  getUserParlay,
  hideUserParlay,
  listUserParlayRows,
  listUserParlays,
  updateParlaySummary,
} from "../services/parlays/userParlayService";
import { saveUserParlay } from "../services/parlays/parlayCreationService";
import type { ListParlaysQuery, SaveMeParlayInput, UpdateParlayInput } from "../validators/parlaySchemas";

export const getParlayHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parlay = await getUserParlay({ userId: req.user!.id, parlayId: req.params.id });
  return res.json(parlay);
});

export const listMyParlaysHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = req.query as unknown as ListParlaysQuery;
  const result = await listUserParlays({
    userId: req.user!.id,
    limit: query.limit,
    offset: query.offset,
  });
  return res.json(result);
});

export const listLegacyParlaysHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = req.query as unknown as ListParlaysQuery;
  if (query.user_id && query.user_id !== req.user!.id) {
    throw new AppError({ status: 403, code: "forbidden", message: "You cannot read another user's parlays." });
  }

  const result = await listUserParlayRows({
    userId: req.user!.id,
    limit: query.limit,
    offset: query.offset,
  });
  return res.json(result);
});

export const saveMeParlayHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const result = await saveUserParlay({
    userId: req.user!.id,
    body: req.body as SaveMeParlayInput,
  });
  return res.status(result.statusCode).json(result.body);
});

export const updateParlayHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const body = req.body as UpdateParlayInput;
  const parlay = await updateParlaySummary({
    userId: req.user!.id,
    parlayId: req.params.id,
    title: body.title,
    stakeUnits: body.stake_units,
  });
  return res.json(parlay);
});

export const hideParlayHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const result = await hideUserParlay({ userId: req.user!.id, parlayId: req.params.id });
  return res.json(result);
});
