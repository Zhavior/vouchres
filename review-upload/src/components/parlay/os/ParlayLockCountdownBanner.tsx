import React, { useEffect, useState } from "react";
import { Lock, Clock } from "lucide-react";
import { trustLockCountdownLabel } from "../../../lib/trustLockSchedule";

export default function ParlayLockCountdownBanner({
  trustCommittedAt,
  trustLockAt,
  feedLockedAt,
}: {
  trustCommittedAt?: string | null;
  trustLockAt?: string | null;
  feedLockedAt?: string | null;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (feedLockedAt) {
      setLabel("Locked — slip is sealed for grading");
      return;
    }
    if (!trustCommittedAt || !trustLockAt) {
      setLabel(null);
      return;
    }

    const tick = () => setLabel(trustLockCountdownLabel(trustLockAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [trustCommittedAt, trustLockAt, feedLockedAt]);

  if (!label) return null;

  const sealed = Boolean(feedLockedAt);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-mono ${
        sealed
          ? "border-emerald-500/35 bg-emerald-950/20 text-emerald-200"
          : "border-amber-500/35 bg-amber-950/15 text-amber-100"
      }`}
    >
      {sealed ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />}
      <span>{label}</span>
    </div>
  );
}
