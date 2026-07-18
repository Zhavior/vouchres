import { type ReactNode, useEffect, useMemo } from "react";
import { bootDataStore } from "../../lib/boot/bootDataStore";
import { useVouchEdgeBoot } from "../../features/hr/hooks/useVouchEdgeBoot";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../hooks/queries/queryKeys";
import { todayISO } from "../../hooks/queries/hrBoardQuery";
import type { HrBoardResponse } from "../../types/hrBoard";
import VouchEdgeBootScreen from "./VouchEdgeBootScreen";

type Props = {
  children: ReactNode;
  enabled?: boolean;
  storageKey?: string;
};

export default function VouchEdgeBootGate({
  children,
  enabled = true,
  storageKey = "vouchedge_boot_complete_v1",
}: Props) {
  const shouldRunBoot = useMemo(() => {
    if (!enabled) return false;

    const hasWarmBootData =
      bootDataStore.has("lineupToday") ||
      bootDataStore.has("dailyPlayers") ||
      bootDataStore.has("dailyHrBoard");

    try {
      const bootWasCompleted = sessionStorage.getItem(storageKey) === "true";
      return !bootWasCompleted || !hasWarmBootData;
    } catch {
      return !hasWarmBootData;
    }
  }, [enabled, storageKey]);

  const boot = useVouchEdgeBoot(shouldRunBoot);

  useEffect(() => {
    if (!shouldRunBoot || !boot.ready) return;

    const hrBoard = bootDataStore.get<HrBoardResponse>("dailyHrBoard");
    if (hrBoard) {
      const date = todayISO();
      const updatedAt = bootDataStore.getUpdatedAt("dailyHrBoard");
      queryClient.setQueryData(queryKeys.hrBoard(date), hrBoard, {
        updatedAt,
      });
    }

    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // Safe no-op. Some privacy modes can block storage.
    }
  }, [boot.ready, shouldRunBoot, storageKey]);

  // Keep children mounted under the splash so routes/data can warm while branding plays.
  return (
    <>
      {children}
      {shouldRunBoot && !boot.ready ? <VouchEdgeBootScreen boot={boot} /> : null}
    </>
  );
}
