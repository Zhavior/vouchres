/**
 * HotMarketsPanel — right rail MLB market highlights.
 * TODO: Replace mock data with real mlbApi call when /v1/hot-markets endpoint exists.
 */
import { Sparkles } from "lucide-react";

interface MarketSelection {
  name: string;
  odds: string;
  vouchCount: number;
}

interface HotMarket {
  id: string;
  sport: string;
  startTime: string;
  game: string;
  headlineMarket: string;
  selections: MarketSelection[];
}

const MOCK_HOT_MARKETS: HotMarket[] = [
  {
    id: "hm1",
    sport: "MLB",
    startTime: "7:10 PM",
    game: "Yankees vs Red Sox",
    headlineMarket: "Moneyline",
    selections: [
      { name: "Yankees -115", odds: "-115", vouchCount: 42 },
      { name: "Red Sox +105", odds: "+105", vouchCount: 31 },
    ],
  },
  {
    id: "hm2",
    sport: "MLB",
    startTime: "8:05 PM",
    game: "Dodgers vs Padres",
    headlineMarket: "Run Line",
    selections: [
      { name: "Dodgers -1.5", odds: "+120", vouchCount: 58 },
      { name: "Padres +1.5", odds: "-140", vouchCount: 24 },
    ],
  },
];

export function HotMarketsPanel() {
  return (
    <div className="ve-card p-4" id="hot-markets-card">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <h3 className="font-bold text-slate-100 text-xs tracking-widest uppercase">Hot MLB Markets</h3>
      </div>

      <div className="space-y-3">
        {MOCK_HOT_MARKETS.map((m) => (
          <div
            key={m.id}
            className="p-3 rounded-lg border border-slate-800 space-y-2 text-xs"
            style={{ background: "rgba(11,15,25,0.6)" }}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase">
                {m.sport}
              </span>
              <span className="text-slate-400 text-[10px] font-mono">{m.startTime}</span>
            </div>
            <p className="font-medium text-slate-200 truncate">{m.game}</p>
            <div className="pt-1 border-t border-slate-800/60">
              <p className="text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Headline: {m.headlineMarket}</p>
              <div className="grid grid-cols-2 gap-2">
                {m.selections.map((sel) => (
                  <div
                    key={sel.name}
                    className="p-2 rounded border border-slate-800 bg-slate-900 flex flex-col gap-1"
                  >
                    <span className="font-bold text-slate-200 truncate text-[11px]">{sel.name}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sky-400 font-mono font-bold text-[10px]">{sel.odds}</span>
                      <span className="text-slate-500 text-[9px] font-mono">{sel.vouchCount} vouches</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
