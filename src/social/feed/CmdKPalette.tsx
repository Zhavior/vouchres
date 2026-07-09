/**
 * CmdKPalette — Command palette for VouchEdge
 *
 * Opens on Cmd+K / Ctrl+K. Provides instant keyboard navigation to any
 * sidebar section. 100% CSS-token based — theme-ready.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <CmdKPalette open={open} onClose={() => setOpen(false)} onNavigate={onSectionChange} />
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, Command, Home, Flame, Users, Tv, Activity, Radio,
  UserRoundSearch, Swords, LineChart, Cpu, Sliders, ClipboardCheck,
  BarChart3, Trophy, Sparkles, Settings, LayoutDashboard, ShoppingBag,
  User, X,
} from 'lucide-react';
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_PANEL } from '../../theme/z8Tokens';
import { preloadSection } from '../../lib/routePreload';

/** Likely next destinations — warmed when the palette opens. */
const CMDK_PREFETCH_SECTIONS = [
  'feed',
  'hr_board',
  'today',
  'build',
  'ai_engine',
  'ai_pilot',
] as const;

// ─── Data ─────────────────────────────────────────────────────────────────────

interface PaletteItem {
  id: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const ALL_ITEMS: PaletteItem[] = [
  // Ungrouped
  { id: 'welcome',         label: 'Edge Island',           group: 'Home',          icon: LayoutDashboard, keywords: ['island', 'dashboard', 'home'] },
  { id: 'today',           label: 'Today',                 group: 'Daily',         icon: LayoutDashboard, keywords: ['today', 'slate', 'dashboard', 'daily'] },
  // Daily
  { id: 'hr_board',        label: 'Home Run Intelligence', group: 'Daily',         icon: Flame,           keywords: ['hr', 'home run', 'hitter', 'mlb', 'intel'] },
  { id: 'mlb_stats',       label: 'MLB Stat Hub',          group: 'Daily',         icon: Flame,           keywords: ['mlb', 'stat', 'rbi', 'runs', 'sb', 'stolen bases', 'hits', 'strikeouts', 'k', 'hub'] },
  { id: 'daily_players',   label: 'Daily Players',         group: 'Daily',         icon: Users,           keywords: ['players', 'slate', 'daily', 'lineup'] },
  { id: 'live_games',      label: 'Live Projections',      group: 'Daily',         icon: Tv,              keywords: ['live', 'projections', 'games', 'in-play'] },
  // Pro Labs
  { id: 'intel',           label: 'AI Edge Lab',           group: 'Pro Labs',      icon: Flame,           keywords: ['ai', 'edge', 'lab', 'intel', 'signals'] },
  { id: 'live_game_lab',   label: 'Live Game Lab',         group: 'Pro Labs',      icon: Radio,           keywords: ['live', 'game', 'lab', 'in-game'] },
  { id: 'player_edge_lab', label: 'Player Intelligence Card',       group: 'Pro Labs',      icon: UserRoundSearch, keywords: ['player', 'edge', 'breakdown', 'score'] },
  { id: 'team_matchup_lab',label: 'Team Matchup Lab',      group: 'Pro Labs',      icon: Swords,          keywords: ['matchup', 'team', 'pitcher', 'k9', 'era', 'whip'] },
  { id: 'hitter_matchup_zones', label: 'Hitter Matchup Zones', group: 'Pro Labs', icon: LineChart,       keywords: ['hitter', 'zones', 'heatmap', 'matchup'] },
  { id: 'pro_graphs_lab',  label: 'Pro Graphs Lab',        group: 'Pro Labs',      icon: LineChart,       keywords: ['graphs', 'charts', 'trends', 'data'] },
  { id: 'nba_nfl',         label: 'NBA / NFL Arena',       group: 'Pro Labs',      icon: Trophy,          keywords: ['nba', 'nfl', 'basketball', 'football'] },
  // AI
  { id: 'ai_pilot',        label: 'V.A.I Dynamic Creator', group: 'AI',            icon: Cpu,             keywords: ['ai', 'pilot', 'dynamic', 'creator', 'parlay', 'vai'] },
  { id: 'ai_engine',       label: 'V.A.I Research Center', group: 'AI',            icon: Cpu,             keywords: ['ai', 'research', 'vai', 'rooms', 'smart'] },
  // Build & Track
  { id: 'live_parlays',    label: 'Parlay Hub',             group: 'Build & Track', icon: Radio,           keywords: ['parlay', 'hub', 'live', 'slips'] },
  { id: 'build',           label: 'Build Parlay',           group: 'Build & Track', icon: Sliders,         keywords: ['build', 'parlay', 'create', 'legs', 'slip'] },
  { id: 'research',        label: 'Player Research',        group: 'Build & Track', icon: Search,          keywords: ['research', 'player', 'stats', 'search'] },
  { id: 'board',           label: 'Vouch Board',            group: 'Build & Track', icon: ClipboardCheck,  keywords: ['vouch', 'board', 'picks', 'ledger'] },
  { id: 'results',         label: 'Results',                group: 'Build & Track', icon: BarChart3,       keywords: ['results', 'record', 'history', 'wins', 'losses'] },
  // Social
  { id: 'feed',            label: 'Home Feed',              group: 'Social',        icon: Home,            keywords: ['feed', 'home', 'posts', 'social'] },
  { id: 'leaderboard',     label: 'Top Cappers',            group: 'Social',        icon: Trophy,          keywords: ['leaderboard', 'cappers', 'top', 'rank'] },
  { id: 'subscriber_hub',  label: 'Subscribers Club',       group: 'Social',        icon: Users,           keywords: ['subscribers', 'club', 'community'] },
  // Account
  { id: 'premium',         label: 'PRO Premium Tiers',      group: 'Account',       icon: Sparkles,        keywords: ['premium', 'pro', 'upgrade', 'tiers', 'plan'] },
  { id: 'themestore',      label: 'Theme Store',            group: 'Account',       icon: ShoppingBag,     keywords: ['theme', 'store', 'skins', 'appearance'] },
  { id: 'profile',         label: 'My Profile',             group: 'Account',       icon: User,            keywords: ['profile', 'account', 'me', 'stats'] },
  { id: 'settings',        label: 'Settings',               group: 'Account',       icon: Settings,        keywords: ['settings', 'preferences', 'config', 'mode', 'beginner', 'pro'] },
  { id: 'customize',       label: 'Customize Layout',       group: 'Account',       icon: Settings,        keywords: ['customize', 'layout', 'sidebar', 'arrange'] },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface CmdKPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
}

export default function CmdKPalette({ open, onClose, onNavigate }: CmdKPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened + prefetch common lazy routes
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      for (const section of CMDK_PREFETCH_SECTIONS) {
        preloadSection(section);
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleInputFocus = useCallback(() => {
    for (const section of CMDK_PREFETCH_SECTIONS) {
      preloadSection(section);
    }
  }, []);

  // Global Cmd+K / Ctrl+K listener (this component handles its own open toggle when used standalone)
  // HomeFeedLayout owns the open state — this just closes on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const filtered = useCallback(() => {
    if (!query.trim()) return ALL_ITEMS;
    const q = query.toLowerCase();
    return ALL_ITEMS.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q)),
    );
  }, [query]);

  const results = filtered();

  // Arrow key / Enter navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault();
      navigate(results[cursor].id);
    }
  };

  const navigate = (id: string) => {
    onNavigate(id);
    onClose();
  };

  // Scroll active item into view + prefetch highlighted destination chunk
  useEffect(() => {
    const item = listRef.current?.querySelector(`[data-cursor-idx="${cursor}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  useEffect(() => {
    if (!open) return;
    const item = filtered()[cursor];
    if (item) preloadSection(item.id);
  }, [open, cursor, filtered]);

  if (!open) return null;

  // Group results for display
  const grouped = results.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-obsidian-900/82 backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={[
          'fixed z-[201] left-1/2 top-[12vh] -translate-x-1/2',
          'w-full max-w-[540px] mx-4',
          Z8_PANEL,
          'border-vouch-cyan/25 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.85)]',
          'overflow-hidden font-z8',
          'animate-in fade-in slide-in-from-top-4 duration-200',
        ].join(' ')}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Jump to any section…"
            className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm font-mono outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setCursor(0); inputRef.current?.focus(); }}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className={`hidden sm:flex items-center gap-0.5 border border-white/10 bg-black/30 px-1.5 py-0.5 ${Z8_LABEL} text-white/40`}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="overflow-y-auto max-h-[420px] scrollbar-none py-2"
          role="listbox"
        >
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/40 font-mono">
              No sections match <strong className="text-white">"{query}"</strong>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => {
              const globalOffset = results.indexOf(items[0]);
              return (
                <div key={group} className="mb-1">
                  <div className={`px-4 py-1.5 ${Z8_LABEL} text-white/40`}>
                    {group}
                  </div>
                  {items.map((item, i) => {
                    const idx = globalOffset + i;
                    const isActive = cursor === idx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-cursor-idx={idx}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => navigate(item.id)}
                        onMouseEnter={() => {
                          setCursor(idx);
                          preloadSection(item.id);
                        }}
                        className={[
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all border border-transparent font-mono',
                          isActive ? Z8_ACTIVE : `${Z8_IDLE} border-transparent`,
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-7 w-7 shrink-0 items-center justify-center border transition-all',
                            isActive
                              ? 'border-vouch-cyan/45 bg-vouch-cyan/15 text-vouch-cyan'
                              : 'border-white/10 bg-black/30 text-vouch-cyan/65',
                          ].join(' ')}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 text-left font-medium uppercase tracking-wide">{item.label}</span>
                        {isActive && (
                          <kbd className={`flex items-center gap-0.5 border border-white/10 bg-black/30 px-1.5 py-0.5 ${Z8_LABEL} text-white/40`}>
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="border border-white/10 bg-black/30 px-1 py-0.5 text-[9px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-white/10 bg-black/30 px-1 py-0.5 text-[9px]">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-white/10 bg-black/30 px-1 py-0.5 text-[9px]">esc</kbd>
              close
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
            <Command className="h-2.5 w-2.5" />
            <span className="font-black tracking-wider">K</span>
          </div>
        </div>
      </div>
    </>
  );
}
