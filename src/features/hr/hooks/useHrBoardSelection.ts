import { useCallback, useState } from "react";
import type { HrBoardRow } from "../types/hrBoard";

export function useHrBoardSelection() {
  const [selected, setSelected] = useState<HrBoardRow | null>(null);

  const clearSelected = useCallback(() => {
    setSelected(null);
  }, []);

  return {
    selected,
    setSelected,
    clearSelected,
  };
}
