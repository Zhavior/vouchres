import { useEffect, useRef, useState } from 'react';
import { useHrFeedToday } from './queries/useHrFeedToday';
import type { HrEvent } from '../types/notifications';
import type { Parlay } from '../types';

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

const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function surnameOf(fullName: string): string {
  const tokens = normalizeName(fullName).split(' ').filter(Boolean);
  while (tokens.length > 1 && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens[tokens.length - 1] || '';
}

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
      return surnameRe ? surnameRe.test(sel) : false;
    }),
  );
}

export function useHrNotificationState(savedSlips: Parlay[] = []) {
  const [enabled, setEnabled] = useState(() => lsBool(LS_ENABLED, true));
  const [onlyParlays, setOnlyParlays] = useState(() => lsBool(LS_ONLY_PARLAYS, false));
  const [events, setEvents] = useState<HrEvent[]>([]);
  const [toasts, setToasts] = useState<HrEvent[]>([]);
  const [unread, setUnread] = useState(0);

  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    localStorage.setItem(LS_ENABLED, String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem(LS_ONLY_PARLAYS, String(onlyParlays));
  }, [onlyParlays]);

  const { data: hrFeed } = useHrFeedToday({
    enabled,
    refetchInterval: enabled ? undefined : false,
  });

  useEffect(() => {
    if (!enabled || !hrFeed?.events) return;

    let evs = hrFeed.events;
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
  }, [enabled, onlyParlays, savedSlips, hrFeed]);

  const markHrRead = () => setUnread(0);
  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return {
    enabled,
    setEnabled,
    onlyParlays,
    setOnlyParlays,
    events,
    toasts,
    unread,
    markHrRead,
    dismissToast,
    savedSlips,
  };
}
