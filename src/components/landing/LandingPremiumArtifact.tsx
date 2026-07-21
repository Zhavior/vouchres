import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Flame,
  Home,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import { Z8_INTERACTIVE, Z8_LABEL, Z8_PANEL_PREMIUM } from './LandingTokens';

type WidthId = 'mobile' | 'tablet' | 'desktop';

const ACTIVE_THEME = { accent: '#8FB4CE', accentSoft: 'rgba(143, 180, 206, 0.18)' };

const WIDTHS: Array<{ id: WidthId; label: string; widthPx: number }> = [
  { id: 'mobile', label: '390', widthPx: 390 },
  { id: 'tablet', label: 'Tablet', widthPx: 700 },
  { id: 'desktop', label: 'Desktop', widthPx: 840 },
];

const METRICS = [
  { label: 'Power', value: '100' },
  { label: 'Pitcher vulnerability', value: '53' },
  { label: 'Park factor', value: '112' },
  { label: 'Data confidence', value: '100%' },
];

const EVIDENCE = [
  'Strongest signal. 29 HR this season, .601 SLG — top-decile power.',
  'Matchup. Yamamoto vulnerability 53/100 (HR/9 0.98, K/9 8.62).',
  'Confirmed. In official lineup, batting #2.',
  'Counter-signal. Weather & wind unavailable — not in the model.',
];

