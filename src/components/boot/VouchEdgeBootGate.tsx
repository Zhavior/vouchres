import { type ReactNode, useMemo } from "react";
import { useVouchEdgeBoot } from "../../hooks/useVouchEdgeBoot";
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

    try {
      return sessionStorage.getItem(storageKey) !== "true";
    } catch {
      return true;
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
