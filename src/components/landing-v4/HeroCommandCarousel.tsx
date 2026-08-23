import React, { useCallback, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';

const SCENES = [
  {
    id: '01',
    title: 'CANDIDATE_INTELLIGENCE',
    content: (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-2xl font-bold italic tracking-tighter text-white">PETE ALONSO</h4>
            <p className="text-[10px] font-mono uppercase tracking-tight text-white/40">BAL @ NYM // Citi Field</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-ve-emerald">HRPI 100</div>
            <div className="text-[10px] text-white/20 uppercase">Elite_Tier</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 border border-white/5 rounded-none">
            <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Avg_EV</p>
            <p className="text-lg font-mono text-white">94.1 <span className="text-[10px] text-white/20">MPH</span></p>
          </div>
          <div className="p-3 bg-white/5 border border-white/5 rounded-none">
            <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Barrel_%</p>
            <p className="text-lg font-mono text-white">14.1%</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
            <span className="text-white/40">Evidence_Coverage</span>
            <span className="text-ve-emerald">88%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-ve-emerald w-[88%] shadow-[0_0_10px_#31B583]" />
          </div>
        </div>
      </div>
    )
  },
  {
    id: '02',
    title: 'LIVE_SLATE_MATRIX',
    content: (
      <div className="space-y-3">
        {[
          { p: 'Judge', m: 'NYY@BOS', h: '98', e: '84%' },
          { p: 'Ohtani', m: 'LAD@SF', h: '96', e: '92%' },
          { p: 'Alvarez', m: 'HOU@TEX', h: '92', e: '78%' },
          { p: 'Olson', m: 'ATL@PHI', h: '89', e: '65%' },
        ].map((row, i) => (
          <div key={i} className={`flex items-center justify-between p-2 border-b border-white/5 ${i === 0 ? 'bg-ve-emerald/5 border-ve-emerald/20' : ''}`}>
            <span className="text-[10px] font-bold w-16 text-white">{row.p}</span>
            <span className="text-[8px] font-mono text-white/40 uppercase">{row.m}</span>
            <span className="text-[10px] font-mono text-ve-emerald">{row.h}</span>
            <span className="text-[10px] font-mono text-white/40">{row.e}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: '03',
    title: 'AUDIT_RECEIPT',
    content: (
      <div className="flex flex-col h-full justify-center items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full border border-ve-emerald/30 flex items-center justify-center bg-ve-emerald/5">
          <ShieldCheck className="text-ve-emerald" size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Hypothesis_Locked</h4>
          <p className="text-[9px] font-mono text-white/40 mt-1 uppercase">Timestamp: 2024.08.23_14:02:11_UTC</p>
        </div>
        <div className="p-3 bg-black/40 border border-dashed border-white/10 w-full">
          <p className="text-[9px] font-mono text-white/40 break-all">
            HASH: 8f2b3c9d1a0e5f7b8a9c0d1e2f3a4b5c6d7e8f9a
          </p>
        </div>
        <p className="text-[10px] font-mono text-ve-emerald uppercase tracking-widest">Permanent_Record_Stored</p>
      </div>
    )
  }
];

export default function HeroCommandCarousel() {
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
          {SCENES.map((scene) => (
            <div key={scene.id} className="flex-[0_0_100%] min-w-0 p-5 sm:p-8 h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <span className="text-[10px] font-mono text-ve-emerald uppercase tracking-tighter">{scene.title}</span>
                <span className="text-[10px] font-mono text-white/20">{scene.id} / 03</span>
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
