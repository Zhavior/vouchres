import React, { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TouchdownPlayer } from '../../../types/touchdown';

interface LedgerRow {
  id: string;
  name: string;
  team: string;
  tdpiScore: number;
  marketOdds: string;
  modelEdgePercent: number;
  scoredTouchdown: boolean;
  closingLineValue: number;
}

interface TdLedgerViewProps {
  players: TouchdownPlayer[]; // Kept for interface compatibility, but we fetch our own data now
}

export function TdLedgerView({ players }: TdLedgerViewProps) {
  const [ledgerData, setLedgerData] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      try {
        const res = await fetch('/api/nfl/ledger');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLedgerData(json.data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch ledger", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-black p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase text-white font-mono flex items-center gap-2">
          <TrendingUp className="text-cyan-400" />
          TDPI Historical Accuracy Ledger
        </h2>
        <div className="flex gap-4 font-mono">
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase">Week 9 ROI</div>
            <div className="text-lg font-black text-emerald-400">+14.2%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase">Closing Line Value</div>
            <div className="text-lg font-black text-cyan-300">73.5%</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-950 overflow-hidden min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-900 border-b border-white/10">
            <tr>
              <th className="p-3 text-zinc-400 font-bold uppercase tracking-wider">Player</th>
              <th className="p-3 text-zinc-400 font-bold uppercase tracking-wider">Proj TDPI</th>
              <th className="p-3 text-zinc-400 font-bold uppercase tracking-wider">Closing Odds</th>
              <th className="p-3 text-zinc-400 font-bold uppercase tracking-wider">Model Edge</th>
              <th className="p-3 text-zinc-400 font-bold uppercase tracking-wider text-right">Result (Wk 9)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ledgerData.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02]">
                <td className="p-3 font-bold text-white uppercase flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${row.scoredTouchdown ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {row.name} <span className="text-zinc-500 font-normal">({row.team})</span>
                </td>
                <td className="p-3 text-cyan-300 font-black">{row.tdpiScore.toFixed(1)}</td>
                <td className="p-3 text-zinc-300">{row.marketOdds}</td>
                <td className="p-3 text-emerald-400 font-bold">+{row.modelEdgePercent.toFixed(1)}%</td>
                <td className="p-3 text-right">
                  {row.scoredTouchdown ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> TOUCHDOWN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                      <XCircle className="w-3.5 h-3.5" /> BLANK
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && ledgerData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  No historical ledger data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
