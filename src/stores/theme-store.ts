import { create } from "zustand";
import { persist } from "zustand/middleware";
import { themesApi, type MyThemesResponse } from "@/services/themes";
import { getTheme, type VisualTheme } from "@/data/themes";

interface ThemeState {
  activeThemeId: string;
  boughtThemes: string[];
  themeCredits: number;
  isLoading: boolean;

  fetchMyThemes: () => Promise<void>;
  buyTheme: (themeId: string) => Promise<boolean>;
  activateTheme: (themeId: string) => Promise<boolean>;
  deactivateTheme: () => Promise<boolean>;
  grantCredits: (amount: number) => Promise<boolean>;
  getActiveTheme: () => VisualTheme | undefined;
  isOwned: (themeId: string) => boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: "default",
      boughtThemes: ["default"],
      themeCredits: 1000,
      isLoading: false,

      fetchMyThemes: async () => {
        try {
          const data = await themesApi.myThemes();
          set({
            activeThemeId: data.active_theme,
            boughtThemes: data.bought_themes,
            themeCredits: data.theme_credits,
          });
        } catch {
          // Not logged in or error — keep defaults
        }
      },

      buyTheme: async (themeId) => {
        try {
          const result = await themesApi.buy(themeId);
          set({
            boughtThemes: [...get().boughtThemes, themeId],
            themeCredits: result.theme_credits,
          });
          return true;
        } catch (err: any) {
          if (err?.response?.status === 402) {
            alert("Insufficient credits! Earn more through verified wins or grant yourself credits in the Theme Store.");
          } else {
            alert("Failed to buy theme: " + (err?.response?.data?.detail || "unknown error"));
          }
          return false;
        }
      },

      activateTheme: async (themeId) => {
        try {
          await themesApi.activate(themeId);
          set({ activeThemeId: themeId });
          return true;
        } catch (err: any) {
          alert("Failed to activate theme: " + (err?.response?.data?.detail || "unknown error"));
          return false;
        }
      },

      deactivateTheme: async () => {
        try {
          await themesApi.deactivate();
          set({ activeThemeId: "default" });
          return true;
        } catch {
          return false;
        }
      },

      grantCredits: async (amount) => {
        try {
          const result = await themesApi.grantCredits(amount);
          set({ themeCredits: result.theme_credits });
          return true;
        } catch {
          return false;
        }
      },

      getActiveTheme: () => {
        return getTheme(get().activeThemeId);
      },

      isOwned: (themeId) => {
        return get().boughtThemes.includes(themeId);
      },
    }),
    { name: "vouchedge-themes" }
  )
);
