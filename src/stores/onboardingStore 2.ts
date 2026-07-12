import { create } from "zustand";

const STORAGE_KEY = "vouchedge_onboarding_complete";

type OnboardingState = {
  completed: boolean;
  complete: () => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed:
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false,

  complete: () => {
    localStorage.setItem(STORAGE_KEY, "true");
    set({ completed: true });
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ completed: false });
  },
}));
