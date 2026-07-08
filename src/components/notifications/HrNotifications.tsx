import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { HrEvent } from '../../types/notifications';
import type { Parlay } from '../../types';

const POLL_MS = import.meta.env.DEV ? 120_000 : 60_000;
const LS_ENABLED = 'vouchedge_hr_notify';
const LS_ONLY_PARLAYS = 'vouchedge_hr_only_parlays';

function lsBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v === 'true';
  } catch {
    return def;
  }
}

/** Name suffixes that should be ignored when deriving a player's surname. */
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

/** Lowercase, strip accents/punctuation, collapse whitespace. */
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (José → jose, Acuña → acuna)
    .replace(/[.\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Real surname, ignoring trailing suffixes (Acuña Jr. → "acuna", not "jr"). */
function surnameOf(fullName: string): string {
  const tokens = normalizeName(fullName).split(' ').filter(Boolean);
  while (tokens.length > 1 && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens[tokens.length - 1] || '';
}

/** True if the HR's hitter appears in any saved parlay leg. */
function matchesParlay(ev: HrEvent, slips: Parlay[]): boolean {
  const full = normalizeName(ev.playerName);
  const surname = surnameOf(ev.playerName);
  const surnameRe =
    surname.length > 2
      ? new RegExp(`\\b${surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
      : null;

  return slips.some((s) =>
    (s.legs || []).some((l) => {
      const sel = normalizeName(l.selection || '');
      if (!sel) return false;
      if (full && sel.includes(full)) return true;
      // Word-boundary surname match avoids "soto" matching inside other words
      // and prevents suffix tokens from matching everything.
      return surnameRe ? surnameRe.test(sel) : false;
    })
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function HrNotifications({ savedSlips = [] }: { savedSlips?: Parlay[] }) {
  const [enabled, setEnabled] = useState(() => lsBool(LS_ENABLED, true));
  const [onlyParlays, setOnlyParlays] = useState(() => lsBool(LS_ONLY_PARLAYS, false));
  const [events, setEvents] = useState<HrEvent[]>([]);
  const [toasts, setToasts] = useState<HrEvent[]>([]);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => { localStorage.setItem(LS_ENABLED, String(enabled)); }, [enabled]);
  useEffect(() => { localStorage.setItem(LS_ONLY_PARLAYS, String(onlyParlays)); }, [onlyParlays]);

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await vouchedgeApi.hrFeedToday();
      let evs = res.events;
      if (onlyParlays) evs = evs.filter((e) => matchesParlay(e, savedSlips));
      setEvents(evs);

      const fresh = evs.filter((e) => !seen.current.has(e.id));
      if (initialized.current && fresh.length) {
        setToasts((t) => [...fresh.slice(0, 3), ...t].slice(0, 3));
        setUnread((u) => u + fresh.length);
        window.setTimeout(() => setToasts([]), 8000);
      }
      evs.forEach((e) => seen.current.add(e.id));
      initialized.current = true;
    } catch {
      /* backend offline — stay quiet, no fake data */
    }
  }, [enabled, onlyParlays, savedSlips]);

  useEffect(() => {
    if (!enabled) { setToasts([]); return; }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll, enabled]);

  const openPanel = () => { setIsOpen(true); setUnread(0); };

  return (
    <>
      {/* Floating toasts for brand-new HRs */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[110] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none">
        {toasts.map((e) => (
          <div key={e.id} className="pointer-events-auto flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-950/95 to-slate-950 border border-orange-500/60 shadow-[0_0_24px_rgba(249,115,22,0.25)] animate-slide-in">
            <span className="text-2xl">⚾</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black font-mono text-orange-400 uppercase tracking-wider">Home Run!</p>
              <p className="text-sm font-bold text-slate-100 truncate">{e.playerName} <span className="text-slate-400 font-normal">({e.teamAbbr})</span></p>
              <p className="text-[11px] text-slate-500">{e.inning ? `${e.halfInning} ${e.inning} · ` : ''}{e.matchup} · {e.rbi} RBI</p>
            </div>
            <button onClick={() => setToasts((t) => t.filter((x) => x.id !== e.id))} className="text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* Bell button — stacked directly above the AI support FAB (which sits at bottom-6 right-6/8) */}
      <button onClick={openPanel}
        className="fixed bottom-28 md:bottom-24 right-6 md:right-8 z-[60] w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl hover:border-orange-500/60 transition-colors"
        aria-label="Home run notifications">
        <Bell className="w-5 h-5 text-orange-400" />
        {enabled && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-[10px] font-black text-slate-950 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Panel — full screen on mobile, corner on desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] md:inset-auto md:bottom-6 md:right-6 md:w-96">
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />
          <div className="relative h-full md:h-auto md:max-h-[72vh] bg-[#0b1120] md:border border-slate-800 md:rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-100"><Bell className="w-4 h-4 text-orange-400" /> Home Run Alerts</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {/* Settings */}
            <div className="px-4 py-3 border-b border-slate-800 space-y-2.5">
              <ToggleRow label="Home Run notifications" sub="Real-time alerts when a HR is hit" value={enabled} onChange={() => setEnabled((v) => !v)} />
              <ToggleRow label="Only from my parlays" sub="Only notify for hitters in your saved slips" value={onlyParlays} onChange={() => setOnlyParlays((v) => !v)} disabled={!enabled} />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {!enabled ? (
                <Empty icon={<Bell className="w-5 h-5" />} text="HR notifications are off. Turn them on above." />
              ) : events.length === 0 ? (
                <Empty
                  icon={<AlertTriangle className="w-5 h-5" />}
                  text={
                    onlyParlays
                      ? savedSlips.length === 0
                        ? 'You have no saved parlays yet. Build one to use this filter.'
                        : 'No HRs from your parlay players yet today.'
                      : 'No home runs yet today — check back during games.'
                  }
                />
              ) : (
                events.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                    <img src={e.headshot} alt={e.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-100 truncate">⚾ {e.playerName} <span className="text-slate-500 font-normal text-xs">({e.teamAbbr})</span></p>
                      <p className="text-[11px] text-slate-400 truncate">{e.halfInning} {e.inning} · {e.matchup} · {e.rbi} RBI</p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">{timeAgo(e.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
            <p className="px-4 py-2 text-[10px] text-slate-600 border-t border-slate-800">Live from MLB game data. Research/entertainment only.</p>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({ label, sub, value, onChange, disabled }: { label: string; sub: string; value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div>
        <p className="text-xs font-bold text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-500">{sub}</p>
      </div>
      <button onClick={onChange} className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-orange-500' : 'bg-slate-700'}`}>
        <span className={`block w-4 h-4 bg-white rounded-full transition-transform mt-1 ${value ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
      <div className="mb-2">{icon}</div>
      <p className="text-xs font-mono max-w-[220px]">{text}</p>
    </div>
  );
}
