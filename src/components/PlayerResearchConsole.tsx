import React from 'react';
import { Z8_PAGE, Z8_PAGE_GAP, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y } from '../theme/z8Tokens';
import type { PlayerResearchConsoleProps } from './player-research-console/types';
import { usePlayerResearchConsole } from './player-research-console/hooks/usePlayerResearchConsole';
import ConsoleHeader from './player-research-console/panels/ConsoleHeader';
import RosterSearchPanel from './player-research-console/panels/RosterSearchPanel';
import ComparePanel from './player-research-console/panels/ComparePanel';
import DossierPanel from './player-research-console/panels/DossierPanel';

export type { PlayerResearchConsoleProps } from './player-research-console/types';

export default function PlayerResearchConsole(props: PlayerResearchConsoleProps) {
  const model = usePlayerResearchConsole(props);
  const { toastMessage, compareMode } = model;

  return (
    <div className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} max-w-none mx-auto font-z8`} id="player-research-console-root">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/92 border-2 border-vouch-emerald/50 text-white px-5 py-4 rounded-2xl shadow-vouch-emerald/10 shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className="w-2.5 h-2.5 bg-vouch-emerald rounded-full animate-ping" />
          <span className="font-extrabold text-xs font-mono uppercase tracking-wide">{toastMessage}</span>
        </div>
      )}

      <ConsoleHeader model={model} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="bento-console-grid">
        <RosterSearchPanel model={model} />

        <div className="col-span-1 lg:col-span-8 space-y-8" id="console-research-content">
          {compareMode ? (
            <ComparePanel model={model} />
          ) : (
            <DossierPanel model={model} />
          )}
        </div>
      </div>
    </div>
  );
}
