import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Gauge,
  LayoutTemplate,
  Menu,
  Monitor,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

type PreviewWidth = 'desktop' | 'mobile';

type DemoGame = {
  id: string;
  away: string;
  home: string;
  time: string;
  status: string;
  player: string;
  team: string;
  score: number;
  probability: string;
  evidence: Array<{ label: string; value: string; tone: 'good' | 'neutral' | 'watch' }>;
  read: string;
};

const DEMO_GAMES: DemoGame[] = [
  {
    id: 'sea-hou',
    away: 'SEA',
    home: 'HOU',
    time: '8:10 PM',
    status: 'Lineups confirmed',
    player: 'Julio Rodríguez',
    team: 'SEA · OF',
    score: 86,
    probability: 'Research signal: strong',
    evidence: [
      { label: 'Pitcher matchup', value: 'Favorable', tone: 'good' },
      { label: 'Park environment', value: 'Neutral', tone: 'neutral' },
      { label: 'Recent contact', value: 'Improving', tone: 'good' },
      { label: 'Bullpen context', value: 'Watch', tone: 'watch' },
    ],
    read: 'The matchup grades well because the pitch-shape fit and recent contact quality agree. Park conditions are not adding extra lift.',
  },
  {
    id: 'chc-mil',
    away: 'CHC',
    home: 'MIL',
    time: '7:40 PM',
    status: 'Projected lineup',
    player: 'Seiya Suzuki',
    team: 'CHC · OF',
    score: 78,
    probability: 'Research signal: positive',
    evidence: [
      { label: 'Pitcher matchup', value: 'Positive', tone: 'good' },
      { label: 'Park environment', value: 'Favorable', tone: 'good' },
      { label: 'Recent contact', value: 'Stable', tone: 'neutral' },
      { label: 'Lineup certainty', value: 'Pending', tone: 'watch' },
    ],
    read: 'The environment supports power, but the conclusion stays provisional until the official lineup is posted.',
  },
  {
    id: 'lad-sd',
    away: 'LAD',
    home: 'SD',
    time: '9:40 PM',
    status: 'Lineups confirmed',
    player: 'Fernando Tatis Jr.',
    team: 'SD · OF',
    score: 73,
    probability: 'Research signal: monitor',
    evidence: [
      { label: 'Pitcher matchup', value: 'Mixed', tone: 'watch' },
      { label: 'Park environment', value: 'Muted', tone: 'watch' },
      { label: 'Recent contact', value: 'Strong', tone: 'good' },
      { label: 'Bullpen context', value: 'Neutral', tone: 'neutral' },
    ],
    read: 'Recent contact is strong, but the park and matchup disagree. This belongs on the watchlist, not at the top of the board.',
  },
];

const TONE_STYLE = {
  good: 'border-[#7ac995]/25 bg-[#7ac995]/10 text-[#b9e8c8]',
  neutral: 'border-white/10 bg-white/[0.04] text-[#d9ddd5]',
  watch: 'border-[#e5ad62]/25 bg-[#e5ad62]/10 text-[#f0c98f]',
} as const;

function ProductMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-8 w-8 place-items-center border border-[#a8d8b6]/35 bg-[#0d2318]">
        <span className="absolute inset-[5px] rotate-45 border border-[#a8d8b6]/65" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#a8d8b6] shadow-[0_0_12px_rgba(168,216,182,0.7)]" />
      </div>
      <div>
        <p className="text-[13px] font-black tracking-[-0.02em] text-[#f2f0e9]">VOUCHEDGE</p>
        <p className="font-mono text-[7px] font-bold uppercase tracking-[0.25em] text-[#a8d8b6]/65">MLB Research</p>
      </div>
    </div>
  );
}

