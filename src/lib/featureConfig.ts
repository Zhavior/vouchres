/**
 * Feature Configuration System — modular sidebar + beginner/pro mode
 *
 * Users can:
 *   - Toggle features on/off (hide from sidebar)
 *   - Drag-reorder features
 *   - Switch between Beginner and Pro mode (changes data density globally)
 *
 * Config is stored in localStorage + synced to the profile.
 * Default config has all features enabled in the original order.
 */

import type { SportId } from "../sports/registry";

export type ViewMode = "beginner" | "pro";

/** Sidebar section a feature belongs to. Undefined = ungrouped (top). */
export type FeatureGroup = "Daily" | "Pro Labs" | "AI" | "Build & Track" | "Social" | "Account";

export interface FeatureConfig {
  id: string;
  label: string;
  icon: string; // lucide icon name
  enabled: boolean;
  order: number;
  /** Features that can't be disabled (core app navigation) */
  locked?: boolean;
  /** Features hidden from regular users while still available to admin/dev operators. */
  access?: "public" | "admin_dev";
  /** Sidebar section header this feature renders under. */
  group?: FeatureGroup;
  /**
   * Sports this feature applies to. Omit for sport-agnostic features (always shown).
   * When set, the feature only appears when the active sport is in the list.
   */
  sports?: SportId[];
}

const ALL_SPORTS: SportId[] = ["mlb", "nba", "nfl"];

export interface FeatureLayout {
  mode: ViewMode;
  features: FeatureConfig[];
  lastUpdated: string;
}

/* ============ All features (master list) ============ */

export const ALL_FEATURES: FeatureConfig[] = [

  // Edge Island — ungrouped, renders first/headerless above "Daily".
  // Routes to the `welcome` section, which now renders the Z8 morning command
  // board with a logged-in dashboard mode and a public preview mode.
  { id: "welcome", label: "Edge Island", icon: "LayoutDashboard", enabled: true, order: 1, locked: true },

  // Daily — sport-scoped boards and slates
  { id: "today", label: "Today", icon: "CalendarDays", enabled: true, order: 2, group: "Daily", sports: ALL_SPORTS, locked: true },
  { id: "hr_board", label: "Home Run Intelligence", icon: "Flame", enabled: true, order: 3, group: "Daily", sports: ALL_SPORTS, locked: true },
  { id: "mlb_stats", label: "MLB Stat Hub", icon: "BarChart3", enabled: true, order: 4, group: "Daily", sports: ALL_SPORTS, locked: false },
  { id: "daily_players", label: "Daily Players", icon: "Users", enabled: true, order: 5, group: "Daily", sports: ALL_SPORTS, locked: true },
  { id: "live_games", label: "Live Games", icon: "Tv", enabled: true, order: 6, group: "Daily", sports: ALL_SPORTS, locked: true },

  // Pro Labs — sport-scoped analytics
  { id: "intel", label: "AI Edge Lab", icon: "Flame", enabled: true, order: 7, group: "Pro Labs", sports: ALL_SPORTS, locked: true },
  { id: "live_game_lab", label: "Live Game Lab", icon: "Radio", enabled: true, order: 8, group: "Pro Labs", sports: ALL_SPORTS },
  { id: "player_edge_lab", label: "Player Intelligence Card", icon: "UserRoundSearch", enabled: true, order: 9, group: "Pro Labs", sports: ALL_SPORTS },
  { id: "team_matchup_lab", label: "Team Matchup Lab", icon: "Swords", enabled: true, order: 10, group: "Pro Labs", sports: ALL_SPORTS },
  { id: "hitter_matchup_zones", label: "Hitter Matchup Zones", icon: "Grid3x3", enabled: true, order: 10.5, group: "Pro Labs", sports: ALL_SPORTS },
  { id: "pro_graphs_lab", label: "Pro Graphs Lab", icon: "LineChart", enabled: true, order: 11, group: "Pro Labs", sports: ALL_SPORTS },
  { id: "nba_nfl", label: "NBA / NFL Arena", icon: "Trophy", enabled: true, order: 11.5, group: "Pro Labs" },

  // AI — V.A.I pilot tools
  { id: "ai_pilot", label: "V.A.I Dynamic Creator", icon: "Cpu", enabled: true, order: 11.6, group: "AI", sports: ALL_SPORTS, locked: true },
  { id: "ai_engine", label: "V.A.I Research Center", icon: "Activity", enabled: true, order: 11.7, group: "AI", sports: ALL_SPORTS },

  // Build & Track
  { id: "live_parlays", label: "Parlay Hub", icon: "Radio", enabled: true, order: 10.5, group: "Build & Track", locked: true },
  { id: "build", label: "Build Parlay", icon: "Sliders", enabled: true, order: 11, group: "Build & Track", locked: true },
  { id: "research", label: "Player Research", icon: "Search", enabled: true, order: 12, group: "Build & Track" },
  { id: "board", label: "Vouch Board", icon: "ClipboardCheck", enabled: true, order: 13, group: "Build & Track", locked: true },
  { id: "results", label: "Results", icon: "BarChart3", enabled: true, order: 14, group: "Build & Track" },
  { id: "notifications", label: "Notifications", icon: "Bell", enabled: true, order: 14.5, group: "Build & Track" },

  // Social
  { id: "feed", label: "Home", icon: "Home", enabled: true, order: 15, group: "Social" },
  { id: "following", label: "Following", icon: "Users", enabled: true, order: 15.5, group: "Social", locked: true },
  { id: "leaderboard", label: "Top Cappers", icon: "Trophy", enabled: true, order: 16, group: "Social" },
  { id: "subscriber_hub", label: "Subscribers Club", icon: "Crown", enabled: true, order: 17, group: "Social" },

  // Account
  { id: "premium", label: "Upgrade", icon: "Sparkles", enabled: true, order: 18, group: "Account" },
  { id: "themestore", label: "Theme Store", icon: "ShoppingBag", enabled: true, order: 19, group: "Account", access: "admin_dev" },
  { id: "profile", label: "Profile", icon: "UserCircle", enabled: true, order: 20, group: "Account", locked: true },
  { id: "settings", label: "Settings", icon: "Settings", enabled: true, order: 22, group: "Account", locked: true },
];

