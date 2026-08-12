import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Activity,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Download,
  FileCheck2,
  Filter,
  LayoutTemplate,
  Menu,
  Monitor,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  AuroraMaxCommandHeader,
  AuroraMaxEvidenceLadder,
  AuroraMaxFallback,
  AuroraMaxPanel,
  AuroraMaxProductMark,
  AuroraMaxRankedWorkspace,
  AuroraMaxReceiptAction,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../aurora-max/AuroraMaxPrimitives';

type PreviewWidth = 'desktop' | 'mobile';
type SortKey = 'hrpi' | 'time' | 'volume';
type EvidenceTone = 'good' | 'neutral' | 'watch';

type DemoGame = {
  id: string;
  away: string;
  home: string;
  time: string;
  timeValue: number;
  status: string;
  confirmed: boolean;
  player: string;
  team: string;
  score: number;
  marketVolume: number;
  signal: string;
  read: string;
  evidenceConfidence: string;
  evidence: Array<{ label: string; value: string; tone: EvidenceTone }>;
  receipt: {
    updated: string;
    sources: string[];
    missing: string;
    methodology: string;
  };
};

const DEMO_GAMES: DemoGame[] = [
  {
    id: 'sea-hou', away: 'SEA', home: 'HOU', time: '8:10 PM', timeValue: 2010,
    status: 'Lineups confirmed', confirmed: true, player: 'Julio Rodríguez', team: 'SEA · OF',
    score: 86, marketVolume: 91, signal: 'Strong research signal', evidenceConfidence: 'High coverage',
    read: 'Pitch-shape fit and recent contact quality agree. Park conditions are not adding extra lift.',
    evidence: [
      { label: 'Pitcher matchup', value: 'Favorable', tone: 'good' },
      { label: 'Park environment', value: 'Neutral', tone: 'neutral' },
      { label: 'Recent contact', value: 'Improving', tone: 'good' },
      { label: 'Bullpen context', value: 'Watch', tone: 'watch' },
    ],
    receipt: { updated: '7:42 PM', sources: ['MLB schedule', 'Official lineup', 'HR research model'], missing: 'Bullpen availability is partial.', methodology: 'HRPI summarizes available matchup, form, park, and lineup evidence.' },
  },
  {
    id: 'chc-mil', away: 'CHC', home: 'MIL', time: '7:40 PM', timeValue: 1940,
    status: 'Projected lineup', confirmed: false, player: 'Seiya Suzuki', team: 'CHC · OF',
    score: 78, marketVolume: 84, signal: 'Positive, lineup pending', evidenceConfidence: 'Medium coverage',
    read: 'The environment supports power, but the conclusion stays provisional until the official lineup posts.',
    evidence: [
      { label: 'Pitcher matchup', value: 'Positive', tone: 'good' },
      { label: 'Park environment', value: 'Favorable', tone: 'good' },
      { label: 'Recent contact', value: 'Stable', tone: 'neutral' },
      { label: 'Lineup certainty', value: 'Pending', tone: 'watch' },
    ],
    receipt: { updated: '7:31 PM', sources: ['MLB schedule', 'Projected lineup', 'HR research model'], missing: 'Official batting order is unavailable.', methodology: 'The score is provisional and should be rechecked after lineup confirmation.' },
  },
  {
    id: 'lad-sd', away: 'LAD', home: 'SD', time: '9:40 PM', timeValue: 2140,
    status: 'Lineups confirmed', confirmed: true, player: 'Fernando Tatis Jr.', team: 'SD · OF',
    score: 73, marketVolume: 96, signal: 'Monitor conflicting inputs', evidenceConfidence: 'High coverage',
    read: 'Recent contact is strong, but the park and pitcher matchup disagree. Keep it on the watchlist.',
    evidence: [
      { label: 'Pitcher matchup', value: 'Mixed', tone: 'watch' },
      { label: 'Park environment', value: 'Muted', tone: 'watch' },
      { label: 'Recent contact', value: 'Strong', tone: 'good' },
      { label: 'Bullpen context', value: 'Neutral', tone: 'neutral' },
    ],
    receipt: { updated: '7:38 PM', sources: ['MLB schedule', 'Official lineup', 'Park factors'], missing: 'No material source gaps.', methodology: 'Conflicting evidence lowers the row despite strong recent contact.' },
  },
  {
    id: 'nyy-cle', away: 'NYY', home: 'CLE', time: '6:40 PM', timeValue: 1840,
    status: 'Lineups confirmed', confirmed: true, player: 'Aaron Judge', team: 'NYY · OF',
    score: 89, marketVolume: 99, signal: 'Strongest row on slate', evidenceConfidence: 'High coverage',
    read: 'Power baseline, contact quality, and pitcher vulnerability align. Weather remains neutral.',
    evidence: [
      { label: 'Power baseline', value: 'Elite', tone: 'good' },
      { label: 'Pitcher matchup', value: 'Favorable', tone: 'good' },
      { label: 'Weather', value: 'Neutral', tone: 'neutral' },
      { label: 'Lineup certainty', value: 'Confirmed', tone: 'good' },
    ],
    receipt: { updated: '7:44 PM', sources: ['MLB schedule', 'Official lineup', 'Weather feed'], missing: 'No material source gaps.', methodology: 'The top row requires aligned evidence and confirmed availability.' },
  },
  {
    id: 'bos-tb', away: 'BOS', home: 'TB', time: '6:50 PM', timeValue: 1850,
    status: 'Projected lineup', confirmed: false, player: 'Rafael Devers', team: 'BOS · 3B',
    score: 69, marketVolume: 77, signal: 'Wait for lineup truth', evidenceConfidence: 'Medium coverage',
    read: 'The matchup is playable, but the unconfirmed lineup and park environment cap the score.',
    evidence: [
      { label: 'Pitcher matchup', value: 'Positive', tone: 'good' },
      { label: 'Park environment', value: 'Muted', tone: 'watch' },
      { label: 'Recent contact', value: 'Stable', tone: 'neutral' },
      { label: 'Lineup certainty', value: 'Pending', tone: 'watch' },
    ],
    receipt: { updated: '7:29 PM', sources: ['MLB schedule', 'Projected lineup'], missing: 'Official lineup and bullpen context are unavailable.', methodology: 'Missing lineup truth limits evidence confidence.' },
  },
  {
    id: 'atl-phi', away: 'ATL', home: 'PHI', time: '7:05 PM', timeValue: 1905,
    status: 'Lineups confirmed', confirmed: true, player: 'Matt Olson', team: 'ATL · 1B',
    score: 81, marketVolume: 88, signal: 'Positive power context', evidenceConfidence: 'High coverage',
    read: 'Park and power indicators align while the pitcher matchup grades slightly above neutral.',
    evidence: [
      { label: 'Power baseline', value: 'Strong', tone: 'good' },
      { label: 'Pitcher matchup', value: 'Positive', tone: 'good' },
      { label: 'Park environment', value: 'Favorable', tone: 'good' },
      { label: 'Recent contact', value: 'Neutral', tone: 'neutral' },
    ],
    receipt: { updated: '7:40 PM', sources: ['MLB schedule', 'Official lineup', 'Park factors'], missing: 'No material source gaps.', methodology: 'Park and player power carry more weight when lineup status is official.' },
  },
];

