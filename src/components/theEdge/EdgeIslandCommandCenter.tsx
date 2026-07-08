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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 font-z8" role="dialog" aria-modal="true" aria-label="The Edge Island">
      <button
        type="button"
        aria-label="Close The Edge Island"
        onClick={onClose}
        className="absolute inset-0 bg-obsidian-900/80 backdrop-blur-sm"
      />

      <div className="glass-panel glass-border relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem]">
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="glass-panel glass-border inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-vouch-emerald" />
                <span className="terminal-text">The Edge Island</span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {firstName ? `Welcome back, ${firstName}.` : "Your command island."}
              </h1>
              <p className="mt-1.5 text-sm text-white/40">
                A quick-launch dock for the routes you use most.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="glass-panel glass-border grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white/50 transition hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Real stats — every value is derived from props, not invented */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="glass-panel glass-border rounded-2xl p-3.5 text-center">
              <Gauge className="mx-auto mb-1.5 h-4 w-4 text-vouch-emerald" />
              <div className="text-xl font-black text-white">{decided ? `${profile!.winRate.toFixed(1)}%` : "—"}</div>
              <div className="terminal-text mt-0.5">Win Rate</div>
            </div>
            <div className="glass-panel glass-border rounded-2xl p-3.5 text-center">
              <Trophy className="mx-auto mb-1.5 h-4 w-4 text-vouch-emerald" />
              <div className="text-xl font-black text-white">{decided ? `${profile!.wonPicks}-${profile!.totalPicks - profile!.wonPicks}` : "0-0"}</div>
              <div className="terminal-text mt-0.5">Record</div>
            </div>
            <div className="glass-panel glass-border rounded-2xl p-3.5 text-center">
              <Layers3 className="mx-auto mb-1.5 h-4 w-4 text-vouch-cyan" />
              <div className="text-xl font-black text-white">{pendingParlays.length}</div>
              <div className="terminal-text mt-0.5">Pending</div>
            </div>
            <div className="glass-panel glass-border rounded-2xl p-3.5 text-center">
              <Crown className="mx-auto mb-1.5 h-4 w-4 text-vouch-cyan" />
              <div className="text-xl font-black text-white">{tierLabel}</div>
              <div className="terminal-text mt-0.5">Plan</div>
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
                  className="glass-panel glass-border group rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-vouch-emerald/10 text-vouch-emerald">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="terminal-text text-vouch-cyan">{zone.tag}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{zone.title}</h3>
                  <p className="mt-1 text-xs text-white/40">{zone.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Real pending parlays — no fake list */}
          <div className="glass-panel glass-border mt-5 rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-white/40" />
              <h2 className="text-sm font-bold text-white">Pending parlays</h2>
            </div>
            {pendingParlays.length > 0 ? (
              <div className="space-y-2">
                {pendingParlays.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => go("live_parlays")}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-left transition hover:border-vouch-cyan/30"
                  >
                    <span className="truncate text-xs font-bold text-white/80">{p.title || "Saved parlay"}</span>
                    <span className="font-mono text-[11px] text-white/40">{p.totalOdds}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => go("build")}
                className="w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3.5 text-center text-xs font-bold text-white/40 transition hover:text-white/70"
              >
                No pending parlays — build one
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-[10px] text-white/25">
            Research &amp; entertainment only — no guaranteed outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}
