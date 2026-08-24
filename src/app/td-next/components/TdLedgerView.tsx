import React, { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TouchdownPlayer } from '../../../types/touchdown';
import { apiClient } from '../../../lib/apiClient';

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
        const json = await apiClient.get<{ success: boolean; data: LedgerRow[] }>('/api/nfl/ledger');
        if (json.success) {
          setLedgerData(json.data);
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
    <div className="w-full flex-1 flex flex-col min-h-0 bg-transparent p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold uppercase text-white font-mono flex items-center gap-2">
          <TrendingUp className="text-ve-cyan" />
          Verified TD Outcome Ledger
        </h2>
        <div className="border border-ve-amber/30 bg-ve-amber/10 px-3 py-2 text-right font-mono">
          <div className="text-[10px] font-bold uppercase text-ve-amber">Calibration pending</div>
          <div className="text-[9px] text-white/40">No ROI or accuracy claim without stored snapshots.</div>
        </div>
      </div>

      <div className="border border-white/10 bg-white/[0.02] overflow-hidden min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="w-8 h-8 text-ve-cyan animate-spin" />
          </div>
        )}
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-white/[0.04] border-b border-white/10">
            <tr>
              <th className="p-3 text-white/55 font-bold uppercase tracking-wider">Player</th>
              <th className="p-3 text-white/55 font-bold uppercase tracking-wider">Proj TDPI</th>
              <th className="p-3 text-white/55 font-bold uppercase tracking-wider">Closing Odds</th>
              <th className="p-3 text-white/55 font-bold uppercase tracking-wider">Model Edge</th>
              <th className="p-3 text-white/55 font-bold uppercase tracking-wider text-right">Result (Wk 9)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ledgerData.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02]">
                <td className="p-3 font-bold text-white uppercase flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${row.scoredTouchdown ? 'bg-ve-emerald/10' : 'bg-ve-red/10'}`} />
                  {row.name} <span className="text-white/40 font-normal">({row.team})</span>
                </td>
                <td className="p-3 text-ve-cyan font-bold">{row.tdpiScore.toFixed(1)}</td>
                <td className="p-3 text-white/70">{row.marketOdds}</td>
                <td className="p-3 text-ve-emerald font-bold">+{row.modelEdgePercent.toFixed(1)}%</td>
                <td className="p-3 text-right">
                  {row.scoredTouchdown ? (
                    <span className="inline-flex items-center gap-1 text-ve-emerald font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> TOUCHDOWN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ve-red font-bold">
                      <XCircle className="w-3.5 h-3.5" /> BLANK
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && ledgerData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/40">
                  No verified prediction/outcome pairs are stored yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
