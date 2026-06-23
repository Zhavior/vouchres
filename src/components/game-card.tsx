import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { CloudRain, Clock, MapPin, Flame } from "lucide-react";

export interface GameCardProps {
  id: number;
  awayAbbr: string;
  homeAbbr: string;
  awayScore?: number;
  homeScore?: number;
  venue?: string;
  scheduledFirstPitch: string;
  status: string;
  parkFactor?: number;
  weather?: { temp?: string | number; wind?: string; condition?: string };
  lineupConfirmed?: boolean;
  dataFreshAt?: string | null;
  topTargets?: { name: string; market: string; probability: number }[];
  className?: string;
  onClick?: () => void;
}

const STATUS_STYLES: Record<string, { text: string; label: string; pulse?: boolean }> = {
  scheduled: { text: "text-slate-400", label: "SCHEDULED" },
  pre: { text: "text-electric-300", label: "PRE-GAME" },
  live: { text: "text-success", label: "LIVE", pulse: true },
  delayed: { text: "text-warning", label: "DELAYED" },
  final: { text: "text-slate-500", label: "FINAL" },
  postponed: { text: "text-danger", label: "POSTPONED" },
  cancelled: { text: "text-danger", label: "CANCELLED" },
};

export function GameCard({
  awayAbbr,
  homeAbbr,
  awayScore,
  homeScore,
  venue,
  scheduledFirstPitch,
  status,
  parkFactor,
  weather,
  lineupConfirmed,
  dataFreshAt,
  topTargets = [],
  className,
  onClick,
}: GameCardProps) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
  const pitchTime = new Date(scheduledFirstPitch).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onClick={onClick}
      className={cn(
        "glass-card glass-card-hover p-4 cursor-pointer relative overflow-hidden",
        className
      )}
    >
      {/* Top row: status + freshness */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold tracking-wider",
              s.text
            )}
          >
            {s.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {s.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
          <Clock className="w-2.5 h-2.5" />
          <span>updated {timeAgo(dataFreshAt ?? null)}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between">
        <TeamSide abbr={awayAbbr} score={awayScore} />
        <div className="flex flex-col items-center px-3">
          <span className="text-[9px] text-slate-500 font-mono">@</span>
          <span className="text-[10px] text-electric-300 font-bold">{pitchTime}</span>
        </div>
        <TeamSide abbr={homeAbbr} score={homeScore} align="right" />
      </div>

      {/* Meta */}
      <div className="mt-3 pt-3 border-t border-navy-700 grid grid-cols-3 gap-2 text-[10px]">
        <Meta icon={<MapPin className="w-2.5 h-2.5" />} value={venue ?? "TBD"} />
        <Meta
          icon={<Flame className="w-2.5 h-2.5" />}
          value={`PF ${(parkFactor ?? 1.0).toFixed(2)}`}
        />
        <Meta
          icon={<CloudRain className="w-2.5 h-2.5" />}
          value={weather?.condition ?? "—"}
        />
      </div>

      {/* Lineup + targets */}
      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            "text-[9px] font-mono px-1.5 py-0.5 rounded",
            lineupConfirmed
              ? "bg-success/10 text-success"
              : "bg-slate-700/40 text-slate-400"
          )}
        >
          {lineupConfirmed ? "LINEUP CONFIRMED" : "LINEUP PENDING"}
        </span>
        {topTargets.length > 0 && (
          <span className="text-[9px] text-electric-300 font-mono">
            {topTargets.length} TARGETS
          </span>
        )}
      </div>
    </motion.div>
  );
}

function TeamSide({
  abbr,
  score,
  align = "left",
}: {
  abbr: string;
  score?: number;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col",
        align === "right" ? "items-end" : "items-start"
      )}
    >
      <span className="text-lg font-extrabold tracking-tight text-slate-100">{abbr}</span>
      {score !== undefined && (
        <span className="text-2xl font-mono font-bold text-electric-300">{score}</span>
      )}
    </div>
  );
}

function Meta({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-1 text-slate-400 truncate">
      {icon}
      <span className="truncate">{value}</span>
    </div>
  );
}
