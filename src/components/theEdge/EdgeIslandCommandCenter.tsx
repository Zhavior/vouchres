import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  ChevronRight,
  Crown,
  FlaskConical,
  Flame,
  Gauge,
  Globe,
  Layers3,
  Radio,
  ScrollText,
  Shield,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { motion } from "../../lib/motion";
import type { CreatorProofProfile, Parlay } from "../../types";
import EdgeIslandAskAiPanel from "./EdgeIslandAskAiPanel";
import WorldChatPanel from "./WorldChatPanel";

type Props = {
  open: boolean;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
  onNavigateProfile?: (userId: string) => void;
  savedSlips?: Parlay[];
  profile?: CreatorProofProfile;
  isLoggedIn?: boolean;
};

const PANELS = ["command", "ask-ai", "world-chat"] as const;
type PanelId = (typeof PANELS)[number];

const PRIMARY_ROUTE = {
  title: "Open HR Board",
  subtitle: "Today’s verified home run targets, edge grades, and lineup status.",
  section: "hr_board",
  icon: Flame,
} as const;

const QUICK_ROUTES = [
  { title: "Parlay Dock", section: "build", icon: Shield },
  { title: "Research Lab", section: "research", icon: FlaskConical },
  { title: "Live Games", section: "live_games", icon: Radio },
] as const;

const MORE_ROUTES = [
  { title: "Ledger Vault", subtitle: "Wins, losses, history", section: "results", icon: ScrollText },
  { title: "Notifications", subtitle: "HR & parlay alerts", section: "notifications", icon: Bell },
  { title: "Pro Tower", subtitle: "Premium tools", section: "premium", icon: Crown },
] as const;

const TIER_LABEL: Record<string, string> = {
  BASIC: "Basic",
  GOLD: "Gold",
  SELLER_PRO: "Seller Pro",
};

const SWIPE_THRESHOLD = 56;
const PANEL_SCROLL_CLASS =
  "h-full min-h-0 shrink-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 py-4 sm:px-6 sm:py-5 [-webkit-overflow-scrolling:touch]";
const TAB_COPY: Record<PanelId, { title: string; subtitle: string }> = {
  command: {
    title: "Command deck",
    subtitle: "Start with today’s board, then jump to build, research, or live tools.",
  },
  "ask-ai": {
    title: "Ask Command AI",
    subtitle: "Research help, parlay context, and quick jumps.",
  },
  "world-chat": {
    title: "World Chat",
    subtitle: "Community lounge and chat profile.",
  },
};

function cleanParlayTitle(parlay: Parlay): string {
  const raw = String(parlay.title || "").trim();
  if (!raw || raw.includes("clientRef=") || raw.includes("backend-ai-") || raw.length > 56) {
    return `${parlay.legs?.length ?? 0}-leg parlay`;
  }
  return raw.length > 56 ? `${raw.slice(0, 53)}…` : raw;
}

function CommandStats({
  profile,
  pendingCount,
  tierLabel,
  onPendingClick,
}: {
  profile?: CreatorProofProfile;
  pendingCount: number;
  tierLabel: string;
  onPendingClick: () => void;
}) {
  const totalPicks = profile?.totalPicks ?? 0;
  const decided = totalPicks > 0;
  const winRate = decided ? profile!.winRate : null;
  const losses = decided ? profile!.totalPicks - profile!.wonPicks : 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">
          <Gauge className="h-3.5 w-3.5 text-vouch-emerald" />
          Win rate
        </div>
        <div className="mt-1 text-lg font-black tabular-nums text-white">
          {winRate == null ? "—" : `${winRate.toFixed(1)}%`}
        </div>
        <p className="mt-0.5 text-[10px] text-white/38">
          {decided ? (totalPicks < 8 ? "Early sample" : "Graded record") : "Save picks to track proof"}
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">
          <Trophy className="h-3.5 w-3.5 text-vouch-emerald" />
          Record
        </div>
        <div className="mt-1 text-lg font-black tabular-nums text-white">
          {decided ? `${profile!.wonPicks}-${losses}` : "0-0"}
        </div>
        <p className="mt-0.5 text-[10px] text-white/38">
          {decided ? `${totalPicks} graded picks` : "No graded picks yet"}
        </p>
      </div>

      <button
        type="button"
        onClick={onPendingClick}
        className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2.5 text-left transition hover:border-cyan-400/35 hover:bg-cyan-400/10"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-vouch-cyan">
          <Layers3 className="h-3.5 w-3.5" />
          Pending
        </div>
        <div className="mt-1 text-lg font-black tabular-nums text-white">{pendingCount}</div>
        <p className="mt-0.5 text-[10px] text-white/38">Open saved slips</p>
      </button>

      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">
          <Crown className="h-3.5 w-3.5 text-vouch-cyan" />
          Plan
        </div>
        <div className="mt-1 truncate text-lg font-black text-white">{tierLabel}</div>
        <p className="mt-0.5 text-[10px] text-white/38">Your access tier</p>
      </div>
    </div>
  );
}

