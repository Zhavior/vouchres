import { vouchedgeApi } from "../api/vouchedgeApi";

export const HrBoardRepository = {
  getToday(previewLimit?: number, signal?: AbortSignal) {
    return vouchedgeApi.hrBoardToday(previewLimit, signal);
  },

  getByDate(date: string, previewLimit?: number, signal?: AbortSignal) {
    return vouchedgeApi.hrBoardByDate(date, previewLimit, signal);
  },

  getPlayer(playerId: number, date?: string) {
    return vouchedgeApi.hrBoardPlayer(playerId, date);
  },
};
