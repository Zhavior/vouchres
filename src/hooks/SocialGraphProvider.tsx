import React, { createContext, useContext } from "react";
import { useAuth } from "../lib/useAuth";
import { useSocialGraph, type SocialGraphBucket, type RelationshipType } from "./useSocialGraph";

type SocialGraphContextValue = ReturnType<typeof useSocialGraph>;

const SocialGraphContext = createContext<SocialGraphContextValue | null>(null);

export function SocialGraphProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const graph = useSocialGraph(user?.id ?? null);
  return (
    <SocialGraphContext.Provider value={graph}>
      {children}
    </SocialGraphContext.Provider>
  );
}

export function useSocialGraphContext(): SocialGraphContextValue {
  const ctx = useContext(SocialGraphContext);
  if (!ctx) {
    throw new Error("useSocialGraphContext must be used within SocialGraphProvider");
  }
  return ctx;
}

export function useOptionalSocialGraph(): SocialGraphContextValue | null {
  return useContext(SocialGraphContext);
}

export type { SocialGraphBucket, RelationshipType };
