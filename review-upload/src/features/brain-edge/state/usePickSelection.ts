import { useState } from "react";
import type { PickInput } from "../contracts/pick";

export function usePickSelection() {
  const [pick, setPick] = useState<PickInput | null>(null);

  return {
    pick,
    setPick,
    clearPick: () => setPick(null),
    hasPick: pick !== null,
  };
}
