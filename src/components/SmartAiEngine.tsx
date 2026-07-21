import { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Database,
  CheckCircle2,
  Award,
  Gauge,
  Lock,
  Unlock,
  Crown,
} from 'lucide-react';
import { VAI_PERSONAS, type VaiPersonaId } from '../lib/vai/vaiPersonas';
import { getDailyVaiPersona, getVaiEntitlements } from '../lib/vai/vaiEntitlements';

import { MLBPlayer, FeedPost } from '../types';
import type { CanonicalParlaySlip } from '../lib/parlays/parlayBridge';
import { SmartAiDeepResearchPanel } from './smart-ai/SmartAiDeepResearchPanel';
import { VaiParlayCommandDeck } from './smart-ai/VaiParlayCommandDeck';
import JudgePixelIcon from './judges/JudgePixelIcon';
import { useSmartAiCandidates } from './smart-ai/useSmartAiCandidates';
import type { RealCandidate } from './smart-ai/smartAiEngine.logic';

import {
  Z8_DISPLAY,
  Z8_EMERALD,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
  Z8_WARNING,
  Z8_ACTIVE,
  Z8_SURFACE,
} from '../theme/z8Tokens';

/**
 * V.A.I Research Command Center.
 *
 * Truth rules:
 *   - Every candidate comes from the validated HR board pipeline (real MLB
 *     season stats, probable pitchers, sourced park factors). Nothing is
 *     generated client-side to fill gaps.
 *   - Missing data renders as an explicit warning, never a fabricated value.
 *   - Model probability estimates are labeled as estimates — they are not
 *     sportsbook odds and are never saved as market prices.
 */

interface SmartAiEngineProps {
  onSectionChange: (section: string) => void;
  onAddLegToParlay: (
    player: MLBPlayer,
    prop: { id: string; market: string; odds: number | null; spec: string; gamePk?: string | number; playerId?: number | string }
  ) => void;
  onSaveVouch: (vouchItem: unknown) => void;
  onPostCreated?: (newPost: FeedPost) => void;
  onSaveParlay?: (parlay: CanonicalParlaySlip) => void;
  liveGames?: any[];
}


