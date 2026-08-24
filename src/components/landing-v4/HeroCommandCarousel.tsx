import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  useLandingTelemetry,
  type LandingCandidate,
  type TelemetryMode,
} from '../../hooks/public/useLandingTelemetry';
import { TelemetryModeChip } from './TelemetryStatus';
import { MODE_COPY, slateLabel } from './telemetryStatusCopy';

/**
 * Every cell here is API-backed or explicitly absent — the value is never
 * invented. What changed is the absent case: a bare dash under a live banner
 * read as a bug, so a missing figure now names the feed that owes it.
 */
function Cell({
  value,
  suffix,
  missing = 'NO FEED',
}: {
  value: string | number | null;
  suffix?: string;
  missing?: string;
}) {
  if (value == null) return <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">{missing}</span>;
  return (
    <>
      {value}
      {suffix && <span className="text-[10px] text-white/20"> {suffix}</span>}
    </>
  );
}

function pct(value: number | null): string | null {
  return value == null ? null : `${(value * 100).toFixed(1)}%`;
}

/**
 * Confidence tier as a 4-step ladder.
 *
 * This replaced a percentage bar fed by `dataConfidence`, which does not
 * discriminate between players: on a live 120-row board, 110 rows carried
 * exactly 90, the remaining 10 scattered 75-87 with no relationship to
 * hrScore, and confirmed rows all read 100. It encodes lineup status, not
 * evidence coverage — so rendering it as a per-player "Evidence_Coverage"
 * percentage claimed a precision the field does not have.
 *
 * `confidenceTier` genuinely varies (elite 14 / strong 26 / watchlist 50 /
 * thin 30 on that same board), and it is categorical, so it is drawn as
 * discrete steps rather than a continuous bar.
 */
const TIER_LADDER = ['thin', 'watchlist', 'strong', 'elite'] as const;

