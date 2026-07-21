import React from 'react';
import { AlertCircle } from 'lucide-react';
import TrendingVouchesPanel from './TrendingVouchesPanel';
import ProofBuildersPanel from './ProofBuildersPanel';
import HotMarketsPanel from './HotMarketsPanel';

import { FeedPost, CreatorProofProfile, Vouch } from '../../types';
import { VECard } from '../../components/ui/ve';

interface FeedRightRailProps {
  posts: FeedPost[];
  profile: CreatorProofProfile;
  savedVouchIds: string[];
  onSaveVouch: (vouch: Vouch) => void;
}

export default function FeedRightRail({
  posts,
  profile,
  savedVouchIds,
  onSaveVouch,
}: FeedRightRailProps) {
  return (
    <aside className="font-z8 hidden xl:flex flex-col gap-4 w-[290px] py-4 overflow-y-auto no-scrollbar max-h-screen sticky top-0 px-3 border-l border-white/[0.08]" id="feed-right-rail">
      

      {/* 2. Hot MLB Markets Selection */}
      <HotMarketsPanel onQuickVouch={onSaveVouch} savedVouchIds={savedVouchIds} />

      {/* 2. Trending Vouches Derived from local state */}
      <TrendingVouchesPanel posts={posts} onSaveVouch={onSaveVouch} savedVouchIds={savedVouchIds} />

      {/* 3. Top Proof Builders (Transparent statistics) */}
      <ProofBuildersPanel profile={profile} />

      {/* 4. Risk Reminder Plate */}
      <VECard className="border-rose-400/15" id="risk-reminder-plate">
        <div className="flex gap-2.5 items-start">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-400 mb-1">Responsible Trading Alert</h4>
            <p className="text-white/40 leading-relaxed font-medium">
              No guaranteed wins. Parlays increase risk and compound volatility. Please track responsibly.
            </p>
          </div>
        </div>
      </VECard>

    </aside>
  );
}
