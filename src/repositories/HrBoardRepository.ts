import { vouchedgeApi } from "../api/vouchedgeApi";

export const HrBoardRepository = {
  getToday(previewLimit?: number) {
    return vouchedgeApi.hrBoardToday(previewLimit);
  },

  getByDate(date: string, previewLimit?: number) {
    return vouchedgeApi.hrBoardByDate(date, previewLimit);
  },

  getPlayer(playerId: number, date?: string) {
    return vouchedgeApi.hrBoardPlayer(playerId, date);
  },
};
