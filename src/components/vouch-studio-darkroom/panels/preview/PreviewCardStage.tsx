import React from 'react';
import type { CardStyleConfig, VouchStudioDarkroomProps } from '../../types';
import PrimaryStudioCard from './PrimaryStudioCard';
import CompanionStudioCard from './CompanionStudioCard';

interface Props extends VouchStudioDarkroomProps {
  activeStyle: CardStyleConfig;
}

export default function PreviewCardStage(props: Props) {
  const {
    previewScale,
    postSideways,
    showSecondCard,
    activePreviewCardIndex,
  } = props;

  return (
    <div
      className="ve-studio-canvas flex-1 p-3 sm:p-6 lg:p-10 overflow-y-auto lg:max-h-[750px] flex items-center justify-center relative select-none scrollbar-none"
      style={{
        backgroundImage: `radial-gradient(rgba(14, 165, 233, 0.02) 1px, transparent 1px), radial-gradient(rgba(14, 165, 233, 0.01) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        backgroundColor: '#05070c'
      }}
    >
      <div
        className="transition-all duration-300 ease-out origin-center flex flex-col items-center justify-center"
        style={{ transform: `scale(${previewScale})` }}
      >
        <div className="w-full max-w-[620px] bg-ve-graphite border border-white/[0.06] p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-5 relative">
          <div className="hidden sm:flex absolute top-4 left-4 bg-sky-950/40 border border-sky-900/40 rounded-full px-2.5 py-0.5 text-[8px] font-mono text-sky-400 font-black uppercase tracking-wider items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-sky-400 animate-ping" />
            Social Feed Post Frame Size (Max-W: 620px)
          </div>

          <div className="absolute top-4 right-4 flex gap-1.5">
            {showSecondCard && !postSideways && (
              <div className="bg-obsidian-900/80 rounded-full py-0.5 px-2 text-[8px] font-mono text-white/45 font-bold border border-white/10">
                {activePreviewCardIndex === 0 ? "CARD 1 / 2" : "CARD 2 / 2"}
              </div>
            )}
            <span className="bg-emerald-950/50 border border-emerald-900/35 text-emerald-400 rounded-full px-2 py-0.5 text-[7.5px] font-mono font-bold uppercase tracking-wider">
              ★ LIVE STREAM
            </span>
          </div>

          <div className="pt-6 flex flex-col gap-6 w-full relative">
            <div className={`flex ${postSideways && showSecondCard ? 'flex-col xl:flex-row' : 'flex-col'} gap-6 w-full justify-center items-center`}>
              <PrimaryStudioCard {...props} />
              <CompanionStudioCard {...props} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
