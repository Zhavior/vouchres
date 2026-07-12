import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Cpu,
  Crown,
  Flame,
  Grid3x3,
  Home,
  LayoutDashboard,
  LineChart,
  Lock,
  Palette,
  Radio,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  Tv,
  UserRoundSearch,
  Users,
  Zap,
} from "lucide-react";

import {
  type FeatureConfig,
  type FeatureLayout,
  loadFeatureLayout,
  moveFeature,
  resetLayout,
  saveFeatureLayout,
  setViewMode,
  toggleFeature,
} from "../lib/featureConfig";
import type { CreatorProofProfile } from "../types";
import {
  Z8_ACTIVE,
  Z8_IDLE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_SURFACE,
} from "../theme/z8Tokens";

type CustomizePageProps = {
  profile?: CreatorProofProfile | null;
  onUpdateProfile?: (updated: Partial<CreatorProofProfile>) => void;
  onSectionChange: (section: string) => void;
};

type FeatureId = FeatureConfig["id"];

type FeatureMeta = {
  id: FeatureId;
  label: string;
  description: string;
  icon: typeof Home;
};

const FEATURE_META: Record<FeatureId, FeatureMeta> = {
  welcome: {
    id: "welcome",
    label: "Edge Island",
    description: "Morning command board and daily overview.",
    icon: LayoutDashboard,
  },
  today: {
    id: "today",
    label: "Today",
    description: "Today's slate dashboard and quick jumps.",
    icon: Home,
  },
  hr_board: {
    id: "hr_board",
    label: "Home Run Intelligence",
    description: "Home run board, power spots, and matchup context.",
    icon: Flame,
  },
  mlb_stats: {
    id: "mlb_stats",
    label: "MLB Stat Hub",
    description: "Eight-stat engine hub with judge panel synthesis.",
    icon: BarChart3,
  },
  daily_players: {
    id: "daily_players",
    label: "Daily Players",
    description: "Today's player board and research cards.",
    icon: Users,
  },
  live_games: {
    id: "live_games",
    label: "Live Games",
    description: "In-play game projections and live edges.",
    icon: Tv,
  },
  intel: {
    id: "intel",
    label: "AI Edge Lab",
    description: "Signals, intel layers, and edge research.",
    icon: Flame,
  },
  live_game_lab: {
    id: "live_game_lab",
    label: "Live Game Lab",
    description: "In-game analytics and live lab tools.",
    icon: Radio,
  },
  player_edge_lab: {
    id: "player_edge_lab",
    label: "Player Edge Lab",
    description: "Deep player edge breakdowns and scores.",
    icon: UserRoundSearch,
  },
  team_matchup_lab: {
    id: "team_matchup_lab",
    label: "Team Matchup Lab",
    description: "Pitcher vs lineup matchup research.",
    icon: Swords,
  },
  hitter_matchup_zones: {
    id: "hitter_matchup_zones",
    label: "Hitter Matchup Zones",
    description: "Heatmap zones for hitter-vs-pitcher research.",
    icon: Grid3x3,
  },
  pro_graphs_lab: {
    id: "pro_graphs_lab",
    label: "Pro Graphs Lab",
    description: "Trend charts and advanced graphing tools.",
    icon: LineChart,
  },
  nba_nfl: {
    id: "nba_nfl",
    label: "NBA / NFL Arena",
    description: "Cross-sport arena for NBA and NFL tools.",
    icon: Trophy,
  },
  ai_pilot: {
    id: "ai_pilot",
    label: "V.A.I Dynamic Creator",
    description: "Stats-verified AI parlay pilot with market focus and thresholds.",
    icon: Cpu,
  },
  ai_engine: {
    id: "ai_engine",
    label: "V.A.I Research Center",
    description: "V.A.I rooms and deep research board.",
    icon: Cpu,
  },
  live_parlays: {
    id: "live_parlays",
    label: "ParlayOS",
    description: "Canonical builder, saved slips, and live parlay intelligence.",
    icon: Radio,
  },
  research: {
    id: "research",
    label: "Player Research",
    description: "Search players, stats, and research context.",
    icon: Search,
  },
  board: {
    id: "board",
    label: "Vouch Board",
    description: "Community proof, posts, and creator signals.",
    icon: ClipboardCheck,
  },
  results: {
    id: "results",
    label: "Results Ledger",
    description: "Proof, grading history, and win-rate truth.",
    icon: BarChart3,
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    description: "Alerts for saves, locks, grades, and account updates.",
    icon: Bell,
  },
  feed: {
    id: "feed",
    label: "Home Feed",
    description: "Social feed, posts, and community activity.",
    icon: Home,
  },
  leaderboard: {
    id: "leaderboard",
    label: "Top Cappers",
    description: "Leaderboard rankings and top creators.",
    icon: Trophy,
  },
  subscriber_hub: {
    id: "subscriber_hub",
    label: "Subscribers Club",
    description: "Subscriber clubs, chat, and capper community.",
    icon: Crown,
  },
  premium: {
    id: "premium",
    label: "Upgrade",
    description: "Premium tiers and subscription upgrades.",
    icon: Sparkles,
  },
  themestore: {
    id: "themestore",
    label: "Z8 Visual Standard",
    description: "The fixed premium visual system used across VouchEdge.",
    icon: Palette,
  },
  profile: {
    id: "profile",
    label: "Profile",
    description: "Your public profile, stats, and posts.",
    icon: Users,
  },
  settings: {
    id: "settings",
    label: "Settings",
    description: "Account, billing, privacy, and app controls.",
    icon: Settings,
  },
};

