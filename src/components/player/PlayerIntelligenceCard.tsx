import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import type { LiveAtBatSnapshot } from "../../types/liveAtBat";

const DISMISS_KEY = "ve_live_ai_breakdown_closed";

type PlayerIntelligenceCardProps = {
  snapshot?: LiveAtBatSnapshot;
  onOpenPitcherProfile?: (pitcherId: number) => void;
};

export function PlayerIntelligenceCard({
  snapshot,
  onOpenPitcherProfile,
}: PlayerIntelligenceCardProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const batterKey = snapshot?.play?.batter?.name ?? "";

  useEffect(() => {
    if (!batterKey) return;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    if (desktop && !dismissed) {
      setOpen(true);
    }
  }, [batterKey]);

  const closePanel = () => {
    setOpen(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  const togglePanel = () => {
    if (open) {
      closePanel();
      return;
    }
    sessionStorage.removeItem(DISMISS_KEY);
    setOpen(true);
  };

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close AI breakdown"
              className="fixed inset-0 z-[118] bg-black/55 backdrop-blur-sm md:hidden"
              onClick={closePanel}
            />

            <aside
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Live AI breakdown"
              className="fixed z-[119] flex max-h-[min(72vh,640px)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-cyan-400/25 bg-[linear-gradient(145deg,rgba(8,20,31,0.98),rgba(4,9,16,0.96))] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl bottom-3 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:right-4 md:top-[4.75rem] md:w-[min(22rem,calc(100vw-2rem))] md:max-h-[calc(100vh-5.5rem)] md:translate-x-0 xl:right-6"
            >
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
                    AI Breakdown
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Live pitcher vs batter — follows you while you scroll
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-red-300">
                    Live
                  </span>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <PlayerIntelligenceCardBody
                  snapshot={snapshot}
                  onOpenPitcherProfile={onOpenPitcherProfile}
                />
              </div>
            </aside>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-300 transition hover:border-sky-400/60 hover:bg-sky-500/20"
      >
        AI Breakdown
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {panel}
    </>
  );
}

function PlayerIntelligenceCardBody({
  snapshot,
  onOpenPitcherProfile,
}: PlayerIntelligenceCardProps) {
  const batter = snapshot?.play?.batter;
  const pitcher = snapshot?.play?.pitcher;

  return (
    <div className="space-y-px bg-white/10 p-3 sm:p-4">
      <article className="rounded-2xl bg-ve-obsidian p-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          Pitcher
        </p>

        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar
            name={pitcher?.name ?? "Pitcher"}
            imageUrl={null}
            accent="cyan"
          />

          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-white">
              {pitcher?.name ?? "Waiting for pitcher"}
            </h3>
            <p className="mt-1 text-xs text-white/50">
              {pitcher?.gameLine ?? "Live pitching line unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric
            label="Inning"
            value={
              snapshot?.inning != null
                ? `${snapshot.halfInning ?? ""} ${snapshot.inning}`.trim()
                : "—"
            }
          />
          <Metric label="Outs" value={snapshot?.outs ?? "—"} />
          <Metric label="Pitches" value={snapshot?.play?.pitches.length ?? "—"} />
        </div>

        {pitcher?.id != null && onOpenPitcherProfile && (
          <button
            type="button"
            onClick={() => onOpenPitcherProfile(pitcher.id as number)}
            className="mt-4 w-full rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-black text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
          >
            View Pitcher Profile
          </button>
        )}
      </article>

      <article className="rounded-2xl bg-ve-storm p-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          At The Plate
        </p>

        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar
            name={batter?.name ?? "Batter"}
            imageUrl={batter?.headshot ?? null}
            accent="gold"
          />

          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-white">
              {batter?.name ?? "Waiting for batter"}
            </h3>
            <p className="mt-1 text-xs text-white/50">
              {batter?.gameLine ?? "Live batting line unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric label="Balls" value={snapshot?.count.balls ?? "—"} />
          <Metric label="Strikes" value={snapshot?.count.strikes ?? "—"} />
          <Metric label="Runners" value={countRunners(snapshot?.runners)} />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
            Current play
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">
            {snapshot?.play?.description ??
              "Waiting for the next MLB play update."}
          </p>
        </div>
      </article>
    </div>
  );
}

function PlayerAvatar({
  name,
  imageUrl,
  accent,
}: {
  name: string;
  imageUrl: string | null;
  accent: "cyan" | "gold";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accentClass =
    accent === "cyan"
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
      : "border-amber-300/30 bg-amber-300/10 text-amber-200";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name} headshot`}
        className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 bg-black/30 object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-base font-black ${accentClass}`}
      aria-hidden="true"
    >
      {initials || "—"}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 text-center">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function countRunners(
  runners: LiveAtBatSnapshot["runners"] | undefined,
): number {
  if (!runners) return 0;

  return [runners.first, runners.second, runners.third].filter(Boolean).length;
}
