import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Medal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp,
  Cpu,
  Sparkles,
  Play,
  RefreshCw,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Activity,
  DollarSign,
  HelpCircle,
  Copy,
  Plus
} from 'lucide-react';
import { FeedPost, Leg, MLBPlayer, CreatorProofProfile, Parlay } from '../types';
import ResultsLedgerSummary from './results/ResultsLedgerSummary';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import { isGuestMode } from '../lib/authDisplay';
import { apiClient } from "../lib/apiClient";
import { buildSaveParlayPayload, isImportableLiveLeg, normalizeLocalSlip } from "../lib/parlays/parlayBridge";
import {
  Z8_ACTIVE,
  Z8_DISPLAY,
  Z8_EMERALD,
  Z8_IDLE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
} from '../theme/z8Tokens';

interface ResultsPageProps {
  posts: FeedPost[];
  profile?: CreatorProofProfile;
  onTailParlay?: (legs: Leg[]) => void;
  savedParlays?: Parlay[];
}

export interface AIParlayPick {
  id: string;
  title: string;
  createdAt: string;
  gameStartTime: string;
  status: 'UPCOMING' | 'ACTIVE' | 'WON' | 'LOST';
  bookie: string;
  wager: number;
  payout: number;
  oddsValue: number;
  oddsDisplay: string;
  confidence: number;
  legs: {
    playerName: string;
    team: string;
    headshot: string;
    marketName: string;
    spec: string;
    odds: number;
    status: 'PENDING' | 'WON' | 'LOST';
    resultDetail?: string;
  }[];
}


interface BackendLedgerPick {
  id: string;
  title?: string | null;
  status?: string | null;
  leg_type?: string | null;
  created_at?: string | null;
  stake?: number | null;
  payout?: number | null;
  odds?: number | null;
  legs?: unknown[];
  is_parlay?: boolean;
}

interface BackendLedgerResponse {
  ledger: BackendLedgerPick[];
  summary: {
    total: number;
    pending: number;
    won: number;
    lost: number;
    void: number;
    push: number;
    parlays: number;
    singles: number;
  };
  total: number;
  limit: number;
  offset: number;
}

const INITIAL_AI_PARLAYS: AIParlayPick[] = [
  {
    id: 'VAI-PARLAY-4982',
    title: 'Precision Bat Barrel Multi-Stash',
    createdAt: '2026-06-18T10:15:00-07:00',
    gameStartTime: 'Yesterday, 6:10 PM',
    status: 'WON',
    bookie: 'DraftKings',
    wager: 100,
    payout: 432,
    oddsValue: 4.32,
    oddsDisplay: '+332',
    confidence: 88,
    legs: [
      {
        playerName: 'Shohei Ohtani',
        team: 'LAD',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660271/headshot/67/current',
        marketName: 'To Record 2+ Hits',
        spec: 'Shohei Ohtani Over 1.5 Hits',
        odds: 2.15,
        status: 'WON',
        resultDetail: '2 Hits (Single in 1st, Double in 5th)'
      },
      {
        playerName: 'Gunnar Henderson',
        team: 'BAL',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/683002/headshot/67/current',
        marketName: 'To Record 1+ Runs',
        spec: 'Gunnar Henderson Over 0.5 Runs',
        odds: 2.01,
        status: 'WON',
        resultDetail: '1 Run Scored (Solo Shot over Right-Center, 3rd Inning)'
      }
    ]
  },
  {
    id: 'VAI-PARLAY-4989',
    title: 'Atmospheric Air Density Power Ticket',
    createdAt: '2026-06-18T14:45:00-07:00',
    gameStartTime: 'Yesterday, 7:15 PM',
    status: 'LOST',
    bookie: 'FanDuel',
    wager: 100,
    payout: 0,
    oddsValue: 5.85,
    oddsDisplay: '+485',
    confidence: 91,
    legs: [
      {
        playerName: 'Aaron Judge',
        team: 'NYY',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/592450/headshot/67/current',
        marketName: 'To Hit 1+ Home Run',
        spec: 'Aaron Judge Over 0.5 HRs',
        odds: 2.90,
        status: 'WON',
        resultDetail: '1 Home Run (Solo Shot in 4th)'
      },
      {
        playerName: 'Yordan Alvarez',
        team: 'HOU',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/670541/headshot/67/current',
        marketName: 'To Record 2+ Hits',
        spec: 'Yordan Alvarez Over 1.5 Hits',
        odds: 2.02,
        status: 'LOST',
        resultDetail: '1 Hit (1-for-4, 2 Strikeouts)'
      }
    ]
  },
  {
    id: 'VAI-PARLAY-5002',
    title: 'Optimal Matchup Sabermetric Slice',
    createdAt: '2026-06-19T09:30:00-07:00',
    gameStartTime: 'June 19, 7:15 PM',
    status: 'WON',
    bookie: 'Bet365',
    wager: 100,
    payout: 580,
    oddsValue: 5.80,
    oddsDisplay: '+480',
    confidence: 93,
    legs: [
      {
        playerName: 'Shohei Ohtani',
        team: 'LAD',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660271/headshot/67/current',
        marketName: 'To Hit 1+ Home Run',
        spec: 'Shohei Ohtani Over 0.5 HRs',
        odds: 3.20,
        status: 'WON',
        resultDetail: '1 Home Run (Solo Shot to Right in 4th)'
      },
      {
        playerName: 'Bobby Witt Jr.',
        team: 'KCR',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/677951/headshot/67/current',
        marketName: 'To Record 1+ Over RBIs',
        spec: 'Bobby Witt Jr. Over 0.5 RBIs',
        odds: 1.81,
        status: 'WON',
        resultDetail: '1 RBI (Double down the line in 6th)'
      }
    ]
  },
  {
    id: 'VAI-PARLAY-5011',
    title: 'Low Altitude Cold Front Value Accumulator',
    createdAt: '2026-06-19T11:45:00-07:00',
    gameStartTime: 'June 19, 7:15 PM',
    status: 'LOST',
    bookie: 'BetMGM',
    wager: 100,
    payout: 0,
    oddsValue: 3.48,
    oddsDisplay: '+248',
    confidence: 96,
    legs: [
      {
        playerName: 'Aaron Judge',
        team: 'NYY',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/592450/headshot/67/current',
        marketName: 'Total Bases Prop',
        spec: 'Aaron Judge Over 1.5 Total Bases',
        odds: 1.85,
        status: 'WON',
        resultDetail: '2 Hits (Single & Double, 3 Total Bases)'
      },
      {
        playerName: 'Juan Soto',
        team: 'NYY',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/665742/headshot/67/current',
        marketName: 'To Record 1+ Runs',
        spec: 'Juan Soto Over 0.5 Runs',
        odds: 1.88,
        status: 'LOST',
        resultDetail: '0 Runs Scored (0-for-3, 1 strikeout, 1 walk)'
      }
    ]
  },
  {
    id: 'VAI-PARLAY-5022',
    title: 'Heavy Thermal Air Flow Prop Sweep',
    createdAt: '2026-06-20T10:15:00-07:00',
    gameStartTime: 'June 20, 4:10 PM',
    status: 'WON',
    bookie: 'DraftKings',
    wager: 100,
    payout: 385,
    oddsValue: 3.85,
    oddsDisplay: '+285',
    confidence: 92,
    legs: [
      {
        playerName: 'Gunnar Henderson',
        team: 'BAL',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/683002/headshot/67/current',
        marketName: 'To Record 1+ Runs',
        spec: 'Gunnar Henderson Over 0.5 Runs',
        odds: 2.10,
        status: 'WON',
        resultDetail: '1 Run Scored (Walked and scored in 1st)'
      },
      {
        playerName: 'Bobby Witt Jr.',
        team: 'KCR',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/677951/headshot/67/current',
        marketName: 'To Record 2+ Hits',
        spec: 'Bobby Witt Jr. Over 1.5 Hits',
        odds: 1.83,
        status: 'WON',
        resultDetail: '2 Hits (2-for-4, 1 Double, 1 Single)'
      }
    ]
  },
  {
    id: 'VAI-PARLAY-5026',
    title: 'Late Inning Platoon Leverage Ticket',
    createdAt: '2026-06-20T15:00:00-07:00',
    gameStartTime: 'June 20, 7:15 PM',
    status: 'LOST',
    bookie: 'FanDuel',
    wager: 100,
    payout: 0,
    oddsValue: 4.80,
    oddsDisplay: '+380',
    confidence: 89,
    legs: [
      {
        playerName: 'Shohei Ohtani',
        team: 'LAD',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660271/headshot/67/current',
        marketName: 'To Record 1+ Over RBIs',
        spec: 'Shohei Ohtani Over 0.5 RBIs',
        odds: 2.30,
        status: 'WON',
        resultDetail: '1 RBI (Triple to gap scoring runner from first in 5th)'
      },
      {
        playerName: 'Aaron Judge',
        team: 'NYY',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/592450/headshot/67/current',
        marketName: 'To Hit 1+ Home Run',
        spec: 'Aaron Judge Over 0.5 HRs',
        odds: 2.08,
        status: 'LOST',
        resultDetail: '0 Home Runs (0-for-2, 2 Walks)'
      }
    ]
  },
  {
    id: 'VAI-PARLAY-5030',
    title: 'Sunday Midsummer Humidity Power Sweep',
    createdAt: '2026-06-21T09:00:00-07:00',
    gameStartTime: 'Today, 1:15 PM (Posted Pre-Game)',
    status: 'UPCOMING',
    bookie: 'BetMGM',
    wager: 100,
    payout: 410,
    oddsValue: 4.10,
    oddsDisplay: '+310',
    confidence: 94,
    legs: [
      {
        playerName: 'Gunnar Henderson',
        team: 'BAL',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/683002/headshot/67/current',
        marketName: 'Total Bases Prop',
        spec: 'Gunnar Henderson Over 1.5 Total Bases',
        odds: 1.95,
        status: 'PENDING'
      },
      {
        playerName: 'Juan Soto',
        team: 'NYY',
        headshot: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/665742/headshot/67/current',
        marketName: 'To Record 1+ Runs',
        spec: 'Juan Soto Over 0.5 Runs',
        odds: 2.10,
        status: 'PENDING'
      }
    ]
  }
];

