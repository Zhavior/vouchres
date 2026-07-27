import React from 'react';
import type { CardStyleConfig, VouchStudioDarkroomProps } from '../types';
import CanvasHeader from './preview/CanvasHeader';
import PreviewCardStage from './preview/PreviewCardStage';
import StickyActions from './preview/StickyActions';

interface Props extends VouchStudioDarkroomProps {
  showPreviewPanel: boolean;
  activeStyle: CardStyleConfig;
}

export default function StudioPreviewCanvas({ showPreviewPanel, activeStyle, ...props }: Props) {
  return (
    <div className={`lg:col-span-8 bg-ve-obsidian flex flex-col h-full min-h-0 lg:min-h-[750px] relative ${showPreviewPanel ? 'flex' : 'hidden lg:flex'}`}>
      <CanvasHeader
        showSecondCard={props.showSecondCard}
        setShowSecondCard={props.setShowSecondCard}
        postSideways={props.postSideways}
        setPostSideways={props.setPostSideways}
        previewScale={props.previewScale}
        setPreviewScale={props.setPreviewScale}
      />
      <PreviewCardStage {...props} activeStyle={activeStyle} />
      <StickyActions
        handleSimulateXPost={props.handleSimulateXPost}
        handlePublishAsFeedPost={props.handlePublishAsFeedPost}
        isPublishingToFeed={props.isPublishingToFeed}
      />
    </div>
  );
}
