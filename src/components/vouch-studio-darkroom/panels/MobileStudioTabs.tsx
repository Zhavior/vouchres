import React from 'react';
import { Eye, SlidersHorizontal } from 'lucide-react';
import { AURORA_ACTIVE, AURORA_IDLE } from '../../../theme/auroraTokens';

interface Props {
  mobileStudioView: 'preview' | 'edit';
  setMobileStudioView: (view: 'preview' | 'edit') => void;
}

export default function MobileStudioTabs({ mobileStudioView, setMobileStudioView }: Props) {
  return (
    <>
      {/* Mobile: swipe-friendly Preview / Edit tabs */}
      <div className="lg:hidden grid grid-cols-2 gap-2 p-3 bg-ve-obsidian border-b border-white/10" id="ve-studio-mobile-tabs">
        {([
          { id: 'preview' as const, label: 'Preview', icon: Eye },
          { id: 'edit' as const, label: 'Customize', icon: SlidersHorizontal },
        ]).map((tab) => {
          const active = mobileStudioView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileStudioView(tab.id)}
              className={`ve-studio-touch-btn flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                active ? AURORA_ACTIVE : AURORA_IDLE
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>    </>
  );
}
