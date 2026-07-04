import { useEffect } from "react";
import {
  Bell, Crown, FlaskConical, Gauge, Layers3, ScrollText, Shield,
  Sparkles, Target, Trophy, X,
} from "lucide-react";
import type { CreatorProofProfile, Parlay } from "../../types";

/**
 * The Edge Island Command Center — a quick-launch popup dock.
 *
 * Designed to pop open on top of whatever page the user is on and close
 * again cleanly, any number of times, with no leaked listeners or stale
 * state: it renders nothing while `open` is false, and its only side effect
 * (the Esc-key listener + body scroll lock) is registered and torn down in
 * the same effect every time `open` flips.
 *
 * Every number shown here comes from real props (profile, savedSlips) —
 * no invented stats, no fake daily-missions checklist, no placeholder
 * "live" game cards.
 */
type Props = {
  open: boolean;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
  savedSlips?: Parlay[];
  profile?: CreatorProofProfile;
};

const ZONES = [
  { title: "HR Board", subtitle: "Daily HR targets, edge grades, and research cards", section: "hr_board", icon: Target, tag: "Start here" },
  { title: "Parlay Dock", subtitle: "Build, save, and track parlays", section: "build", icon: Shield, tag: "Builder" },
  { title: "Research Lab", subtitle: "Player, pitcher, matchup research", section: "research", icon: FlaskConical, tag: "Deep dive" },
  { title: "Ledger Vault", subtitle: "Wins, losses, and full history", section: "results", icon: ScrollText, tag: "Proof" },
  { title: "Notifications", subtitle: "HR alerts, parlay alerts, live updates", section: "notifications", icon: Bell, tag: "Alerts" },
  { title: "Pro Tower", subtitle: "Premium tools and upgrade path", section: "premium", icon: Crown, tag: "Pro" },
] as const;

const TIER_LABEL: Record<string, string> = {
  BASIC: "Basic",
  GOLD: "Gold",
  SELLER_PRO: "Seller Pro",
};

export default function EdgeIslandCommandCenter({ open, onClose, onSectionChange, savedSlips = [], profile }: Props) {
  // Esc closes; body scroll is locked while the island is open. Both are
  // torn down on every close/unmount, so opening and closing repeatedly
  // never accumulates listeners or leaves the page stuck unscrollable.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (section: string) => {
    onSectionChange?.(section);
    onClose();
  };

  const pendingParlays = savedSlips.filter((p) => p.status === "PENDING").slice(0, 4);
  const firstName = profile?.displayName?.split(" ")[0];
  const decided = (profile?.totalPicks ?? 0) > 0;
  const tierLabel = profile?.subscriptionTier ? TIER_LABEL[profile.subscriptionTier] ?? profile.subscriptionTier : "Basic";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="The Edge Island">
      <button
        type="button"
        aria-label="Close The Edge Island"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-cyan-950/40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#020617,#0f172a)]" />

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                The Edge Island
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {firstName ? `Welcome back, ${firstName}.` : "Your command island."}
              </h1>
              <p className="mt-1.5 text-sm font-semibold text-slate-400">
                A quick-launch dock for the routes you use most.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Real stats — every value is derived from props, not invented */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
              <Gauge className="mx-auto mb-1.5 h-4 w-4 text-cyan-200" />
              <div className="text-xl font-black text-white">{decided ? `${profile!.winRate.toFixed(1)}%` : "—"}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Win Rate</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
              <Trophy className="mx-auto mb-1.5 h-4 w-4 text-emerald-200" />
              <div className="text-xl font-black text-white">{decided ? `${profile!.wonPicks}-${profile!.totalPicks - profile!.wonPicks}` : "0-0"}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Record</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
              <Layers3 className="mx-auto mb-1.5 h-4 w-4 text-amber-200" />
              <div className="text-xl font-black text-white">{pendingParlays.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pending</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
              <Crown className="mx-auto mb-1.5 h-4 w-4 text-violet-200" />
              <div className="text-xl font-black text-white">{tierLabel}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Plan</div>
            </div>
          </div>

          {/* Quick-launch zones */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ZONES.map((zone) => {
              const Icon = zone.icon;
              return (
                <button
                  key={zone.title}
                  type="button"
                  onClick={() => go(zone.section)}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-2xl bg-cyan-300/10 p-2.5 text-cyan-200">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-300">
                      {zone.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{zone.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{zone.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Real pending parlays — no fake list */}
          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-300" />
              <h2 className="text-sm font-black text-white">Pending parlays</h2>
            </div>
            {pendingParlays.length > 0 ? (
              <div className="space-y-2">
                {pendingParlays.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => go("live_parlays")}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-left transition hover:border-cyan-300/30"
                  >
                    <span className="truncate text-xs font-bold text-slate-200">{p.title || "Saved parlay"}</span>
                    <span className="font-mono text-[11px] text-slate-400">{p.totalOdds}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => go("build")}
                className="w-full rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-3.5 text-center text-xs font-bold text-slate-500 transition hover:text-slate-300"
              >
                No pending parlays — build one
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-[10px] font-bold text-slate-500">
            Research &amp; entertainment only — no guaranteed outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}