export default function SmartAiEngine({
  onSectionChange,
}: SmartAiEngineProps) {
  const [aiAgreementAccepted, setAiAgreementAccepted] = useState(false);
  const { realCandidates, candidatesLoading } = useSmartAiCandidates();

  // V.A.I Rooms shell: frontend/dev adapter for now.
  // Final paid access enforcement should move to the server route.
  const vaiTodayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [vaiAccessTier, setVaiAccessTier] = useState<string>(() => {
    if (typeof window === 'undefined') return 'pro';
    return window.localStorage.getItem('vouchedge_vai_tier') ?? 'pro';
  });

  const handleVaiAccessTierChange = (tier: string) => {
    setVaiAccessTier(tier);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vouchedge_vai_tier', tier);
    }
  };

  const vaiEntitlements = useMemo(
    () => getVaiEntitlements({ tier: vaiAccessTier, dateKey: vaiTodayKey }),
    [vaiAccessTier, vaiTodayKey]
  );

  const [selectedVaiPersonaId, setSelectedVaiPersonaId] = useState<VaiPersonaId>(() =>
    getDailyVaiPersona(vaiTodayKey)
  );

  useEffect(() => {
    if (
      vaiEntitlements.allowedPersonaIds.length > 0 &&
      !vaiEntitlements.allowedPersonaIds.includes(selectedVaiPersonaId)
    ) {
      setSelectedVaiPersonaId(vaiEntitlements.allowedPersonaIds[0]);
    }
  }, [selectedVaiPersonaId, vaiEntitlements.allowedPersonaIds]);

  const selectedVaiPersona =
    VAI_PERSONAS.find((persona) => persona.id === selectedVaiPersonaId) ?? VAI_PERSONAS[0];

  const isSelectedVaiRoomUnlocked = vaiEntitlements.allowedPersonaIds.includes(selectedVaiPersona.id);

  // Real header stats — computed from today's actual board, never hardcoded.
  const boardStats = useMemo(() => {
    const confirmed = realCandidates.filter((c) => String(c.lineupStatus ?? '').toLowerCase() === 'confirmed').length;
    const games = new Set(realCandidates.map((c) => c.gamePk)).size;
    const confidences = realCandidates
      .map((c) => c.dataConfidence)
      .filter((v): v is number => typeof v === 'number');
    const avgConfidence = confidences.length
      ? Math.round(confidences.reduce((sum, v) => sum + v, 0) / confidences.length)
      : null;
    return { total: realCandidates.length, confirmed, games, avgConfidence };
  }, [realCandidates]);

  const usingProjectedPreview = useMemo(
    () =>
      realCandidates.length > 0 &&
      realCandidates.every((c) => String(c.lineupStatus ?? '').toLowerCase() !== 'confirmed'),
    [realCandidates],
  );

  const handleAddCandidateToSlip = (_candidate: RealCandidate) => {
    alert('Verified candidates are research inputs only. To protect AI Made Parlay records, save a full locked V.A.I parlay instead of adding single AI legs to the manual builder.');
  };

  // Safe redirect to Player Research Console with the real MLB player id.
  const handleOpenResearch = (candidate: RealCandidate) => {
    try {
      localStorage.setItem('vouchedge_selected_research_player_id', String(candidate.playerId));
    } catch {
      // ignore storage failures
    }
    onSectionChange('research');
  };

  if (!aiAgreementAccepted) {
    return (
      <main className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} mx-auto max-w-none animate-fade-in`} id="smart-ai-agreement-gate">
        <div className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-[2rem] p-6 sm:p-8`}>
          <div className="relative space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-vouch-cyan/25 bg-vouch-cyan/10 p-3">
                <Award className="h-6 w-6 text-vouch-cyan" />
              </div>
              <div className={`${Z8_SECTION_HEADER} space-y-2`}>
                <p className={`${Z8_LABEL} text-vouch-cyan`}>
                  V.A.I Locked AI Made Parlays
                </p>
                <h1 className={Z8_DISPLAY}>
                  Research tool only — not betting advice.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-white/45">
                  V.A.I generates locked AI Made Parlays from available research signals. These picks can be wrong, player
                  status can change, odds are not guaranteed, and sportsbook markets may differ. Use this as research support,
                  verify every leg yourself, and never risk money you cannot afford to lose.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className={Z8_STAT_CHIP}>
                <CheckCircle2 className={`mb-3 h-5 w-5 ${Z8_EMERALD}`} />
                <h3 className="text-sm font-black text-white">Locked separation</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  AI Made Parlays stay separate from manual ParlayOS slips.
                </p>
              </div>
              <div className={Z8_STAT_CHIP}>
                <Database className="mb-3 h-5 w-5 text-vouch-cyan" />
                <h3 className="text-sm font-black text-white">Research inputs</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  Candidate boards are informational and must be verified before use.
                </p>
              </div>
              <div className={Z8_STAT_CHIP}>
                <Gauge className="mb-3 h-5 w-5 text-vouch-cyan/80" />
                <h3 className="text-sm font-black text-white">No guarantees</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  Model confidence is not a promise, price, sportsbook line, or financial recommendation.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-vouch-amber/25 bg-vouch-amber/10 p-4 text-xs leading-relaxed text-vouch-amber/90">
              By unlocking V.A.I, you understand that this feature is for sports research and entertainment only. You are
              responsible for your own choices and local rules.
            </div>

            <button
              type="button"
              onClick={() => setAiAgreementAccepted(true)}
              className="w-full rounded-2xl border border-vouch-cyan/40 bg-vouch-cyan/15 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-vouch-cyan/25 active:scale-[0.99]"
            >
              I Understand — Unlock V.A.I
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} mx-auto max-w-none animate-fade-in`} id="smart-ai-ledger-root">

      {/* HEADER HERO AREA */}
      <header className={`${Z8_PANEL_PREMIUM} relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] p-6 sm:p-8 md:flex-row md:items-center`} id="ai-banner-container">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-vouch-cyan/5 blur-[120px] pointer-events-none" />

        <div className={`${Z8_SECTION_HEADER} min-w-0 flex-1`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${Z8_LABEL} rounded-full border border-vouch-emerald/30 bg-vouch-emerald/10 px-3 py-0.5 text-vouch-emerald`}>
              Verified MLB data only
            </span>
            <span className={`${Z8_LABEL} rounded-full border border-white/10 bg-black/35 px-2.5 py-0.5 text-white/45`}>
              {candidatesLoading ? 'Loading board...' : `${boardStats.total} candidates today`}
            </span>
          </div>
          <h1 className={`${Z8_DISPLAY} mt-2 flex items-center gap-3`}>
            <Cpu className="h-8 w-8 animate-pulse text-vouch-cyan" />
            V.A.I <span className="text-vouch-cyan">Research Command Center</span>
          </h1>
          <p className="max-w-3xl text-sm text-white/45">
            Explore V.A.I research rooms and today&apos;s validated hitter board. Build locked parlays in{' '}
            <button
              type="button"
              onClick={() => onSectionChange('ai_pilot')}
              className="font-bold text-vouch-cyan underline-offset-2 hover:underline"
            >
              V.A.I Dynamic Creator
            </button>
            . Every signal comes from real MLB season stats — missing data is flagged, never invented.
          </p>
          <div className="z8-accent-line mt-2 w-full max-w-md" />
        </div>
      </header>

      <div className="space-y-6">
      {/* V.A.I ROOMS — one-page locked/unlocked room selector */}
      <section className={`${Z8_PANEL_PREMIUM} rounded-[2rem] p-4 sm:p-5`} id="vai-rooms-command-deck">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className={Z8_SECTION_HEADER}>
            <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}>
              <Crown className="h-3.5 w-3.5" />
              V.A.I Rooms
            </div>
            <h2 className={`${Z8_DISPLAY} mt-1 text-xl sm:text-2xl`}>
              Choose today&apos;s AI research room
            </h2>
            <p className="max-w-3xl text-xs text-white/45 sm:text-sm">
              All four rooms are visible. Pro unlocks one room per day. Research Seller Pro unlocks the full AI desk.
            </p>
          </div>

          <div className={`${Z8_STAT_CHIP} text-xs text-white/70`}>
            <span className={`${Z8_LABEL} text-white/45`}>Access</span>
            <div className="font-bold text-white">{vaiEntitlements.reason}</div>

            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="V.A.I access preview">
              {[
                ['free', 'Free'],
                ['pro', 'Pro'],
                ['research_seller_pro', 'Seller Pro'],
                ['admin', 'Admin'],
              ].map(([tier, label]) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleVaiAccessTierChange(tier)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                    vaiAccessTier === tier
                      ? Z8_ACTIVE
                      : 'border border-white/10 bg-black/30 text-white/45 hover:border-vouch-cyan/45 hover:bg-vouch-cyan/8 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {VAI_PERSONAS.map((persona) => {
            const unlocked = vaiEntitlements.allowedPersonaIds.includes(persona.id);
            const selected = selectedVaiPersonaId === persona.id;

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setSelectedVaiPersonaId(persona.id)}
                className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 ${
                  selected ? 'ring-2 ring-vouch-cyan shadow-2xl bg-vouch-cyan/10' : 'hover:border-vouch-cyan/45 hover:bg-vouch-cyan/8'
                }`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <JudgePixelIcon code={persona.judgeCode} size="sm" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                          {persona.judgeCode} · {persona.accent}
                        </div>
                        <h3 className="mt-1 text-lg font-black text-white">{persona.name}</h3>
                      </div>
                    </div>

                    <div className={`rounded-2xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      unlocked
                        ? 'border-vouch-emerald/40 bg-vouch-emerald/10 text-vouch-emerald'
                        : 'border-white/10 bg-black/40 text-white/45'
                    }`}>
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1"><Unlock className="h-3 w-3" /> Open</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>
                      )}
                    </div>
                  </div>

                  <p className="min-h-[44px] text-xs leading-relaxed text-white/70">
                    {persona.specialtyLine}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {persona.specialties.slice(0, 4).map((specialty) => (
                      <span
                        key={`${persona.id}-${specialty}`}
                        className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold text-white/70"
                      >
                        {specialty.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-3 text-[11px] text-white/45">
                    <span className="font-bold text-white">{persona.roomName}</span>
                    <span className="mx-1">·</span>
                    <span>{unlocked ? 'Tap to enter today.' : persona.lockedLine}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className={`${Z8_PANEL_PREMIUM} rounded-[2rem] p-4 sm:p-5`} id="vai-selected-room-panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={`${Z8_LABEL} text-white/45`}>
              Selected room
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">{selectedVaiPersona.name}</h2>
            <p className="mt-1 text-sm text-white/45">{selectedVaiPersona.toneLine}</p>
          </div>

          <div className={`w-fit rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wider ${
            isSelectedVaiRoomUnlocked
              ? 'border-vouch-emerald/40 bg-vouch-emerald/10 text-vouch-emerald'
              : 'border-white/10 bg-black/40 text-white/45'
          }`}>
            {isSelectedVaiRoomUnlocked ? 'Room open today' : 'Upgrade to unlock'}
          </div>
        </div>

        {isSelectedVaiRoomUnlocked ? (
          <div className="space-y-6">
            <VaiParlayCommandDeck
              persona={selectedVaiPersona}
              candidates={realCandidates}
              loading={candidatesLoading}
              usingProjectedPreview={usingProjectedPreview}
            />

            <div id="ai-deep-research-column">
              <SmartAiDeepResearchPanel
                candidates={realCandidates}
                loading={candidatesLoading}
                onAddToSlip={handleAddCandidateToSlip}
                onOpenResearch={handleOpenResearch}
              />
            </div>
          </div>
        ) : (
          <div className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center`} id="vai-locked-room-upgrade-panel">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-black/60 shadow-2xl shadow-black/40">
              <Lock className="h-7 w-7 text-white/70" />
            </div>
            <div className="mx-auto max-w-xl space-y-2">
              <div className={`${Z8_LABEL} text-white/45`}>
                {selectedVaiPersona.roomName} sealed
              </div>
              <h3 className="text-2xl font-black text-white">{selectedVaiPersona.lockedLine}</h3>
              <p className="text-sm leading-relaxed text-white/45">
                You can see the room identity, specialty, and risk style, but the actual slips, player names,
                and research receipts stay hidden until this room is unlocked.
              </p>
            </div>
            <button
              type="button"
              className="mt-5 rounded-2xl border border-vouch-cyan/40 bg-vouch-cyan/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-vouch-cyan hover:bg-vouch-cyan/20"
              onClick={() => onSectionChange('pricing')}
            >
              Upgrade to enter room
            </button>
          </div>
        )}
      </div>
      </div>

    </main>
  );
}