function PreviewToggle({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`${Z8_INTERACTIVE} rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
              active ? 'bg-white text-black shadow-[0_8px_22px_rgba(255,255,255,0.12)]' : 'text-white/45 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function MiniBarChart({ accent }: { accent: string }) {
  const bars = [0.42, 0.76, 0.43, 0.44, 0.8, 0.45, 0.72, 0.45, 0.44, 0.86];
  return (
    <div className="flex h-24 items-end gap-2 rounded-2xl border border-white/6 bg-[#0B1323] px-3 py-4">
      {bars.map((height, index) => {
        const active = index === 1 || index === 4 || index === 6 || index === 9;
        return (
          <div key={index} className="relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-sm bg-white/10 transition-all duration-700"
              style={{
                height: `${height * 100}%`,
                background: active ? `linear-gradient(180deg, ${accent}, rgba(49, 181, 131, 0.95))` : undefined,
                boxShadow: active ? `0 0 16px ${accent}33` : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ArtifactSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default function LandingPremiumArtifact() {
  const [width, setWidth] = useState<WidthId>('desktop');
  const [glowIndex, setGlowIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  const [canvasHeight, setCanvasHeight] = useState(0);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGlowIndex((current) => (current + 1) % 4);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const update = () => setCanvasHeight(node.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);
  const activeWidth = useMemo(() => WIDTHS.find((item) => item.id === width) ?? WIDTHS[2], [width]);
  const isMobileSpec = width === 'mobile';
  const previewFrameWidth = useMemo(() => {
    if (viewportWidth < 640) return Math.max(280, viewportWidth - 48);
    if (viewportWidth < 1024) return Math.min(activeWidth.widthPx, viewportWidth - 72);
    return activeWidth.widthPx;
  }, [activeWidth.widthPx, viewportWidth]);
  const previewScale = useMemo(
    () => Math.min(1, previewFrameWidth / activeWidth.widthPx),
    [activeWidth.widthPx, previewFrameWidth],
  );
  const previewStageHeight = canvasHeight > 0 ? canvasHeight * previewScale : undefined;

  return (
    <section className="space-y-6" aria-labelledby="premium-artifact-heading">
      <div className="text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>Product Language</p>
        <h2 id="premium-artifact-heading" className="mx-auto mt-2 max-w-[14ch] text-[1.95rem] font-black leading-[1.05] text-white sm:max-w-none sm:text-3xl">
          The terminal experience, tightened into one system
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          This module now carries the landing direction directly: trust-first research UI, tighter spacing, clearer states, and a shell meant to stay consistent across the product.
        </p>
      </div>

      <div
        className={`relative mx-auto max-w-[980px] overflow-hidden rounded-[32px] border border-white/10 bg-[#060D18] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-6 ${Z8_PANEL_PREMIUM}`}
        style={{
          backgroundImage: `radial-gradient(circle at 10% 10%, ${ACTIVE_THEME.accentSoft}, transparent 28%), radial-gradient(circle at 90% 0%, rgba(255,255,255,0.05), transparent 20%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22%,transparent_78%,rgba(255,255,255,0.025))]" />
        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black text-white">VouchEdge Terminal</p>
              <p className="mt-1 text-xs text-white/35">
                {isMobileSpec ? 'Mobile specimen for the landing system' : 'Production landing module for the VouchEdge system'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">Width</span>
                <PreviewToggle
                  items={WIDTHS.map((item) => ({ id: item.id, label: item.label }))}
                  value={width}
                  onChange={(next) => setWidth(next as WidthId)}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto transition-all duration-500" style={{ width: previewFrameWidth }}>
            <div
              className="relative mx-auto overflow-hidden rounded-[28px] border border-white/8 bg-[#050C17] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-3"
              style={{ minHeight: previewStageHeight }}
            >
              <div
                className="flex justify-center"
                style={{ width: '100%' }}
              >
                <div
                  style={{
                    width: activeWidth.widthPx * previewScale,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    ref={canvasRef}
                    className={`rounded-[24px] border border-white/8 bg-[#08111D] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5 ${isMobileSpec ? 'space-y-5' : 'space-y-7'}`}
                    style={{
                      width: activeWidth.widthPx,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                    }}
                  >
              <div
                className={`rounded-2xl border px-4 text-white/52 transition-all duration-500 ${isMobileSpec ? 'py-3 text-[12px] leading-5' : 'py-4 text-sm leading-relaxed'}`}
                style={{
                  borderColor: `${ACTIVE_THEME.accent}4d`,
                  background: `linear-gradient(180deg, ${ACTIVE_THEME.accent}12 0%, rgba(8,17,29,0.72) 100%)`,
                  boxShadow: `0 0 0 1px ${ACTIVE_THEME.accent}14 inset, 0 0 32px ${ACTIVE_THEME.accent}22`,
                }}
              >
                <span className="font-semibold text-white/72">Theme discipline:</span>{' '}
                {isMobileSpec
                  ? 'accent can change. Surface hierarchy, evidence density, and trust copy stay fixed.'
                  : 'the accent token can change. Surface hierarchy, semantic states, evidence density, and trust copy do not.'}
              </div>

              <ArtifactSection title="Foundations" subtitle="ground · surfaces · text · accent · semantics">
                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-2' : 'md:grid-cols-4'}`}>
                  {[
                    ['Ground', '#050A14'],
                    ['Surface 1', '#0B1220'],
                    ['Surface 2', '#101A2C'],
                    ['Surface 3', '#16233A'],
                  ].map(([label, hex]) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">{label}</p>
                      <p className="mt-6 text-sm font-bold text-white/88">{hex}</p>
                    </div>
                  ))}
                </div>

                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
                  {[
                    ['Accent', ACTIVE_THEME.accent],
                    ['Positive', '#31B583'],
                    ['Caution', '#D99C4A'],
                    ['Negative', '#D96459'],
                  ].map(([label, color]) => (
                    <div key={label} className="overflow-hidden rounded-2xl border border-white/8 bg-[#0B1323]">
                      <div className="h-12" style={{ background: color }} />
                      <div className="p-3">
                        <p className="text-sm font-bold text-white/88">{label}</p>
                        <p className="mt-1 text-xs text-white/32">{color}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-1' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}>
                  <div className="rounded-2xl border border-white/8 p-4" style={{ background: `linear-gradient(180deg, ${ACTIVE_THEME.accent}10 0%, #0B1323 30%)` }}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Text hierarchy</p>
                    <p className={`mt-4 font-black leading-tight text-white ${isMobileSpec ? 'text-[1.3rem]' : 'text-[1.65rem]'}`}>
                      {isMobileSpec ? 'Ben Rice vs Yamamoto' : 'Primary — Ben Rice vs Yamamoto'}
                    </p>
                    <p className={`mt-3 leading-relaxed text-white/56 ${isMobileSpec ? 'text-[13px]' : 'text-sm'}`}>
                      {isMobileSpec
                        ? 'Matchup context and reasoning that carry the call.'
                        : 'Secondary — supporting matchup context and reasoning that carries the explanation.'}
                    </p>
                    <p className="mt-3 text-xs text-white/28">
                      {isMobileSpec ? 'Updated 3m ago · confirmed lineup' : 'Tertiary — updated 3m ago · confirmed lineup · source: MLB API'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 p-4" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, ${ACTIVE_THEME.accent}08 100%)` }}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Borders & live accent</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-white/10 px-3 py-3 text-sm text-white/70">
                        {isMobileSpec ? 'Divider border ' : 'Subtle divider border '}
                        <span className="text-white/30">rgba(255,255,255,.07)</span>
                      </div>
                      <div
                        className="rounded-xl border px-3 py-3 text-sm text-white/88"
                        style={{ borderColor: `${ACTIVE_THEME.accent}73`, boxShadow: `0 0 0 1px ${ACTIVE_THEME.accent}14 inset` }}
                      >
                        {isMobileSpec ? 'Accent border for active surfaces only' : 'Accent/selected border — used only on active surfaces'}
                      </div>
                    </div>
                  </div>
                </div>
              </ArtifactSection>

              {!isMobileSpec && (
              <ArtifactSection title="Controls" subtitle="buttons · navigation · filter chips">
                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Buttons</p>
                    <div className={`mt-4 gap-2 ${isMobileSpec ? 'grid grid-cols-1' : 'flex flex-wrap'}`}>
                      <button
                        type="button"
                        className={`rounded-xl px-4 py-3 text-sm font-bold text-black transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08111D] ${isMobileSpec ? 'w-full' : ''}`}
                        style={{ background: ACTIVE_THEME.accent, boxShadow: `0 10px 30px ${ACTIVE_THEME.accent}2e` }}
                      >
                        {isMobileSpec ? 'Add' : 'Add to slip'}
                      </button>
                      <button type="button" className={`rounded-xl border border-white/12 px-4 py-3 text-sm font-bold text-white/75 transition-[transform,border-color,color] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08111D] ${isMobileSpec ? 'w-full' : ''}`}>Research</button>
                      <button type="button" className={`rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-sm font-bold text-white/22 ${isMobileSpec ? 'w-full' : ''}`}>Disabled</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Navigation</p>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: isMobileSpec ? 'HR Board' : 'HR Intelligence', icon: Search, active: true },
                        { label: 'Live Games', icon: Activity, active: false },
                        { label: isMobileSpec ? 'Parlay' : 'Parlay Builder', icon: BarChart3, active: false },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all duration-300"
                            style={item.active ? { borderColor: `${ACTIVE_THEME.accent}42`, background: ACTIVE_THEME.accentSoft } : { borderColor: 'rgba(255,255,255,0.06)' }}
                          >
                            <Icon size={16} style={{ color: item.active ? ACTIVE_THEME.accent : 'rgba(255,255,255,0.38)' }} />
                            <span className={item.active ? 'font-bold text-white' : 'text-white/56'}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Filter chips</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['Confirmed', 'Preview', 'Elite', 'Strong', 'Watch'].map((chip, index) => (
                        <span
                          key={chip}
                          className="rounded-full border px-3 py-1.5 text-xs font-bold"
                          style={index === glowIndex ? { borderColor: `${ACTIVE_THEME.accent}4d`, background: ACTIVE_THEME.accentSoft, color: ACTIVE_THEME.accent } : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.52)' }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ArtifactSection>
              )}

              <ArtifactSection title="Player intelligence primitives" subtitle="identity · confidence · metrics · evidence">
                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-1' : 'lg:grid-cols-[1.08fr_0.92fr]'}`}>
                  <div className="rounded-2xl border border-white/8 p-4" style={{ background: `linear-gradient(180deg, ${ACTIVE_THEME.accent}0c 0%, #0B1323 34%)` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-black"
                          style={{ borderColor: `${ACTIVE_THEME.accent}36`, color: ACTIVE_THEME.accent, background: ACTIVE_THEME.accentSoft }}
                        >
                          BR
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white">Ben Rice</p>
                          <p className="mt-1 text-xs text-white/40">NYY vs LAD · vs Yoshinobu Yamamoto</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-[#31B58344] bg-[#31B58322] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#31B583]">Confirmed</span>
                    </div>

                    <div className={`mt-5 flex gap-4 ${isMobileSpec ? 'flex-col' : 'flex-col sm:flex-row'}`}>
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/8 bg-black/30">
                        <div
                          className="flex h-18 w-18 flex-col items-center justify-center rounded-full border border-white/10 text-center"
                          style={{ boxShadow: `0 0 0 6px ${ACTIVE_THEME.accent}16`, color: ACTIVE_THEME.accent }}
                        >
                          <span className="text-3xl font-black leading-none">82</span>
                          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/34">Signal</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Model confidence</p>
                        <p className="text-sm leading-relaxed text-white/62">
                          High — driven by <span className="font-bold text-white">power (100)</span> and a vulnerable matchup. Weather unavailable, not factored.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 p-4" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, ${ACTIVE_THEME.accent}08 100%)` }}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Metric rows</p>
                    <div className="mt-4 divide-y divide-white/8">
                      {METRICS.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between py-3 text-sm">
                          <span className="text-white/52">{metric.label}</span>
                          <span className={metric.label === 'Data confidence' ? 'font-bold text-[#31B583]' : 'font-bold text-white'}>{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Structured evidence — not a paragraph</p>
                  <div className="mt-4 divide-y divide-white/8">
                    {EVIDENCE.map((line, index) => (
                      <div key={line} className="flex gap-3 py-3 text-sm text-white/60">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: index === 3 ? '#D99C4A' : ACTIVE_THEME.accent }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <p className={index === 3 ? 'text-[#D99C4A]' : undefined}>{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ArtifactSection>

              {!isMobileSpec && (
              <ArtifactSection title="Chart as decision instrument" subtitle="threshold line · hit / miss · emphasized endpoint">
                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-white">Last 10 · HR</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Line 0.5</p>
                    </div>
                    <div className="mt-4">
                      <MiniBarChart accent={ACTIVE_THEME.accent} />
                    </div>
                    <p className="mt-3 text-sm text-white/48"><span className="font-bold text-[#31B583]">4 of 10</span> cleared 0.5 · most recent game a hit.</p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-white">Last 10 · HR</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Loading</p>
                    </div>
                    <div className="mt-4 flex h-24 items-end gap-3 rounded-2xl border border-white/6 bg-black/15 px-3 py-4">
                      {[0.38, 0.62, 0.4, 0.5, 0.66, 0.39, 0.54].map((height, index) => (
                        <div key={index} className="flex h-full flex-1 items-end">
                          <div className="w-full animate-pulse rounded-sm bg-white/10" style={{ height: `${height * 100}%`, animationDelay: `${index * 120}ms` }} />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-white/32">Fetching game log…</p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-white">Last 10 · HR</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Empty</p>
                    </div>
                    <div className="mt-4 flex h-24 flex-col items-center justify-center rounded-2xl border border-white/6 bg-black/15 text-center">
                      <CircleDot size={18} className="text-white/40" />
                      <p className="mt-3 text-base font-bold text-white/84">No game log yet</p>
                      <p className="mt-2 max-w-[14rem] text-sm text-white/30">Season hasn&apos;t produced enough games to chart.</p>
                    </div>
                  </div>
                </div>
              </ArtifactSection>
              )}

              <ArtifactSection title="Semantic states" subtitle="meaning is fixed — theme cannot alter these">
                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-1' : 'lg:grid-cols-[0.95fr_1.05fr]'}`}>
                  <div className="space-y-2">
                    {[
                      { label: 'Positive', body: 'Pick settled: won · +2.4u', color: '#31B583', icon: CheckCircle2 },
                      { label: 'Caution', body: 'Projected lineup. Awaiting confirmation.', color: '#D99C4A', icon: AlertTriangle },
                      { label: 'Negative', body: 'Pick settled: lost · missing source check', color: '#D96459', icon: ShieldAlert },
                      { label: 'Live', body: 'Bottom 7th · runner on second', color: '#F0536B', icon: Flame },
                    ].map((state) => {
                      const Icon = state.icon;
                      return (
                        <div
                          key={state.label}
                          className={`rounded-2xl border px-4 py-3 ${isMobileSpec ? 'space-y-2' : 'flex items-center gap-3'}`}
                          style={{ borderColor: `${state.color}35`, background: `${state.color}12` }}
                        >
                          <Icon size={16} style={{ color: state.color }} />
                          <div className={isMobileSpec ? 'space-y-1' : 'flex items-center gap-3'}>
                            <span className="text-sm font-bold" style={{ color: state.color }}>{state.label}</span>
                            <span className="text-sm text-white/58">{state.body}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-[#D9645933] bg-[#D9645908] p-5 text-center">
                      <ShieldAlert size={18} className="text-[#D96459]" />
                      <p className="mt-4 text-lg font-black text-[#D96459]">Board verification failed</p>
                      <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-white/38">The slate is live, but the player pool did not pass verification. Retry in a moment.</p>
                      <button type="button" className="mt-4 rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/80 transition-[transform,border-color,color] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08111D]">Retry</button>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#0B1323] px-4 py-4">
                      <span className="rounded-full border border-[#F0536B44] bg-[#F0536B1A] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F0536B]">Live</span>
                      <div>
                        <p className="text-sm font-bold text-white">Brighter live color</p>
                        <p className="text-sm text-white/34">Reserved strictly for in-progress game state — never decorative.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ArtifactSection>

              {!isMobileSpec && (
              <ArtifactSection title="Loading · empty · Pro-locked" subtitle="every surface defines its honest states">
                <div className={`grid gap-3 ${isMobileSpec ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                  <div className="rounded-2xl border border-white/8 bg-[#0B1323] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Skeleton</p>
                    <div className="mt-4 space-y-3">
                      <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/8" />
                      <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/8" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-white/8" />
                      <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/8" />
                    </div>
                  </div>

                  <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#0B1323] p-4 text-center">
                    <Sparkles size={18} className="text-white/50" />
                    <p className="mt-4 text-xl font-black text-white">No active slip yet</p>
                    <p className="mt-3 max-w-[14rem] text-sm leading-relaxed text-white/35">Add a researched signal when you&apos;re ready. Saved context stays visible here.</p>
                  </div>

                  <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#0B1323] p-4 text-center">
                    <Lock size={18} className="text-[#D9C57A]" />
                    <p className="mt-4 text-xl font-black text-white">Pro research</p>
                    <p className="mt-2 text-sm text-white/35">Signal graphs & matchup zones</p>
                    <button
                      type="button"
                      className="mt-4 rounded-xl px-4 py-3 text-sm font-bold text-black transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08111D]"
                      style={{ background: ACTIVE_THEME.accent }}
                    >
                      Unlock Pro
                    </button>
                  </div>
                </div>
              </ArtifactSection>
              )}

              <ArtifactSection title="App chrome" subtitle="sticky action bar · bottom nav · desktop sidebar">
                <div className={`grid gap-4 ${isMobileSpec ? 'grid-cols-1' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>
                  <div className="rounded-[28px] border border-white/8 bg-[#09111D] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Mobile — sticky action bar + bottom nav</p>
                    <div className="mx-auto mt-4 max-w-[300px] rounded-[28px] border border-white/8 bg-[#050B16] shadow-[0_18px_46px_rgba(0,0,0,0.45)]">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-black" style={{ borderColor: `${ACTIVE_THEME.accent}35`, color: ACTIVE_THEME.accent, background: ACTIVE_THEME.accentSoft }}>BR</div>
                            <div>
                              <p className="text-xl font-black text-white">Ben Rice</p>
                              <p className="text-sm text-white/35">HR · over 0.5</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-[#31B58322] px-2 py-1 text-xs font-bold text-[#31B583]">82</span>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-white/48">
                          {isMobileSpec ? 'Decision first. Evidence on tap. Deep research behind it.' : 'Progressive disclosure: decision first, evidence on tap, deep research behind it.'}
                        </p>
                      </div>
                      <div className="border-y border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className={`gap-3 ${isMobileSpec ? 'space-y-3' : 'flex items-center justify-between'}`}>
                          <div>
                            <p className="text-sm font-black text-white">Signal 82 · Elite</p>
                            <p className="mt-1 text-xs text-white/28">Confirmed · fresh</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" className="rounded-xl border border-white/12 px-3 py-2 text-sm font-bold text-white/70 transition-[transform,border-color,color] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B16]">Save</button>
                            <button type="button" className="rounded-xl px-3 py-2 text-sm font-bold text-black transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B16]" style={{ background: ACTIVE_THEME.accent }}>{isMobileSpec ? 'Add' : 'Add to slip'}</button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1 px-3 py-2">
                        {[
                          { label: 'Home', icon: Home },
                          { label: 'Research', icon: Search },
                          { label: 'Build', icon: BarChart3 },
                          { label: 'Live', icon: Activity },
                          { label: 'Profile', icon: UserCircle2 },
                        ].map(({ label, icon: Icon }, index) => {
                          const active = index === 0;
                          return (
                            <div key={label} className="flex flex-col items-center gap-1 rounded-xl px-1 py-2">
                              <Icon size={14} style={{ color: active ? ACTIVE_THEME.accent : 'rgba(255,255,255,0.28)' }} />
                              <span className="text-[8px]" style={{ color: active ? ACTIVE_THEME.accent : 'rgba(255,255,255,0.28)' }}>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {!isMobileSpec && (
                  <div className="rounded-2xl border border-white/8 bg-[#09111D] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Desktop — sidebar shell</p>
                    <div className="mt-4 grid min-h-[290px] grid-cols-[0.82fr_1fr] overflow-hidden rounded-[24px] border border-white/8 bg-[#050B16]">
                      <div className="border-r border-white/8 p-4">
                        <p className="text-xl font-black text-white">VouchEdge</p>
                        <div className="mt-5 space-y-2">
                          {[
                            { label: 'Home', icon: Home, active: true },
                            { label: 'Research', icon: Search, active: false },
                            { label: 'Build', icon: BarChart3, active: false },
                            { label: 'Live', icon: Activity, active: false },
                            { label: 'Profile', icon: UserCircle2, active: false },
                          ].map(({ label, icon: Icon, active }) => {
                            return (
                              <div
                                key={label}
                                className="flex items-center gap-3 rounded-xl border px-3 py-3"
                                style={active ? { borderColor: `${ACTIVE_THEME.accent}42`, background: ACTIVE_THEME.accentSoft } : { borderColor: 'transparent' }}
                              >
                                <Icon size={16} style={{ color: active ? ACTIVE_THEME.accent : 'rgba(255,255,255,0.38)' }} />
                                <span className={active ? 'font-bold text-white' : 'text-white/56'}>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Today&apos;s top signal</p>
                        <div className="mt-4 flex gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-black" style={{ borderColor: `${ACTIVE_THEME.accent}35`, color: ACTIVE_THEME.accent, background: ACTIVE_THEME.accentSoft }}>BR</div>
                          <div>
                            <p className="text-2xl font-black text-white">Ben Rice</p>
                            <p className="text-sm text-white/35">NYY vs LAD</p>
                          </div>
                        </div>
                        <div className="mt-5 flex gap-2">
                          <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: `${ACTIVE_THEME.accent}4d`, background: ACTIVE_THEME.accentSoft, color: ACTIVE_THEME.accent }}>Confirmed</span>
                          <span className="rounded-full border border-white/8 px-3 py-1.5 text-xs font-bold text-white/44">Elite</span>
                        </div>
                        <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
                          <p className="text-sm leading-relaxed text-white/48">
                            This shell is designed to merge cleanly into the real product, not sit beside it as a separate design exercise.
                          </p>
                          <button
                            type="button"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-black transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B16]"
                            style={{ background: ACTIVE_THEME.accent }}
                          >
                            Open research
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </ArtifactSection>

              <div
                className={`rounded-2xl border px-4 py-4 leading-relaxed text-white/36 ${isMobileSpec ? 'text-[12px]' : 'text-sm'}`}
                style={{ borderColor: `${ACTIVE_THEME.accent}2e`, background: `${ACTIVE_THEME.accent}0f` }}
              >
                {isMobileSpec
                  ? 'This mobile specimen now reflects the landing direction for the real product shell.'
                  : 'This landing module now carries the same premium system language we want across the rest of the VouchEdge shell.'}
              </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
