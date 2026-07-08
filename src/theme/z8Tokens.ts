/**
 * Z8 Obsidian design tokens — single source for sidebar-aligned UI.
 * Uses Tailwind @theme colors from src/styles/z8-design-system.css.
 */

export const Z8_ACCENT = 'text-vouch-cyan';
export const Z8_EMERALD = 'text-vouch-emerald';

/** Glass panel shell used across pages (matches FeedSidebar groups). */
export const Z8_PANEL = 'glass-panel glass-border border-white/10 bg-black/25 font-z8';

/** Compact inner surface (nav items, inputs). */
export const Z8_SURFACE = 'border border-white/10 bg-black/25';

/** Icon / chip box. */
export const Z8_ICON_BOX =
  'flex items-center justify-center border border-white/10 bg-black/30 text-vouch-cyan/65';

/** Active nav / tab state. */
export const Z8_ACTIVE =
  'border-vouch-cyan/55 bg-vouch-cyan/10 text-white shadow-[0_0_20px_rgba(0,240,255,0.08)]';

/** Idle nav / tab state. */
export const Z8_IDLE =
  'border-white/10 bg-black/25 text-white/45 hover:border-vouch-cyan/40 hover:bg-vouch-cyan/5 hover:text-white';

/** Mono label typography. */
export const Z8_LABEL = 'font-mono text-[10px] font-bold uppercase tracking-wide';

/** Page root background. */
export const Z8_PAGE = 'bg-obsidian-900 font-z8 text-white min-h-full';

/** Vouch-cyan hex for SVG rings / inline styles. */
export const Z8_CYAN_HEX = '#00F0FF';