function CommandPanel({
  profile,
  pendingParlays,
  tierLabel,
  onGo,
}: {
  profile?: CreatorProofProfile;
  pendingParlays: Parlay[];
  tierLabel: string;
  onGo: (section: string) => void;
}) {
  const PrimaryIcon = PRIMARY_ROUTE.icon;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => onGo(PRIMARY_ROUTE.section)}
        className="group relative w-full overflow-hidden rounded-2xl border border-vouch-cyan/35 bg-gradient-to-br from-vouch-cyan/15 via-black/20 to-emerald-400/10 p-4 text-left transition hover:border-vouch-cyan/55 hover:shadow-[0_16px_48px_rgba(0,240,255,0.12)] sm:p-5"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-vouch-cyan/15 blur-2xl" aria-hidden />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-vouch-cyan/35 bg-vouch-cyan/12 text-vouch-cyan">
            <PrimaryIcon className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-vouch-cyan">
              Start here
            </div>
            <h2 className="mt-2 text-lg font-black text-white sm:text-xl">{PRIMARY_ROUTE.title}</h2>
            <p className="mt-1 max-w-xl text-sm leading-5 text-white/55">{PRIMARY_ROUTE.subtitle}</p>
          </div>
          <ChevronRight className="relative mt-1 h-5 w-5 shrink-0 text-vouch-cyan/70 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" />
        </div>
      </button>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {QUICK_ROUTES.map((route) => {
          const Icon = route.icon;
          return (
            <button
              key={route.section}
              type="button"
              onClick={() => onGo(route.section)}
              className="group flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition hover:border-white/18 hover:bg-white/[0.05]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-vouch-emerald">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white">{route.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" />
            </button>
          );
        })}
      </div>

      <CommandStats
        profile={profile}
        pendingCount={pendingParlays.length}
        tierLabel={tierLabel}
        onPendingClick={() => onGo("live_parlays")}
      />

      {pendingParlays.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-vouch-cyan" />
              <h3 className="text-sm font-black text-white">Needs grading</h3>
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black text-vouch-cyan">
                {pendingParlays.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onGo("live_parlays")}
              className="text-[11px] font-black text-vouch-cyan transition hover:text-white"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {pendingParlays.map((parlay) => (
              <button
                key={parlay.id}
                type="button"
                onClick={() => onGo("live_parlays")}
                className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-vouch-cyan/25 hover:bg-white/[0.05]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white/90">{cleanParlayTitle(parlay)}</div>
                  <div className="mt-0.5 text-[11px] text-white/42">
                    {parlay.legs?.length ?? 0} leg{(parlay.legs?.length ?? 0) === 1 ? "" : "s"} · Pending
                  </div>
                </div>
                <span className="shrink-0 font-mono text-sm font-black text-vouch-cyan">{parlay.totalOdds || "—"}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-white/40">More tools</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {MORE_ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <button
                key={route.section}
                type="button"
                onClick={() => onGo(route.section)}
                className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left transition hover:border-white/16 hover:bg-white/[0.04]"
              >
                <Icon className="mb-2 h-4 w-4 text-white/45" />
                <div className="text-sm font-bold text-white">{route.title}</div>
                <p className="mt-0.5 text-[11px] text-white/40">{route.subtitle}</p>
              </button>
            );
          })}
        </div>
      </section>

      {pendingParlays.length === 0 ? (
        <button
          type="button"
          onClick={() => onGo("build")}
          className="w-full rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-3 py-3 text-center text-xs font-bold text-white/45 transition hover:border-vouch-cyan/25 hover:text-white/70"
        >
          No pending parlays — build your first slip
        </button>
      ) : null}

      <p className="text-center text-[10px] leading-5 text-white/28">
        Research &amp; entertainment only — no guaranteed outcomes. Press Esc to close.
      </p>
    </div>
  );
}

