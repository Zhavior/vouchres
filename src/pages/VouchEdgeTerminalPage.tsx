import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthModal from '../components/auth/AuthModal';

type TerminalView = 'ledger' | 'matchup' | 'props' | 'profile' | 'money';
type SignupPlan = 'free' | 'pro' | 'capper';

const matchups = [
  { id: 1, away: 'NYY', home: 'LAD', awayOdds: '-122', homeOdds: '+110', time: 'LIVE' },
  { id: 2, away: 'PHI', home: 'ATL', awayOdds: '+105', homeOdds: '-125', time: '19:05' },
  { id: 3, away: 'HOU', home: 'TEX', awayOdds: '-140', homeOdds: '+120', time: '20:10' },
  { id: 4, away: 'CHC', home: 'MIL', awayOdds: '+130', homeOdds: '-150', time: '20:10' },
  { id: 5, away: 'BOS', home: 'BAL', awayOdds: '+115', homeOdds: '-135', time: '21:30' },
];

const pricingPlans: Array<{
  id: SignupPlan;
  name: string;
  price: string;
  descriptor: string;
  bullets: string[];
  featured?: boolean;
}> = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    descriptor: 'Start the terminal',
    bullets: ['Public ledger', 'Daily slate preview', 'Community vouch actions'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99 USD',
    descriptor: 'Research command',
    bullets: ['All Pro Labs', 'Signal graphs', 'Verified profile tools'],
    featured: true,
  },
  {
    id: 'capper',
    name: 'Capper',
    price: '$34.99 USD',
    descriptor: 'Monetize proof',
    bullets: ['Everything in Pro', 'Subscriber club tools', 'Creator storefront'],
  },
];

