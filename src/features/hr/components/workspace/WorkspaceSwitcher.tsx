import React from "react";
import { motion } from "framer-motion";
import { LayoutGrid, TrendingUp, Layers, Grid, Flame } from "lucide-react";
import { WORKSPACE_TABS } from "./constants";
import type { WorkspaceView } from "./types";
import "../../hr-command.css";

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
      aria-label="HR Intelligence workspace"
      className="scrollbar-none -mx-1 flex snap-x snap-mandatory items-stretch gap-1.5 overflow-x-auto px-1 py-0.5 xl:flex-wrap xl:overflow-x-visible"
    >
      {WORKSPACE_TABS.map((tab) => {
        const isActive = value === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
            title={tab.description}
            className="hr-tab group relative flex min-h-[44px] shrink-0 snap-start items-center gap-2.5 rounded-xl px-3 py-2 text-left sm:px-4"
          >
            {isActive && (
              <motion.span
                layoutId="hr-workspace-pill"
                aria-hidden
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-vouch-cyan/15 to-emerald-500/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}

            <span
              className={`relative z-10 shrink-0 transition-transform duration-200 ${
                isActive ? "scale-110 text-vouch-cyan" : "text-white/45 group-hover:text-white"
              }`}
            >
              {TAB_ICONS[tab.id]}
            </span>

            <span className="relative z-10 flex flex-col leading-tight">
              <span className="whitespace-nowrap text-[11px] font-extrabold tracking-wide sm:text-xs">
                {tab.label}
              </span>
              {tab.description && (
                <span
                  className={`hidden whitespace-nowrap text-[9px] font-normal tracking-normal lg:block ${
                    isActive ? "text-vouch-cyan/70" : "text-white/35"
                  }`}
                >
                  {tab.description}
                </span>
              )}
            </span>

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
