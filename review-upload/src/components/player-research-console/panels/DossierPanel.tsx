import React, { Suspense, lazy } from 'react';
import type { PlayerResearchModel } from "../hooks/usePlayerResearchConsole";
import DossierModeToggle from './dossier/DossierModeToggle';
import SaberHeroPanel from './dossier/SaberHeroPanel';
import MetricsBento from './dossier/MetricsBento';
import ScoutingBento from './dossier/ScoutingBento';
import PropsHealthBento from './dossier/PropsHealthBento';
import GameLogsPanel from './dossier/GameLogsPanel';

const PokemonPlayerCard = lazy(() => import('../../PokemonPlayerCard'));

export default function DossierPanel({ model }: { model: PlayerResearchModel }) {
  const { dossierMode, activePlayer, activeLegs, handleWagerProposition, savedVouchIds } = model;

  return (
    <div className="space-y-8" id="individual-roster-dossier">
      <DossierModeToggle model={model} />

      {dossierMode === 'POKEMON' ? (
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/45">Loading player card...</div>}>
          <PokemonPlayerCard
            activePlayer={activePlayer}
            activeLegs={activeLegs}
            handleWagerProposition={handleWagerProposition}
            savedVouchIds={savedVouchIds}
          />
        </Suspense>
      ) : (
        <>
          <SaberHeroPanel model={model} />
          <MetricsBento model={model} />
          <ScoutingBento model={model} />
          <PropsHealthBento model={model} />
          <GameLogsPanel model={model} />
        </>
      )}
    </div>
  );
}