const STORAGE_KEY = "vouchedge_feature_layout";

/* ============ Default layout ============ */

export function getDefaultLayout(): FeatureLayout {
  return {
    mode: "beginner",
    features: ALL_FEATURES.map((f) => ({ ...f })),
    lastUpdated: new Date().toISOString(),
  };
}

/* ============ Load from localStorage ============ */

export function loadFeatureLayout(): FeatureLayout {
  if (typeof window === "undefined") return getDefaultLayout();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultLayout();

    const parsed = JSON.parse(stored) as FeatureLayout;

    // Reconcile against ALL_FEATURES (the source of truth):
    //  - labels, icons, group, sports, order, access, locked come from code
    //  - the user's `enabled` toggle is preserved
    //  - features removed from ALL_FEATURES (e.g. VouchScan) are dropped
    const storedById = new Map(parsed.features.map((f) => [f.id, f]));
    parsed.features = ALL_FEATURES.map((def) => {
      const prev = storedById.get(def.id);
      const enabled = def.locked ? true : prev ? prev.enabled : def.enabled;
      return { ...def, enabled };
    });

    return parsed;
  } catch {
    return getDefaultLayout();
  }
}

/* ============ Save to localStorage ============ */

export function saveFeatureLayout(layout: FeatureLayout): void {
  if (typeof window === "undefined") return;
  layout.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

/* ============ Helpers ============ */

/** Returns only enabled features, sorted by order — for sidebar rendering */
/** Sidebar-only exclusions — settings stays in footer. */
const SIDEBAR_HIDDEN_FEATURES = ['settings'];

export function getEnabledFeatures(
  layout: FeatureLayout,
  options: { canAccessThemeStore?: boolean; activeSport?: SportId } = {},
): FeatureConfig[] {
  return layout.features
    .filter((f) => f.enabled)
    .filter((f) => f.access !== 'admin_dev' || options.canAccessThemeStore)
    // Sport-scoped features only show when the active sport is in their list.
    // Sport-agnostic features (no `sports`) always show.
    .filter((f) => !f.sports || !options.activeSport || f.sports.includes(options.activeSport))
    .sort((a, b) => a.order - b.order);
}

export function getSidebarFeatures(
  layout: FeatureLayout,
  options: { canAccessThemeStore?: boolean; activeSport?: SportId; excludedFeatureIds?: string[] } = {},
): FeatureConfig[] {
  const excluded = [...SIDEBAR_HIDDEN_FEATURES, ...(options.excludedFeatureIds ?? [])];
  return getEnabledFeatures(layout, options).filter((feature) => !excluded.includes(feature.id));
}

/** Toggle a feature on/off */
export function toggleFeature(layout: FeatureLayout, featureId: string): FeatureLayout {
  return {
    ...layout,
    features: layout.features.map((f) =>
      f.id === featureId && !f.locked ? { ...f, enabled: !f.enabled } : f
    ),
  };
}

/** Move a feature up or down in the order */
export function moveFeature(layout: FeatureLayout, featureId: string, direction: "up" | "down"): FeatureLayout {
  const sorted = [...layout.features].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((f) => f.id === featureId);
  if (index === -1) return layout;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return layout;

  // Don't allow swapping past locked items
  if (sorted[swapIndex].locked && !sorted[index].locked) return layout;

  const temp = sorted[index].order;
  sorted[index].order = sorted[swapIndex].order;
  sorted[swapIndex].order = temp;

  return { ...layout, features: sorted };
}

/** Set view mode (beginner/pro) */
export function setViewMode(layout: FeatureLayout, mode: ViewMode): FeatureLayout {
  return { ...layout, mode };
}

/** Reset to defaults */
export function resetLayout(): FeatureLayout {
  const def = getDefaultLayout();
  saveFeatureLayout(def);
  return def;
}
