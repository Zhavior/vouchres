import { useEffect, useRef, useState } from 'react';
import { Share2, BadgeCheck, Trophy } from 'lucide-react';
import { Z8_LABEL, Z8_PANEL_PREMIUM } from './LandingTokens';
import { MLB_PLAYER_RECORDS } from '../../data/playerData';
import PreviewCardStage from '../vouch-studio-darkroom/panels/preview/PreviewCardStage';
import { cardStyleConfigs } from '../vouch-studio-darkroom/utils/cardStyleConfigs';
import type { CardLayoutId, CustomPlayerSelection, VouchStudioDarkroomProps } from '../vouch-studio-darkroom/types';

/** Demo roster — mirrors the Vouch Board default preview (Ohtani HR · Judge Hits · Betts Runs). */
const DEMO_SELECTED_PLAYERS: CustomPlayerSelection[] = [
  {
    player: MLB_PLAYER_RECORDS[0],
    statType: 'Homeruns',
    customVal: 'Over 0.5 HRs',
    aiConfidence: 94,
    playerConfidence: 90,
    customExplanation: 'Ohtani pairs an elite launch rate with tonight’s high humidity coefficients.',
  },
  {
    player: MLB_PLAYER_RECORDS[1],
    statType: 'Hits',
    customVal: 'Over 1.5 Hits',
    aiConfidence: 91,
    playerConfidence: 85,
    customExplanation: 'Judge’s target-index velocity points to reliable hard-hit contact.',
  },
  {
    player: MLB_PLAYER_RECORDS[2],
    statType: 'Runs',
    customVal: 'Over 0.5 Runs',
    aiConfidence: 88,
    playerConfidence: 92,
    customExplanation: 'Betts is an elite lead-off catalyst with high Dodger leverage tonight.',
  },
];

const DEMO_PROFILE = {
  displayName: 'user_name',
  username: 'user_name',
  avatarUrl: undefined,
};

const ORBIT_RADIUS = 38;
const noop = () => {};

function calculateOrbitPos(index: number) {
  const count = DEMO_SELECTED_PLAYERS.length;
  if (count <= 1) return { x: 50, y: 50 };
  const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
  return { x: 50 + ORBIT_RADIUS * Math.cos(angle), y: 50 + ORBIT_RADIUS * Math.sin(angle) };
}

const FORMATTED_TODAY = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Read-only clone of the Vouch Board studio state, wired with no-op setters so the real
 *  PrimaryStudioCard renders exactly as it does on the vouch page. */
function makeDemoProps(layout: CardLayoutId): VouchStudioDarkroomProps {
  return {
    profile: DEMO_PROFILE,
    savedVouches: [],
    selectedPlayers: DEMO_SELECTED_PLAYERS,
    setSelectedPlayers: noop,
    cardStyle: 'cyberpunk',
    setCardStyle: noop,
    activeCardLayout: layout,
    setActiveCardLayout: noop,
    potdIndex: 0,
    setPotdIndex: noop,
    customCardPhoto: '',
    setCustomCardPhoto: noop,
    customCardPhotoLabel: '',
    setCustomCardPhotoLabel: noop,
    showWinRate: true,
    setShowWinRate: noop,
    customWinRate: 'Record building',
    setCustomWinRate: noop,
    showDailyWinRate: true,
    setShowDailyWinRate: noop,
    customDailyWinRate: '0 verified picks yet',
    setCustomDailyWinRate: noop,
    showMonthlyWinRate: true,
    setShowMonthlyWinRate: noop,
    customMonthlyWinRate: 'Awaiting verified results',
    setCustomMonthlyWinRate: noop,
    showMlbPicks: true,
    setShowMlbPicks: noop,
    customMlbPicks: '0-0 · Demo preview',
    setCustomMlbPicks: noop,
    showProBadge: true,
    setShowProBadge: noop,
    customProTag: 'VIP GOLD',
    setCustomProTag: noop,
    showUnitsProfit: true,
    setShowUnitsProfit: noop,
    unitsProfitValue: 'Record building',
    setUnitsProfitValue: noop,
    showBestParlay: false,
    setShowBestParlay: noop,
    bestParlayDesc: '',
    setBestParlayDesc: noop,
    showCoupon: false,
    setShowCoupon: noop,
    couponCode: '',
    setCouponCode: noop,
    couponText: '',
    setCouponText: noop,
    reasonsText: 'Velocity coefficients support launch-angle probability models.',
    setReasonsText: noop,
    showCharts: true,
    setShowCharts: noop,
    showLogo: true,
    setShowLogo: noop,
    showReasons: true,
    setShowReasons: noop,
    previewScale: 1,
    setPreviewScale: noop,
    activePreviewCardIndex: 0,
    setActivePreviewCardIndex: noop,
    showSecondCard: false,
    setShowSecondCard: noop,
    postSideways: false,
    setPostSideways: noop,
    isPublishingToFeed: false,
    handlePublishAsFeedPost: noop,
    handleSimulateXPost: noop,
    triggerToast: noop,
    formattedToday: FORMATTED_TODAY,
    calculateOrbitPos,
    handleAddPlayerToCircle: noop,
    handleRemovePlayerFromCircle: noop,
    handleStatTypeChange: noop,
    handleCustomValChange: noop,
    studioSectionPreset: false,
    setStudioSectionPreset: noop,
    studioSectionRoster: false,
    setStudioSectionRoster: noop,
    studioSectionPromo: false,
    setStudioSectionPromo: noop,
    studioSectionRationale: false,
    setStudioSectionRationale: noop,
  };
}

