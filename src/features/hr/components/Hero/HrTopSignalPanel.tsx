import type { CSSProperties } from 'react';
import { ArrowRight, Check, Cloud, Crosshair, Gauge, Heart, Landmark, Plus, Shield, ShieldAlert, Users, Zap } from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrBoardFreshness } from '../../utils/hrDecisionBrief';

interface HrTopSignalPanelProps {
  player: HrWatchRow | null;
  freshness: HrBoardFreshness;
  generatedAt: Date | null;
  dateLabel: string;
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  onTogglePlayerVouch?: (player: HrWatchRow) => void;
  onOpenBuild: () => void;
  playerVouchCount?: number;
  playerVouchedByViewer?: boolean;
  playerVouchPending?: boolean;
}

function numberLabel(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '-' : String(Math.round(value));
}

function updatedLabel(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(value);
}

function EvidenceList({ items, emptyLabel, warning = false }: { items: string[]; emptyLabel: string; warning?: boolean }) {
  const visible = items.filter((item) => item.trim().length > 0).slice(0, 3);
  return (
    <div className="mt-3 space-y-3">
      {(visible.length > 0 ? visible : [emptyLabel]).map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-start gap-2.5">
          {warning ? <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00ff94]" />}
          <p className="text-[12px] leading-5 text-white/65">{item}</p>
        </div>
      ))}
    </div>
  );
}

function MetricCell({ label, value, detail, icon }: { label: string; value: string; detail: string; icon?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-t border-white/[0.08] px-4 py-3 first:border-l-0 lg:border-l lg:border-t-0">
      {icon ? <div className="shrink-0 text-[#00f0ff]">{icon}</div> : null}
      <div className="min-w-0">
        <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.09em] text-white/40">{label}</p>
        <p className="mt-1 truncate text-[17px] font-black leading-none text-white">{value}</p>
        <p className="mt-1 truncate text-[9px] text-[#75ffc5]/75">{detail}</p>
      </div>
    </div>
  );
}

