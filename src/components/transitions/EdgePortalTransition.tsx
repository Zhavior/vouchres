import { ReactNode, useEffect, useState } from "react";
import { Sparkles, Zap } from "lucide-react";

type EdgePortalTransitionProps = {
  children: ReactNode;
  active?: boolean;
  title?: string;
  subtitle?: string;
};

export default function EdgePortalTransition({
  children,
  active = true,
  title = "Entering Your Edge Island",
  subtitle = "Building your personalized VouchEdge command center...",
}: EdgePortalTransitionProps) {
  const [phase, setPhase] = useState<"portal" | "reveal" | "done">(active ? "portal" : "done");

  useEffect(() => {
    if (!active) {
      setPhase("done");
      return;
    }

    setPhase("portal");

    const revealTimer = window.setTimeout(() => setPhase("reveal"), 850);
    const doneTimer = window.setTimeout(() => setPhase("done"), 1550);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
    };
  }, [active]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className={[
          "relative z-[1] min-h-screen transition-all duration-700 ease-out",
          phase === "portal" ? "scale-[0.975] opacity-0 blur-md" : "",
          phase === "reveal" ? "scale-100 opacity-100 blur-0" : "",
          phase === "done" ? "scale-100 opacity-100 blur-0" : "",
        ].join(" ")}
      >
        {children}
      </div>

      {phase !== "done" && (
        <div className="fixed inset-0 z-[9998] grid place-items-center overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(var(--skin-1),0.28),transparent_28%),radial-gradient(circle_at_50%_50%,rgba(var(--skin-2),0.16),transparent_44%),linear-gradient(135deg,rgba(var(--skin-bg),1),#020617)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--skin-1),0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--skin-1),0.045)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />

          <div
            className={[
              "absolute h-[34rem] w-[34rem] rounded-full border transition-all duration-700 ease-out",
              "border-[rgba(var(--skin-1),0.22)] bg-[rgba(var(--skin-1),0.035)] shadow-[0_0_120px_rgba(var(--skin-1),0.24)]",
              phase === "portal" ? "scale-75 opacity-100" : "scale-[2.2] opacity-0",
            ].join(" ")}
          />

          <div
            className={[
              "absolute h-[22rem] w-[22rem] rounded-full border transition-all duration-700 ease-out",
              "border-[rgba(var(--skin-2),0.18)] bg-[rgba(var(--skin-2),0.035)] shadow-[0_0_90px_rgba(var(--skin-2),0.16)]",
              phase === "portal" ? "scale-90 opacity-100 rotate-0" : "scale-[2.8] opacity-0 rotate-45",
            ].join(" ")}
          />

          <div
            className={[
              "relative z-10 w-[min(92vw,520px)] rounded-[2rem] border p-7 text-center transition-all duration-700 ease-out",
              "border-[rgba(var(--skin-1),0.16)] bg-[rgba(var(--skin-bg),0.62)] shadow-[0_30px_120px_rgba(var(--skin-1),0.20)] backdrop-blur-2xl",
              phase === "portal" ? "translate-y-0 scale-100 opacity-100" : "-translate-y-8 scale-95 opacity-0",
            ].join(" ")}
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-[rgba(var(--skin-1),0.22)] bg-[rgba(var(--skin-1),0.12)] shadow-[0_0_45px_rgba(var(--skin-1),0.24)]">
              <Zap className="h-8 w-8 text-[rgb(var(--skin-1))]" />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--skin-1),0.16)] bg-[rgba(var(--skin-1),0.08)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--skin-1))]">
              <Sparkles className="h-3 w-3" />
              Portal Sync
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
              {title}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-slate-300">
              {subtitle}
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full border border-[rgba(var(--skin-1),0.14)] bg-slate-950/60">
              <div
                className={[
                  "h-full rounded-full bg-gradient-to-r from-[rgb(var(--skin-1))] to-[rgb(var(--skin-2))] transition-all duration-700 ease-out",
                  phase === "portal" ? "w-2/3" : "w-full",
                ].join(" ")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
