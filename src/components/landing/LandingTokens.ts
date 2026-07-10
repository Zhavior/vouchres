export const Z8_CYAN_HEX = '#00F0FF';
export const Z8_INTERACTIVE = 'z8-interactive';
export const Z8_LABEL = 'font-mono text-[10px] font-bold uppercase tracking-wide';
export const Z8_PAGE = 'bg-transparent font-z8 text-white min-h-full';
export const Z8_PANEL = 'glass-panel-strong glass-border border-vouch-cyan/20 bg-black/20 font-z8';
export const Z8_PANEL_PREMIUM =
  'glass-panel-premium glass-border border-vouch-cyan/25 bg-black/25 font-z8 z8-interactive';

/** Auth modal — matches VouchEdge.Terminal landing CTAs and panels */
export const Z8_AUTH_SURFACE = 'rounded-xl border border-white/10 bg-black/35';

export const Z8_AUTH_FIELD =
  'flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/35 px-3.5 h-11 transition-colors focus-within:border-vouch-cyan/45 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.08)]';

export const Z8_BTN_TERMINAL_PRIMARY =
  `${Z8_INTERACTIVE} inline-flex items-center justify-center gap-2 rounded-xl border border-vouch-cyan/55 bg-vouch-cyan/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-vouch-cyan shadow-[0_0_24px_rgba(0,240,255,0.1)] transition hover:border-vouch-cyan hover:bg-vouch-cyan hover:text-black disabled:cursor-not-allowed disabled:opacity-50`;

export const Z8_BTN_TERMINAL_SECONDARY =
  `${Z8_INTERACTIVE} inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white/70 transition hover:border-vouch-cyan/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50`;

export const Z8_BTN_TERMINAL_GHOST =
  `${Z8_INTERACTIVE} inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/25 text-white/45 transition hover:border-vouch-cyan/25 hover:text-white/70`;

export const Z8_AUTH_TAB_ACTIVE =
  'rounded-lg border border-vouch-cyan/35 bg-vouch-cyan/10 font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan shadow-[inset_0_0_0_1px_rgba(0,240,255,0.15)]';

export const Z8_AUTH_TAB_IDLE =
  'rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:bg-white/[0.04] hover:text-white/65';

export const Z8_AUTH_PLAN_SELECTED =
  'border-vouch-cyan/50 bg-vouch-cyan/10 shadow-[0_0_24px_rgba(0,240,255,0.12)]';

export const Z8_AUTH_PLAN_IDLE =
  'border-white/10 bg-black/30 hover:border-vouch-cyan/40';

/** Landing header auth actions — reuse in terminal page + auth modal tabs */
export const Z8_BTN_TERMINAL_HEADER_LOGIN =
  `${Z8_INTERACTIVE} rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60 transition hover:border-vouch-cyan/40 hover:text-white`;

export const Z8_BTN_TERMINAL_HEADER_SIGNUP =
  `${Z8_INTERACTIVE} rounded-xl border border-vouch-cyan/50 bg-vouch-cyan/10 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan shadow-[0_0_20px_rgba(0,240,255,0.1)] transition hover:border-vouch-cyan hover:bg-vouch-cyan hover:text-black`;