function useLiveTerminal() {
  const [data, setData] = useState({ confidence: 84.2, line: -115, latency: 14 });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setData((prev) => ({
        confidence: Number((prev.confidence + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        latency: Math.floor(Math.random() * 7) + 12,
        line: Math.random() > 0.9 ? prev.line - 1 : prev.line,
      }));
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  return data;
}

function Ticker() {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full overflow-hidden border-t border-white/10 bg-[#0A0A0A]/95 py-2 shadow-[0_-18px_40px_rgba(10,10,10,0.75)] backdrop-blur">
      <motion.div
        animate={{ x: '-50%' }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="flex gap-12 whitespace-nowrap"
      >
        {[1, 2].map((i) => (
          <span key={i} className="font-mono text-[9px] uppercase tracking-widest text-white/40">
            MLB_LIVE: NYY (-122) @ LAD (+110) // VOUCH_ALERT: @ALPHA_QUANT VOUCHED PHI ML // SYSTEM_STABLE //
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function TerminalCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#161616] shadow-2xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
      {children}
    </div>
  );
}

function DataPoint({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-r border-white/5 p-4">
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</span>
      <span className={`truncate font-mono text-lg font-bold sm:text-xl ${active ? 'text-[#00E5FF]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function VouchButton() {
  const [vouched, setVouched] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setVouched(true)}
      className={`shrink-0 border px-3 py-1 font-mono text-[9px] font-bold uppercase transition-all ${
        vouched
          ? 'border-[#00E5FF] bg-[#00E5FF] text-black'
          : 'border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black'
      }`}
    >
      {vouched ? 'Vouched' : '+ Vouch'}
    </button>
  );
}

function DailySlate({ onSelect, selectedId }: { onSelect: (id: number) => void; selectedId: number }) {
  return (
    <div className="overflow-hidden border border-white/5 bg-[#0A0A0A] font-mono text-[10px]">
      <div className="grid grid-cols-4 border-b border-white/10 bg-white/5 p-2 uppercase tracking-widest text-white/40">
        <span className="col-span-2">Matchup</span>
        <span>Odds</span>
        <span className="text-right">Time</span>
      </div>
      <div className="max-h-[200px] divide-y divide-white/5 overflow-y-auto">
        {matchups.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`grid w-full cursor-pointer grid-cols-4 items-center p-3 text-left transition-colors ${
              selectedId === m.id ? 'border-l-2 border-[#00E5FF] bg-[#00E5FF]/10' : 'hover:bg-white/[0.02]'
            }`}
          >
            <span className="col-span-2 flex items-center gap-2">
              <span className="font-bold text-white">{m.away}</span>
              <span className="text-white/20">@</span>
              <span className="font-bold text-white">{m.home}</span>
            </span>
            <span className="flex flex-col text-white/60">
              <span>{m.awayOdds}</span>
              <span>{m.homeOdds}</span>
            </span>
            <span className={`text-right ${m.time === 'LIVE' ? 'animate-pulse text-[#00E5FF]' : 'text-white/40'}`}>
              {m.time}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VouchLedger() {
  return (
    <div className="w-full space-y-2 font-mono text-[10px]">
      {['ALPHA_QUANT', 'SHARP_BETTOR', 'DATA_MINER'].map((user) => (
        <div key={user} className="flex items-center justify-between gap-3 border-b border-white/5 p-2">
          <span className="text-white/80">@{user}</span>
          <span className="font-bold text-[#00E5FF]">NYY ML</span>
          <VouchButton />
        </div>
      ))}
    </div>
  );
}

function MatchupIntelligence() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-[8px] uppercase text-[#00E5FF]">Zone_Matrix</div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`aspect-square border border-white/5 ${i === 4 ? 'bg-[#00E5FF]/20' : ''}`} />
          ))}
        </div>
      </div>
      <div className="flex h-24 items-end gap-1 border border-white/10 bg-white/5 p-4">
        {[40, 70, 45, 90, 65].map((h, i) => (
          <div key={i} className="flex-1 bg-[#00E5FF]/40" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function PropTerminal() {
  return (
    <div className="space-y-2 font-mono text-[10px]">
      {[
        { player: 'A. JUDGE', edge: '+4.2%' },
        { player: 'S. OHTANI', edge: '+2.8%' },
      ].map((item) => (
        <div key={item.player} className="flex items-center justify-between gap-3 border-b border-white/5 p-2">
          <span className="text-white">{item.player}</span>
          <span className="font-bold text-[#00E5FF]">{item.edge}</span>
          <VouchButton />
        </div>
      ))}
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className="space-y-4 font-mono text-[10px]">
      <div className="flex items-center justify-between border border-[#00E5FF]/20 bg-[#00E5FF]/10 p-4">
        <div>
          <div className="text-sm font-bold uppercase text-white">@EDGE_ANALYST</div>
          <div className="text-[8px] uppercase tracking-widest text-[#00E5FF]">Identity_Verified</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] uppercase text-white/20">Trust_Score</div>
          <div className="text-lg font-bold text-[#00E5FF]">--.-</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col border border-white/5 bg-white/5 p-3">
          <span className="text-[8px] uppercase text-white/20">ROI</span>
          <span className="font-bold text-white">0.0%</span>
        </div>
        <div className="flex flex-col border border-white/5 bg-white/5 p-3">
          <span className="text-[8px] uppercase text-white/20">Vouches</span>
          <span className="font-bold text-white">0</span>
        </div>
      </div>
      <div className="border border-white/5 p-4 text-center text-[9px] uppercase tracking-widest text-white/20">
        No_Verification_History_Found
      </div>
    </div>
  );
}

function MonetizationEngine() {
  return (
    <div className="space-y-4 font-mono text-[10px]">
      <div className="border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4">
        <div className="mb-1 uppercase text-[#00E5FF]/60">Monthly_Revenue</div>
        <div className="text-xl font-bold text-[#00E5FF]">$12,480.00</div>
      </div>
      <div className="border border-white/5 bg-white/5 p-4">
        <div className="mb-1 uppercase text-white/40">Subscribers</div>
        <div className="text-xl font-bold text-white">412</div>
      </div>
    </div>
  );
}

function PricingGrid({ onSelectPlan }: { onSelectPlan: (plan: SignupPlan) => void }) {
  return (
    <section className="mt-8 border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">These are Beta Prices</div>
          <h2 className="mt-1 text-xl font-bold uppercase tracking-tight text-white">Terminal Access</h2>
        </div>
        <p className="max-w-sm font-mono text-[10px] uppercase leading-relaxed text-white/35">
          Beta pricing is shown in USD and built for early VouchEdge users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelectPlan(plan.id)}
            className={`group flex min-h-[190px] flex-col justify-between border p-4 text-left transition-all hover:-translate-y-0.5 ${
              plan.featured
                ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 shadow-[0_0_24px_rgba(0,229,255,0.12)]'
                : 'border-white/10 bg-black/30 hover:border-[#00E5FF]/40'
            }`}
          >
            <span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">{plan.descriptor}</span>
              <span className="mt-1 block text-lg font-black uppercase text-white">{plan.name}</span>
              <span className={plan.featured ? 'mt-3 block text-2xl font-black text-[#00E5FF]' : 'mt-3 block text-2xl font-black text-white'}>
                {plan.price}
              </span>
            </span>
            <span className="mt-4 space-y-1.5">
              {plan.bullets.map((bullet) => (
                <span key={bullet} className="block font-mono text-[10px] uppercase tracking-wide text-white/45">
                  / {bullet}
                </span>
              ))}
            </span>
            <span className="mt-4 block border-t border-white/10 pt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] group-hover:text-white">
              Select {plan.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function VouchEdgeTerminalPage({ onAuthed }: { onAuthed?: () => void }) {
  const [view, setView] = useState<TerminalView>('ledger');
  const [selectedGame, setSelectedGame] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authPlan, setAuthPlan] = useState<SignupPlan>('free');
  const liveData = useLiveTerminal();

  const openSignup = (plan: SignupPlan) => {
    setAuthMode('signup');
    setAuthPlan(plan);
    setAuthOpen(true);
  };

  const openLogin = () => {
    setAuthMode('login');
    setAuthPlan('free');
    setAuthOpen(true);
  };

  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A] p-4 pb-28 font-sans text-white lg:p-12 lg:pb-32">
        <Ticker />
        <div className="pointer-events-none absolute left-[-10%] top-0 h-full w-[80%] bg-[radial-gradient(circle_at_30%_20%,rgba(0,229,255,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)] opacity-60" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_4px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-6 text-center sm:flex-row sm:text-left">
            <div className="text-xl font-bold uppercase italic tracking-tighter">
              VouchEdge<span className="text-[#00E5FF]">.Terminal</span>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="hidden font-mono text-[10px] uppercase tracking-widest text-white/40 sm:block">
                System_Status: <span className="text-[#00E5FF]">Optimal</span> // Latency: {liveData.latency}ms
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-6 text-center">
              <h1 className="text-4xl font-bold leading-none tracking-tighter sm:text-5xl lg:text-6xl">
                Command the board with <span className="text-[#00E5FF]">pristine</span> intelligence.
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/40">
                The definitive research and verification terminal for serious analysts. Analyze live data,
                execute AI models, and prove your record.
              </p>
              <div className="grid w-full max-w-2xl grid-cols-2 border border-white/10 bg-black/30 font-mono text-[10px] font-bold uppercase tracking-widest text-white/70 sm:grid-cols-4">
                {['No Hype', 'Truth', 'Research', 'Play'].map((value) => (
                  <div key={value} className="border-white/10 px-3 py-3 sm:border-l first:border-l-0">
                    {value}
                  </div>
                ))}
              </div>
              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: 'Sign Up', onClick: () => openSignup('free') },
                  { label: 'Log In', onClick: openLogin },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="h-14 border border-[#00E5FF]/55 bg-[#00E5FF]/10 px-5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.08)] transition-all hover:border-[#00E5FF] hover:bg-[#00E5FF] hover:text-black"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="w-full space-y-4">
              <div className="text-center font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
                Active_Daily_Slate
              </div>
              <DailySlate selectedId={selectedGame} onSelect={setSelectedGame} />
            </section>

            <section className="w-full">
              <TerminalCard>
                <div className="flex border-b border-white/10 bg-white/5 p-1">
                  {(['ledger', 'matchup', 'props', 'profile', 'money'] as TerminalView[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setView(tab)}
                      className={`flex-1 py-3 font-mono text-[9px] uppercase tracking-widest transition-all ${
                        view === tab ? 'bg-[#00E5FF] font-bold text-black' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 border-b border-white/5 bg-black/40 sm:grid-cols-3">
                  <DataPoint label="Selected_Matchup" value={selectedGame === 1 ? 'NYY @ LAD' : 'PHI @ ATL'} />
                  <DataPoint label="AI_Confidence" value={`${liveData.confidence}%`} active />
                  <DataPoint label="Live_Line" value={`-115 -> ${liveData.line}`} />
                </div>

                <div className="min-h-[400px] bg-black/20 p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {view === 'ledger' && <VouchLedger />}
                      {view === 'matchup' && <MatchupIntelligence />}
                      {view === 'props' && <PropTerminal />}
                      {view === 'profile' && <ProfilePreview />}
                      {view === 'money' && <MonetizationEngine />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </TerminalCard>
            </section>

            <PricingGrid onSelectPlan={openSignup} />
            <div
              aria-hidden="true"
              className="h-16 border-t border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent"
            />
          </div>
        </div>
      </main>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        initialPlan={authPlan}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => {
          setAuthOpen(false);
          onAuthed?.();
        }}
        onGuest={() => setAuthOpen(false)}
      />
    </>
  );
}
