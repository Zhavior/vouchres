// Themes API service
import { api } from "@/lib/api";
import type { VisualTheme } from "@/data/themes";

export interface MyThemesResponse {
  active_theme: string;
  bought_themes: string[];
  theme_credits: number;
}

export const themesApi = {
  list: async (category?: string): Promise<{ data: any[]; meta: any }> => {
    const r = await api.get("/themes", { params: { category } });
    return r.data;
  },

  get: async (themeId: string): Promise<{ data: any; meta: any }> => {
    const r = await api.get(`/themes/${themeId}`);
    return r.data;
  },

  myThemes: async (): Promise<MyThemesResponse> => {
    const r = await api.get("/me/themes");
    return r.data.data;
  },

  buy: async (themeId: string): Promise<any> => {
    const r = await api.post("/themes/buy", { theme_id: themeId });
    return r.data;
  },

  activate: async (themeId: string): Promise<any> => {
    const r = await api.post("/themes/activate", { theme_id: themeId });
    return r.data;
  },

  deactivate: async (): Promise<any> => {
    const r = await api.post("/themes/deactivate");
    return r.data;
  },

  grantCredits: async (credits: number): Promise<any> => {
    const r = await api.post("/me/themes/credits", { credits });
    return r.data;
  },
};