function TierMeter({ tier }: { tier: string | null }) {
  const index = tier ? TIER_LADDER.indexOf(tier.toLowerCase() as (typeof TIER_LADDER)[number]) : -1;
  return (
    <div className="flex gap-1" aria-label={tier ? `Confidence tier ${tier}` : 'Confidence tier unavailable'}>
      {TIER_LADDER.map((step, i) => (
        <span
          key={step}
          className={`h-1 flex-1 transition-colors duration-500 ${
            index >= 0 && i <= index ? 'bg-ve-emerald' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

function buildScenes(
  top: LandingCandidate | null,
  rows: LandingCandidate[],
  generatedAt: string | null,
  contractVersion: string | null,
  mode: TelemetryMode,
  slateDate: string | null,
) {
  const modeCopy = MODE_COPY[mode];
  const replayFrom = mode === 'replay' ? slateLabel(slateDate) : null;
  return [
    {
      id: '01',
      title: 'CANDIDATE_INTELLIGENCE',
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-2xl font-bold italic tracking-tighter text-white">
                {top ? top.playerName.toUpperCase() : 'BOARD OFFLINE'}
              </h4>
              <p className="truncate text-[10px] font-mono uppercase tracking-tight text-white/40">
                {top
                  ? `${top.teamAbbrev} @ ${top.opponent} // ${top.venue ?? 'Venue TBD'}`
                  : 'No slate answered in the last seven days'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs font-mono text-ve-emerald">
                HRPI <Cell value={top?.hrScore ?? null} />
              </div>
              <div className="text-[10px] uppercase text-white/20">
                {top?.confidenceTier ? `${top.confidenceTier}_Tier` : modeCopy.chip}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-none">
              <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Avg_EV</p>
              <p className="text-lg font-mono text-white">
                <Cell value={top?.avgExitVelo != null ? top.avgExitVelo.toFixed(1) : null} suffix="MPH" />
              </p>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-none">
              <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Barrel_%</p>
              <p className="text-lg font-mono text-white">
                <Cell value={pct(top?.barrelRate ?? null)} />
              </p>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-none">
              <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Park_Factor</p>
              <p className="text-lg font-mono text-white">
                <Cell value={top?.parkFactor ?? null} />
              </p>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-none">
              <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Opposing_SP</p>
              <p className="truncate text-sm font-mono text-white">
                <Cell value={top?.opposingPitcher ?? null} missing="NOT POSTED" />
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
              <span className="text-white/40">Confidence_Tier</span>
              <span className="text-ve-emerald">
                <Cell value={top?.confidenceTier ? top.confidenceTier.toUpperCase() : null} />
              </span>
            </div>
            <TierMeter tier={top?.confidenceTier ?? null} />
          </div>
        </div>
      ),
    },
    {
      id: '02',
      title: 'LIVE_SLATE_MATRIX',
      content: (
        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="py-8 text-center text-[10px] font-mono uppercase tracking-widest text-white/30">
              {modeCopy.chip} · {modeCopy.detail}
            </p>
          )}
          {rows.map((row, i) => (
            <div
              key={row.playerId || row.playerName}
              className={`flex items-center justify-between gap-2 p-2 border-b border-white/5 ${
                i === 0 ? 'bg-ve-emerald/5 border-ve-emerald/20' : ''
              }`}
            >
              <span className="w-16 shrink-0 truncate text-[10px] font-bold text-white">
                {row.playerName.split(' ').slice(-1)[0]}
              </span>
              <span className="truncate text-[8px] font-mono uppercase text-white/40">
                {row.teamAbbrev}@{row.opponent}
              </span>
              <span className="text-[10px] font-mono tabular-nums text-ve-emerald">
                <Cell value={row.hrScore} />
              </span>
              <span className="w-16 shrink-0 text-right text-[9px] font-mono uppercase tracking-wider text-white/40">
                <Cell value={row.confidenceTier ?? null} />
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: '03',
      title: 'AUDIT_RECEIPT',
      content: (
        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ve-emerald/30 bg-ve-emerald/5">
            <ShieldCheck className="text-ve-emerald" size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              {replayFrom ? `Board_Locked · ${replayFrom}` : 'Board_Locked'}
            </h4>
            <p className="mt-1 text-[9px] font-mono uppercase text-white/40">
              {generatedAt
                ? `Generated: ${new Date(generatedAt).toISOString().replace('T', '_').slice(0, 19)}_UTC`
                : 'No board generated for this slate'}
            </p>
          </div>
          {/*
            This panel used to print a fabricated 40-char SHA and a 2024
            timestamp. The board does not publish a content hash, so it reports
            the contract version it actually returned instead of inventing one.
          */}
          <div className="w-full border border-dashed border-white/10 bg-black/40 p-3">
            <p className="break-all text-[9px] font-mono text-white/40">
              CONTRACT: {contractVersion ?? 'NOT PUBLISHED'}
            </p>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-ve-emerald">
            Permanent_Record_Stored
          </p>
        </div>
      ),
    },
  ];
}

export default function HeroCommandCarousel() {
  const { topCandidates, generatedAt, contractVersion, mode, slateDate } = useLandingTelemetry();
  const scenes = useMemo(
    () => buildScenes(topCandidates[0] ?? null, topCandidates, generatedAt, contractVersion, mode, slateDate),
    [topCandidates, generatedAt, contractVersion, mode, slateDate],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 7000 })]);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Embla's own ref, plus our own handle on the same node.
  const setViewport = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      emblaRef(node);
    },
    [emblaRef],
  );

  /*
   * Embla caches slide geometry at init. Here it was measuring before the slide
   * box settled, which parked the track at a constant translateX(-32px) at every
   * viewport width — two scenes visible at once and the active one clipped 31px
   * off its left edge. Re-measuring after mount snaps it flush, and the observer
   * keeps it correct across rotation and breakpoint changes (Embla listens to
   * element resize, not the window `resize` event, so this is the reliable hook).
   */
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();

    const node = viewportRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => emblaApi.reInit());
    observer.observe(node);
    return () => observer.disconnect();
  }, [emblaApi]);

  return (
    <div className="relative group">
      <div className="overflow-hidden bg-[#0A0A0A]/40 backdrop-blur-xl border border-white/10" ref={setViewport}>
        <div className="flex">
          {scenes.map((scene) => (
            <div key={scene.id} className="flex-[0_0_100%] min-w-0 p-5 sm:p-8 h-[400px] flex flex-col">
              <div className="mb-6 flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-mono uppercase tracking-tighter text-ve-emerald">{scene.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <TelemetryModeChip mode={mode} />
                  <span className="text-[10px] font-mono text-white/20">{scene.id} / 03</span>
                </div>
              </div>
              <div className="flex-1">{scene.content}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute -bottom-12 right-0 flex gap-2">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous scene"
          className="flex h-11 w-11 items-center justify-center border border-white/5 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald sm:h-9 sm:w-9"
        >
          <ChevronLeft size={16} className="text-white/40" />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next scene"
          className="flex h-11 w-11 items-center justify-center border border-white/5 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald sm:h-9 sm:w-9"
        >
          <ChevronRight size={16} className="text-white/40" />
        </button>
      </div>
    </div>
  );
}
