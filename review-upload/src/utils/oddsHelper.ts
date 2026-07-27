export interface BookieOdds {
  name: string;
  oddsDecimal: number;
  oddsAmerican: string;
  isBest?: boolean;
}

export interface MarketOddsComparison {
  bet365: BookieOdds;
  draftkings: BookieOdds;
  fanduel: BookieOdds;
  caesars: BookieOdds;
  betmgm: BookieOdds;
  marketAverageDecimal: number;
  marketAverageAmerican: string;
  bestBookieName: string;
  bestOddsDecimal: number;
}

/**
 * Converts decimal odds to standard American odds format string
 */
export function decimalToAmerican(decimal: number): string {
  if (decimal <= 1.01) return "+100";
  if (decimal >= 2.0) {
    const value = Math.round((decimal - 1) * 100);
    return `+${value}`;
  } else {
    const value = Math.round(-100 / (decimal - 1));
    return `${value}`;
  }
}

/**
 * Returns dynamic, deterministic comparative bookie odds and market averages
 */
export function getMarketOdds(propId: string, baseOdds: number): MarketOddsComparison {
  // Compute seed hash based on prop ID to ensure stable returns for same prop
  let hash = 0;
  for (let i = 0; i < propId.length; i++) {
    hash += propId.charCodeAt(i) * (i + 1);
  }

  // Generate realistic minor variances (within realistic bookmaker vig / margins)
  const bet365Dec = parseFloat((baseOdds * (0.98 + (hash % 5) * 0.012)).toFixed(2));
  const dkDec = parseFloat((baseOdds * (0.97 + ((hash + 1) % 6) * 0.01)).toFixed(2));
  const fdDec = parseFloat((baseOdds * (0.99 + ((hash + 2) % 4) * 0.011)).toFixed(2));
  const caesarsDec = parseFloat((baseOdds * (0.96 + ((hash + 3) % 7) * 0.01)).toFixed(2));
  const mgmDec = parseFloat((baseOdds * (0.975 + ((hash + 4) % 6) * 0.009)).toFixed(2));

  const list = [
    { name: "Bet365", dec: bet365Dec },
    { name: "DraftKings", dec: dkDec },
    { name: "FanDuel", dec: fdDec },
    { name: "Caesars", dec: caesarsDec },
    { name: "BetMGM", dec: mgmDec }
  ];

  // Calculate Market Average 
  const totalDecSum = list.reduce((acc, item) => acc + item.dec, 0);
  const avgDecimal = parseFloat((totalDecSum / list.length).toFixed(2));

  // Determine the highest (best) returns for the player
  const sortedList = [...list].sort((a, b) => b.dec - a.dec);
  const bestDec = sortedList[0].dec;
  const bestName = sortedList[0].name;

  return {
    bet365: { name: "Bet365", oddsDecimal: bet365Dec, oddsAmerican: decimalToAmerican(bet365Dec), isBest: bet365Dec === bestDec },
    draftkings: { name: "DraftKings", oddsDecimal: dkDec, oddsAmerican: decimalToAmerican(dkDec), isBest: dkDec === bestDec },
    fanduel: { name: "FanDuel", oddsDecimal: fdDec, oddsAmerican: decimalToAmerican(fdDec), isBest: fdDec === bestDec },
    caesars: { name: "Caesars", oddsDecimal: caesarsDec, oddsAmerican: decimalToAmerican(caesarsDec), isBest: caesarsDec === bestDec },
    betmgm: { name: "BetMGM", oddsDecimal: mgmDec, oddsAmerican: decimalToAmerican(mgmDec), isBest: mgmDec === bestDec },
    marketAverageDecimal: avgDecimal,
    marketAverageAmerican: decimalToAmerican(avgDecimal),
    bestBookieName: bestName,
    bestOddsDecimal: bestDec
  };
}

/**
 * Return specific odds for a bookie or the market average
 */
export function getSelectedBookieOddsValue(propId: string, baseOdds: number, bookieName: string): { decimal: number; american: string } {
  const comparison = getMarketOdds(propId, baseOdds);
  
  switch (bookieName.toLowerCase().replace(/\s/g, "")) {
    case "bet365":
      return { decimal: comparison.bet365.oddsDecimal, american: comparison.bet365.oddsAmerican };
    case "draftkings":
      return { decimal: comparison.draftkings.oddsDecimal, american: comparison.draftkings.oddsAmerican };
    case "fanduel":
      return { decimal: comparison.fanduel.oddsDecimal, american: comparison.fanduel.oddsAmerican };
    case "caesars":
      return { decimal: comparison.caesars.oddsDecimal, american: comparison.caesars.oddsAmerican };
    case "betmgm":
      return { decimal: comparison.betmgm.oddsDecimal, american: comparison.betmgm.oddsAmerican };
    case "marketaverage":
    case "average":
    default:
      return { decimal: comparison.marketAverageDecimal, american: comparison.marketAverageAmerican };
  }
}
