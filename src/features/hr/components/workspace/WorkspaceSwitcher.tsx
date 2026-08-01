import { motion } from "framer-motion";
import { WORKSPACE_TABS } from "./constants";
import type { WorkspaceView } from "./types";

interface Props {
  value: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}

export default function WorkspaceSwitcher({ value, onChange }: Props) {
  return (
    <nav
      aria-label="Titan Workspace"
      className="mb-5 flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/60 p-2 backdrop-blur-md"
    >
      {WORKSPACE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={!tab.enabled}
          onClick={() => value === tab.id && onChange(tab.id)}
          className={[
            "relative min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            value === tab.id
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-white/40 border border-transparent cursor-not-allowed opacity-60",
          ].join(" ")}
        >
          {value === tab.id && (
            <motion.div
              layoutId="workspace-active"
              className="absolute inset-0 rounded-xl border border-emerald-500/30 bg-emerald-500/5"
            />
          )}

          <span className="relative z-10">{tab.label}</span>

          {!tab.enabled && (
            <span className="ml-2 text-[9px] uppercase tracking-widest text-white/30">
              Preview
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