export default function EdgeIslandCommandCenter({
  open,
  onClose,
  onSectionChange,
  onNavigateProfile,
  savedSlips = [],
  profile,
  isLoggedIn = false,
}: Props) {
  const [activePanel, setActivePanel] = useState<PanelId>("command");
  const touchStartX = useRef<number | null>(null);
  const panelScrollRefs = useRef<Array<HTMLDivElement | null>>([]);

  const setPanelScrollRef = (index: number) => (node: HTMLDivElement | null) => {
    panelScrollRefs.current[index] = node;
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setActivePanel("command");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelScrollRefs.current.forEach((pane) => {
      if (pane) pane.scrollTop = 0;
    });
  }, [open]);

  useEffect(() => {
    const index = PANELS.indexOf(activePanel);
    panelScrollRefs.current[index]?.scrollTo({ top: 0, behavior: "auto" });
  }, [activePanel]);

  if (!open) return null;

  const go = (section: string) => {
    onSectionChange?.(section);
    onClose();
  };

  const activeIndex = PANELS.indexOf(activePanel);
  const panelCopy = TAB_COPY[activePanel];
  const firstName = profile?.displayName?.split(" ")[0];
  const pendingParlays = savedSlips.filter((p) => p.status === "PENDING").slice(0, 3);
  const tierLabel = profile?.subscriptionTier ? TIER_LABEL[profile.subscriptionTier] ?? profile.subscriptionTier : "Basic";

  const onTouchStart = (clientX: number) => {
    touchStartX.current = clientX;
  };

  const onTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const delta = clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD && activeIndex < PANELS.length - 1) {
      setActivePanel(PANELS[activeIndex + 1]);
    } else if (delta > SWIPE_THRESHOLD && activeIndex > 0) {
      setActivePanel(PANELS[activeIndex - 1]);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 font-z8 sm:items-center sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="The Edge Island"
    >
      <button
        type="button"
        aria-label="Close The Edge Island"
        onClick={onClose}
        className="absolute inset-0 bg-obsidian-900/82 backdrop-blur-sm"
      />

      <div className="glass-panel glass-border relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] shadow-[0_32px_120px_rgba(0,0,0,0.55)] sm:max-h-[92vh] sm:rounded-[1.75rem]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.12),transparent_72%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/40 to-transparent" aria-hidden />

        <div className="relative shrink-0 border-b border-white/8 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                <Sparkles className="h-3.5 w-3.5 text-vouch-emerald" />
                <span className="terminal-text text-[10px]">The Edge Island</span>
              </div>
              <h1 className="mt-2 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                {activePanel === "command" && firstName ? `Welcome back, ${firstName}` : panelCopy.title}
              </h1>
              <p className="mt-1 text-sm leading-5 text-white/45">{panelCopy.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/50 transition hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/30 p-1"
            role="tablist"
            aria-label="Command Island panels"
          >
            {(
              [
                { id: "command" as const, label: "Command", icon: Gauge },
                { id: "ask-ai" as const, label: "Ask AI", icon: BrainCircuit },
                { id: "world-chat" as const, label: "Chat", icon: Globe },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activePanel === id}
                onClick={() => setActivePanel(id)}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-black transition sm:text-xs ${
                  activePanel === id
                    ? "bg-vouch-cyan/15 text-vouch-cyan shadow-[inset_0_0_0_1px_rgba(0,240,255,0.25)]"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="relative min-h-0 flex-1 overflow-hidden"
          onTouchStart={(e) => onTouchStart(e.touches[0]?.clientX ?? 0)}
          onTouchEnd={(e) => onTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
        >
          <motion.div
            className="flex h-full min-h-0"
            style={{ width: `${PANELS.length * 100}%` }}
            animate={{ x: `-${(activeIndex * 100) / PANELS.length}%` }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div
              ref={setPanelScrollRef(0)}
              className={PANEL_SCROLL_CLASS}
              style={{ width: `${100 / PANELS.length}%` }}
            >
              <CommandPanel
                profile={profile}
                pendingParlays={pendingParlays}
                tierLabel={tierLabel}
                onGo={go}
              />
            </div>

            <div
              ref={setPanelScrollRef(1)}
              className={`flex ${PANEL_SCROLL_CLASS}`}
              style={{ width: `${100 / PANELS.length}%` }}
            >
              <EdgeIslandAskAiPanel
                profile={profile}
                savedSlips={savedSlips}
                onSectionChange={onSectionChange}
                onClose={onClose}
              />
            </div>

            <div
              ref={setPanelScrollRef(2)}
              className={`flex ${PANEL_SCROLL_CLASS}`}
              style={{ width: `${100 / PANELS.length}%` }}
            >
              <WorldChatPanel
                profile={profile}
                isLoggedIn={isLoggedIn}
                onNavigateProfile={(userId) => {
                  onNavigateProfile?.(userId);
                  onClose();
                }}
                onSectionChange={onSectionChange}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
