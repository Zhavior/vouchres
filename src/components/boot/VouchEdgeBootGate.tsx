import { type ReactNode, useMemo } from "react";
import { bootDataStore } from "../../lib/boot/bootDataStore";
import { useVouchEdgeBoot } from "../../features/hr/hooks/useVouchEdgeBoot";
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

  if (!shouldRunBoot) {
    return <>{children}</>;
  }

  if (!boot.ready) {
    return <VouchEdgeBootScreen boot={boot} />;
  }

  try {
    sessionStorage.setItem(storageKey, "true");
  } catch {
    // Safe no-op. Some privacy modes can block storage.
  }

  return <>{children}</>;
}
