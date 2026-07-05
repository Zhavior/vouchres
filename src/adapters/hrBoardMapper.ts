import type { HrBoard } from "../models/HrBoard";

export function mapHrBoard(api: any): HrBoard {
  return {
    confirmed: api.confirmed ?? [],
    projected: api.projected ?? [],
    blocked: api.blocked ?? [],

    confirmedCount: api.confirmedCount ?? 0,
    projectedCount: api.projectedCount ?? 0,
    blockedCount: api.blockedCount ?? 0,

    updatedAt: api.updatedAt ?? null,
  };
}
