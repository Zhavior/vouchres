import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  LayoutDashboard,
  Lock,
  Palette,
  RefreshCcw,
  Settings,
  Sparkles,
  Trophy,
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
import { canAccessThemeStore } from "../lib/adminDevAccess";
import type { CreatorProofProfile } from "../types";
import { VEBadge, VEButton, VECard } from "./ui/ve";

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
  dashboard: {
    id: "dashboard",
    label: "Home Dashboard",
    description: "Main command center and daily overview.",
    icon: Home,
  },
  dailyPlayers: {
    id: "dailyPlayers",
    label: "Daily Players",
    description: "Today’s MLB player board and research cards.",
    icon: LayoutDashboard,
  },
  hr_board: {
    id: "hr_board",
    label: "Home Run Intelligence",
    description: "Home run board, power spots, and matchup context.",
    icon: BarChart3,
  },
  dailyHrBoard: {
    id: "dailyHrBoard",
    label: "HR Board",
    description: "Home run board, power spots, and matchup context.",
    icon: BarChart3,
  },
  aiPicks: {
    id: "aiPicks",
    label: "AI Picks",
    description: "Smart AI player and parlay ideas.",
    icon: Sparkles,
  },
  parlays: {
    id: "parlays",
    label: "Parlay Hub",
    description: "Manual builder, saved slips, and parlay command tools.",
    icon: Trophy,
  },
  results: {
    id: "results",
    label: "Results Ledger",
    description: "Proof, grading history, and win-rate truth.",
    icon: Check,
  },
  vouchBoard: {
    id: "vouchBoard",
    label: "VouchBoard",
    description: "Community proof, posts, and creator signals.",
    icon: Users,
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    description: "Alerts for saves, locks, grades, and account updates.",
    icon: Bell,
  },
  themeStore: {
    id: "themeStore",
    label: "Theme Store",
    description: "Premium visual customization and profile styling.",
    icon: Palette,
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

  const canUseThemes = canAccessThemeStore(profile);
  const previewItems = layout.mode === "pro" ? proPreview : beginnerPreview;

  return (
    <div className="ve-page-shell min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <VECard tone="elevated" className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <VEBadge tone="info" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Native Layout Studio
              </VEBadge>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Customize VouchEdge
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Choose how your command center behaves. Keep the product brain, but control the visible tools,
                order, and research depth.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <VEButton
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                onClick={handleReset}
              >
                Reset
              </VEButton>

              <VEButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSectionChange("settings")}
              >
                Back to Settings
              </VEButton>
            </div>
          </div>
        </VECard>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <VECard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <VEBadge tone="neutral">Research mode</VEBadge>
                <h2 className="mt-3 text-xl font-black text-white">Choose your UI depth</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Beginner mode keeps the app clean. Pro mode exposes more model confidence and research context.
                </p>
              </div>
              <Zap className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange("beginner")}
                className={`rounded-2xl border p-4 text-left transition ${
                  layout.mode === "beginner"
                    ? "border-cyan-300/40 bg-cyan-300/10"
                    : "border-slate-800 bg-slate-950/45 hover:border-slate-600"
                }`}
              >
                <div className="text-sm font-black text-white">Beginner</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">Cleaner cards, simpler labels.</div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("pro")}
                className={`rounded-2xl border p-4 text-left transition ${
                  layout.mode === "pro"
                    ? "border-emerald-300/40 bg-emerald-300/10"
                    : "border-slate-800 bg-slate-950/45 hover:border-slate-600"
                }`}
              >
                <div className="text-sm font-black text-white">Pro</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">More detail, judge context, warnings.</div>
              </button>
            </div>

            <div className="mt-5">
              <VEBadge tone={canUseThemes ? "success" : "warning"}>
                {canUseThemes ? "Theme Store unlocked" : "Theme Store locked"}
              </VEBadge>
            </div>
          </VECard>

          <VECard className="p-5">
            <VEBadge tone="info">Visible tools</VEBadge>
            <h2 className="mt-3 text-xl font-black text-white">
              {visibleFeatures.length} tools active
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              These are the tools currently visible in your app shell.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleFeatures.map((feature) => {
                const meta = FEATURE_META[feature.id];
                return (
                  <VEBadge key={feature.id} tone="neutral">
                    {meta?.label ?? feature.id}
                  </VEBadge>
                );
              })}
            </div>
          </VECard>
        </div>

        <VECard className="p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <VEBadge tone="neutral">Sidebar order</VEBadge>
              <h2 className="mt-3 text-xl font-black text-white">Reorder and toggle features</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Locked tools stay visible because they protect navigation and customer trust.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-800/70">
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
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-1 text-slate-500 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label={`Move ${meta?.label ?? feature.id} up`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(feature.id, "down")}
                      disabled={isLast || (feature.locked && nextLocked)}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-1 text-slate-500 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label={`Move ${meta?.label ?? feature.id} down`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-black text-white">
                        {meta?.label ?? feature.id}
                      </span>
                      {feature.locked && (
                        <VEBadge tone="neutral" className="gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          Always visible
                        </VEBadge>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {meta?.description ?? "Custom VouchEdge feature."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => !feature.locked && handleToggle(feature.id)}
                    disabled={feature.locked}
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                      feature.enabled
                        ? "border-cyan-300/40 bg-cyan-400/25"
                        : "border-slate-700 bg-slate-800/50"
                    } ${feature.locked ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}
                    aria-label={`Toggle ${meta?.label ?? feature.id}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition ${
                        feature.enabled ? "left-5.5 bg-cyan-300" : "left-0.5 bg-slate-500"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </VECard>

        <VECard tone="soft" className="p-5">
          <VEBadge tone={layout.mode === "pro" ? "success" : "info"}>
            {layout.mode === "pro" ? "Pro mode preview" : "Beginner mode preview"}
          </VEBadge>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {previewItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-400">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </VECard>

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-slate-950/95 px-4 py-2.5 text-xs font-black text-white shadow-2xl shadow-black/30">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomizePage;