const DEMO_CARDS: Array<{ layout: CardLayoutId; caption: string }> = [
  { layout: 'orbit', caption: 'Correlated circle' },
  { layout: 'potd', caption: 'Spotlight hero' },
  { layout: 'parlay', caption: 'Parlay voucher' },
];

const STUDIO_STYLE = cardStyleConfigs.cyberpunk;

const FEATURES = [
  {
    icon: Share2,
    title: 'Post straight to your feed',
    copy: 'Build a card in the Vouch Board and share it to your feed in one tap — no screenshots, no re-uploading.',
  },
  {
    icon: Trophy,
    title: 'Auto win/loss grading',
    copy: 'Every card settles itself. When your pick hits or misses, it flips to WON or LOST automatically for everyone to see.',
  },
  {
    icon: BadgeCheck,
    title: 'Your name on a verified pick',
    copy: 'Each card carries your handle and the exact verified pick, so your record speaks for itself.',
  },
];

export default function LandingVouchCardShowcase() {
  const [activeLayout, setActiveLayout] = useState<CardLayoutId>('orbit');
  const cardRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    window.clearTimeout(settleTimer.current);
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    el.classList.add('is-tilting');
    el.style.transform = `rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg) scale(1.015)`;
  };

  const handleTiltEnd = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = '';
    // Let the transform ease back to neutral before resuming the idle float,
    // whose keyframes start at neutral — no visible jump.
    settleTimer.current = window.setTimeout(() => el.classList.remove('is-tilting'), 260);
  };

  return (
    <section className={`rounded-2xl ${Z8_PANEL_PREMIUM} p-5 sm:p-8`} aria-labelledby="vouch-card-system-heading">
      <div className="text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>Vouch Card System</p>
        <h2 id="vouch-card-system-heading" className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Turn every pick into a Vouch Card
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Design a card in the Vouch Board, then post it straight to your feed. Cards grade themselves — the
          community sees whether your pick won or lost, tied to your name and the exact verified pick.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan">
              <Icon size={16} strokeWidth={2.25} />
            </div>
            <h3 className="text-sm font-black text-white">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/45">{copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {DEMO_CARDS.map(({ layout, caption }) => (
            <button
              key={layout}
              type="button"
              onClick={() => setActiveLayout(layout)}
              aria-pressed={activeLayout === layout}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest transition ${
                activeLayout === layout
                  ? 'border-vouch-cyan/60 bg-vouch-cyan/10 text-vouch-cyan'
                  : 'border-white/10 bg-black/25 text-white/45 hover:border-vouch-cyan/30 hover:text-white/70'
              }`}
            >
              {caption}
            </button>
          ))}
        </div>

        {/* The real Vouch Board preview stage — same component the studio renders — floating in 3D.
            The card tracks the cursor like a holo trading card, then settles back into its idle float. */}
        <div className="ve-vouch-3d-stage">
          <div
            ref={cardRef}
            onMouseMove={handleTilt}
            onMouseLeave={handleTiltEnd}
            className="ve-vouch-3d-card overflow-hidden rounded-2xl border border-white/[0.06]"
          >
            <PreviewCardStage {...makeDemoProps(activeLayout)} activeStyle={STUDIO_STYLE} />
          </div>
        </div>
      </div>
    </section>
  );
}
