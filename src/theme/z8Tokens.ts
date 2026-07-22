/**
 * Z8 Obsidian design tokens — single source for sidebar-aligned UI.
 * Uses Tailwind @theme colors from src/styles/z8-design-system.css.
 */

export const Z8_ACCENT = 'text-vouch-emerald';
export const Z8_EMERALD = 'text-vouch-emerald';
export const Z8_WARNING = 'text-vouch-amber';

/** Premium typography — Geist body, display weight, JetBrains labels. */
export const Z8_FONT = 'font-z8';
export const Z8_FONT_DISPLAY = 'font-z8 font-extrabold tracking-tight';
export const Z8_FONT_MONO = 'font-mono';

/** Glass panel shell used across pages (matches FeedSidebar groups). */
export const Z8_PANEL = 'glass-panel-strong glass-border border-vouch-cyan/20 bg-black/20 font-z8';

/** Premium glass — layered depth, grain, inset highlights. */
export const Z8_PANEL_PREMIUM =
  'glass-panel-premium glass-border border-vouch-cyan/25 bg-black/25 font-z8 z8-interactive';

/** Compact inner surface (nav items, inputs). */
export const Z8_SURFACE = 'border border-white/10 bg-black/35';

/** Icon / chip box. */
export const Z8_ICON_BOX =
  'flex items-center justify-center border border-white/10 bg-black/40 text-vouch-cyan/70';

/** Active nav / tab state — cyan left rail + glow (layout-stable via fixed left border width). */
export const Z8_ACTIVE =
  'border-l-[3px] border-l-vouch-cyan border-vouch-cyan/50 bg-vouch-cyan/15 text-white shadow-[inset_4px_0_24px_rgba(79,184,220,0.22),0_0_32px_rgba(79,184,220,0.14)]';

/** Idle nav / tab state. */
export const Z8_IDLE =
  'border-l-[3px] border-l-transparent border-white/10 bg-black/30 text-white/45 hover:border-vouch-cyan/45 hover:bg-vouch-cyan/8 hover:text-white';

/** Sidebar column shell — glass morphism, see-through to unified page base. */
export const Z8_SIDEBAR_SHELL = 'z8-sidebar-shell backdrop-blur-xl font-z8 text-white';

/** Borderless sidebar panel — depth via shadow, not border lines. */
export const Z8_SIDEBAR_PANEL = 'z8-sidebar-panel font-z8';

/** Borderless sidebar inner surface. */
export const Z8_SIDEBAR_SURFACE = 'z8-sidebar-surface';

/** Borderless sidebar icon box. */
export const Z8_SIDEBAR_ICON_BOX =
  'z8-sidebar-icon flex items-center justify-center text-vouch-cyan/70';

/** Active sidebar nav — cyan glow rail (absolute in component), no borders. */
export const Z8_SIDEBAR_ACTIVE =
  'bg-vouch-cyan/15 text-white shadow-[inset_4px_0_24px_rgba(79,184,220,0.22),0_0_32px_rgba(79,184,220,0.14)]';

/** Idle sidebar nav — background contrast + hover glow, no borders. */
export const Z8_SIDEBAR_IDLE =
  'bg-black/30 text-white/45 hover:bg-vouch-cyan/8 hover:text-white hover:shadow-[0_0_20px_rgba(79,184,220,0.1)]';

/** Mono label typography — semibold weight for clean hierarchy without visual clutter. */
export const Z8_LABEL = `${Z8_FONT_MONO} text-[11px] font-semibold uppercase tracking-[0.08em]`;

/** Muted secondary badge — clean depth without visual noise. */
export const Z8_BADGE_MUTED = 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white/70';

/** Primary active neon badge. */
export const Z8_BADGE_NEON = 'inline-flex items-center gap-1.5 rounded-full border border-vouch-cyan/35 bg-vouch-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-vouch-cyan';

/** Page root background — transparent; unified obsidian base lives on .z8-app-shell. */
export const Z8_PAGE = 'bg-transparent font-z8 text-white min-h-full';

/** Page shell rhythm — padding scale + vertical gap between sections. */
export const Z8_PAGE_SHELL = 'z8-page-shell space-y-4 sm:space-y-5';

/** Section header block (eyebrow + title cluster). */
export const Z8_SECTION_HEADER = 'z8-section-header';

/** Stat metric chip — tabular nums, compact cell. */
export const Z8_STAT_CHIP = 'z8-stat-chip';

/** Display title scale. */
export const Z8_DISPLAY = 'z8-display';

/** Tabular numerals utility. */
export const Z8_TABULAR = 'z8-tabular-nums';

/** Motion-safe interactive lift. */
export const Z8_INTERACTIVE = 'z8-interactive';

/** Vouch palette hex — SVG rings, inline styles, chart strokes. */
export const Z8_CYAN_HEX = '#4FB8DC';
export const Z8_EMERALD_HEX = '#31B583';
export const Z8_AMBER_HEX = '#D99C4A';

/** Resolve legacy --ve-accent-* status tokens to Z8 hex; passthrough for semantic ve-* vars. */
export function z8StatusColor(token: string): string {
  switch (token) {
    case '--ve-accent-cyan':
      return Z8_CYAN_HEX;
    case '--ve-accent-gold':
      return Z8_AMBER_HEX;
    case '--ve-accent-pink':
    case '--ve-accent-violet':
      return Z8_EMERALD_HEX;
    default:
      return `hsl(var(${token}))`;
  }
}

/** Page rhythm spacing (Tailwind arbitrary values from @theme). */
export const Z8_PAGE_PAD_X = 'px-3 sm:px-4';
export const Z8_PAGE_PAD_Y = 'py-4 lg:py-5';
export const Z8_PAGE_GAP = 'space-y-4 sm:space-y-5';
