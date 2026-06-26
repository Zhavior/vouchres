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

export type ViewMode = "beginner" | "pro";

export interface FeatureConfig {
  id: string;
  label: string;
  icon: string; // lucide icon name
  enabled: boolean;
  order: number;
  /** Features that can't be disabled (core app navigation) */
  locked?: boolean;
}

export interface FeatureLayout {
  mode: ViewMode;
  features: FeatureConfig[];
  lastUpdated: string;
}

/* ============ All features (master list) ============ */

export const ALL_FEATURES: FeatureConfig[] = [
  { id: "welcome", label: "Welcome Portal", icon: "Trophy", enabled: true, order: 0, locked: true },
  { id: "today", label: "Today", icon: "LayoutDashboard", enabled: true, order: 1 },
  { id: "feed", label: "Home Feed", icon: "Home", enabled: true, order: 2 },
  { id: "leaderboard", label: "Top Cappers", icon: "Award", enabled: true, order: 3 },
  { id: "live_games", label: "Live Projections", icon: "Tv", enabled: true, order: 4 },
  { id: "build", label: "Build Parlay", icon: "Sliders", enabled: true, order: 5 },
  { id: "ai_engine", label: "V.A.I Smart Picks", icon: "Cpu", enabled: true, order: 6 },
  { id: "intel", label: "MLB Intelligence", icon: "Activity", enabled: true, order: 7 },
  { id: "hr_board", label: "Daily HR Board", icon: "Flame", enabled: true, order: 8 },
  { id: "vouchscan", label: "VouchScan", icon: "ScanLine", enabled: true, order: 9 },
  { id: "research", label: "Player Research", icon: "Search", enabled: true, order: 10 },
  { id: "board", label: "Vouch Board", icon: "ClipboardCheck", enabled: true, order: 11 },
  { id: "results", label: "Results", icon: "BarChart3", enabled: true, order: 12 },
  { id: "premium", label: "PRO Premium Tiers", icon: "Sparkles", enabled: true, order: 13 },
  { id: "subscriber_hub", label: "Subscriber Clubs", icon: "MessageSquare", enabled: true, order: 14 },
  { id: "themestore", label: "Theme Store", icon: "ShoppingBag", enabled: true, order: 15 },
  { id: "epic_themes", label: "Epic Themes", icon: "Sparkles", enabled: true, order: 16 },
  { id: "profile", label: "Profile", icon: "User", enabled: true, order: 17, locked: true },
  { id: "settings", label: "Settings", icon: "Settings", enabled: true, order: 18, locked: true },
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

    // Merge: any new features in ALL_FEATURES that aren't in the stored config get added
    const storedIds = new Set(parsed.features.map((f) => f.id));
    const missing = ALL_FEATURES.filter((f) => !storedIds.has(f.id));
    if (missing.length > 0) {
      parsed.features = [...parsed.features, ...missing];
    }

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
export function getEnabledFeatures(layout: FeatureLayout): FeatureConfig[] {
  return layout.features
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);
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
