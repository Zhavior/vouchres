import React from 'react';
import type { VouchStudioDarkroomProps } from '../types';
import PresetSection from './controls/PresetSection';
import RosterSection from './controls/RosterSection';
import PromoSection from './controls/PromoSection';
import RationaleSection from './controls/RationaleSection';

interface Props extends VouchStudioDarkroomProps {
  showControlsPanel: boolean;
}

export default function StudioControlsPanel({ showControlsPanel, ...props }: Props) {
  return (
    <div className={`lg:col-span-4 bg-ve-obsidian flex flex-col h-full overflow-y-auto lg:max-h-[850px] scrollbar-thin ${showControlsPanel ? 'flex' : 'hidden lg:flex'}`}>
      <PresetSection {...props} />
      <RosterSection {...props} />
      <PromoSection {...props} />
      <RationaleSection {...props} />
    </div>
  );
}
