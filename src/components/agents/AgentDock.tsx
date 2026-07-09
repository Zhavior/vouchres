import React from 'react';
import { Cpu, Plug, Sparkles } from 'lucide-react';
import { JUDGE_COLOR_RING } from '../../constants/aiJudges';
import JudgePixelIcon from '../judges/JudgePixelIcon';
import type { AgentPluginMeta } from '../../types/aiAgent';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';

type Props = {
  agents: AgentPluginMeta[];
  customSlotEnabled?: boolean;
  extensionDocs?: string;
  loading?: boolean;
  error?: string | null;
};

const EXTENSION_GUIDE_URL =
  'https://github.com/vouchedge/vouchedge/blob/main/server/services/aiJudges/agentRegistry.ts';

export default function AgentDock({
  agents,
  customSlotEnabled = false,
  extensionDocs,
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
            Plug Agent
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-white/50">
            Registered AI judge agents. Custom plugins slot in via{' '}
            <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-vouch-cyan">registerAgent()</code>{' '}
            on the server — trust-first picks unchanged.
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentSlot key={agent.id} agent={agent} />
          ))}

          <div
            className={`rounded-2xl border border-dashed border-white/15 bg-black/25 p-4 ${Z8_SURFACE}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                <Cpu className="h-5 w-5 text-white/40" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Custom agent slot
                </p>
                <p className="mt-1 text-sm font-bold text-white/70">
                  {customSlotEnabled ? 'Ready for plugin' : 'Staff / dev only'}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Implement{' '}
                  <code className="text-vouch-cyan">AgentPlugin</code> and call{' '}
                  <code className="text-vouch-cyan">registerAgent()</code> at boot.
                </p>
                <a
                  href={EXTENSION_GUIDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-vouch-cyan hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  Extension guide
                  {extensionDocs ? ` · ${extensionDocs}` : ''}
                </a>
                {import.meta.env.VITE_AI_AGENT_PLUGINS_ENABLED === 'true' && (
                  <p className="mt-2 text-[10px] font-mono text-vouch-emerald">
                    VITE_AI_AGENT_PLUGINS_ENABLED=true
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AgentSlot({ agent }: { agent: AgentPluginMeta }) {
  const ring = JUDGE_COLOR_RING[agent.color] ?? JUDGE_COLOR_RING.cyan;

  return (
    <article className={`rounded-2xl border bg-black/30 p-4 ${ring}`}>
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