const proPreview = [
  "Judge scores (0-100) on every pick",
  "Full whatCouldGoWrong list",
  "Missing data warnings",
  "Safer alternative suggestions",
  "4-judge panel breakdown",
  "Data confidence scores",
  "Advanced metrics (barrel%, exit velo, xwOBA)",
  "Raw API data + debug panels",
];

const beginnerPreview = [
  "Risk pill (Safe/Balanced/Risky/Sneaky/Lotto)",
  "Confidence level (High/Med/Low)",
  "One-line reason per pick",
  "Clean stat tiles (AVG/HR/RBI/OPS)",
  "Simple game log timeline",
  "No judge internals or debug data",
  "Larger touch targets",
  "Clearer visual hierarchy",
];

export function CustomizePage({ profile, onSectionChange }: CustomizePageProps) {
  const [layout, setLayout] = useState<FeatureLayout>(() => loadFeatureLayout());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const visibleFeatures = useMemo(
    () =>
      layout.features
        .filter((feature) => feature.enabled)
        .sort((a, b) => a.order - b.order),
    [layout.features],
  );

  const sortedFeatures = useMemo(
    () => [...layout.features].sort((a, b) => a.order - b.order),
    [layout.features],
  );

  const handleToggle = (id: FeatureId) => {
    const next = toggleFeature(layout, id);
    setLayout(next);
    saveFeatureLayout(next);
    showToast("Layout updated");
  };

  const handleMove = (id: FeatureId, direction: "up" | "down") => {
    const next = moveFeature(layout, id, direction);
    setLayout(next);
    saveFeatureLayout(next);
    showToast("Order updated");
  };

  const handleModeChange = (mode: FeatureLayout["mode"]) => {
    const next = setViewMode(layout, mode);
    setLayout(next);
    saveFeatureLayout(next);
    showToast(`${mode === "pro" ? "Pro" : "Beginner"} mode enabled`);
  };

  const handleReset = () => {
    const next = resetLayout();
    setLayout(next);
    showToast("Layout reset");
  };

  const previewItems = layout.mode === "pro" ? proPreview : beginnerPreview;

  return (
    <main className={`${Z8_PAGE} min-h-screen ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto max-w-5xl ${Z8_PAGE_GAP}`}>
        <header className={`${Z8_PANEL_PREMIUM} ${Z8_SECTION_HEADER} p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full border border-vouch-cyan/25 bg-vouch-cyan/10 px-3 py-1 ${Z8_LABEL} text-vouch-cyan`}>
                <Sparkles className="h-3.5 w-3.5" />
                Native Layout Studio
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Customize VouchEdge
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Choose how your command center behaves. Keep the product brain, but control the visible tools,
                order, and research depth.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className={`${Z8_IDLE} inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide`}
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                type="button"
                onClick={() => onSectionChange("settings")}
                className={`${Z8_IDLE} px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide`}
              >
                Back to Settings
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className={`${Z8_PANEL_PREMIUM} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`${Z8_LABEL} text-white/40`}>Research mode</span>
                <h2 className="mt-3 text-xl font-black text-white">Choose your UI depth</h2>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Beginner mode keeps the app clean. Pro mode exposes more model confidence and research context.
                </p>
              </div>
              <Zap className="h-5 w-5 text-vouch-cyan" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange("beginner")}
                className={`rounded-2xl border p-4 text-left transition ${
                  layout.mode === "beginner"
                    ? `${Z8_ACTIVE} border-vouch-cyan/40`
                    : `${Z8_IDLE} rounded-2xl`
                }`}
              >
                <div className="text-sm font-black text-white">Beginner</div>
                <div className="mt-1 text-xs leading-5 text-white/45">Cleaner cards, simpler labels.</div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("pro")}
                className={`rounded-2xl border p-4 text-left transition ${
                  layout.mode === "pro"
                    ? "border-vouch-emerald/40 bg-vouch-emerald/10 text-white"
                    : `${Z8_IDLE} rounded-2xl`
                }`}
              >
                <div className="text-sm font-black text-white">Pro</div>
                <div className="mt-1 text-xs leading-5 text-white/45">More detail, judge context, warnings.</div>
              </button>
            </div>

            <div className="mt-5">
              <span className={`inline-flex items-center rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-cyan`}>
                Z8 premium visual standard
              </span>
            </div>
          </section>

          <section className={`${Z8_PANEL_PREMIUM} p-5`}>
            <span className={`${Z8_LABEL} text-vouch-cyan`}>Visible tools</span>
            <h2 className="mt-3 text-xl font-black text-white">
              {visibleFeatures.length} tools active
            </h2>
            <p className="mt-1 text-sm leading-6 text-white/50">
              These are the tools currently visible in your app shell.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleFeatures.map((feature) => {
                const meta = FEATURE_META[feature.id];
                return (
                  <span key={feature.id} className={`${Z8_SURFACE} rounded-full px-2.5 py-1 text-[10px] font-bold text-white/70`}>
                    {meta?.label ?? feature.id}
                  </span>
                );
              })}
            </div>
          </section>
        </div>

        <section className={`${Z8_PANEL_PREMIUM} p-5`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className={`${Z8_LABEL} text-white/40`}>Sidebar order</span>
              <h2 className="mt-3 text-xl font-black text-white">Reorder and toggle features</h2>
              <p className="mt-1 text-sm leading-6 text-white/50">
                Locked tools stay visible because they protect navigation and customer trust.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-white/10">
            {sortedFeatures.map((feature, index) => {
              const meta = FEATURE_META[feature.id];
              const Icon = meta?.icon ?? LayoutDashboard;
              const isFirst = index === 0;
              const isLast = index === sortedFeatures.length - 1;
              const prevLocked = index > 0 && sortedFeatures[index - 1].locked;
              const nextLocked = index < sortedFeatures.length - 1 && sortedFeatures[index + 1].locked;

              return (
                <div
                  key={feature.id}
                  className={`flex items-center gap-3 py-3 transition ${!feature.enabled ? "opacity-45" : ""}`}
                >
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(feature.id, "up")}
                      disabled={isFirst || (feature.locked && prevLocked)}
                      className={`${Z8_SURFACE} rounded-lg p-1 text-white/45 transition hover:text-vouch-cyan disabled:cursor-not-allowed disabled:opacity-25`}
                      aria-label={`Move ${meta?.label ?? feature.id} up`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(feature.id, "down")}
                      disabled={isLast || (feature.locked && nextLocked)}
                      className={`${Z8_SURFACE} rounded-lg p-1 text-white/45 transition hover:text-vouch-cyan disabled:cursor-not-allowed disabled:opacity-25`}
                      aria-label={`Move ${meta?.label ?? feature.id} down`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-vouch-cyan/15 bg-vouch-cyan/10 text-vouch-cyan">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-black text-white">
                        {meta?.label ?? feature.id}
                      </span>
                      {feature.locked && (
                        <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 ${Z8_LABEL} text-white/50`}>
                          <Lock className="h-2.5 w-2.5" />
                          Always visible
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      {meta?.description ?? "Custom VouchEdge feature."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => !feature.locked && handleToggle(feature.id)}
                    disabled={feature.locked}
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                      feature.enabled
                        ? "border-vouch-cyan/40 bg-vouch-cyan/25"
                        : "border-white/15 bg-black/40"
                    } ${feature.locked ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}
                    aria-label={`Toggle ${meta?.label ?? feature.id}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition ${
                        feature.enabled ? "left-5.5 bg-vouch-cyan" : "left-0.5 bg-white/40"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`${Z8_PANEL_PREMIUM} border-vouch-cyan/15 bg-vouch-cyan/5 p-5`}>
          <span className={`${Z8_LABEL} ${layout.mode === "pro" ? 'text-vouch-emerald' : 'text-vouch-cyan'}`}>
            {layout.mode === "pro" ? "Pro mode preview" : "Beginner mode preview"}
          </span>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {previewItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs leading-5 text-white/50">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vouch-emerald" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {toast && (
          <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-vouch-cyan/30 bg-black/90 px-4 py-2.5 text-xs font-black text-white shadow-2xl shadow-black/30`}>
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}

export default CustomizePage;
