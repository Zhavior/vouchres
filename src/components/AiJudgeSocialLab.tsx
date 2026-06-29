import React, { useEffect, useMemo, useState } from 'react';
import { Bot, CalendarClock, CheckCircle2, Loader2, Send, ShieldAlert, Sparkles } from 'lucide-react';

type Judge = {
  id: string;
  name: string;
  icon: string;
  personality: string;
  strategy: string;
};

type Pick = {
  playerName?: string;
  name?: string;
  team?: string;
  opponent?: string;
  opponentTeam?: string;
  hrScore?: number;
  estimatedHrProbability?: number;
};

type Draft = {
  id: string;
  judgeId: string;
  judgeName: string;
  postType: string;
  platform: string;
  status: 'draft' | 'queued' | 'mock_posted';
  date: string;
  scheduledFor: string;
  content: string;
  picks: Pick[];
  createdAt: string;
  updatedAt: string;
};

function pickName(pick: Pick): string {
  return pick.playerName || pick.name || 'Unknown player';
}

function statusLabel(status: Draft['status']): string {
  if (status === 'queued') return 'Queued';
  if (status === 'mock_posted') return 'Mock Posted';
  return 'Draft';
}

export default function AiJudgeSocialLab() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Safe mode active. Nothing posts to X/Twitter.');

  const groupedDrafts = useMemo(() => drafts, [drafts]);

  async function loadJudges() {
    const res = await fetch('/api/ai-judge-social/judges');
    const data = await res.json();
    setJudges(Array.isArray(data.judges) ? data.judges : []);
  }

  async function loadDrafts() {
    const res = await fetch('/api/ai-judge-social/drafts');
    const data = await res.json();
    setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
  }

  async function generateDrafts() {
    setLoading(true);
    setMessage('Generating AI Judge HR drafts from the HR Board...');
    try {
      const res = await fetch('/api/ai-judge-social/generate-hr-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: `${new Date().toISOString().slice(0, 10)} 10:30 America/Halifax` }),
      });
      const data = await res.json();
      setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      setMessage(`Generated ${Array.isArray(data.drafts) ? data.drafts.length : 0} safe draft posts from ${data.candidateCount ?? 0} candidates.`);
    } catch {
      setMessage('Could not generate drafts yet. Check the API route.');
    } finally {
      setLoading(false);
    }
  }

  async function queueDraft(draftId: string) {
    const res = await fetch(`/api/ai-judge-social/drafts/${draftId}/queue`, { method: 'POST' });
    const data = await res.json();
    if (data.draft) {
      setDrafts((prev) => prev.map((d) => (d.id === draftId ? data.draft : d)));
      setMessage('Draft queued safely. Still no real X/Twitter post.');
    }
  }

  async function mockPostDraft(draftId: string) {
    const res = await fetch(`/api/ai-judge-social/drafts/${draftId}/mock-post`, { method: 'POST' });
    const data = await res.json();
    if (data.draft) {
      setDrafts((prev) => prev.map((d) => (d.id === draftId ? data.draft : d)));
      setMessage('Mock post complete. Nothing was posted publicly.');
    }
  }

  useEffect(() => {
    loadJudges();
    loadDrafts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                <ShieldAlert className="h-4 w-4" />
                Safe Prototype · No Real Posting
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                AI Judge Social Lab
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
                Generate HR pick post drafts from your VouchEdge AI judges. Queue and mock-post them safely before connecting the real X/Twitter API.
              </p>
            </div>

            <button
              onClick={generateDrafts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Generate HR Drafts
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200">
            {message}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {judges.map((judge) => (
            <div key={judge.id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 font-black text-cyan-200">
                {judge.icon || <Bot className="h-5 w-5" />}
              </div>
              <h3 className="font-black">{judge.name}</h3>
              <p className="mt-2 text-xs text-slate-400">{judge.personality}</p>
              <p className="mt-3 text-xs text-cyan-200">{judge.strategy}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-cyan-300" />
            <h2 className="text-2xl font-black">Draft Queue</h2>
          </div>

          {groupedDrafts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
              No drafts yet. Click <span className="font-bold text-cyan-200">Generate HR Drafts</span>.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {groupedDrafts.map((draft) => (
                <article key={draft.id} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{draft.postType}</div>
                      <h3 className="text-xl font-black">{draft.judgeName}</h3>
                    </div>
                    <div className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold text-slate-200">
                      {statusLabel(draft.status)}
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                    <CalendarClock className="h-4 w-4 text-cyan-300" />
                    {draft.scheduledFor}
                  </div>

                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-700 bg-black/50 p-4 text-sm leading-relaxed text-slate-100">
                    {draft.content}
                  </pre>

                  {draft.picks?.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {draft.picks.slice(0, 4).map((pick, index) => (
                        <div key={`${draft.id}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
                          <span className="font-bold text-white">{pickName(pick)}</span>
                          <span className="text-slate-500"> · </span>
                          {pick.team ?? 'TBD'} vs {pick.opponent ?? pick.opponentTeam ?? 'TBD'}
                          <span className="text-slate-500"> · </span>
                          HR Edge {pick.hrScore ?? '—'}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => queueDraft(draft.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/10"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Queue
                    </button>
                    <button
                      onClick={() => mockPostDraft(draft.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-purple-400/40 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-400/10"
                    >
                      <Send className="h-4 w-4" />
                      Mock Post
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
