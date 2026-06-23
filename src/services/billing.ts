// Billing API service
import { api } from "@/lib/api";

export const billingApi = {
  checkout: async (req: {
    plan?: string;
    paid_pick_id?: string;
  }): Promise<any> => {
    const r = await api.post("/billing/checkout", req);
    return r.data;
  },

  status: async (): Promise<any> => {
    const r = await api.get("/billing/status");
    return r.data;
  },

  applyCapper: async (bio?: string): Promise<any> => {
    const r = await api.post("/billing/capper/apply", { bio: bio || "" });
    return r.data;
  },

  createPaidPick: async (req: {
    game_id: number;
    player_id: number;
    market: string;
    line?: number;
    price_cents: number;
  }): Promise<any> => {
    const r = await api.post("/billing/paid-picks", req);
    return r.data;
  },

  viewPaidPick: async (pickId: string): Promise<any> => {
    const r = await api.get(`/billing/paid-picks/${pickId}`);
    return r.data;
  },

  payouts: async (): Promise<any> => {
    const r = await api.get("/billing/payouts/my");
    return r.data;
  },
};
