/**
 * stringsEn.ts - English Localization Dictionary for HR Intelligence (hr-v2)
 *
 * NOTE: This is the first step toward full i18n support. All user-facing copy,
 * button labels, aria-labels, formatting interpolations, and screen reader announcements
 * are centralized here so future locales can be added without modifying component logic.
 */

export const STRINGS_EN = {
  // Page Header
  header: {
    eyebrow: 'Vouch Edge Intelligence Engine',
    title: 'HR Intelligence Command Desk',
    subtitle: 'Aurora HQ probability engine & calibrated slate telemetry',
    badges: {
      slateUpdated: 'Slate updated',
      reconnecting: (current: number, max: number) => `RECONNECTING (${current}/${max})`,
      liveEngine: 'LIVE ENGINE',
      mlbFeedConnected: 'MLB FEED CONNECTED',
      mlbFeedLastGood: 'LAST GOOD BOARD',
      previewMode: 'PREVIEW MODE',
      updatedPrefix: (timeAgo: string) => `Updated ${timeAgo}`,
      timeUnavailable: 'Update time unavailable',
      tooltipLastUpdated: (timeStr: string) => `Last updated: ${timeStr}`,
      tooltipUnavailable: 'Update time unavailable — waiting for live telemetry timestamp',
    },
  },

  // View Options & Toggles
  views: {
    groupAriaLabel: 'View mode toggle',
    card: { label: 'Card', icon: 'card', ariaLabel: 'Card view' },
    table: { label: 'Table', icon: 'table', ariaLabel: 'Table view' },
    kanban: { label: 'Kanban', icon: 'kanban', ariaLabel: 'Kanban view' },
    arena3d: { label: '3D Stadium', icon: '3d', ariaLabel: '3D Stadium arena view' },
  },

  // Tier Filter Tabs
  tierTabs: {
    groupAriaLabel: 'Tier Quick Filters',
    all: { label: 'ALL', icon: 'all' },
    very_high: { label: 'VERY HIGH', icon: 'very_high' },
    high: { label: 'HIGH', icon: 'high' },
    moderate: { label: 'MODERATE', icon: 'moderate' },
  },

  // Grouping Options (Matchup Chronological vs Tiers)
  grouping: {
    groupAriaLabel: 'Card grouping mode',
    label: 'Group By:',
    matchup: {
      label: 'Matchup / Teams',
      ariaLabel: 'Group by game matchups chronologically from earliest to late games',
      gameTitle: (away: string, home: string) => `${away} @ ${home}`,
      gameOrderBadge: (index: number, total: number) => `Game ${index} of ${total}`,
      earliestBadge: 'First Game of Day',
      liveBadge: 'LIVE GAME',
      propsCount: (count: number) => `${count} Hitters`,
      topHrpi: (score: number, name: string) => `Top: ${score} HRPI (${name})`,
      collapse: 'Collapse Game',
      expand: 'Expand Game',
    },
    tier: {
      label: 'Confidence Tiers',
      ariaLabel: 'Group by confidence tiers',
    },
    slider: {
      navAriaLabel: 'Game matchup slider',
      allGames: 'All Slate',
      prevGame: 'Previous Game (Left Arrow)',
      nextGame: 'Next Game (Right Arrow)',
      gameIndexBadge: (curr: number, total: number) => `Game ${curr} of ${total}`,
      keyboardHint: 'Arrow Keys (Left/Right) to slide games',
      jumpToGame: (title: string) => `Slide to ${title}`,
      liveIndicator: 'LIVE',
    },
  },

  // Search, Sliders & Sort Controls
  controls: {
    searchAriaLabel: 'Search player or team',
    searchPlaceholder: 'Search player or team...',
    filteringPending: 'Filtering…',
    sortLabel: 'Sort:',
    sortAriaLabel: 'Sort slate by',
    sortOptions: {
      score: 'HRPI Score (Highest)',
      ev: 'EV% (Highest)',
      odds: 'Odds (Longest)',
    },
    evRankedChip: 'EV RANKED',
    startersOnly: 'Starters Only',
    fullRoster: 'Full Roster',
    previewUntilLineups: 'Preview — lineups pending',
    startersOnlyAria: 'Switch to full roster view',
    fullRosterAria: 'Switch to starters-only view',
    previewUntilLineupsAria:
      'Official lineups not posted. Showing projected preview. Switch to full roster view',
    showingProjectedPool: 'projected pool',
    showingActiveRoster: 'active roster hitters',
    confirmedStartersCount: (count: number) => `(${count} confirmed starters)`,
  },

  // 3D Stadium & Trajectory Arena
  stadium3d: {
    title: '3D Stadium & Trajectory Arena',
    subtitle: 'Statcast parabolic launch physics, wind deflection & spatial hit telemetry',
    cameraPresetsLabel: 'Camera Perspective:',
    cameraPresets: {
      flyover: 'Flyover (3D)',
      plate: 'Behind Plate',
      outfield: 'Outfield',
      pressbox: 'Press Box',
    },
    legend: {
      elite: 'Elite HRPI (85+)',
      high: 'High HRPI (70–84)',
      moderate: 'Moderate HRPI (<70)',
      trajectory: 'Flight Trajectory',
      landingZone: 'Wall Clearance Zone',
    },
    dossier: {
      title: '3D Launch Telemetry',
      quickAdd: 'Quick Add to Slip',
      exitVelo: 'Exit Velocity',
      launchAngle: 'Launch Angle',
      distance: 'Est. Distance',
      parkFactor: 'Park Factor',
      close: 'Close Dossier',
    },
    controlsHint: 'Drag to rotate 3D view • Scroll to zoom • Click trajectory to spotlight',
  },

  previewBanner: {
    title: 'Preview mode',
    body: 'Official lineup not posted yet. Showing preview candidates only — do not treat as confirmed.',
  },

  // State Screens (Loading, Retrying, Error, Empty)
  states: {
    loadingAriaLabel: 'Loading slate view...',
    errorBoundaryFallbackTitle: 'HR Intelligence Command Desk Error',
    retrying: {
      title: (current: number, max: number) =>
        `Connecting to MLB live telemetry (attempt ${current}/${max})...`,
      fallbackError: 'Retrying feed connection in background.',
      button: 'Retry Now',
    },
    error: {
      title: (msg: string) => `Failed to load MLB live slate feed. ${msg}`,
      unknownError: 'Unknown telemetry error.',
      description: 'All automatic connection attempts exhausted. Please check connection and retry.',
      button: 'Retry Connection',
    },
    empty: {
      headline: (tierText: string, queryText: string) =>
        `No players matched your filter criteria (${tierText}${queryText}).`.replace('()', '').replace('(, ', '('),
      showingZero: 'Showing',
      ofTotal: (total: number) => `of ${total} total slate players`,
      filteredOut: (total: number) => `${total} filtered out`,
      adjustHint: '). Try adjusting your search query or tier filter.',
      resetButton: 'Reset Search & Filters',
    },
  },

  // Accessibility Announcements (aria-live polite region)
  liveAnnouncements: {
    retrying: (current: number, max: number) =>
      `Connecting to MLB live telemetry, attempt ${current} of ${max}`,
    error: 'Failed to load MLB live slate feed. Please retry connection.',
    loaded: (shown: number, total: number, updateMsg: string) =>
      `MLB slate loaded with ${shown} active players shown of ${total} total. ${updateMsg}.`,
    loading: 'Loading MLB live slate...',
  },

  // Relative Time Telemetry Formatting
  timeAgo: {
    unavailable: 'Update time unavailable',
    justNow: 'just now',
    secondsAgo: (s: number) => `${s}s ago`,
    minutesAgo: (m: number) => `${m}m ago`,
    hoursAgo: (h: number) => `${h}h ago`,
  },
} as const;

export type FeatureStrings = typeof STRINGS_EN;