const SORT_LABELS: Record<SortKey, string> = {
  hrpi: 'HRPI score',
  time: 'Game time',
  volume: 'Market attention',
};


function UtilityButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-9 items-center justify-center gap-1.5 border px-3 text-[11px] font-semibold transition ${active ? 'border-[#8bcda0]/35 bg-[#8bcda0]/10 text-[#c9ead3]' : 'border-white/10 bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white'}`}>
      {children}
    </button>
  );
}

function Spotlight({ game, compact, saved, onToggleSaved }: { game: DemoGame; compact: boolean; saved: boolean; onToggleSaved: () => void }) {
  return (
    <AuroraMaxPanel className="relative overflow-hidden bg-[#07100c]/95">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(139,205,160,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(139,205,160,0.035)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative flex min-h-9 items-center justify-between border-b border-[#8bcda0]/10 bg-[#0b1510]/95 px-4">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ed4ae]"><Radio className="h-3 w-3" /> Primary research signal</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white/35"><Clock3 className="h-3 w-3" /> {game.receipt.updated}</span>
      </div>

      <div className={`relative grid ${compact ? '' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>
        <div className={`p-4 ${compact ? 'border-b border-white/[0.07]' : 'border-b border-white/[0.07] lg:border-b-0 lg:border-r lg:border-[#8bcda0]/10 lg:p-5'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <AuroraMaxTruthBadge state={game.confirmed ? 'confirmed' : 'projected'}>{game.status}</AuroraMaxTruthBadge>
              <h2 className="mt-2 text-[22px] font-semibold leading-none tracking-[-0.04em] text-[#f2f0e9]">{game.player}</h2>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#8bcda0]">{game.team} · {game.away} at {game.home} · {game.time}</p>
            </div>
            <AuroraMaxScoreBadge score={game.score} />
          </div>

          <div className="mt-3 border-l-2 border-[#8bcda0]/45 bg-[#8bcda0]/[0.045] px-3 py-2.5">
            <p className="text-[11px] leading-[1.55] text-[#cdd1c9]">{game.read}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#e0e5dd]"><TrendingUp className="h-3 w-3 text-[#8bcda0]" /> {game.signal}</p>
              <p className="mt-1 text-[11px] text-white/30">{game.evidenceConfidence} · research signal, not a guarantee.</p>
            </div>
            <button type="button" onClick={onToggleSaved} aria-pressed={saved} aria-label={saved ? `Remove ${game.player} from My List` : `Add ${game.player} to My List`} title={saved ? 'Remove from My List' : 'Add to My List'} className={`grid h-9 w-9 shrink-0 place-items-center border ${saved ? 'border-[#8bcda0]/35 bg-[#8bcda0]/10 text-[#c9ead3]' : 'border-white/10 text-white/45 hover:text-white'}`}>
              <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-5">
          <AuroraMaxEvidenceLadder
            meta={<AuroraMaxTruthBadge state={game.confirmed ? 'confirmed' : 'projected'}>{game.evidenceConfidence}</AuroraMaxTruthBadge>}
            items={game.evidence.map((item) => ({
              label: item.label,
              value: item.value,
              score: item.tone === 'good' ? 80 : item.tone === 'neutral' ? 60 : 40,
              tone: item.tone === 'good' ? 'confirmed' : item.tone === 'watch' ? 'warning' : 'neutral',
            }))}
          />
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/25">
            <span>Source receipt available in queue</span>
            <span className="font-mono uppercase tracking-[0.12em]">4 layers read</span>
          </div>
        </div>
      </div>
    </AuroraMaxPanel>
  );
}

function ReceiptTray({ game, onClose }: { game: DemoGame; onClose: () => void }) {
  return (
    <div className="border-x border-b border-[#8bcda0]/20 bg-[#0a1510] px-4 py-4" role="region" aria-label={`${game.away} at ${game.home} research receipt`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8bcda0]" />
          <div>
            <p className="text-[10px] font-semibold text-[#e7e9e2]">Research receipt · {game.player}</p>
            <p className="mt-1 text-[10px] text-white/35">Captured {game.receipt.updated} · original conclusion preserved</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close receipt" className="text-white/35 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">Sources</p><p className="mt-1.5 text-[11px] leading-4 text-white/60">{game.receipt.sources.join(' · ')}</p></div>
        <div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">Missing inputs</p><p className="mt-1.5 text-[11px] leading-4 text-white/60">{game.receipt.missing}</p></div>
        <div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">Method</p><p className="mt-1.5 text-[11px] leading-4 text-white/60">{game.receipt.methodology}</p></div>
      </div>
    </div>
  );
}

function SlateQueue({ games, activeId, compact, savedIds, receiptId, onSelect, onToggleSaved, onToggleReceipt }: {
  games: DemoGame[]; activeId: string; compact: boolean; savedIds: Set<string>; receiptId: string | null;
  onSelect: (id: string) => void; onToggleSaved: (id: string) => void; onToggleReceipt: (id: string) => void;
}) {
  return (
    <div className="border border-white/[0.08] bg-[#070c09]">
      <div className={`hidden min-h-9 items-center border-b border-white/[0.07] bg-white/[0.02] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-white/25 ${compact ? '' : 'sm:grid sm:grid-cols-[1.1fr_1fr_0.55fr_0.7fr_0.65fr_70px]'}`}>
        <span>Matchup</span><span>Top research row</span><span>HRPI</span><span>Lineup</span><span>Attention</span><span className="text-right">Receipt</span>
      </div>
      {games.length === 0 ? <AuroraMaxFallback compact title="No ranked matchups" detail="The active workspace filter returned no eligible slate rows." /> : null}
      {games.map((game, index) => {
        const active = game.id === activeId;
        const receiptOpen = receiptId === game.id;
        return (
          <div key={game.id}>
            <div className={`relative grid border-b border-white/[0.06] transition ${compact ? 'grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_70px]'} ${active ? 'bg-[#8bcda0]/[0.08]' : 'hover:bg-white/[0.025]'}`}>
              {active ? <span className="absolute inset-y-0 left-0 w-0.5 bg-[#8bcda0]" /> : null}
              <button type="button" onClick={() => onSelect(game.id)} aria-pressed={active} className={`grid min-w-0 gap-3 px-3 py-2.5 text-left ${compact ? 'grid-cols-2' : 'sm:grid-cols-[1.1fr_1fr_0.55fr_0.7fr_0.65fr] sm:items-center'}`}>
                <span className="flex items-center gap-3">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center border font-mono text-[11px] ${active ? 'border-[#8bcda0]/30 bg-[#8bcda0]/10 text-[#a8d8b6]' : 'border-white/[0.07] text-white/20'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-mono text-[10px] font-bold text-[#e9e8e1]">{game.away} @ {game.home}</span>
                    <span className="mt-1 block text-[10px] text-white/35">{game.time}</span>
                  </span>
                </span>
                <span className={compact ? 'text-right' : ''}>
                  <span className="block text-[10px] font-semibold text-white/70">{game.player}</span>
                  <span className="mt-1 block text-[10px] text-white/30">{game.team}</span>
                </span>
                <span className={`font-mono text-sm font-semibold tabular-nums ${active ? 'text-[#b9e8c8]' : 'text-white/70'}`}>{game.score}</span>
                <AuroraMaxTruthBadge state={game.confirmed ? 'confirmed' : 'projected'}>{game.confirmed ? 'Confirmed' : 'Projected'}</AuroraMaxTruthBadge>
                <span><span className="font-mono text-[11px] text-white/55">{game.marketVolume}</span><span className="ml-1 text-[11px] text-white/25">index</span></span>
              </button>
              <span className={`flex items-center justify-end gap-2 px-3 ${compact ? 'flex-col border-l border-white/[0.06]' : ''}`}>
                <button type="button" onClick={() => onToggleSaved(game.id)} aria-label={`${savedIds.has(game.id) ? 'Remove' : 'Add'} ${game.player} ${savedIds.has(game.id) ? 'from' : 'to'} My List`} className={`grid h-9 w-9 place-items-center border ${savedIds.has(game.id) ? 'border-[#8bcda0]/30 text-[#8bcda0]' : 'border-white/10 text-white/25 hover:text-white'}`}><Star className={`h-3 w-3 ${savedIds.has(game.id) ? 'fill-current' : ''}`} /></button>
                <AuroraMaxReceiptAction onClick={() => onToggleReceipt(game.id)} expanded={receiptOpen} label={`${receiptOpen ? 'Close' : 'Open'} ${game.player} receipt`}><ChevronDown className={`h-3 w-3 transition ${receiptOpen ? 'rotate-180' : ''}`} /></AuroraMaxReceiptAction>
              </span>
            </div>
            {receiptOpen ? <ReceiptTray game={game} onClose={() => onToggleReceipt(game.id)} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function DailyHubConcept({ compact }: { compact: boolean }) {
  const [activeGameId, setActiveGameId] = useState('nyy-cle');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('hrpi');
  const [confirmedOnly, setConfirmedOnly] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const game = DEMO_GAMES.find((item) => item.id === activeGameId) ?? DEMO_GAMES[0];
  const visibleGames = useMemo(() => {
    const filtered = confirmedOnly ? DEMO_GAMES.filter((item) => item.confirmed) : DEMO_GAMES;
    return [...filtered].sort((left, right) => sortKey === 'hrpi' ? right.score - left.score : sortKey === 'time' ? left.timeValue - right.timeValue : right.marketVolume - left.marketVolume);
  }, [confirmedOnly, sortKey]);

  const selectGame = (id: string) => {
    setActiveGameId(id);
    setReceiptId(id);
  };
  const toggleSaved = (id: string) => setSavedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const cycleSort = () => setSortKey((current) => current === 'hrpi' ? 'time' : current === 'time' ? 'volume' : 'hrpi');
  const exportReceipts = () => {
    setExportStatus(`${savedIds.size || visibleGames.length} sample receipt${(savedIds.size || visibleGames.length) === 1 ? '' : 's'} prepared`);
    window.setTimeout(() => setExportStatus(null), 2200);
  };

  return (
    <div className="min-h-full bg-[#060907] text-[#f2f0e9]">
      <header className="border-b border-[#8bcda0]/10 bg-[#080d0a]">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <AuroraMaxProductMark />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 border-r border-white/[0.07] pr-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/30 sm:flex">Session 002</span>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8bcda0] sm:flex"><CircleDot className="h-2.5 w-2.5" /> Sources fresh</span>
            <Menu className="h-4 w-4 text-white/45" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1240px] px-3 py-4 sm:px-6 sm:py-5">
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-0 h-40 w-40 rounded-full bg-[#28543a]/10 blur-[70px]" />
        <AuroraMaxCommandHeader
          eyebrow={<span className="flex items-center gap-2"><Activity className="h-3 w-3" /> Tuesday · August 12</span>}
          title="Research command desk"
          description="Aurora Max system · sample interaction data"
          meta={<div className={`grid border border-white/[0.07] bg-[#0a110d] ${compact ? 'grid-cols-3' : 'grid-cols-3'}`}>
            {[
              { value: '06', label: 'Matchups' },
              { value: '04', label: 'Confirmed' },
              { value: '7:44', label: 'Refreshed' },
            ].map((item, index) => (
              <div key={item.label} className={`min-w-20 px-3 py-2 ${index ? 'border-l border-white/[0.07]' : ''}`}>
                <p className="font-mono text-[13px] font-semibold text-[#e8ebe4]">{item.value}</p>
                <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/25">{item.label}</p>
              </div>
            ))}
          </div>}
        />

        {exportStatus ? <div className="mt-3 flex items-center gap-2 border border-[#8bcda0]/20 bg-[#8bcda0]/[0.07] px-3 py-2 text-[11px] text-[#c9ead3]" role="status"><Check className="h-3.5 w-3.5" /> {exportStatus}</div> : null}

        <div className="mt-4"><Spotlight game={game} compact={compact} saved={savedIds.has(game.id)} onToggleSaved={() => toggleSaved(game.id)} /></div>

        <div className="mt-3">
          <AuroraMaxRankedWorkspace
            title="Daily slate"
            subtitle={`${visibleGames.length} ranked matchups · ${DEMO_GAMES.filter((item) => item.confirmed).length} confirmed`}
            controls={<div className={`flex gap-2 ${compact ? 'grid grid-cols-2 [&>button:last-child]:col-span-2' : 'flex-wrap'}`}>
              <UtilityButton active={confirmedOnly} onClick={() => setConfirmedOnly((value) => !value)}><Filter className="h-3.5 w-3.5" /> {confirmedOnly ? 'Confirmed only' : 'All lineups'}</UtilityButton>
              <UtilityButton onClick={cycleSort}><ArrowDownUp className="h-3.5 w-3.5" /> {SORT_LABELS[sortKey]}</UtilityButton>
              <UtilityButton onClick={exportReceipts}><Download className="h-3.5 w-3.5" /> Export receipts</UtilityButton>
            </div>}
          >
            <SlateQueue games={visibleGames} activeId={activeGameId} compact={compact} savedIds={savedIds} receiptId={receiptId} onSelect={selectGame} onToggleSaved={toggleSaved} onToggleReceipt={(id) => setReceiptId((current) => current === id ? null : id)} />
          </AuroraMaxRankedWorkspace>
        </div>

        <div className="mt-4 grid gap-2 border border-white/[0.07] bg-[#0a110d] p-3 sm:grid-cols-3">
          {[
            { icon: FileCheck2, text: 'Every row keeps its research receipt.' },
            { icon: Clock3, text: 'Freshness is visible at decision time.' },
            { icon: ShieldCheck, text: 'Missing inputs remain explicitly labeled.' },
          ].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-2 text-[10px] text-white/35"><Icon className="h-3.5 w-3.5 text-[#8bcda0]" /> {text}</div>)}
        </div>
      </main>
    </div>
  );
}

export default function AuroraMax() {
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('desktop');

  return (
    <section className="space-y-4" aria-labelledby="aurora-max-title" data-testid="aurora-max-lab">
      <AuroraMaxPanel className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="aurora-max-eyebrow flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Canonical product system</div>
          <h2 id="aurora-max-title" className="mt-1.5 text-xl font-semibold text-white">Aurora Max — Field Desk System</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">The shared visual direction for VouchEdge pages: evidence-first hierarchy, dense utility, quiet glass, and emerald truth states. Data below remains sample content for interaction review.</p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-md border border-white/10 bg-black/30 p-1" aria-label="Preview width">
          <button type="button" onClick={() => setPreviewWidth('desktop')} aria-pressed={previewWidth === 'desktop'} className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-xs font-medium transition-colors ${previewWidth === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><Monitor className="h-3.5 w-3.5" /> Desktop</button>
          <button type="button" onClick={() => setPreviewWidth('mobile')} aria-pressed={previewWidth === 'mobile'} className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-xs font-medium transition-colors ${previewWidth === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><Smartphone className="h-3.5 w-3.5" /> Mobile</button>
        </div>
      </AuroraMaxPanel>

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#020403] p-2 sm:p-3">
        <div className={`mx-auto overflow-hidden rounded-sm border border-white/[0.08] transition-[max-width] duration-300 ${previewWidth === 'mobile' ? 'max-w-[390px]' : 'max-w-[1440px]'}`}>
          <DailyHubConcept compact={previewWidth === 'mobile'} />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-vouch-emerald/15 bg-vouch-emerald/[0.05] p-4">
        <LayoutTemplate className="mt-0.5 h-4 w-4 shrink-0 text-vouch-emerald" />
        <p className="text-xs leading-5 text-white/55"><strong className="text-white/80">System target:</strong> this is now the Aurora Max reference composition. Shared shell, panel, control, focus, typography, and atmosphere contracts are active across routed pages; individual page anatomy migrates through those primitives.</p>
      </div>
    </section>
  );
}
