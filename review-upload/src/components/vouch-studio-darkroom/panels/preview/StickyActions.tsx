import React from 'react';
import { Share2, Tv } from 'lucide-react';
import type { VouchStudioDarkroomProps } from '../../types';

type Props = Pick<
  VouchStudioDarkroomProps,
  'handleSimulateXPost' | 'handlePublishAsFeedPost' | 'isPublishingToFeed'
>;

export default function StickyActions({
  handleSimulateXPost,
  handlePublishAsFeedPost,
  isPublishingToFeed,
}: Props) {
  return (
    <>
          {/* Action Buttons Lightroom Slate Footer — sticky on mobile */}
          <div className="ve-studio-sticky-actions bg-ve-obsidian border-t border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 z-20">
            <div className="text-left hidden sm:block">
              <span className="text-[8.5px] font-mono text-white/40 block uppercase font-bold">Creator Campaign Operations:</span>
              <p className="text-[10px] text-white/45 mt-0.5">Review, verify projections, and publish this Vouch Board directly to the main feed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-3 w-full lg:w-auto">
              <button
                onClick={handleSimulateXPost}
                className="ve-studio-touch-btn min-h-11 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-mono uppercase cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">Share to X</span>
              </button>

              <button
                onClick={handlePublishAsFeedPost}
                disabled={isPublishingToFeed}
                className={`ve-studio-touch-btn min-h-11 py-2.5 px-4 font-mono font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase cursor-pointer ${
                  isPublishingToFeed 
                    ? 'bg-black/25 border border-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
              >
                <Tv className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">{isPublishingToFeed ? 'Publishing...' : 'Publish to Feed'}</span>
              </button>
            </div>
          </div>    </>
  );
}
