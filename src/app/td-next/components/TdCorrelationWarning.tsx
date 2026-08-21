import React, { useMemo } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useParlayCommandStore } from '../../../stores/parlayCommandStore';

export function TdCorrelationWarning() {
  const draftLegs = useParlayCommandStore((state) => state.draftLegs);

  const warnings = useMemo(() => {
    if (!draftLegs || draftLegs.length < 2) return [];

    const nflLegs = draftLegs.filter((leg: any) => 
      leg.sport === 'NFL' || leg.league === 'NFL' || leg.sport?.toLowerCase() === 'nfl'
    );

    if (nflLegs.length < 2) return [];

    const issues: { type: 'danger' | 'warning', message: string }[] = [];

    // Group legs by gameId (or team if gameId is not reliable)
    // We'll use a simple N^2 comparison since parlays are small (max ~10 legs)
    for (let i = 0; i < nflLegs.length; i++) {
      for (let j = i + 1; j < nflLegs.length; j++) {
        const legA = nflLegs[i];
        const legB = nflLegs[j];

        // Ensure we are comparing props from the same game
        const sameGame = legA.gameId && legB.gameId && legA.gameId === legB.gameId;
        const sameTeam = legA.teamId && legB.teamId && legA.teamId === legB.teamId;
        
        // Try to determine position
        const posA = (legA as any).position || (legA as any).addSnapshot?.player?.position;
        const posB = (legB as any).position || (legB as any).addSnapshot?.player?.position;

        // If same team and neither is a QB (e.g., RB and WR, or two WRs)
        if (sameTeam) {
          if (posA !== 'QB' && posB !== 'QB') {
            issues.push({
              type: 'danger',
              message: `Cannibalization Risk: ${legA.playerName} and ${legB.playerName} compete for the same team touchdowns.`
            });
          }
        }

        // If same game but opposing teams
        if (sameGame && !sameTeam) {
          // QB vs Opposing RB
          const isQbA = posA === 'QB';
          const isRbB = posB === 'RB';
          const isQbB = posB === 'QB';
          const isRbA = posA === 'RB';

          if ((isQbA && isRbB) || (isQbB && isRbA)) {
            issues.push({
              type: 'warning',
              message: `Script Conflict: QB (${isQbA ? legA.playerName : legB.playerName}) pass volume negatively correlates with opposing heavy RB (${isQbA ? legB.playerName : legA.playerName}) leading.`
            });
          }
        }
      }
    }

    // Deduplicate warnings
    const unique = new Map<string, any>();
    issues.forEach(i => unique.set(i.message, i));
    return Array.from(unique.values());
  }, [draftLegs]);

  if (warnings.length === 0) return null;

  return (
    <div className="mx-3.5 mb-2 flex flex-col gap-1.5">
      {warnings.map((w, idx) => (
        <div 
          key={idx} 
          className={`flex items-start gap-2 rounded border p-2 shadow-inner ${
            w.type === 'danger' 
              ? 'border-rose-500/30 bg-rose-500/10' 
              : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          {w.type === 'danger' ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
          ) : (
            <Info className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
          )}
          <p className={`text-[10px] font-bold leading-tight uppercase tracking-widest font-mono ${
            w.type === 'danger' ? 'text-rose-200' : 'text-amber-200'
          }`}>
            {w.message}
          </p>
        </div>
      ))}
    </div>
  );
}
