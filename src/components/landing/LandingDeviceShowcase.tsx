import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Repeat2, Search, ShieldCheck, Share, Feather } from 'lucide-react';
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
              active === slide ? 'w-6 bg-vouch-emerald' : 'w-1.5 bg-white/20 hover:bg-white/35'
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

/* ── Static iPhone mockup screens ────────────────────────────────────── */

function MockAvatar({ initials, accent = 'cyan' }: { initials: string; accent?: 'cyan' | 'emerald' | 'amber' }) {
  const bg = accent === 'emerald' ? 'bg-vouch-emerald/20 text-vouch-emerald' : accent === 'amber' ? 'bg-vouch-amber/20 text-vouch-amber' : 'bg-vouch-cyan/20 text-vouch-cyan';
  return <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${bg}`}>{initials}</div>;
}

function MockFeedPost({ initials, name, handle, content, accent, likes, vouches, comments }: {
  initials: string; name: string; handle: string; content: string; accent?: 'cyan' | 'emerald' | 'amber';
  likes: number; vouches: number; comments: number;
}) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex gap-3">
        <MockAvatar initials={initials} accent={accent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-extrabold text-white">{name}</span>
            <span className="text-[11px] text-white/30">@{handle}</span>
          </div>
          <p className="mt-1 text-[12px] leading-[1.4] text-white/65">{content}</p>
          <div className="mt-2 flex items-center gap-5 text-[10px] text-white/25">
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{comments}</span>
            <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{vouches}</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockHomeFeed() {
  return (
    <div className="flex min-h-full flex-col bg-obsidian-900 font-z8 text-white">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-obsidian-900/90 backdrop-blur-md">
        <div className="flex h-[46px] items-center justify-between px-4">
          <span className="text-[17px] font-extrabold">Home</span>
          <div className="flex items-center gap-1">
            <Search className="h-4 w-4 text-white/40" />
            <Feather className="ml-1 h-4 w-4 text-white/40" />
          </div>
        </div>
      </header>
      <div className="flex gap-0 border-b border-white/[0.06]">
        {['For You', 'Following', 'MLB'].map((tab, i) => (
          <button key={tab} type="button" className={`flex-1 py-2.5 text-center text-[11px] font-bold ${i === 0 ? 'border-b-2 border-vouch-cyan text-vouch-cyan' : 'text-white/35'}`}>{tab}</button>
        ))}
      </div>
      <MockFeedPost initials="SP" name="sharp_props" handle="sharp_props" content="Twins lineup confirmed. Buxton cleanup tonight — launch angle data is screaming." accent="emerald" likes={24} vouches={8} comments={5} />
      <MockFeedPost initials="VE" name="VouchEdge AI" handle="ve_data_scout" content="HR Board alert: 3 Elite-tier candidates just moved to confirmed lineups." accent="cyan" likes={41} vouches={14} comments={9} />
      <MockFeedPost initials="MR" name="momentum_read" handle="momentum_read" content="CHC @ CIN run environment 82/100. Park factor + bullpen fatigue = value." accent="amber" likes={18} vouches={6} comments={3} />
      <MockFeedPost initials="JK" name="jake_capper" handle="jakecapper" content="2-leg parlay locked: Buxton HR + Twins ML. Card posted to the board." likes={32} vouches={11} comments={7} />
    </div>
  );
}

function MockProfilePage() {
  return (
    <div className="flex min-h-full flex-col bg-obsidian-900 font-z8 text-white">
      <div className="relative h-24 bg-gradient-to-r from-sky-600/25 to-indigo-600/25">
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/50 to-transparent" />
        <div className="absolute -bottom-8 left-4 z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-vouch-cyan/40 bg-obsidian-900 text-lg font-black text-vouch-cyan shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          VE
        </div>
      </div>
      <div className="px-4 pt-10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold">VouchEdge Pro</span>
          <span className="flex items-center gap-0.5 rounded-full border border-vouch-emerald/25 bg-vouch-emerald/10 px-1.5 py-0.5 text-[8px] font-bold text-vouch-emerald">
            <ShieldCheck className="h-2.5 w-2.5" /> PRO
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-white/35">@vouchedge_pro</p>
        <div className="mt-2 flex gap-4 text-[10px] text-white/40">
          <span><strong className="text-white/80">247</strong> followers</span>
          <span><strong className="text-white/80">89</strong> following</span>
          <span><strong className="text-white/80">31</strong> friends</span>
        </div>
        <p className="mt-2.5 text-[11px] leading-[1.4] text-white/50">Trust-first MLB research. Every pick graded, every miss shown.</p>
      </div>

      <div className="flex border-y border-white/[0.06]">
        {['Posts', 'Results', 'Vouches'].map((tab, i) => (
          <button key={tab} type="button" className={`flex-1 py-2 text-center text-[10px] font-bold ${i === 0 ? 'border-b-2 border-vouch-cyan text-vouch-cyan' : 'text-white/30'}`}>{tab}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {[
          { label: 'Win Rate', value: '64%', sub: 'Verified' },
          { label: 'MLB Record', value: '42-24', sub: 'Season' },
          { label: 'ROI', value: '+18.2u', sub: 'Tracked' },
          { label: 'Streak', value: 'W5', sub: 'Current' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <div className="text-[8px] font-bold uppercase tracking-wider text-white/25">{s.label}</div>
            <div className="mt-0.5 text-[14px] font-black tabular-nums text-white">{s.value}</div>
            <div className="text-[8px] text-white/20">{s.sub}</div>
          </div>
        ))}
      </div>

      <MockFeedPost initials="VP" name="VouchEdge Pro" handle="vouchedge_pro" content="Tonight's 3-leg locked and posted. Full rationale on the card." accent="cyan" likes={28} vouches={9} comments={4} />
    </div>
  );
}

const IPHONE_SLIDES = ['feed', 'profile', 'card'] as const;
type IPhoneSlide = (typeof IPHONE_SLIDES)[number];
const IPHONE_LABELS: Record<IPhoneSlide, string> = { feed: 'Home Feed', profile: 'Your Profile', card: 'Vouch Card' };
const IPHONE_CYCLE_MS = 6000;

function IPhoneFrame() {
  const [active, setActive] = useState<IPhoneSlide>('feed');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((s) => IPHONE_SLIDES[(IPHONE_SLIDES.indexOf(s) + 1) % IPHONE_SLIDES.length]);
    }, IPHONE_CYCLE_MS);
  }, []);

  useEffect(() => {
    startCycle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCycle]);

  const pickSlide = useCallback((slide: IPhoneSlide) => {
    setActive(slide);
    startCycle();
  }, [startCycle]);

  return (
    <div className="ve-device-iphone">
      <div className="ve-device-iphone-frame">
        <div className="ve-device-iphone-island" />
        <div className="ve-device-iphone-screen">
          <div className="ve-device-screen-content ve-device-scale-wrapper">
            <div className="ve-device-scale-inner ve-device-scale-iphone pointer-events-none select-none" style={{ position: 'relative', height: '100%' }}>
              {IPHONE_SLIDES.map((slide) => (
                <div
                  key={slide}
                  style={{
                    background: '#0a0a0f',
                    position: slide === 'feed' ? 'relative' : 'absolute',
                    inset: slide === 'feed' ? undefined : 0,
                    opacity: active === slide ? 1 : 0,
                    zIndex: active === slide ? 2 : 1,
                    transition: 'opacity 0.8s ease-in-out',
                  }}
                >
                  {slide === 'feed' && <MockHomeFeed />}
                  {slide === 'profile' && <MockProfilePage />}
                  {slide === 'card' && <PreviewCardStage {...makeDemoProps('orbit')} activeStyle={STUDIO_STYLE} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {IPHONE_SLIDES.map((slide) => (
          <button
            key={slide}
            type="button"
            onClick={() => pickSlide(slide)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              active === slide ? 'w-5 bg-vouch-cyan' : 'w-1.5 bg-white/20 hover:bg-white/35'
            }`}
            aria-label={IPHONE_LABELS[slide]}
          />
        ))}
      </div>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-white/25">
        {IPHONE_LABELS[active]}
      </p>
    </div>
  );
}

export default function LandingDeviceShowcase() {
  return (
    <section className="py-8 sm:py-16">
      <div className="mb-10 text-center sm:mb-16">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>Inside VouchEdge</p>
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
        </div>
      </div>
    </section>
  );
}
