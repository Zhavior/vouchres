/**
 * Aurora composition tokens.
 *
 * Canonical color values live in src/styles/vouchedge-tokens.css. These
 * exports compose those semantic values into reusable UI contracts. Some CSS
 * utility names remain z8-* during the compatibility migration; new
 * TypeScript consumers should use the AURORA_* API defined here.
 */

export const AURORA_ACCENT = 'text-vouch-emerald';
export const AURORA_EMERALD = 'text-vouch-emerald';
export const AURORA_WARNING = 'text-vouch-amber';

export const AURORA_FONT = 'font-z8';
export const AURORA_FONT_DISPLAY = 'font-z8 font-extrabold tracking-tight';
export const AURORA_FONT_MONO = 'font-mono';

export const AURORA_PANEL = 'glass-panel-strong glass-border border-vouch-cyan/20 bg-black/20 font-z8';
export const AURORA_PANEL_PREMIUM =
  'glass-panel-premium glass-border border-vouch-cyan/25 bg-black/25 font-z8 z8-interactive';
export const AURORA_SURFACE = 'border border-white/10 bg-black/35';
export const AURORA_OVERLAY_SCRIM = 'bg-black/60 backdrop-blur-sm';
export const AURORA_ICON_BOX =
  'flex items-center justify-center border border-white/10 bg-black/40 text-vouch-cyan/70';

export const AURORA_ACTIVE =
  'border-l-[3px] border-l-vouch-cyan border-vouch-cyan/50 bg-vouch-cyan/15 text-white shadow-[inset_4px_0_24px_rgba(79,184,220,0.22),0_0_32px_rgba(79,184,220,0.14)]';
export const AURORA_IDLE =
  'border-l-[3px] border-l-transparent border-white/10 bg-black/30 text-white/45 hover:border-vouch-cyan/45 hover:bg-vouch-cyan/8 hover:text-white';

export const AURORA_SIDEBAR_SHELL = 'z8-sidebar-shell backdrop-blur-xl font-z8 text-white';
export const AURORA_SIDEBAR_PANEL = 'z8-sidebar-panel font-z8';
export const AURORA_SIDEBAR_SURFACE = 'z8-sidebar-surface';
export const AURORA_SIDEBAR_ICON_BOX =
  'z8-sidebar-icon flex items-center justify-center text-vouch-cyan/70';
export const AURORA_SIDEBAR_ACTIVE =
  'bg-vouch-cyan/12 text-white shadow-[inset_4px_0_20px_rgba(79,184,220,0.18)]';
export const AURORA_SIDEBAR_IDLE =
  'bg-black/30 text-white/45 hover:bg-vouch-cyan/8 hover:text-white hover:shadow-[0_0_20px_rgba(79,184,220,0.1)]';

export const AURORA_LABEL = `${AURORA_FONT_MONO} text-[11px] font-semibold uppercase tracking-[0.08em]`;
export const AURORA_BADGE_MUTED =
  'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white/70';
export const AURORA_BADGE_NEON =
  'inline-flex items-center gap-1.5 rounded-full border border-vouch-cyan/35 bg-vouch-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-vouch-cyan';

export const AURORA_PAGE = 'bg-transparent font-z8 text-white min-h-full';
export const AURORA_PAGE_SHELL = 'z8-page-shell space-y-4 sm:space-y-5';
export const AURORA_SECTION_HEADER = 'z8-section-header';
export const AURORA_STAT_CHIP = 'z8-stat-chip';
export const AURORA_DISPLAY = 'z8-display';
export const AURORA_TABULAR = 'z8-tabular-nums';
export const AURORA_INTERACTIVE = 'z8-interactive';

export const AURORA_CYAN_HEX = '#4FB8DC';
export const AURORA_EMERALD_HEX = '#31B583';
export const AURORA_AMBER_HEX = '#D99C4A';
export const AURORA_CYAN_RGB = '79, 184, 220';
export const AURORA_AUTH_GRADIENT = `linear-gradient(135deg, ${AURORA_CYAN_HEX}, #2563eb)`;
export const AURORA_AUTH_SHADOW = `0 8px 32px rgba(${AURORA_CYAN_RGB}, 0.22)`;
export const AURORA_BLURPLE_HEX = '#5865F2';

export function auroraStatusColor(token: string): string {
  switch (token) {
    case '--ve-accent-cyan':
      return AURORA_CYAN_HEX;
    case '--ve-accent-gold':
      return AURORA_AMBER_HEX;
    case '--ve-accent-pink':
    case '--ve-accent-violet':
      return AURORA_EMERALD_HEX;
    default:
      return `hsl(var(${token}))`;
  }
}

export const AURORA_PAGE_PAD_X = 'px-3 sm:px-4';
export const AURORA_PAGE_PAD_Y = 'py-4 lg:py-5';
export const AURORA_PAGE_GAP = 'space-y-4 sm:space-y-5';
