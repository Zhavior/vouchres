import React from 'react';
import type { VouchStudioDarkroomProps } from './vouch-studio-darkroom/types';
import { cardStyleConfigs } from './vouch-studio-darkroom/utils/cardStyleConfigs';
import { useStudioLayout } from './vouch-studio-darkroom/hooks/useStudioLayout';
import StudioToolbar from './vouch-studio-darkroom/panels/StudioToolbar';
import MobileStudioTabs from './vouch-studio-darkroom/panels/MobileStudioTabs';
import StudioControlsPanel from './vouch-studio-darkroom/panels/StudioControlsPanel';
import StudioPreviewCanvas from './vouch-studio-darkroom/panels/StudioPreviewCanvas';

export type { CustomPlayerSelection, VouchStudioDarkroomProps } from './vouch-studio-darkroom/types';

export default function VouchStudioDarkroom(props: VouchStudioDarkroomProps) {
  const activeStyle = cardStyleConfigs[props.cardStyle];
  const {
    mobileStudioView,
    setMobileStudioView,
    showControlsPanel,
    showPreviewPanel,
  } = useStudioLayout();

  return (
    <div className="ve-studio-editor bg-ve-obsidian border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-0 lg:min-h-[820px] w-full text-left" id="lightroom-darkroom-studio">
      <StudioToolbar
        selectedPlayers={props.selectedPlayers}
        setSelectedPlayers={props.setSelectedPlayers}
        setCardStyle={props.setCardStyle}
        setActiveCardLayout={props.setActiveCardLayout}
        setCustomCardPhoto={props.setCustomCardPhoto}
        setCustomCardPhotoLabel={props.setCustomCardPhotoLabel}
        setReasonsText={props.setReasonsText}
        setShowWinRate={props.setShowWinRate}
        setShowDailyWinRate={props.setShowDailyWinRate}
        setShowMonthlyWinRate={props.setShowMonthlyWinRate}
        setShowMlbPicks={props.setShowMlbPicks}
        setShowProBadge={props.setShowProBadge}
        setShowUnitsProfit={props.setShowUnitsProfit}
        setShowBestParlay={props.setShowBestParlay}
        setShowCoupon={props.setShowCoupon}
        setShowCharts={props.setShowCharts}
        setShowLogo={props.setShowLogo}
        setShowReasons={props.setShowReasons}
        triggerToast={props.triggerToast}
      />

      <MobileStudioTabs
        mobileStudioView={mobileStudioView}
        setMobileStudioView={setMobileStudioView}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-900">
        <StudioControlsPanel {...props} showControlsPanel={showControlsPanel} />
        <StudioPreviewCanvas {...props} showPreviewPanel={showPreviewPanel} activeStyle={activeStyle} />
      </div>
    </div>
  );
}