export function HrTopSignalPanel({
  player,
  freshness,
  generatedAt,
  dateLabel,
  onResearch,
  onAddToSlip,
  onTogglePlayerVouch,
  onOpenBuild,
  playerVouchCount = 0,
  playerVouchedByViewer = false,
  playerVouchPending = false,
}: HrTopSignalPanelProps) {
  if (!player) {
    return (
      <section className="z8-hr-judge-hero flex min-h-44 items-center justify-center border border-white/10 p-6 text-center">
        <div><Crosshair className="mx-auto h-6 w-6 text-white/25" /><p className="mt-3 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Scanning today&apos;s slate</p></div>
      </section>
    );
  }

  const lineupValue = player.truthStatus === 'official' ? 'Confirmed' : player.truthStatus === 'projected' ? 'Projected' : 'Unverified';
  const lineupDetail = player.truthStatus === 'official' ? 'Official order posted' : 'Awaiting official order';
  const weatherValue = player.weather == null ? 'Unavailable' : `${Math.round(player.weather)}/100`;
  const weatherDetail = player.weather == null ? 'Not provided' : 'Model weather context';
  const canAdd = Boolean(onAddToSlip) && player.playerId != null && player.truthStatus !== 'blocked';

  return (
    <section className="space-y-3">
      <div className="z8-hr-judge-hero overflow-hidden border border-[#00f0ff]/18">
        <div className="grid lg:grid-cols-[minmax(300px,1.2fr)_150px_minmax(220px,1fr)_minmax(220px,1fr)_190px]">
          <div className="relative flex min-w-0 items-center gap-4 border-b border-white/[0.08] px-5 py-5 lg:border-b-0 lg:border-r">
            <div className="absolute left-5 top-4 font-mono text-[9px] font-black uppercase tracking-[0.1em] text-[#00f0ff]">Today&apos;s top signal</div>
            <div className="z8-hr-judge-hero__headshot mt-5 flex h-[104px] w-[104px] shrink-0 items-end justify-center overflow-hidden">
              <PlayerHeadshot name={player.playerName} playerId={player.playerId} headshotUrl={player.headshotUrl} size={98} priority />
            </div>
            <div className="mt-5 min-w-0">
              <h2 className="truncate text-[24px] font-black uppercase tracking-[-0.03em] text-white">{player.playerName}</h2>
              <p className="mt-2 truncate text-[12px] font-semibold text-white/58"><span className="text-[#00ff94]">{player.team}</span> vs {player.opponent} <span className="mx-1.5 text-white/20">/</span> vs {player.pitcherName || 'pitcher unavailable'}</p>
              <span className="mt-2 inline-flex border border-white/12 bg-black/30 px-2 py-1 font-mono text-[9px] font-bold text-white/50">{lineupValue}</span>
            </div>
          </div>

          <div className="flex items-center justify-center border-b border-white/[0.08] p-4 lg:border-b-0 lg:border-r">
            <div className="z8-hr-judge-score-ring flex h-[116px] w-[116px] items-center justify-center rounded-full" style={{ '--hr-score': `${Math.max(0, Math.min(100, player.hrScore))}%` } as CSSProperties}>
              <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-[#061015] shadow-[inset_0_0_24px_rgba(0,0,0,.65)]">
                <strong className="font-mono text-[38px] leading-none text-white">{Math.round(player.hrScore)}</strong>
                <span className="mt-1 font-mono text-[9px] font-black text-[#00f0ff]">Signal Score</span>
                <span className="font-mono text-[8px] text-[#00f0ff]/65">/100</span>
              </div>
            </div>
          </div>

          <div className="border-b border-white/[0.08] px-5 py-5 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[#00ff94]">Why it matters</p>
            <EvidenceList items={player.reasons} emptyLabel="No verified rationale was supplied for this signal." />
          </div>

          <div className="border-b border-white/[0.08] px-5 py-5 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-amber-300">What could change</p>
            <EvidenceList items={player.warnings} emptyLabel="Verify the lineup and market before saving." warning />
          </div>

          <div className="flex flex-col justify-center gap-3 p-5">
            <button type="button" onClick={() => onResearch(player)} className="flex min-h-11 items-center justify-center gap-2 border border-[#00f0ff]/60 bg-[#00f0ff]/15 px-3 text-[12px] font-black text-white transition hover:bg-[#00f0ff]/22">
              Research Player <ArrowRight className="h-4 w-4 text-[#00f0ff]" />
            </button>
            <button
              type="button"
              onClick={() => onTogglePlayerVouch?.(player)}
              disabled={playerVouchPending || !onTogglePlayerVouch}
              className={`flex min-h-11 items-center justify-center gap-2 border px-3 text-[12px] font-black transition ${
                playerVouchedByViewer
                  ? 'border-vouch-emerald/45 bg-vouch-emerald/12 text-vouch-emerald'
                  : 'border-white/15 bg-black/25 text-white/72 hover:border-vouch-emerald/40 hover:text-[#75ffc5]'
              } disabled:cursor-not-allowed disabled:opacity-55`}
            >
              <Heart className={`h-4 w-4 ${playerVouchedByViewer ? 'fill-current' : ''}`} />
              {playerVouchedByViewer ? 'Vouched' : 'Vouch Player'}
              <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60">
                {playerVouchPending ? '...' : playerVouchCount}
              </span>
            </button>
            <button type="button" onClick={() => canAdd ? onAddToSlip?.(player) : onOpenBuild()} className="flex min-h-11 items-center justify-center gap-2 border border-white/15 bg-black/25 px-3 text-[12px] font-bold text-white/72 transition hover:border-[#00ff94]/40 hover:text-[#75ffc5]">
              <Plus className="h-4 w-4" /> Add to Slip
            </button>
          </div>
        </div>
      </div>

      <div className="z8-hr-judge-metrics grid overflow-hidden border border-white/[0.09] sm:grid-cols-2 lg:grid-cols-7">
        <MetricCell label="Power" value={numberLabel(player.hitterPower)} detail="Batter profile" icon={<Zap className="h-5 w-5" />} />
        <MetricCell label="Pitcher vulnerability" value={numberLabel(player.pitcherVulnerability)} detail={player.pitcherName || 'Unavailable'} icon={<Shield className="h-5 w-5" />} />
        <MetricCell label="Park factor" value={numberLabel(player.parkFactor)} detail={player.venue || 'Venue unavailable'} icon={<Landmark className="h-5 w-5" />} />
        <MetricCell label="Lineup status" value={lineupValue} detail={lineupDetail} icon={<Users className="h-5 w-5" />} />
        <MetricCell label="Weather" value={weatherValue} detail={weatherDetail} icon={<Cloud className="h-5 w-5" />} />
        <MetricCell label="Data confidence" value={player.dataConfidence == null ? '-' : `${Math.round(player.dataConfidence)}%`} detail={freshness} icon={<Gauge className="h-5 w-5" />} />
        <MetricCell label="Updated" value={updatedLabel(generatedAt)} detail={dateLabel} />
      </div>
    </section>
  );
}
