import { Share2, BadgeCheck, Trophy } from 'lucide-react';
import { Z8_LABEL, Z8_PANEL_PREMIUM } from './LandingTokens';
import { MLB_PLAYER_RECORDS } from '../../data/playerData';
import PrimaryStudioCard from '../vouch-studio-darkroom/panels/preview/PrimaryStudioCard';
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
  displayName: 'ZHAVIOR',
  username: 'user_7133c107d7a0',
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
        <div className="mb-3 flex items-center justify-between">
          <p className={`${Z8_LABEL} text-vouch-cyan`}>Feed-ready cards</p>
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">Swipe to browse</span>
        </div>
        <div className="ve-vouch-card-strip flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4">
          {DEMO_CARDS.map(({ layout, caption }) => (
            <figure key={layout} className="flex shrink-0 snap-center flex-col items-center">
              <div className="pointer-events-none select-none" aria-hidden="true" style={{ zoom: 0.68 }}>
                <div className="w-[420px]">
                  <PrimaryStudioCard {...makeDemoProps(layout)} activeStyle={STUDIO_STYLE} />
                </div>
              </div>
              <figcaption className="mt-2 text-center font-mono text-[9px] uppercase tracking-widest text-white/35">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
