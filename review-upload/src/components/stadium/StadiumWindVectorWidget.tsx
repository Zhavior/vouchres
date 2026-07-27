import { useMemo } from "react";
import { Wind, Sun, Shield, Compass, Sparkles } from "lucide-react";

export interface StadiumWindVectorWidgetProps {
  venue: string;
  tempF?: number | null;
  windMph?: number | null;
  windCompass?: string | null;
  precipChancePct?: number | null;
  status?: "forecast" | "retractable" | "indoor" | "unavailable";
  parkFactor?: number;
  className?: string;
}

const COMPASS_DEGREES: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

export default function StadiumWindVectorWidget({
  venue,
  tempF,
  windMph,
  windCompass,
  precipChancePct,
  status = "forecast",
  parkFactor = 100,
  className = "",
}: StadiumWindVectorWidgetProps) {
  const isIndoor = status === "indoor";
  const isRetractable = status === "retractable";

  const deg = useMemo(() => {
    if (!windCompass) return 0;
    return COMPASS_DEGREES[windCompass.toUpperCase()] ?? 0;
  }, [windCompass]);

  // Determine wind trajectory impact relative to outfield (CF = 0 deg)
  const windImpact = useMemo(() => {
    if (isIndoor || !windMph || windMph === 0) {
      return { label: "Neutral Air", color: "text-slate-400", bg: "bg-white/5", border: "border-white/10", boost: 0, handAdv: "NEUTRAL" };
    }

    const normDeg = (deg + 360) % 360;

    // Blowing OUT to CF / LF / RF (0 to 60 deg or 300 to 360 deg)
    if (normDeg <= 60 || normDeg >= 300) {
      const boost = Number((windMph * 0.6).toFixed(1));
      const handAdv = normDeg >= 300 ? "RHB (Blowing Out Left)" : normDeg <= 60 ? "LHB (Blowing Out Right)" : "BOTH";
      return {
        label: `Blowing OUT (+${boost}% Carry)`,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        boost,
        handAdv,
      };
    }

    // Blowing IN from Outfield (120 to 240 deg)
    if (normDeg >= 120 && normDeg <= 240) {
      const penalty = Number((windMph * 0.5).toFixed(1));
      return {
        label: `Blowing IN (-${penalty}% Carry)`,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        boost: -penalty,
        handAdv: "PITCHER FAVORABLE",
      };
    }

    // Crosswind (60 to 120 deg or 240 to 300 deg)
    return {
      label: `Crosswind (${windCompass})`,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      boost: 0,
      handAdv: normDeg > 180 ? "RHB Crosswind" : "LHB Crosswind",
    };
  }, [deg, windMph, windCompass, isIndoor]);

  // Thermal air density lift (temp > 70 deg F)
  const thermalLift = useMemo(() => {
    if (!tempF || tempF <= 70 || isIndoor) return 0;
    return Number(((tempF - 70) * 0.25).toFixed(1));
  }, [tempF, isIndoor]);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-black/90 p-4 backdrop-blur-xl shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-vouch-cyan/10 border border-vouch-cyan/30 text-vouch-cyan">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black font-mono uppercase tracking-wider text-white truncate max-w-[180px]">
              {venue}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Ballpark Physics & Wind Trajectory
            </p>
          </div>
        </div>

        {/* Roof status pill */}
        <span
          className={`text-[9.5px] font-black font-mono px-2 py-0.5 rounded-full border ${
            isIndoor
              ? "bg-slate-800 text-slate-400 border-slate-700"
              : isRetractable
              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {isIndoor ? "Fixed Dome" : isRetractable ? "Retractable Roof" : "Open Air"}
        </span>
      </div>

      {/* Main Content Grid: SVG Diamond + Physics Metrics */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* SVG Stadium Diamond with Rotating Wind Vector */}
        <div className="relative flex justify-center items-center p-3 rounded-xl bg-black/40 border border-white/5 overflow-hidden min-h-[140px]">
          <svg viewBox="0 0 200 200" className="w-36 h-36">
            {/* Outfield Fence Arch */}
            <path
              d="M 30 140 Q 100 20 170 140"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
              strokeDasharray="4 2"
            />
            {/* Infield Diamond */}
            <polygon
              points="100,165 140,125 100,85 60,125"
              fill="rgba(34,211,238,0.04)"
              stroke="rgba(34,211,238,0.3)"
              strokeWidth="1.5"
            />
            {/* Base Pads */}
            <circle cx="100" cy="165" r="3" fill="#ffffff" /> {/* Home */}
            <circle cx="140" cy="125" r="3" fill="#ffffff" /> {/* 1st */}
            <circle cx="100" cy="85" r="3" fill="#ffffff" />  {/* 2nd */}
            <circle cx="60" cy="125" r="3" fill="#ffffff" />  {/* 3rd */}

            {/* Pitcher's Mound */}
            <circle cx="100" cy="125" r="4" fill="rgba(251,191,36,0.6)" />

            {/* Rotating Wind Vector Arrow (Centered at Pitcher Mound) */}
            {!isIndoor && windMph && windMph > 0 ? (
              <g transform={`translate(100, 125) rotate(${deg})`}>
                {/* Wind direction line */}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-45"
                  stroke={windImpact.boost > 0 ? "#34d399" : windImpact.boost < 0 ? "#fb7185" : "#fbbf24"}
                  strokeWidth="3"
                  strokeDasharray="6 3"
                  className="animate-pulse"
                />
                {/* Arrowhead */}
                <polygon
                  points="0,-52 -6,-40 6,-40"
                  fill={windImpact.boost > 0 ? "#34d399" : windImpact.boost < 0 ? "#fb7185" : "#fbbf24"}
                />
              </g>
            ) : null}
          </svg>

          {/* Stadium Center Label Overlay */}
          <div className="absolute bottom-2 text-center">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">
              Outfield Trajectory
            </span>
          </div>
        </div>

        {/* Physics & Environmental Metrics Column */}
        <div className="space-y-2.5">
          {/* Wind Badge */}
          <div className={`p-2.5 rounded-xl border ${windImpact.bg} ${windImpact.border} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Wind className={`h-4 w-4 ${windImpact.color}`} />
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">Wind Vector</p>
                <p className={`text-xs font-black font-mono ${windImpact.color}`}>
                  {isIndoor ? "None (Dome)" : `${windMph ?? 0} mph ${windCompass ?? "N/A"}`}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${windImpact.color}`}>
              {windImpact.label}
            </span>
          </div>

          {/* Temperature & Thermal Lift */}
          <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">Air Temp & Density</p>
                <p className="text-xs font-black font-mono text-white">
                  {tempF ? `${tempF}°F` : "Indoor Temp Controlled"}
                </p>
              </div>
            </div>
            {thermalLift > 0 && (
              <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                +{thermalLift}% Thermal Lift
              </span>
            )}
          </div>

          {/* Park Factor & Batter Advantage */}
          <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Park Factor</span>
              <span className="font-bold text-vouch-cyan">{parkFactor} Index</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Batter Split Adv</span>
              <span className="font-bold text-emerald-300">{windImpact.handAdv}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
