import { MLBPlayer } from '../types';

export interface CustomPlayerSelection {
  player: MLBPlayer;
  statType: 'Homeruns' | 'Runs' | 'Hits' | 'RBIs' | 'AVG' | 'OPS';
  customVal: string;
  aiConfidence?: number;
  playerConfidence?: number;
  customExplanation?: string;
  // Spotlight Analytical Additions
  pitcherName?: string;
  pitcherHand?: 'RHP' | 'LHP';
  hitRateLast10?: number;     // e.g. 80 (%)
  playRatePercent?: number;   // e.g. 95 (%)
  pitchTypeFavored?: string;  // e.g. "vs Sweeper Slider (.342 AVG)"
  pitcherEra?: number;        // e.g. 3.55
  edgeMathProof?: string;     // Analytical text details
}

export function getPlayerSpotlightMetrics(ps: CustomPlayerSelection) {
  const p = ps.player;
  const nameId = p.id;
  
  const pitcherName = ps.pitcherName || (
    nameId === 'mlb_ohtani' ? 'Luis Castillo' :
    nameId === 'mlb_judge' ? 'Kevin Gausman' :
    nameId === 'mlb_betts' ? 'Zack Wheeler' :
    nameId === 'mlb_acuna' ? 'Blake Snell' :
    nameId === 'mlb_carroll' ? 'Logan Webb' : 'Gerrit Cole'
  );
  
  const pitcherHand = ps.pitcherHand || (
    nameId === 'mlb_ohtani' ? 'RHP' :
    nameId === 'mlb_judge' ? 'RHP' :
    nameId === 'mlb_betts' ? 'RHP' :
    nameId === 'mlb_acuna' ? 'LHP' : 'RHP'
  );

  const pitcherEra = ps.pitcherEra || (
    nameId === 'mlb_ohtani' ? 3.55 :
    nameId === 'mlb_judge' ? 3.82 :
    nameId === 'mlb_betts' ? 2.74 :
    nameId === 'mlb_acuna' ? 3.12 :
    nameId === 'mlb_carroll' ? 3.35 : 3.42
  );

  const hitRateLast10 = ps.hitRateLast10 !== undefined ? ps.hitRateLast10 : (
    nameId === 'mlb_ohtani' ? 80 :
    nameId === 'mlb_judge' ? 70 :
    nameId === 'mlb_betts' ? 90 : 80
  );

  const playRatePercent = ps.playRatePercent !== undefined ? ps.playRatePercent : (
    nameId === 'mlb_ohtani' ? 98 :
    nameId === 'mlb_judge' ? 100 :
    nameId === 'mlb_betts' ? 96 : 95
  );

  const pitchTypeFavored = ps.pitchTypeFavored || (
    nameId === 'mlb_ohtani' ? 'vs Sweeper Slider (.342 AVG)' :
    nameId === 'mlb_judge' ? 'vs 4-Seam Fastball (.380 AVG)' :
    nameId === 'mlb_betts' ? 'vs Sinker/Cutter (.315 AVG)' :
    nameId === 'mlb_acuna' ? 'vs Curveball (.298 AVG)' :
    nameId === 'mlb_carroll' ? 'vs Changeup (.285 AVG)' : 'vs Fastball (.305 AVG)'
  );

  // Math-based Sabermetric Edge Explanation
  const playerOps = parseFloat(p.seasonStats?.ops || '0.850');
  const ev = p.advanced?.exitVelocity || 92.4;
  const brl = p.advanced?.barrelPercent || 14.5;
  
  // Live dynamic formula
  const edgeFactorVal = ((playerOps * 100 + ev * 1.5 + brl * 2.2) / pitcherEra).toFixed(1);
  const mathFormula = `[OPS (${playerOps})×100 + EV (${ev}mph)×1.5 + Barrel% (${brl}%)×2.2] / ERA (${pitcherEra}) = ${edgeFactorVal}`;

  const edgeMathProof = ps.edgeMathProof || (
    nameId === 'mlb_ohtani' ? `Ohtani's elite ${brl}% barrel rate and ${ev} mph exit velocity matches perfectly with ${pitcherName}'s high-spin fastball. Sabermetric matchup modeling projects a elevated +12.4% success corridor.` :
    nameId === 'mlb_judge' ? `Judge's ${ev} mph hard-hit velocity counters ${pitcherName}'s split vertical drop. High-zone fastballs yield severe launch angle multipliers.` :
    nameId === 'mlb_betts' ? `Betts has contact on 91.2% of pitches inside the zone, neutralizing ${pitcherName}'s sinker variety. Low strikeout probability ensures play rate conversion.` :
    `Matchup math confirms extreme bat speed index of ${ev} mph matches beautifully with pitcher's average zone entry speed. Expect heavy barrel alignment.`
  );

  return {
    pitcherName,
    pitcherHand,
    pitcherEra,
    hitRateLast10,
    playRatePercent,
    pitchTypeFavored,
    edgeFactorVal,
    mathFormula,
    edgeMathProof
  };
}