function GameRail({ activeId, compact, onSelect }: { activeId: string; compact: boolean; onSelect: (id: string) => void }) {
  return (
    <div className={`grid gap-1.5 border-b border-white/[0.07] p-2 ${compact ? '' : 'sm:grid-cols-3'}`}>
      {DEMO_GAMES.map((game) => {
        const active = game.id === activeId;
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onSelect(game.id)}
            aria-pressed={active}
            className={`group flex min-h-14 items-center justify-between gap-2 border px-3 text-left transition-colors ${
              active
                ? 'border-[#8bcda0]/35 bg-[#8bcda0]/10 text-[#f4f2eb]'
                : 'border-transparent bg-white/[0.025] text-white/55 hover:border-white/10 hover:text-white'
            }`}
          >
            <span>
              <span className="block font-mono text-[11px] font-bold tracking-[0.08em]">{game.away} @ {game.home}</span>
              <span className="mt-1 block text-[9px] text-current opacity-55">{game.time}</span>
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${active ? 'text-[#a8d8b6]' : 'text-white/20'}`} />
          </button>
        );
      })}
    </div>
  );
}

function ResearchWorkspace({ game, compact, onSelect }: { game: DemoGame; compact: boolean; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-hidden border border-white/[0.1] bg-[#07100c]/95 shadow-[0_36px_90px_-42px_rgba(0,0,0,0.95)]">
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0b1510] px-3.5">
        <div className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/35">
          <Radio className="h-3 w-3 text-[#88c99c]" /> Live research desk
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-semibold text-[#b8dec4]">
          <CircleDot className="h-2.5 w-2.5" /> Sources fresh
        </div>
      </div>

      <GameRail activeId={game.id} compact={compact} onSelect={onSelect} />

      <div className={`grid ${compact ? '' : 'lg:grid-cols-[0.82fr_1.18fr]'}`}>
        <div className={`border-b border-white/[0.07] p-4 ${compact ? '' : 'sm:p-5 lg:border-b-0 lg:border-r'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#8bcda0]">Strongest research row</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#f2f0e9]">{game.player}</h3>
              <p className="mt-1 text-[10px] text-white/40">{game.team} · {game.away} @ {game.home}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
              <p className="font-mono text-2xl font-medium tabular-nums text-[#f2f0e9]">{game.score}</p>
              <p className="font-mono text-[7px] uppercase tracking-[0.13em] text-white/35">HRPI / 100</p>
            </div>
          </div>

          <p className="mt-5 text-[12px] leading-5 text-[#c7cbc3]">{game.read}</p>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
            <div>
              <p className="text-[10px] font-semibold text-[#dfe2da]">{game.probability}</p>
              <p className="mt-1 text-[8px] text-white/35">Score summarizes evidence; it is not a guarantee.</p>
            </div>
            <button type="button" className="grid h-9 w-9 shrink-0 place-items-center bg-[#b7dfc3] text-[#07100c] transition hover:bg-[#d0edd8]" aria-label="Inspect research row">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-white/35">Evidence layers</p>
              <p className="mt-1 text-[11px] text-white/55">Why this row is where it is.</p>
            </div>
            <span className="border border-[#8bcda0]/20 bg-[#8bcda0]/[0.07] px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.14em] text-[#a8d8b6]">
              High source coverage
            </span>
          </div>

          <div className={`mt-4 grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
            {game.evidence.map((item) => (
              <div key={item.label} className="border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-medium text-white/45">{item.label}</span>
                  <span className={`border px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase ${TONE_STYLE[item.tone]}`}>{item.value}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {[0, 1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className={`h-1 flex-1 ${
                        bar < (item.tone === 'good' ? 4 : item.tone === 'neutral' ? 3 : 2)
                          ? item.tone === 'watch' ? 'bg-[#e5ad62]/70' : 'bg-[#8bcda0]/70'
                          : 'bg-white/[0.06]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border border-white/[0.07] bg-[#0b1510] p-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-[#8bcda0]" />
              <div>
                <p className="text-[9px] font-semibold text-[#e4e6df]">Research receipt attached</p>
                <p className="mt-0.5 text-[7px] text-white/35">Sources · freshness · missing inputs · methodology</p>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustStrip({ compact }: { compact: boolean }) {
  return (
    <div className={`grid border-y border-white/[0.07] bg-[#0a110d] ${compact ? '' : 'sm:grid-cols-3'}`}>
      {[
        { icon: FileCheck2, label: 'Source-backed', detail: 'Every conclusion keeps its receipt.' },
        { icon: Clock3, label: 'Freshness visible', detail: 'Know when every input was checked.' },
        { icon: ShieldCheck, label: 'Missing stays missing', detail: 'No invented certainty or filler.' },
      ].map(({ icon: Icon, label, detail }, index) => (
        <div key={label} className={`flex gap-3 px-5 py-4 ${index > 0 ? compact ? 'border-t border-white/[0.07]' : 'border-t border-white/[0.07] sm:border-l sm:border-t-0' : ''}`}>
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8bcda0]" />
          <div>
            <p className="text-[10px] font-semibold text-[#e9e8e1]">{label}</p>
            <p className="mt-1 text-[8px] leading-4 text-white/35">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LandingConcept({ compact }: { compact: boolean }) {
  const [activeGameId, setActiveGameId] = useState(DEMO_GAMES[0].id);
  const game = DEMO_GAMES.find((item) => item.id === activeGameId) ?? DEMO_GAMES[0];

  return (
    <div className="min-h-full bg-[#060907] text-[#f2f0e9]">
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-[#28543a]/20 blur-[90px]" />

        <nav className="relative z-10 flex h-16 items-center justify-between border-b border-white/[0.07] px-4 sm:px-7">
          <ProductMark />
          <div className={`${compact ? 'hidden' : 'hidden sm:flex'} items-center gap-6 text-[9px] font-semibold text-white/45`}>
            <button type="button" className="transition hover:text-white">Today&apos;s board</button>
            <button type="button" className="transition hover:text-white">Methodology</button>
            <button type="button" className="transition hover:text-white">Trust ledger</button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={`${compact ? 'hidden' : 'hidden sm:block'} min-h-9 border border-white/10 px-3 text-[9px] font-semibold text-white/65 transition hover:text-white`}>Log in</button>
            <button type="button" className="min-h-9 bg-[#b7dfc3] px-3 text-[9px] font-black text-[#07100c] transition hover:bg-[#d0edd8]">Open the board</button>
            <Menu className={`h-4 w-4 text-white/55 ${compact ? '' : 'sm:hidden'}`} />
          </div>
        </nav>

        <section className={`relative z-10 mx-auto grid max-w-[1180px] gap-9 px-4 pb-12 pt-12 ${compact ? '' : 'sm:px-7 sm:pb-16 sm:pt-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12'}`}>
          <div>
            <div className="inline-flex items-center gap-2 border border-[#8bcda0]/20 bg-[#8bcda0]/[0.06] px-2.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-[#a8d8b6]">
              <CircleDot className="h-2.5 w-2.5" /> Live MLB research workspace
            </div>
            <h1 className={`mt-5 max-w-[560px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#f2f0e9] ${compact ? 'text-[2.65rem]' : 'text-[2.65rem] sm:text-[3.65rem] lg:text-[4rem]'}`}>
              Know the matchup.<br />See the evidence.
            </h1>
            <p className="mt-5 max-w-[490px] text-[13px] leading-6 text-[#b8bcb4] sm:text-[14px]">
              One clear research desk for lineup truth, pitcher context, park factors, player form, and what changed before first pitch.
            </p>

            <div className={`mt-7 flex flex-col gap-2.5 ${compact ? '' : 'sm:flex-row'}`}>
              <button type="button" className="group inline-flex min-h-12 items-center justify-center gap-2 bg-[#b7dfc3] px-5 text-[11px] font-black text-[#07100c] transition hover:bg-[#d0edd8]">
                Open today&apos;s board <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/12 px-5 text-[10px] font-semibold text-[#e3e4de] transition hover:border-white/25">
                <Eye className="h-3.5 w-3.5" /> See how we reached it
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[7px] uppercase tracking-[0.11em] text-white/35">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-[#8bcda0]" /> Free open beta</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-[#8bcda0]" /> No picks sold</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-[#8bcda0]" /> Uncertainty shown</span>
            </div>
          </div>

          <ResearchWorkspace game={game} compact={compact} onSelect={setActiveGameId} />
        </section>
      </div>

      <TrustStrip compact={compact} />

      <section className="mx-auto max-w-[1080px] px-4 py-14 sm:px-7 sm:py-16">
        <div className={`grid gap-8 ${compact ? '' : 'lg:grid-cols-[0.68fr_1.32fr]'}`}>
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#8bcda0]">A research workflow, not a feed</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#f0efe8]">From question to receipt in four moves.</h2>
            <p className="mt-4 text-[11px] leading-5 text-white/45">The homepage teaches the product by letting the product do the talking.</p>
          </div>

          <div className={`grid gap-px border border-white/[0.07] bg-white/[0.07] ${compact ? '' : 'sm:grid-cols-2'}`}>
            {[
              { n: '01', icon: Target, title: 'Select', copy: 'Choose a game or player from today’s slate.' },
              { n: '02', icon: Gauge, title: 'Inspect', copy: 'See the layers supporting—or weakening—the read.' },
              { n: '03', icon: FileCheck2, title: 'Save', copy: 'Keep the conclusion with its source receipt.' },
              { n: '04', icon: TrendingUp, title: 'Grade', copy: 'Review what happened without rewriting history.' },
            ].map(({ n, icon: Icon, title, copy }) => (
              <div key={n} className="bg-[#080d0a] p-5">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-[#8bcda0]" />
                  <span className="font-mono text-[8px] text-white/20">{n}</span>
                </div>
                <h3 className="mt-7 text-sm font-semibold text-[#ebeae4]">{title}</h3>
                <p className="mt-2 text-[9px] leading-4 text-white/40">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#0a110d] px-4 py-12 sm:px-7">
        <div className={`mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-7 ${compact ? '' : 'sm:flex-row sm:items-center'}`}>
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#8bcda0]">Built for accountable research</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#f0efe8]">Research the game. Keep the receipt.</h2>
            <p className="mt-2 max-w-xl text-[10px] leading-5 text-white/40">Sources, freshness, missing inputs, and the original conclusion stay together.</p>
          </div>
          <button type="button" className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-[#8bcda0]/30 bg-[#8bcda0]/10 px-4 text-[10px] font-semibold text-[#c9ead3] transition hover:bg-[#8bcda0]/15">
            Explore the trust ledger <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <footer className={`flex flex-col items-start justify-between gap-5 px-4 py-7 ${compact ? '' : 'sm:flex-row sm:items-center sm:px-7'}`}>
        <ProductMark />
        <p className="max-w-md text-[8px] leading-4 text-white/25">Research support only. Scores summarize available evidence and are not guarantees of outcomes or financial advice.</p>
      </footer>
    </div>
  );
}

export default function FrontPageLab() {
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('desktop');

  return (
    <section className="space-y-4" aria-labelledby="front-page-lab-title">
      <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-vouch-emerald">
            <Sparkles className="h-3.5 w-3.5" /> Isolated concept preview
          </div>
          <h2 id="front-page-lab-title" className="mt-1.5 text-lg font-semibold text-white">Front Page Concept 01 — The Research Desk</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">Sample content for visual review only. This is not connected to the public homepage or the current Today page.</p>
        </div>

        <div className="flex shrink-0 gap-1 rounded-md border border-white/10 bg-black/30 p-1" aria-label="Preview width">
          <button
            type="button"
            onClick={() => setPreviewWidth('desktop')}
            aria-pressed={previewWidth === 'desktop'}
            className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-xs font-medium transition-colors ${previewWidth === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setPreviewWidth('mobile')}
            aria-pressed={previewWidth === 'mobile'}
            className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-xs font-medium transition-colors ${previewWidth === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#020403] p-2 sm:p-3">
        <div
          className={`mx-auto overflow-hidden rounded-sm border border-white/[0.08] transition-[max-width] duration-300 ${
            previewWidth === 'mobile' ? 'max-w-[390px]' : 'max-w-[1440px]'
          }`}
        >
          <LandingConcept compact={previewWidth === 'mobile'} />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-vouch-emerald/15 bg-vouch-emerald/[0.05] p-4">
        <LayoutTemplate className="mt-0.5 h-4 w-4 shrink-0 text-vouch-emerald" />
        <p className="text-xs leading-5 text-white/55"><strong className="text-white/80">Decision gate:</strong> review the visual direction here first. If you approve it, the next step is connecting this composition to real landing data and replacing the public route—without deleting Today until the replacement passes desktop, mobile, auth, and performance checks.</p>
      </div>
    </section>
  );
}
