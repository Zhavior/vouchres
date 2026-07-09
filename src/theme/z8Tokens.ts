/**
 * Z8 Obsidian design tokens — single source for sidebar-aligned UI.
 * Uses Tailwind @theme colors from src/styles/z8-design-system.css.
 */

export const Z8_ACCENT = 'text-vouch-cyan';
export const Z8_EMERALD = 'text-vouch-emerald';

/** Glass panel shell used across pages (matches FeedSidebar groups). */
export const Z8_PANEL = 'glass-panel-strong glass-border border-vouch-cyan/20 bg-black/40 font-z8';

/** Compact inner surface (nav items, inputs). */
export const Z8_SURFACE = 'border border-white/10 bg-black/35';

/** Icon / chip box. */
export const Z8_ICON_BOX =
  'flex items-center justify-center border border-white/10 bg-black/40 text-vouch-cyan/70';

/** Active nav / tab state — cyan left rail + glow (layout-stable via fixed left border width). */
export const Z8_ACTIVE =
  'border-l-[3px] border-l-vouch-cyan border-vouch-cyan/50 bg-vouch-cyan/15 text-white shadow-[inset_4px_0_24px_rgba(0,240,255,0.22),0_0_32px_rgba(0,240,255,0.14)]';

/** Idle nav / tab state. */
export const Z8_IDLE =
  'border-l-[3px] border-l-transparent border-white/10 bg-black/30 text-white/45 hover:border-vouch-cyan/45 hover:bg-vouch-cyan/8 hover:text-white';

/** Sidebar column shell — visibly distinct from obsidian-900 main content. */
export const Z8_SIDEBAR_SHELL = 'z8-sidebar-shell font-z8 text-white';

/** Mono label typography. */
export const Z8_LABEL = 'font-mono text-[10px] font-bold uppercase tracking-wide';

/** Page root background. */
export const Z8_PAGE = 'bg-obsidian-900 font-z8 text-white min-h-full';

/** Vouch-cyan hex for SVG rings / inline styles. */
export const Z8_CYAN_HEX = '#00F0FF';
