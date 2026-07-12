import { useCallback, useEffect, useMemo, useState } from 'react';
import type { VaiPersonaId } from '../lib/vai/vaiPersonas';
import type { VaiPersonaPickBundle } from '../lib/vai/vaiParlayBuilder';
import { gradePickBundleDay } from '../lib/vai/vaiParlayBuilder';
import { loadHrResults } from '../kernel/loaders/hrResultsLoader';

const STORAGE_KEY = 'vai_persona_daily_picks_v1';

export type StoredVaiPickDay = VaiPersonaPickBundle;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadAll(): StoredVaiPickDay[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(rows: StoredVaiPickDay[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-120)));
  } catch {
    // ignore quota errors
  }
}

export function persistVaiPickBundle(bundle: VaiPersonaPickBundle): void {
  const rows = loadAll().filter(
    (r) => !(r.personaId === bundle.personaId && r.date === bundle.date),
  );
  if (bundle.singles.length > 0 || bundle.doubles.length > 0) {
    rows.push(bundle);
    saveAll(rows);
  }
}

export interface VaiDayCalendarStat {
  ymd: string;
  winRate: number | null;
  wins: number;
  losses: number;
  pending: number;
  totalPicks: number;
  hasPicks: boolean;
}

function getLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getVaiCalendarDays(): Date[] {
  const days: Date[] = [];
  for (let i = -10; i <= 3; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function useVaiParlayHistory(personaId: VaiPersonaId) {
  const [calendarStats, setCalendarStats] = useState<Record<string, VaiDayCalendarStat>>({});
  const [grading, setGrading] = useState(false);

  const personaRows = useMemo(
    () => loadAll().filter((r) => r.personaId === personaId),
    [personaId],
  );

  const refreshCalendar = useCallback(async () => {
    setGrading(true);
    const rows = loadAll().filter((r) => r.personaId === personaId);
    const days = getVaiCalendarDays();
    const stats: Record<string, VaiDayCalendarStat> = {};

    await Promise.all(
      days.map(async (day) => {
        const ymd = getLocalYMD(day);
        const bundle = rows.find((r) => r.date === ymd);
        if (!bundle) {
          stats[ymd] = {
            ymd,
            winRate: null,
            wins: 0,
            losses: 0,
            pending: 0,
            totalPicks: 0,
            hasPicks: false,
          };
          return;
        }

        try {
          const feed = await loadHrResults(ymd);
          const hitIds = new Set(feed.events.map((e) => e.playerId));
          const graded = gradePickBundleDay(bundle, hitIds, ymd === todayISO());
          stats[ymd] = {
            ymd,
            winRate: graded.winRate,
            wins: graded.wins,
            losses: graded.losses,
            pending: graded.pending,
            totalPicks: graded.total,
            hasPicks: true,
          };
        } catch {
          stats[ymd] = {
            ymd,
            winRate: null,
            wins: 0,
            losses: 0,
            pending: bundle.singles.length + bundle.doubles.length + bundle.triples.length + (bundle.lottery ? 1 : 0),
            totalPicks: bundle.singles.length + bundle.doubles.length + bundle.triples.length + (bundle.lottery ? 1 : 0),
            hasPicks: true,
          };
        }
      }),
    );

    setCalendarStats(stats);
    setGrading(false);
  }, [personaId]);

  useEffect(() => {
    void refreshCalendar();
  }, [refreshCalendar, personaRows.length]);

  const overallWinRate = useMemo(() => {
    let wins = 0;
    let losses = 0;
    for (const stat of Object.values(calendarStats)) {
      wins += stat.wins;
      losses += stat.losses;
    }
    const settled = wins + losses;
    return settled > 0 ? Math.round((wins / settled) * 1000) / 10 : null;
  }, [calendarStats]);

  return {
    calendarStats,
    grading,
    overallWinRate,
    refreshCalendar,
    persistBundle: persistVaiPickBundle,
  };
}
