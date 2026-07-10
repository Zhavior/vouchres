import React from 'react';
import { Plug } from 'lucide-react';
import { JUDGE_COLOR_RING } from '../../constants/aiJudges';
import JudgePixelIcon from '../judges/JudgePixelIcon';
import type { AgentPluginMeta } from '../../types/aiAgent';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';

type Props = {
  agents: AgentPluginMeta[];
  extensionDocs?: string;
  loading?: boolean;
  error?: string | null;
};

export default function AgentDock({
  agents,
  loading,
  error,
}: Props) {
  return (
    <section
      aria-labelledby="agent-dock-heading"
      className={`rounded-3xl border border-vouch-cyan/15 bg-gradient-to-br from-obsidian-900/90 via-black/40 to-vouch-emerald/5 p-5 ${Z8_PANEL_PREMIUM}`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`${Z8_LABEL} text-vouch-emerald`}>Agent Dock</p>
          <h3 id="agent-dock-heading" className="mt-1 text-lg font-black text-white">
            Four AI Judges
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-white/50">
            Each judge scores the HR board with its own specialty lens. Picks sync to V.A.I Research Command Center rooms.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/60">
          <Plug className="h-3.5 w-3.5 text-vouch-cyan" />
          {agents.length} active
        </div>
      </div>

      {loading && (
        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
          Loading agent registry…
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => (
            <AgentSlot key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </section>
  );
}

function AgentSlot({ agent }: { agent: AgentPluginMeta }) {
  const ring = JUDGE_COLOR_RING[agent.color] ?? JUDGE_COLOR_RING.cyan;

  return (
    <article className={`rounded-2xl border bg-black/30 p-4 ${ring} ${Z8_SURFACE}`}>
      <div className="flex items-start gap-3">
        <JudgePixelIcon code={agent.code} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black text-white">{agent.displayName}</h4>
            {agent.builtin && (
              <span className="rounded-full border border-vouch-cyan/25 bg-vouch-cyan/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-vouch-cyan">
                Built-in
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] font-mono text-white/40">@{agent.handle}</p>
          <p className="mt-1 text-xs text-white/55">{agent.tagline}</p>
          <p className="mt-2 text-[10px] text-white/35">
            {agent.specialty} · {agent.singlePickLimit} single/day
          </p>
        </div>
      </div>
    </article>
  );
}