export default function ResultsPage({ posts, profile, onTailParlay, savedParlays = [] }: ResultsPageProps) {
  const guestPreviewMode = isGuestMode();
  // Navigation tabs: 'ai_model' (VAI AI Picks) vs 'community' (verified ledger) vs 'personal' (My Outcomes)
  const [activeSubTab, setActiveSubTab] = useState<'ai_model' | 'community' | 'personal'>('ai_model');

  // AI Parlays local persistence
  const [aiParlays, setAiParlays] = useState<AIParlayPick[]>([]);
  const [aiWinRate, setAiWinRate] = useState<number>(61.4);
  const [aiTotalPicksCount, setAiTotalPicksCount] = useState<number>(142);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [visualToast, setVisualToast] = useState<string | null>(null);
  const [backendLedger, setBackendLedger] = useState<BackendLedgerResponse | null>(null);

  const loadBackendLedger = async () => {
    // Safe read-only compatibility reload for legacy action buttons.
    // Does not mutate grading truth or live-parlay identity.
    setBackendLedgerLoading(true);
    setBackendLedgerError(null);

    try {
      const response = await apiClient.get("/api/me/results-ledger");
      setBackendLedger(response as BackendLedgerResponse);
    } catch (err: any) {
      setBackendLedgerError(err?.message || "Could not reload backend ledger.");
    } finally {
      setBackendLedgerLoading(false);
    }
  };
  const [ledgerNotice, setLedgerNotice] = useState<string | null>(null);

  const triggerNotification = (message: string) => {
    setLedgerNotice(message);
    window.setTimeout(() => setLedgerNotice(null), 3500);
  };

  const [backendLedgerLoading, setBackendLedgerLoading] = useState(false);
  const [backendLedgerError, setBackendLedgerError] = useState<string | null>(null);

  // Calendar timeline
  const [selectedDateYMD, setSelectedDateYMD] = useState<string | null>(null);

  const getLocalYMD = (dateInput: string | Date | number) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${r}`;
  };

  const getCalendarDays = () => {
    const days = [];
    const base = new Date();
    // Preceding 10 days and following 3 days
    for (let i = -10; i <= 3; i++) {
      const d = new Date();
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBackendLedger() {
      try {
        setBackendLedgerLoading(true);
        setBackendLedgerError(null);

        const payload = await apiClient.get("/api/me/parlays");

        if (!cancelled) {
          const rawPicks = Array.isArray(payload)
            ? payload
            : Array.isArray((payload as any)?.parlays)
              ? (payload as any).parlays
              : Array.isArray((payload as any)?.picks)
                ? (payload as any).picks
                : Array.isArray((payload as any)?.data)
                  ? (payload as any).data
                  : [];

          const picks = uniqueByParlayParentId(rawPicks);

          setBackendLedger({ picks } as any);
        }
      } catch (error) {
        if (!cancelled) {
          setBackendLedgerError(error instanceof Error ? error.message : "Parlay request failed");
          setBackendLedger({ picks: [] } as any);
        }
      } finally {
        if (!cancelled) {
          setBackendLedgerLoading(false);
        }
      }
    }

    loadBackendLedger();

    return () => {
      cancelled = true;
    };
  }, []);


  // Customer-safe Results: localStorage is draft/import cache only, never account truth.
  // Account results must come from the backend/Supabase loader.
  useEffect(() => {
    setAiParlays([]);
    setAiWinRate(0);
    setAiTotalPicksCount(0);
  }, []);

  // Settle lists
  const results = posts
    .filter((p) => p.postType === 'RESULT' && p.result)
    .map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      displayName: p.displayName,
      content: p.content,
      result: p.result!,
      parlay: p.parlay,
      vouch: p.vouch
    }));



  const getParlayParentId = (parlay: any) =>
    String(
      parlay?.id ||
      parlay?.pick_id ||
      parlay?.backendPickId ||
      parlay?.pick?.id ||
      parlay?.parentPickId ||
      ""
    ).trim();

  const uniqueByParlayParentId = <T extends any>(items: T[]): T[] => {
    const seen = new Set<string>();
    const unique: T[] = [];

    for (const item of items) {
      const parentId = getParlayParentId(item);
      const fallbackId = String((item as any)?.clientRef || (item as any)?.event_key || (item as any)?.eventKey || "");
      const key = parentId || fallbackId;

      if (!key || seen.has(key)) continue;

      seen.add(key);
      unique.push(item);
    }

    return unique;
  };

  
const cleanCustomerText = (value?: string | number | null): string =>
  String(value ?? "")
    .replace(/\|\|meta:.*$/i, "")
    .replace(/source=manual\s*/gi, "")
    .replace(/clientRef=[^\s]+/gi, "")
    .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const compactPublicTicketId = (id?: string | number | null): string => {
  const raw = String(id ?? "").trim();
  if (!raw) return "VOUCH";
  return `VOUCH-${raw.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;
};

const getFallbackHeadshot = (name?: string | null): string =>
  `https://ui-avatars.com/api/?background=0f172a&color=94a3b8&name=${encodeURIComponent(cleanCustomerText(name) || "Player")}`;

const getFriendlyParlayTitle = (parlay: any) => {
    const rawTitle = String(parlay?.title ?? "").trim();
    const rawMarket = String(parlay?.market ?? "").trim();
    const rawSource = String(parlay?.source ?? "").trim().toLowerCase();

    const candidate = rawTitle || rawMarket;

    const isTechnical =
      !candidate ||
      candidate.includes("clientRef=") ||
      candidate.includes("source=") ||
      candidate.includes("backend-ai-") ||
      candidate.length > 80;

    if (!isTechnical) return candidate;

    if (rawSource.includes("local_import")) return "Imported HR Parlay";
    if (rawSource.includes("manual")) return "My Saved Parlay";
    if (rawSource.includes("ai") || rawSource.includes("vai")) return "V.A.I Smart Picks Parlay";

    return "My Parlay";
  };

  const getFriendlyOddsDisplay = (parlay: any, oddsValue: number) => {
    const rawDisplay = String(parlay?.oddsDisplay ?? parlay?.odds_display ?? "").trim();

    if (rawDisplay && rawDisplay !== "0" && rawDisplay !== "0x") {
      return rawDisplay;
    }

    if (Number.isFinite(oddsValue) && oddsValue > 0) {
      return `${oddsValue.toFixed(2)}x`;
    }

    return "Pending odds";
  };

  const filteredAiParlays = uniqueByParlayParentId(
    selectedDateYMD
      ? aiParlays.filter((p) => getLocalYMD(p.createdAt) === selectedDateYMD)
      : aiParlays
  );

  const filteredCommunityResults = selectedDateYMD
    ? results.filter((r) => getLocalYMD(r.timestamp) === selectedDateYMD)
    : results;

  const personalResults = posts
    .filter((p) => p.postType === 'RESULT' && p.result && (p.userId === 'u-user-current' || p.username === profile?.username || p.displayName === profile?.displayName))
    .map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      displayName: p.displayName || 'You',
      username: p.username || 'proedge_tracker',
      content: p.content,
      result: p.result!,
      parlay: p.parlay,
      vouch: p.vouch
    }));

  const filteredPersonalResults = selectedDateYMD
    ? personalResults.filter((r) => getLocalYMD(r.timestamp) === selectedDateYMD)
    : personalResults;

  interface DateStats {
    ymd: string;
    totalCount: number;
    completedCount: number;
    wins: number;
    losses: number;
    winRate: number | null;
    hasUpcoming: boolean;
  }

  const getDateStats = (ymd: string): DateStats => {
    if (activeSubTab === 'ai_model') {
      const dayPicks = aiParlays.filter(p => getLocalYMD(p.createdAt) === ymd);
      const completed = dayPicks.filter(p => p.status === 'WON' || p.status === 'LOST');
      const wins = completed.filter(p => p.status === 'WON').length;
      const losses = completed.filter(p => p.status === 'LOST').length;
      const totalCount = dayPicks.length;
      const completedCount = completed.length;
      const winRate = completedCount > 0 ? (wins / completedCount) * 100 : null;
      const hasUpcoming = dayPicks.some(p => p.status === 'UPCOMING');

      return { ymd, totalCount, completedCount, wins, losses, winRate, hasUpcoming };
    } else if (activeSubTab === 'personal') {
      const dayPicks = personalResults.filter(r => getLocalYMD(r.timestamp) === ymd);
      const completed = dayPicks.filter(r => r.result.status === 'WON' || r.result.status === 'LOST');
      const wins = completed.filter(r => r.result.status === 'WON').length;
      const losses = completed.filter(r => r.result.status === 'LOST').length;
      const totalCount = dayPicks.length;
      const completedCount = completed.length;
      const winRate = completedCount > 0 ? (wins / completedCount) * 100 : null;

      return { ymd, totalCount, completedCount, wins, losses, winRate, hasUpcoming: false };
    } else {
      const dayPicks = results.filter(r => getLocalYMD(r.timestamp) === ymd);
      const completed = dayPicks.filter(r => r.result.status === 'WON' || r.result.status === 'LOST');
      const wins = completed.filter(r => r.result.status === 'WON').length;
      const losses = completed.filter(r => r.result.status === 'LOST').length;
      const totalCount = dayPicks.length;
      const completedCount = completed.length;
      const winRate = completedCount > 0 ? (wins / completedCount) * 100 : null;

      return { ymd, totalCount, completedCount, wins, losses, winRate, hasUpcoming: false };
    }
  };

  const winsCount = results.filter((r) => r.result.status === 'WON').length;
  const lossesCount = results.filter((r) => r.result.status === 'LOST').length;
  const totalCount = results.length;
  const realWinRate = totalCount > 0 ? (winsCount / totalCount) * 100 : 0.0;

  const totalUnitsProfit = results.reduce((acc, r) => {
    if (r.result.status === 'WON') {
      return acc + (r.result.profit ?? 0.0);
    } else if (r.result.status === 'LOST') {
      return acc - r.result.units;
    }
    return acc;
  }, 0.0);

  const personalWinsCount = personalResults.filter((r) => r.result.status === 'WON').length;
  const personalLossesCount = personalResults.filter((r) => r.result.status === 'LOST').length;
  const personalTotalCount = personalResults.length;
  const personalWinSettleCount = personalWinsCount + personalLossesCount;
  const personalWinRate = personalWinSettleCount > 0 ? (personalWinsCount / personalWinSettleCount) * 100 : 0.0;

  const personalUnitsProfit = personalResults.reduce((acc, r) => {
    if (r.result.status === 'WON') {
      return acc + (r.result.profit ?? 0.0);
    } else if (r.result.status === 'LOST') {
      return acc - r.result.units;
    }
    return acc;
  }, 0.0);

  // VAI AI metrics
  const settledAiParlays = aiParlays.filter(p => p.status === 'WON' || p.status === 'LOST');
  const upcomingAiParlays = aiParlays.filter(p => p.status === 'UPCOMING');
  const aiWinsCount = settledAiParlays.filter(p => p.status === 'WON').length;
  const aiLossesCount = settledAiParlays.filter(p => p.status === 'LOST').length;

  const totalAiInvested = settledAiParlays.reduce((acc, p) => acc + p.wager, 0);
  const totalAiReturned = settledAiParlays.reduce((acc, p) => p.status === 'WON' ? acc + p.payout : acc, 0);

  const netAiWinnings = totalAiReturned - totalAiInvested;
  const netAiUnitsProfit = settledAiParlays.reduce((acc, p) => p.status === 'WON' ? acc + (p.oddsValue - 1) : acc - 1, 0);

  // Action: Clone and Sync
  const handleCloneParlayToBoard = (pick: AIParlayPick) => {
    const clipString = pick.legs.map((leg) => `• ${leg.playerName}: ${leg.marketName} (${leg.spec}) @ dec ${leg.odds}`).join('\n');
    const fullText = `VouchEdge AI Parlay Pick Clone:\n${pick.title} (${pick.oddsDisplay})\n\nLegs:\n${clipString}`;
    
    const mappedLegs: Leg[] = pick.legs.map((l, index) => ({
      id: `tail-leg-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
      sport: 'MLB',
      game: `${l.team} @ Live Target`,
      market: l.marketName,
      selection: l.spec,
      odds: l.odds,
      status: 'PENDING'
    }));

    if (onTailParlay) {
      onTailParlay(mappedLegs);
      triggerNotification(`🎯 SUCCESS: All ${mappedLegs.length} legs from "${pick.title}" added to active Slip Constructor!`);
    } else {
      navigator.clipboard.writeText(fullText).then(() => {
        localStorage.setItem('vouchedge_staged_legs_cache', JSON.stringify(mappedLegs));
        triggerNotification(`🎯 Cloned "${pick.title}"! All props stored to workspace clipboard.`);
      }).catch(() => {
        triggerNotification(`👍 Prop details synchronized. Ready for parlay compiling.`);
      });
    }
  };

  const handleGradeParlay = (_id: string, _status: 'WON' | 'LOST') => {
    triggerNotification("⚠️ Manual grading is disabled. Results now grade from verified backend data.");
  };

  const handleReloadSabermetricFeeds = () => {
    triggerNotification("⚠️ Demo parlay generation is disabled. Build or import a real account parlay instead.");
  };

  const handleResetAISystem = () => {
    setAiParlays([]);
    setAiWinRate(0);
    setAiTotalPicksCount(0);
    triggerNotification("✅ Local demo results cleared. Account results remain database-backed.");
  };


  const handleSyncLiveHrResults = async () => {
    try {
      const result = await apiClient.post("/api/parlays/live-hr-sync", {});
      console.log("[live-hr-sync]", result);

      const updatedLegs = Number((result as any)?.updatedLegs ?? 0);
      const checked = Number((result as any)?.checked ?? 0);
      const repairedCount = Number((result as any)?.repair?.repairedCount ?? 0);

      triggerNotification(
        updatedLegs > 0
          ? `✅ Live HR sync updated ${updatedLegs} leg(s). Repaired ${repairedCount} legacy leg(s).`
          : `✅ Live HR sync checked ${checked} match(es). Repaired ${repairedCount} legacy leg(s).`
      );

      await loadBackendLedger();
    } catch (err: any) {
      console.error("[live-hr-sync] failed", err);
      triggerNotification(`⚠️ Live HR sync failed: ${err?.message || "unknown error"}`);
    }
  };



  const handleImportLocalParlays = async () => {
    try {
      const raw = localStorage.getItem("vouchedge_slips");
      const localSlips = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(localSlips) || localSlips.length === 0) {
        triggerNotification("No local parlays found to import.");
        return;
      }

      let imported = 0;
      let skipped = 0;
      const updatedLocalSlips = [...localSlips];

      for (let index = 0; index < localSlips.length; index += 1) {
        const localSlip = localSlips[index];

        if (!localSlip || localSlip.backendPickId) {
          skipped += 1;
          continue;
        }

        const canonicalSlip = normalizeLocalSlip(localSlip);
        const importableLegs = canonicalSlip.legs.filter(isImportableLiveLeg);

        if (importableLegs.length === 0) {
          skipped += 1;
          continue;
        }

        const payload = buildSaveParlayPayload({
          ...canonicalSlip,
          legs: importableLegs,
          source: "local_import",
          metadata: {
            ...(canonicalSlip.metadata || {}),
            importedFrom: "vouchedge_slips",
          },
        });

        const saved = await apiClient.post("/api/me/parlays", payload);

        const backendPickId =
          (saved as any)?.pick?.id ||
          (saved as any)?.pickId ||
          (saved as any)?.id ||
          (saved as any)?.data?.id ||
          localSlip.backendPickId ||
          null;

        updatedLocalSlips[index] = {
          ...localSlip,
          backendPickId,
          backendSyncState: backendPickId ? "synced" : "unknown",
          backendSyncedAt: new Date().toISOString(),
        };

        imported += 1;
      }

      localStorage.setItem("vouchedge_slips", JSON.stringify(updatedLocalSlips));
      triggerNotification(`✅ Imported ${imported} local parlay(s). Skipped ${skipped}.`);
      await loadBackendLedger();
    } catch (err: any) {
      console.error("[import-local-parlays] failed", err);
      triggerNotification(`⚠️ Import failed: ${err?.message || "unknown error"}`);
    }
  };


  return (
    <main className={`${Z8_PAGE} ve-page-shell min-h-0 min-w-0 overflow-x-hidden bg-ve-obsidian text-ve-flash ve-safe-bottom ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} mx-auto max-w-7xl`} id="results-analytics-view">

      <section className={`${Z8_PANEL_PREMIUM} glass-command mb-4 rounded-3xl border border-ve-fuse/40 p-4`}>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className={Z8_SECTION_HEADER}>
            <div className={`${Z8_LABEL} text-vouch-cyan`}>
              Backend Ledger
            </div>
            <h3 className={`${Z8_DISPLAY} text-xl sm:text-2xl`}>
              Results are now connected to account parlays
            </h3>
            <p className="text-sm text-white/45">
              {backendLedgerLoading
                ? 'Loading your saved picks and parlays from the backend...'
                : backendLedgerError
                  ? backendLedgerError
                  : backendLedger
                    ? `${Object.values(backendLedger).find(Array.isArray)?.length ?? 0} saved parlay${(Object.values(backendLedger).find(Array.isArray)?.length ?? 0) === 1 ? "" : "s"} loaded from your account.`
                    : 'Account parlay results waiting for login.'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className={Z8_STAT_CHIP}>
              <div className="text-lg font-black text-white z8-tabular-nums">{backendLedger?.summary.pending ?? 0}</div>
              <div className={`${Z8_LABEL} text-white/40`}>Pending</div>
            </div>
            <div className={Z8_STAT_CHIP}>
              <div className={`text-lg font-black ${Z8_EMERALD} z8-tabular-nums`}>{backendLedger?.summary.won ?? 0}</div>
              <div className={`${Z8_LABEL} text-white/40`}>Won</div>
            </div>
            <div className={Z8_STAT_CHIP}>
              <div className="text-lg font-black text-red-400 z8-tabular-nums">{backendLedger?.summary.lost ?? 0}</div>
              <div className={`${Z8_LABEL} text-white/40`}>Lost</div>
            </div>
            <div className={Z8_STAT_CHIP}>
              <div className={`text-lg font-black text-vouch-cyan z8-tabular-nums`}>{backendLedger?.summary.parlays ?? 0}</div>
              <div className={`${Z8_LABEL} text-white/40`}>Parlays</div>
            </div>
          </div>
        </div>
      </section>

      <ResultsLedgerSummary savedParlays={savedParlays} />

      {/* Toast Notification */}
      {visualToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-ve-graphite border border-emerald-500 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl text-xs font-mono font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{visualToast}</span>
        </div>
      )}

      {/* Elegant Header */}
      <div className={`${Z8_PANEL_PREMIUM} flex flex-col justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center`}>
        <div className={Z8_SECTION_HEADER}>
          <h2 className={`${Z8_DISPLAY} flex items-center gap-2 text-xl sm:text-2xl`}>
            <Medal className="h-5 w-5 text-vouch-emerald" />
            Performance Ledger & Graded Results
          </h2>
          <p className="text-xs text-white/45">
            Browse real-time calculated outcomes, verified community submissions, and active AI-assisted parlay slips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImportLocalParlays}
            className={`${Z8_IDLE} inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xs text-vouch-emerald`}
          >
            <RefreshCw className="h-3.5 w-3.5 text-vouch-emerald" />
            <span>IMPORT LOCAL PARLAYS</span>
          </button>
          <button
            onClick={handleSyncLiveHrResults}
            className={`${Z8_ACTIVE} inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xs`}
          >
            <RefreshCw className="h-3.5 w-3.5 text-vouch-cyan" />
            <span>SYNC LIVE HR RESULTS</span>
          </button>
          {activeSubTab === 'ai_model' && (
            <button
              onClick={handleReloadSabermetricFeeds}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-black/25 border border-white/10 text-white/65 hover:text-white rounded-xl text-xs font-mono flex items-center gap-2 transition-all hover:bg-black/35 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? "SYNCING DATA..." : "CALCULATE NEW PARLAY"}</span>
            </button>
          )}

          <button
            onClick={handleResetAISystem}
            className="text-[10px] font-mono text-white/40 hover:text-slate-350 bg-obsidian-900 border border-white/10 rounded-lg px-2.5 py-1.5 hover:border-white/10 transition-all"
          >
            Reset Ledger
          </button>
        </div>
      </div>

      {/* Unified Tab Selector */}
      <div className="flex bg-ve-storm/90 p-1 rounded-2xl border border-white/10 shadow-sm" id="results-tab-belt">
        <button
          onClick={() => {
            setActiveSubTab('ai_model');
            setSelectedDateYMD(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs font-black transition-all ${
            activeSubTab === 'ai_model'
              ? 'bg-ve-surface-panel text-sky-400 border border-white/[0.08] shadow-md'
              : 'text-white/45 hover:text-white/80'
          }`}
        >
          <Cpu className="w-4 h-4 text-sky-450" />
          <span>V.A.I PRO PARLAYS ({aiParlays.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('community');
            setSelectedDateYMD(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs font-black transition-all ${
            activeSubTab === 'community'
              ? 'bg-ve-surface-panel text-orange-400 border border-white/[0.08]'
              : 'text-white/45 hover:text-white/80'
          }`}
        >
          <Medal className="w-4 h-4 text-orange-450" />
          <span>COMMUNITY OUTCOMES ({totalCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('personal');
            setSelectedDateYMD(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs font-black transition-all ${
            activeSubTab === 'personal'
              ? 'bg-ve-surface-panel text-emerald-400 border border-white/[0.08]'
              : 'text-white/45 hover:text-white/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-450" />
          <span>MY OUTCOMES ({personalTotalCount})</span>
        </button>
      </div>

      {/* Date timeline filter ribbon */}
      <div className="bg-ve-graphite/90 border border-white/10 rounded-2xl p-4 gap-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between" id="calendar-timeline-hud">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-black uppercase text-white/65 tracking-wider">
              Timezone Ledger Timeline
            </h3>
          </div>
          <p className="text-[10px] text-white/40 font-mono">
            {selectedDateYMD ? `Active Filter Date: ${selectedDateYMD}` : 'Select a calendar day below to inspect daily records:'}
          </p>
          {selectedDateYMD && (
            <button
              onClick={() => setSelectedDateYMD(null)}
              className="text-[9px] font-mono text-emerald-400 font-extrabold hover:underline"
            >
              ← Clear Date Filter [Show All Days]
            </button>
          )}
        </div>

        {/* Scrollable ribbon days */}
        <div className="flex-1 flex gap-2 items-center overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button
            onClick={() => setSelectedDateYMD(null)}
            className={`min-w-[55px] h-[64px] rounded-xl flex flex-col items-center justify-center border transition-all text-center flex-shrink-0 ${
              selectedDateYMD === null
                ? 'bg-black/25 text-emerald-400 border-emerald-500/30'
                : 'bg-obsidian-900/80 text-white/45 border-white/10 hover:border-white/10'
            }`}
          >
            <span className="text-[8px] uppercase font-mono tracking-widest font-bold">ALL</span>
            <span className="text-sm font-extrabold font-mono mt-0.5">★</span>
          </button>

          {getCalendarDays().map((dateItem, idx) => {
            const ymd = getLocalYMD(dateItem);
            const stats = getDateStats(ymd);

            const aiForDate = aiParlays.filter((pick) => {
              const rawDate =
                (pick as any).timestamp ||
                (pick as any).createdAt ||
                (pick as any).created_at ||
                (pick as any).date ||
                (pick as any).gameDate ||
                (pick as any).game_date;

              if (!rawDate) return false;

              try {
                return getLocalYMD(new Date(rawDate)) === ymd;
              } catch {
                return false;
              }
            });

            const settledAiForDate = aiForDate.filter((pick) => {
              const status = String((pick as any).status || (pick as any).result || "").toLowerCase();
              return ["won", "win", "lost", "loss"].includes(status);
            });

            const aiWinsForDate = settledAiForDate.filter((pick) => {
              const status = String((pick as any).status || (pick as any).result || "").toLowerCase();
              return status === "won" || status === "win";
            }).length;

            const aiLossesForDate = settledAiForDate.filter((pick) => {
              const status = String((pick as any).status || (pick as any).result || "").toLowerCase();
              return status === "lost" || status === "loss";
            }).length;

            const aiWinRateForDate =
              settledAiForDate.length > 0 ? (aiWinsForDate / settledAiForDate.length) * 100 : null;

            const isSelected = selectedDateYMD === ymd;
            const dayName = dateItem.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNum = dateItem.getDate();
            
            let statusText = "No Plays";
            let subColor = "text-white/40";
            
            if (aiWinRateForDate !== null) {
              statusText = `AI ${aiWinRateForDate.toFixed(0)}%`;
              subColor = aiWinRateForDate >= 50 ? "text-cyan-300" : "text-rose-500";
            } else if (aiForDate.length > 0) {
              statusText = `AI ${aiForDate.length} pending`;
              subColor = "text-cyan-400 animate-pulse";
            } else if (stats.winRate !== null) {
              statusText = `${stats.winRate.toFixed(0)}% WR`;
              subColor = stats.winRate >= 50 ? "text-emerald-400" : "text-rose-500";
            } else if (stats.hasUpcoming) {
              statusText = "Pre-Game";
              subColor = "text-sky-400";
            } else if (stats.totalCount > 0) {
              statusText = "Pending";
              subColor = "text-amber-400 animate-pulse";
            }

            return (
              <button
                key={ymd || idx}
                type="button"
                onClick={() => setSelectedDateYMD(ymd)}
                className={`min-w-[65px] h-[64px] rounded-xl flex flex-col items-center justify-between py-1.5 px-1 border transition-all text-center flex-shrink-0 relative ${
                  isSelected
                    ? 'bg-ve-surface-panel border-emerald-500/40 border-2 text-emerald-300 shadow shadow-emerald-500/10'
                    : 'bg-obsidian-900/60 border-white/10 hover:border-slate-850 hover:bg-obsidian-900/90'
                }`}
              >
                <span className="text-[8px] uppercase tracking-wider font-mono text-white/40 font-bold leading-none">
                  {dayName}
                </span>

                <span className={`text-xs font-black font-mono leading-none ${isSelected ? 'text-emerald-300' : 'text-white/80'}`}>
                  {dayNum}
                </span>

                <span className={`text-[8px] font-mono leading-none truncate w-full ${subColor}`}>
                  {statusText}
                </span>
                
                {stats.totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black/25 border border-white/10 text-white/45 text-[7px] font-mono rounded px-1 scale-90">
                    {stats.totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-SECTION 1: V.A.I PREMIUM AI MODELS */}
      {activeSubTab === 'ai_model' && (
        <div className="space-y-6">
          
          {/* Executive Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-gradient-to-br from-[#121824] to-[#0e131d] border border-white/10 rounded-2xl p-4.5 space-y-2 md:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest font-black">Accuracy Index</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-900">VERIFIED HISTORICAL</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-mono font-black text-emerald-400">{aiWinRate.toFixed(1)}%</span>
                <span className="text-xs text-white/45 font-mono">True Model Hit-Rate</span>
              </div>
              <div className="h-1.5 w-full bg-black/25 rounded-full overflow-hidden border border-slate-850/50">
                <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${aiWinRate}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1">
                <span>{aiWinsCount} Wins</span>
                <span>{aiLossesCount} Losses</span>
              </div>
            </div>

            <div className="bg-ve-storm border border-white/10 rounded-2xl p-4.5 space-y-1">
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest block">Net Multi-Slip Return</span>
              <div className={`text-2xl font-mono font-black ${netAiWinnings >= 0 ? "text-emerald-400" : "text-rose-500"} pt-1`}>
                ${netAiWinnings >= 0 ? '+' : ''}{netAiWinnings.toLocaleString()}
              </div>
              <p className="text-[10.5px] text-white/40 font-mono">
                Total Placed: ${totalAiInvested} (${(totalAiInvested / (settledAiParlays.length || 1)).toFixed(0)} avg)
              </p>
            </div>

            <div className="bg-ve-storm border border-white/10 rounded-2xl p-4.5 space-y-1">
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest block">Average Yield</span>
              <div className={`text-2xl font-mono font-black ${netAiUnitsProfit >= 0 ? "text-emerald-400" : "text-rose-500"} pt-1`}>
                {netAiUnitsProfit >= 0 ? '+' : ''}{netAiUnitsProfit.toFixed(2)}U
              </div>
              <p className="text-[10.5px] text-white/40 font-mono">
                Confidence rating: Avg 91.2%
              </p>
            </div>

          </div>

          {/* AI Parlay Tickets */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono pl-1">
              PREDICTED PARLAY DECK ({filteredAiParlays.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAiParlays.length === 0 ? (
                <div className="py-12 text-center bg-black/25/10 rounded-2xl border border-white/10 font-mono text-xs w-full col-span-full">
                  <AlertTriangle className="w-5.5 h-5.5 text-white/40 mx-auto mb-2" />
                  <p className="text-white/65 font-black uppercase">No active slips matching {selectedDateYMD}</p>
                  <p className="text-[10px] text-white/40 mt-1">Select other dates on the ribbon above or check out community ledger logs.</p>
                </div>
              ) : (
                filteredAiParlays.map((pick) => {
                  const isWon = pick.status === 'WON';
                  const isLost = pick.status === 'LOST';
                  const isUpcoming = pick.status === 'UPCOMING';

                  return (
                    <div 
                      key={pick.id}
                      className={`bg-ve-graphite/95 rounded-2xl border p-4.5 flex flex-col justify-between gap-4 transition-all hover:scale-[1.01] ${
                        isUpcoming 
                          ? 'border-sky-900/60 shadow-lg shadow-sky-500/5' 
                          : isWon 
                          ? 'border-emerald-950/80 bg-gradient-to-b from-[#0d131f] to-[#041916]' 
                          : 'border-rose-950/70 bg-gradient-to-b from-[#0d131f] via-[#1a0b12] to-[#10070b] shadow-lg shadow-rose-950/10'
                      }`}
                    >
                      
                      <div className="flex justify-between items-start pb-2.5 border-b border-white/[0.08]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
                            <span className="bg-black/25 px-1.5 py-0.5 border border-white/10 rounded text-white/45">
                              {compactPublicTicketId(pick.id)}
                            </span>
                            <span className="text-sky-400 font-bold uppercase">{pick.bookie}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white/90 font-mono mt-1.5">
                            {cleanCustomerText(pick.title) || "VouchEdge Parlay"}
                          </h4>
                        </div>

                        {isUpcoming ? (
                          <span className="text-[9px] bg-sky-950 text-sky-400 font-bold border border-sky-900 rounded-md px-2 py-0.5 font-mono uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400 animate-pulse" /> PRE-GAME
                          </span>
                        ) : isWon ? (
                          <span className="text-[9.5px] bg-emerald-950/60 text-emerald-400 font-black border border-emerald-900 rounded px-2 py-0.5 font-mono leading-none">
                            WON ✓
                          </span>
                        ) : (
                          <span className="text-[9.5px] bg-rose-950/60 text-rose-300 font-black border border-rose-900 rounded px-2 py-1 font-mono leading-none">
                            LOST ✕
                          </span>
                        )}
                      </div>

                      {/* Legs list */}
                      <div className="space-y-2">
                        {pick.legs.map((leg, lIdx) => {
                          const legWon = leg.status === 'WON';
                          const legLost = leg.status === 'LOST';
                          const playerName = cleanCustomerText(leg.playerName) || "Unknown Player";
                          const spec = cleanCustomerText(leg.spec) || "Player prop";
                          const team = cleanCustomerText(leg.team) || "MLB";
                          const fallbackHeadshot = getFallbackHeadshot(playerName);

                          return (
                            <div
                              key={lIdx}
                              className={`rounded-xl p-2.5 flex items-center justify-between gap-3 text-[10px] font-mono border transition-all ${
                                legWon
                                  ? 'bg-emerald-950/20 border-emerald-900/50'
                                  : legLost
                                  ? 'bg-rose-950/20 border-rose-900/50'
                                  : 'bg-obsidian-900/60 border-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`relative rounded-lg p-[1px] flex-shrink-0 ${
                                  legWon ? 'bg-emerald-500/60' : legLost ? 'bg-rose-500/60' : 'bg-obsidian-700'
                                }`}>
                                  <img
                                    src={leg.headshot || fallbackHeadshot}
                                    alt={`${playerName} headshot`}
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(event) => {
                                      event.currentTarget.onerror = null;
                                      event.currentTarget.src = fallbackHeadshot;
                                    }}
                                    className="w-8 h-8 rounded-lg object-cover bg-black/25 border border-slate-950 flex-shrink-0"
                                  />
                                  <span className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border border-slate-950 flex items-center justify-center text-[9px] font-black ${
                                    legWon
                                      ? 'bg-emerald-500 text-slate-950'
                                      : legLost
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-700 text-white/65'
                                  }`}>
                                    {legWon ? '✓' : legLost ? '×' : '•'}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <h5 className="font-black text-white/90 truncate">
                                    {playerName} <span className="text-[8px] text-white/40 font-bold">({team})</span>
                                  </h5>
                                  <span className="text-[9px] text-white/45 truncate block mt-0.5">
                                    {spec}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <span className="text-[9.5px] font-bold text-white/65">
                                  dec {Number(leg.odds || 1).toFixed(2)}
                                </span>
                                {legWon ? (
                                  <span className="text-[8px] text-emerald-300 font-black block uppercase">✓ HIT</span>
                                ) : legLost ? (
                                  <span className="text-[8px] text-rose-300 font-black block uppercase">✕ Miss</span>
                                ) : (
                                  <span className="text-[8px] text-white/40 font-bold block uppercase">Pending</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Odds metrics */}
                      <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04] grid grid-cols-2 gap-3 items-center">
                        <div>
                          <span className="text-[8px] text-white/40 font-mono block">PRACTICE MULTIPLIER</span>
                          <strong className="text-sm font-black font-mono text-emerald-400">{pick.oddsDisplay}</strong>
                          <span className="text-[8px] text-white/40 font-mono ml-1">({pick.oddsValue.toFixed(2)}x)</span>
                        </div>

                        <div className="text-right font-mono">
                          {isWon ? (
                            <div>
                              <span className="text-[8px] text-emerald-500 block">PRACTICE UNITS</span>
                              <span className="text-xs font-black text-emerald-400">
                                +${(pick.wager * pick.oddsValue).toFixed(0)} (+{(pick.oddsValue - 1).toFixed(1)}U)
                              </span>
                            </div>
                          ) : isLost ? (
                            <div>
                              <span className="text-[8px] text-white/40 block">PRACTICE RESULT</span>
                              <span className="text-xs font-black text-rose-500">
                                -${pick.wager.toFixed(0)} (-1.00U)
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[8px] text-white/40 block">EST. PRACTICE SCORE</span>
                              <span className="text-xs font-bold text-white/65">
                                ${pick.payout.toFixed(0)} @ 100
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Controls */}
                      <div className="flex flex-col gap-2 pt-1 font-mono">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCloneParlayToBoard(pick)}
                            className="flex-1 py-1.5 px-3 bg-obsidian-900 hover:bg-black/30 border border-white/10 text-[10px] font-black rounded-xl text-white/65 hover:text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>TAIL PARLAY</span>
                          </button>

                          <div className="py-1.5 px-2 bg-obsidian-900 text-[10px] rounded-xl border border-white/10 font-bold text-white/45">
                            🎯 {pick.confidence}% Edge
                          </div>
                        </div>

                        {isUpcoming && (
                          <div className="px-2.5 py-1.5 bg-obsidian-900/80 rounded-xl border border-dashed border-white/[0.08] text-[9px] font-bold text-white/40">
                            VERIFIED GRADING PENDING OFFICIAL RESULT SYNC
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* SUB-SECTION 2: COMMUNITY VERIFIED LEDGER */}
      {activeSubTab === 'community' && (
        <div className="space-y-6" id="community-ledger-segment">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">Settled Parlays</span>
              <span className="font-mono text-xl font-black text-white/90 block mt-1">{totalCount}</span>
            </div>
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">Win Record</span>
              <span className="font-mono text-xl font-black text-emerald-400 block mt-1">
                {winsCount}W - {lossesCount}L
              </span>
            </div>
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">Net Practice Units</span>
              <span className={`font-mono text-xl font-black block mt-1 ${totalUnitsProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {totalUnitsProfit >= 0 ? '+' : ''}{totalUnitsProfit.toFixed(2)}U
              </span>
            </div>
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">Verified Hit Rate</span>
              <span className="font-mono text-xl font-black text-sky-400 block mt-1">{realWinRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono pl-1">
              COMMUNITY VERIFIED PARLAY TIMELINE ({filteredCommunityResults.length})
            </h3>

            {filteredCommunityResults.length === 0 ? (
              <div className="py-12 bg-black/25/10 rounded-2xl border border-white/10 text-center font-mono text-xs text-white/40">
                <Medal className="w-5.5 h-5.5 text-white/35 mx-auto mb-2" />
                No verified community outcomes recorded on {selectedDateYMD || 'this timeframe'}.
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredCommunityResults.map((item) => {
                  const isWon = item.result.status === 'WON';
                  return (
                    <div 
                      key={item.id} 
                      className={`bg-ve-graphite/90 border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono ${
                        isWon ? "border-emerald-950/60" : "border-white/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/90 font-black">@{item.displayName}</span>
                          <span className="text-[10px] text-white/40">•</span>
                          <span className="text-[10px] text-slate-450 text-white/45">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-white/65 leading-relaxed font-sans">{item.content}</p>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-white/10 pt-2.5 sm:pt-0 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9.5px] px-2 py-0.5 font-bold rounded ${isWon ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-black/25 text-white border border-white/10"}`}>
                            {item.result.status}
                          </span>
                          <span className="text-xs font-bold text-white/80">@{(item.result as any).odds || item.parlay?.totalOdds || item.vouch?.odds || "+110"} Odds</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black ${isWon ? "text-emerald-400" : "text-rose-500"}`}>
                            {isWon ? `+${item.result.profit?.toFixed(2)}U` : `-${item.result.units.toFixed(2)}U`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-SECTION 3: PERSONAL OUTCOMES LEDGER */}
      {activeSubTab === 'personal' && (
        <div className="space-y-6" id="personal-ledger-segment">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">My Placed Tickets</span>
              <span className="font-mono text-xl font-black text-white/90 block mt-1">{personalTotalCount}</span>
            </div>
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">My Record</span>
              <span className="font-mono text-xl font-black text-emerald-400 block mt-1">
                {personalWinsCount}W - {personalLossesCount}L
              </span>
            </div>
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">Personal Units Profit</span>
              <span className={`font-mono text-xl font-black block mt-1 ${personalUnitsProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {personalUnitsProfit >= 0 ? '+' : ''}{personalUnitsProfit.toFixed(2)}U
              </span>
            </div>
            <div className="bg-ve-storm p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider font-mono">Yield Accuracy</span>
              <span className="font-mono text-xl font-black text-sky-400 block mt-1">{personalWinRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono pl-1">
              MY PERSONAL GRADED LEDGER ({filteredPersonalResults.length})
            </h3>

            {filteredPersonalResults.length === 0 ? (
              <div className="py-12 bg-black/25/15 rounded-2xl border border-white/10 text-center font-mono text-xs text-white/40">
                <ShieldCheck className="w-5.5 h-5.5 text-white/35 mx-auto mb-2" />
                No personal graded parlays recorded for {selectedDateYMD || 'this timeframe'}.
                <p className="text-[10px] text-white/35 mt-1">Upload ticket outcomes in Vouch Board or Home Feed to populate your ledger.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredPersonalResults.map((item) => {
                  const isWon = item.result.status === 'WON';
                  return (
                    <div 
                      key={item.id} 
                      className={`bg-ve-graphite/90 border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono ${
                        isWon ? "border-emerald-950/60" : "border-white/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/90 font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>My Slip Grade</span>
                          </span>
                          <span className="text-[10px] text-white/40">•</span>
                          <span className="text-[10px] text-slate-450 text-white/45">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-white/65 leading-relaxed font-sans">{item.content}</p>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-white/10 pt-2.5 sm:pt-0 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9.5px] px-2 py-0.5 font-bold rounded ${isWon ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-black/25 text-white border border-slate-850"}`}>
                            {item.result.status}
                          </span>
                          <span className="text-xs font-bold text-white/80">@{(item.result as any).odds || item.parlay?.totalOdds || item.vouch?.odds || "+110"} Odds</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black ${isWon ? "text-emerald-400" : "text-rose-500"}`}>
                            {isWon ? `+${item.result.profit?.toFixed(2)}U` : `-${item.result.units.toFixed(2)}U`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </main>
  );
}
