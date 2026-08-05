import React from "react";
import { motion } from "framer-motion";
import { LayoutGrid, TrendingUp, Layers, Grid, Flame } from "lucide-react";
import { WORKSPACE_TABS } from "./constants";
import type { WorkspaceView } from "./types";

interface Props {
  value: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}

const TAB_ICONS: Record<WorkspaceView, React.ReactNode> = {
  overview: <LayoutGrid className="h-4 w-4" />,
  edge: <TrendingUp className="h-4 w-4" />,
  stacks: <Layers className="h-4 w-4" />,
  matrix: <Grid className="h-4 w-4" />,
  extremes: <Flame className="h-4 w-4" />,
};

export default function WorkspaceSwitcher({ value, onChange }: Props) {
  return (
    <nav
      aria-label="HR Intelligence Workspace View"
      className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl no-scrollbar"
    >
      {WORKSPACE_TABS.map((tab) => {
        const isActive = value === tab.id;
        const icon = TAB_ICONS[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            onClick={() => onChange(tab.id)}
            title={tab.description}
            className={[
              "group relative flex min-h-[42px] shrink-0 items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 select-none",
              isActive
                ? "text-vouch-cyan shadow-[0_0_20px_rgba(79,184,220,0.18)]"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white cursor-pointer",
            ].join(" ")}
          >
            {isActive && (
              <motion.div
                layoutId="workspace-active-pill"
                className="absolute inset-0 rounded-xl border border-vouch-cyan/40 bg-gradient-to-r from-vouch-cyan/15 to-emerald-500/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}

            <span className={`relative z-10 transition-transform duration-200 ${isActive ? "text-vouch-cyan scale-110" : "text-white/50 group-hover:text-white"}`}>
              {icon}
            </span>

            <div className="relative z-10 flex flex-col text-left leading-tight">
              <span className="font-extrabold tracking-wide">{tab.label}</span>
              {tab.description && (
                <span className={`text-[9px] font-normal tracking-normal transition-colors ${isActive ? "text-vouch-cyan/70" : "text-white/35"}`}>
                  {tab.description}
                </span>
              )}
            </div>

            {!tab.enabled && (
              <span className="relative z-10 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/40">
                Preview
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

