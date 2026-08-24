import React from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ChevronRight, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';
import { AuditReceipt } from '../../lib/audit-schema';

const MOCK_AUDITS: AuditReceipt[] = [
  { id: '001', timestamp: '2024.08.22 19:05', player: 'Aaron Judge', matchup: 'NYY @ BOS', hrpiAtLock: 98, evidenceCoverage: 94, modelId: 'v8.2', status: 'VERIFIED', hash: '8f2b...f9a', metrics: { ev: '96.2', barrel: '15.1%', launchAngle: '18.2°' } },
  { id: '002', timestamp: '2024.08.22 18:40', player: 'Shohei Ohtani', matchup: 'LAD @ SF', hrpiAtLock: 96, evidenceCoverage: 88, modelId: 'v8.2', status: 'MISS', hash: '3a1c...e2b', metrics: { ev: '94.8', barrel: '14.2%', launchAngle: '17.5°' } },
  { id: '003', timestamp: '2024.08.22 18:15', player: 'Yordan Alvarez', matchup: 'HOU @ TEX', hrpiAtLock: 92, evidenceCoverage: 72, modelId: 'v8.2', status: 'PARTIAL_COVERAGE', hash: '9d4e...a1c', metrics: { ev: '95.1', barrel: '13.8%', launchAngle: '19.1°' } },
];

const StatusBadge = ({ status }: { status: AuditReceipt['status'] }) => {
  const config = {
    VERIFIED: { icon: ShieldCheck, color: 'text-ve-emerald', bg: 'bg-ve-emerald/10' },
    MISS: { icon: XCircle, color: 'text-ve-red', bg: 'bg-ve-red/10' },
    PARTIAL_COVERAGE: { icon: AlertCircle, color: 'text-ve-amber', bg: 'bg-ve-amber/10' },
    VOID: { icon: AlertCircle, color: 'text-white/20', bg: 'bg-white/5' },
  };
  const { icon: Icon, color, bg } = config[status];
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${bg} ${color}`}>
      <Icon size={12} />
      <span className="text-[9px] font-bold uppercase tracking-widest">{status.replace('_', ' ')}</span>
    </div>
  );
};

export default function AuditLedgerTable() {
  return (
    <div className="w-full space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input 
            placeholder="SEARCH_BY_PLAYER_OR_HASH..." 
            className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-xs font-mono text-white outline-none focus:border-ve-emerald/50 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-4 border border-white/10 terminal-text flex items-center gap-2 hover:bg-white/5">
            <Filter size={14} /> Filter_Results
          </button>
          <button className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/10 terminal-text hover:text-white">
            Export_CSV
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 terminal-text">
        <div className="col-span-2">Timestamp</div>
        <div className="col-span-3">Player_Unit</div>
        <div className="col-span-2 text-center">HRPI_Lock</div>
        <div className="col-span-2 text-center">Coverage</div>
        <div className="col-span-2 text-right">Status</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {MOCK_AUDITS.map((audit, i) => (
          <motion.div
            key={audit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 glass-panel border-white/5 hover:border-ve-emerald/30 transition-all cursor-pointer group items-center"
          >
            <div className="col-span-2 text-[10px] font-mono text-white/40">{audit.timestamp}</div>
            <div className="col-span-3">
              <p className="text-sm font-bold text-white group-hover:text-ve-emerald transition-colors">{audit.player}</p>
              <p className="terminal-text text-[8px]">{audit.matchup}</p>
            </div>
            <div className="col-span-2 text-center font-mono text-ve-emerald">{audit.hrpiAtLock}</div>
            <div className="col-span-2 text-center">
              <div className="w-16 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-white/20" style={{ width: `${audit.evidenceCoverage}%` }} />
              </div>
              <span className="text-[9px] font-mono text-white/20 mt-1 block">{audit.evidenceCoverage}%</span>
            </div>
            <div className="col-span-2 text-right">
              <StatusBadge status={audit.status} />
            </div>
            <div className="col-span-1 flex justify-end">
              <ChevronRight size={16} className="text-white/10 group-hover:text-ve-emerald transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
