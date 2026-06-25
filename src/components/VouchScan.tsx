import React, { useState } from 'react';
import { ScanLine, Upload, Plus, X, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface ScanLeg {
  id: string;
  player: string;
  market: string;
  selection: string;
  team: string;
}

const EMPTY = { player: '', market: 'Anytime HR', selection: '', team: '' };

export default function VouchScan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [legs, setLegs] = useState<ScanLeg[]>([]);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<{ edgeScore?: number; riskLevel?: string; report: string } | null>(null);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { if (typeof r.result === 'string') { setPreview(r.result); setFileName(file.name); } };
    r.readAsDataURL(file);
    setReport(null);
  };

  const addLeg = () => {
    const selection = draft.selection.trim() || (draft.player.trim() ? `${draft.player.trim()} ${draft.market}` : '');
    if (!draft.player.trim() || !selection) return;
    setLegs((l) => [...l, { id: `leg-${Date.now()}`, player: draft.player.trim(), market: draft.market, selection, team: draft.team.trim() }]);
    setDraft({ ...EMPTY });
    setReport(null);
  };

  const runVouchCheck = async () => {
    if (legs.length === 0) return;
    setAnalyzing(true);
    setReport(null);
    try {
      const res = await fetch('/api/ai/parlay-edge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legs: legs.map((l) => ({ selection: l.selection, market: l.market, team: l.team })) }),
      });
      const data = await res.json();
      setReport({ edgeScore: data.edgeScore, riskLevel: data.riskLevel, report: data.report || 'No analysis returned.' });
    } catch {
      setReport({ report: 'VouchCheck unavailable — make sure the dev server is running.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const input = 'bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 px-2.5 py-2 focus:border-sky-500/60 outline-none';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-slate-100">
      <h1 className="text-xl font-black tracking-tight flex items-center gap-2 mb-1"><ScanLine className="w-5 h-5 text-sky-400" /> VouchScan</h1>
      <p className="text-xs text-slate-400 mb-5">Upload your slip, then confirm each leg manually. We never auto-detect or invent legs — your confirmed entries are what get analyzed.</p>

      {/* Upload (preview only) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-4">
        <label className="cursor-pointer flex items-center gap-3 text-sm">
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-sky-500/50 transition-colors text-slate-300 font-bold">
            <Upload className="w-4 h-4" /> Upload slip image
          </span>
          {fileName && <span className="text-[11px] text-slate-500 font-mono truncate">{fileName}</span>}
        </label>
        {preview && <img src={preview} alt="slip" className="mt-3 max-h-56 rounded-xl border border-slate-800" />}
        <p className="mt-2 text-[10px] text-amber-400/80 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No automatic extraction yet — read your slip and enter the legs below.</p>
      </div>

      {/* Manual leg entry */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-4">
        <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2">Add a leg</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input className={input} placeholder="Player" value={draft.player} onChange={(e) => setDraft({ ...draft, player: e.target.value })} />
          <input className={input} placeholder="Team (opt)" value={draft.team} onChange={(e) => setDraft({ ...draft, team: e.target.value })} />
          <input className={input} placeholder="Market (e.g. Anytime HR)" value={draft.market} onChange={(e) => setDraft({ ...draft, market: e.target.value })} />
          <input className={input} placeholder="Selection (opt)" value={draft.selection} onChange={(e) => setDraft({ ...draft, selection: e.target.value })} />
        </div>
        <button onClick={addLeg} disabled={!draft.player.trim()} className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 disabled:opacity-40">
          <Plus className="w-3.5 h-3.5" /> Add leg
        </button>
      </div>

      {/* Confirmed legs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-4">
        <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2">Confirmed legs ({legs.length})</p>
        {legs.length === 0 ? (
          <p className="text-[11px] text-slate-500 font-mono py-4 text-center">No confirmed legs yet. Add at least one to run VouchCheck.</p>
        ) : (
          <div className="space-y-2">
            {legs.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-100 truncate">{i + 1}. {l.selection}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{l.market}{l.team ? ` · ${l.team}` : ''}</p>
                </div>
                <button onClick={() => setLegs((arr) => arr.filter((x) => x.id !== l.id))} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run VouchCheck */}
      <button onClick={runVouchCheck} disabled={legs.length === 0 || analyzing}
        className="w-full flex items-center justify-center gap-2 text-sm font-black px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed">
        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Run VouchCheck
      </button>

      {report && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          {(report.edgeScore != null || report.riskLevel) && (
            <p className="text-xs font-mono text-slate-300 mb-2">Edge {report.edgeScore ?? '—'}/99 · Risk {report.riskLevel ?? '—'}</p>
          )}
          <pre className="whitespace-pre-wrap text-[12px] text-slate-300 leading-relaxed font-sans">{report.report}</pre>
        </div>
      )}

      <p className="mt-4 text-[10px] text-slate-600 text-center">Probability-based research for entertainment — not betting advice. No guaranteed outcomes.</p>
    </div>
  );
}
