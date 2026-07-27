import { useMemo } from "react";

import {
  verdictEngine,
  type VerdictInput,
} from "../scoring/verdictEngine";

export function useVerdict(input: import("@/adapters/normalized").NormalizedPlayerPayload | null) {
  return useMemo(() => {
    if (!input) return null;

    return verdictEngine({ payload: input });
  }, [input]);
}
