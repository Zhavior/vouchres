import type { HrBoard } from "../models/HrBoard";

export function validateHrBoard(data: unknown): HrBoard {
  const board = data as Partial<HrBoard>;

  return {
    confirmed: board.confirmed ?? [],
    projected: board.projected ?? [],
    blocked: board.blocked ?? [],

    confirmedCount: board.confirmedCount ?? 0,
    projectedCount: board.projectedCount ?? 0,
    blockedCount: board.blockedCount ?? 0,

    updatedAt: board.updatedAt ?? null,
  };
}
