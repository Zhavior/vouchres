import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Z8_LABEL } from './LandingTokens';
import PreviewCardStage from '../vouch-studio-darkroom/panels/preview/PreviewCardStage';
import { cardStyleConfigs } from '../vouch-studio-darkroom/utils/cardStyleConfigs';
import { MLB_PLAYER_RECORDS } from '../../data/playerData';
import { warmGuestHrBoardCache } from '../../lib/boot/guestHrBoardWarmCache';
import type { CardLayoutId, CustomPlayerSelection, VouchStudioDarkroomProps } from '../vouch-studio-darkroom/types';

const HomeRunIntelligencePage = lazy(() => import('../../features/hr/pages/HomeRunIntelligencePage'));
const TodayDashboard = lazy(() => import('../TodayDashboard'));

const noop = () => {};
const ORBIT_RADIUS = 38;
const CYCLE_MS = 8000;

function calculateOrbitPos(index: number) {
  const count = 3;
  if (count <= 1) return { x: 50, y: 50 };
  const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
  return { x: 50 + ORBIT_RADIUS * Math.cos(angle), y: 50 + ORBIT_RADIUS * Math.sin(angle) };
}

const DEMO_PLAYERS: CustomPlayerSelection[] = [
  {
    player: MLB_PLAYER_RECORDS[0],
    statType: 'Homeruns',
    customVal: 'Over 0.5 HRs',
    aiConfidence: 94,
    playerConfidence: 90,
    customExplanation: 'Elite launch rate meets high humidity coefficients.',
  },
  {
    player: MLB_PLAYER_RECORDS[1],
    statType: 'Hits',
    customVal: 'Over 1.5 Hits',
    aiConfidence: 91,
    playerConfidence: 85,
    customExplanation: 'Target-index velocity points to reliable contact.',
  },
  {
    player: MLB_PLAYER_RECORDS[2],
    statType: 'Runs',
    customVal: 'Over 0.5 Runs',
    aiConfidence: 88,
    playerConfidence: 92,
    customExplanation: 'Elite lead-off catalyst with high leverage tonight.',
  },
];

const FORMATTED_TODAY = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function makeDemoProps(layout: CardLayoutId): VouchStudioDarkroomProps {
  return {
    profile: { displayName: 'user_name', username: 'user_name', avatarUrl: undefined },
    savedVouches: [],
    selectedPlayers: DEMO_PLAYERS,
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

const STUDIO_STYLE = cardStyleConfigs.cyberpunk;

const SLIDES = ['hr', 'home'] as const;
type Slide = (typeof SLIDES)[number];

const SLIDE_LABELS: Record<Slide, string> = {
  hr: 'Home Run Intelligence',
  home: 'Command Center',
};

function MacBookSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#00ff94]" />
    </div>
  );
}

function MacBookFrame() {
  const [active, setActive] = useState<Slide>('hr');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    warmGuestHrBoardCache();
  }, []);

  const startCycle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((s) => (s === 'hr' ? 'home' : 'hr'));
    }, CYCLE_MS);
  }, []);

  useEffect(() => {
    startCycle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCycle]);

  const pickSlide = useCallback((slide: Slide) => {
    setActive(slide);
    startCycle();
  }, [startCycle]);

  return (
    <div className="ve-device-macbook">
      <div className="ve-device-macbook-lid">
        <div className="ve-device-macbook-notch" />
        <div className="ve-device-macbook-screen">
          <div className="ve-device-screen-content ve-device-scale-wrapper">
            <div className="ve-device-scale-inner ve-device-scale-macbook">
              <div className="pointer-events-none select-none" style={{ position: 'relative', height: '100%', background: '#000' }}>
                <Suspense fallback={<MacBookSkeleton />}>
                  <div
                    style={{
                      background: '#0a0a0f',
                      position: 'absolute',
                      inset: 0,
                      opacity: active === 'hr' ? 1 : 0,
                      zIndex: active === 'hr' ? 2 : 1,
                      transition: 'opacity 1s ease-in-out',
                    }}
                  >
                    <HomeRunIntelligencePage />
                  </div>
                  <div
                    style={{
                      background: '#0a0a0f',
                      position: 'absolute',
                      inset: 0,
                      opacity: active === 'home' ? 1 : 0,
                      zIndex: active === 'home' ? 2 : 1,
                      transition: 'opacity 1s ease-in-out',
                    }}
                  >
                    <TodayDashboard onSectionChange={noop} />
                  </div>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="ve-device-macbook-base" />

      {/* Slide indicator dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((slide) => (
          <button
            key={slide}
            type="button"
            onClick={() => pickSlide(slide)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              active === slide ? 'w-6 bg-[#00ff94]' : 'w-1.5 bg-white/20 hover:bg-white/35'
            }`}
            aria-label={SLIDE_LABELS[slide]}
          />
        ))}
      </div>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-white/25">
        {SLIDE_LABELS[active]}
      </p>
    </div>
  );
}

function IPhoneFrame() {
  return (
    <div className="ve-device-iphone">
      <div className="ve-device-iphone-frame">
        <div className="ve-device-iphone-island" />
        <div className="ve-device-iphone-screen">
          <div className="ve-device-screen-content ve-device-scale-wrapper">
            <div className="ve-device-scale-inner ve-device-scale-iphone pointer-events-none select-none">
              <PreviewCardStage {...makeDemoProps('orbit')} activeStyle={STUDIO_STYLE} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingDeviceShowcase() {
  return (
    <section className="py-8 sm:py-16">
      <div className="mb-10 text-center sm:mb-16">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>Inside the Terminal</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Research it. Post it.<br />
          <span className="bg-gradient-to-r from-vouch-cyan to-vouch-emerald bg-clip-text text-transparent">
            Prove it.
          </span>
        </h2>
      </div>

      <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:items-end sm:gap-16 lg:gap-24">
        <div className="w-full max-w-[640px] sm:w-auto">
          <MacBookFrame />
        </div>
        <div className="w-full max-w-[200px] sm:w-auto">
          <IPhoneFrame />
          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-widest text-white/25">
            Your Vouch Card
          </p>
        </div>
      </div>
    </section>
  );
}
