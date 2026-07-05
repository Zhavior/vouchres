import type { HrPlayer } from "./HrPlayer";

export interface HrBoard {
  confirmed: HrPlayer[];
  projected: HrPlayer[];
  blocked: HrPlayer[];

  confirmedCount: number;
  projectedCount: number;
  blockedCount: number;

  updatedAt: string | null;
}
