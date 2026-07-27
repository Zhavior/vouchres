import React from 'react';
import type { VouchStudioDarkroomProps } from '../../types';

type Props = Pick<
  VouchStudioDarkroomProps,
  | 'showSecondCard'
  | 'setShowSecondCard'
  | 'postSideways'
  | 'setPostSideways'
  | 'previewScale'
  | 'setPreviewScale'
>;

export default function CanvasHeader({
  showSecondCard,
  setShowSecondCard,
  postSideways,
  setPostSideways,
  previewScale,
  setPreviewScale,
}: Props) {
  return (
    <>
          {/* Canvas Header Toolbar */}
          <div className="bg-ve-obsidian/90 border-b border-white/10 px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <div className="flex bg-ve-storm p-0.5 rounded-lg border border-slate-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSecondCard(false)}
                  className={`ve-studio-touch-btn px-3 py-2 min-h-11 text-[9px] sm:text-[8.5px] font-mono font-bold rounded transition-all ${
                    !showSecondCard ? 'bg-sky-950 text-sky-300 font-black' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  Single Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondCard(true);
                    setPostSideways(true);
                  }}
                  className={`ve-studio-touch-btn px-3 py-2 min-h-11 text-[9px] sm:text-[8.5px] font-mono font-bold rounded transition-all ${
                    showSecondCard && postSideways ? 'bg-sky-950 text-sky-300 font-black' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  Dual Grid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondCard(true);
                    setPostSideways(false);
                  }}
                  className={`ve-studio-touch-btn px-3 py-2 min-h-11 text-[9px] sm:text-[8.5px] font-mono font-bold rounded transition-all ${
                    showSecondCard && !postSideways ? 'bg-sky-950 text-sky-300 font-black' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  Dual Slide
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[8.5px] text-white/45">
                <span>ZOOM:</span>
                <span className="text-sky-400 font-black bg-sky-950/40 border border-sky-900/30 px-1.5 rounded">{Math.round(previewScale * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.15" 
                step="0.05" 
                value={previewScale}
                onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                className="flex-1 sm:w-24 min-h-11 sm:min-h-0 bg-obsidian-700 rounded-lg cursor-pointer accent-sky-500" 
              />
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setPreviewScale(0.65)} className="ve-studio-touch-btn min-h-11 min-w-11 px-2 text-[9px] font-mono bg-black/25 border border-white/10 rounded-lg hover:text-white/80">S</button>
                <button onClick={() => setPreviewScale(0.85)} className="ve-studio-touch-btn min-h-11 min-w-11 px-2 text-[9px] font-mono bg-black/25 border border-white/10 rounded-lg hover:text-white/80">M</button>
                <button onClick={() => setPreviewScale(1.0)} className="ve-studio-touch-btn min-h-11 min-w-11 px-2 text-[9px] font-mono bg-black/25 border border-white/10 rounded-lg hover:text-white/80">1:1</button>
              </div>
            </div>
          </div>    </>
  );
}
