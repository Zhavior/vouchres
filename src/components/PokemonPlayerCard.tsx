import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Plus, 
  Flame, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { MLBPlayer, Leg } from '../types';

interface PokemonPlayerCardProps {
  activePlayer: MLBPlayer;
  activeLegs: Leg[];
  savedVouchIds: string[];
  handleWagerProposition: (player: MLBPlayer, prop: any) => void;
}

export default function PokemonPlayerCard({
  activePlayer,
  activeLegs,
  handleWagerProposition,
  savedVouchIds
}: PokemonPlayerCardProps) {
  const [opposingPitcherType, setOpposingPitcherType] = useState<'RHP' | 'LHP'>('RHP');

  // Compute dynamic stats based on chosen Matchup Pitcher
  const getAdjustedBatterScore = (player: MLBPlayer, pitcher: 'RHP' | 'LHP') => {
    const baseScore = player.batterScore;
    if (player.id === "mlb_acuna" || player.id === "mlb_tucker") {
      return baseScore; // Injured remains low
    }
    if (pitcher === 'RHP') {
      if (player.bats === 'L') return Math.min(99, baseScore + 2);
      if (player.bats === 'R') return Math.max(50, baseScore - 3);
      return baseScore;
    } else { // Facing Left Handed Pitcher
      if (player.bats === 'R') return Math.min(99, baseScore + 2);
      if (player.bats === 'L') return Math.max(50, baseScore - 5);
      return baseScore;
    }
  };

  const adjustedScore = getAdjustedBatterScore(activePlayer, opposingPitcherType);

  // Get Pokemon attribute elements based on player position
  const getPokemonTypeInfo = (position: string) => {
    const pos = position.toLowerCase();
    if (pos.includes('pitcher') || pos.includes('designated hitter') || pos.includes('dh')) {
      return { 
        name: 'FIRE', 
        color: 'from-orange-500 to-red-650', 
        text: 'text-orange-400 bg-orange-950/40 border-orange-500/20', 
        badge: 'bg-orange-500 text-slate-950 border-orange-400', 
        icon: '🔥', 
        description: 'Blaze Strike Velocity' 
      };
    }
    if (pos.includes('outfielder') || pos.includes('shortstop')) {
      return { 
        name: 'ELECTRIC', 
        color: 'from-yellow-400 to-amber-500', 
        text: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/20', 
        badge: 'bg-yellow-400 text-slate-950 border-yellow-300', 
        icon: '⚡', 
        description: 'Gale Speed Reflexes' 
      };
    }
    if (pos.includes('third baseman') || pos.includes('first baseman') || pos.includes('infielder')) {
      return { 
        name: 'STEEL', 
        color: 'from-slate-500 to-zinc-600', 
        text: 'text-zinc-300 bg-zinc-900/50 border-zinc-500/20', 
        badge: 'bg-zinc-400 text-slate-950 border-zinc-300', 
        icon: '🛡️', 
        description: 'Unshakable Iron Corner' 
      };
    }
    if (pos.includes('catcher')) {
      return { 
        name: 'WATER', 
        color: 'from-blue-500 to-indigo-650', 
        text: 'text-sky-400 bg-sky-950/40 border-sky-500/20', 
        badge: 'bg-sky-400 text-slate-950 border-sky-300', 
        icon: '🌊', 
        description: 'Oceanic Focus Commander' 
      };
    }
    return { 
      name: 'PSYCHIC', 
      color: 'from-pink-500 to-purple-650', 
      text: 'text-pink-400 bg-pink-950/40 border-pink-500/20', 
      badge: 'bg-pink-400 text-slate-950 border-pink-300', 
      icon: '🔮', 
      description: 'Mindset Instinct Hitter' 
    };
  };

  const pokemonType = getPokemonTypeInfo(activePlayer.position);

  // Compute dynamic lineup order & Starter indicators
  const getStarterLineupInfo = (player: MLBPlayer) => {
    if (player.id === 'mlb_acuna' || player.id === 'mlb_tucker' || player.injurySeverity === 'IL_10' || player.injurySeverity === 'IL_60') {
      return { 
        isStarter: false, 
        statusText: 'OUT / IL RESERVE ❌', 
        color: 'text-red-400 bg-red-950/30 border-red-500/20', 
        orderText: 'Dugout Scratch Order', 
        code: 'IL' 
      };
    }
    if (player.injurySeverity === 'DAY_TO_DAY') {
      return { 
        isStarter: true, 
        statusText: 'GAME-TIME DECISION ⚠️', 
        color: 'text-amber-400 bg-amber-950/40 border-amber-500/20', 
        orderText: 'Projected Batting #5 (TBD)', 
        code: 'GTD' 
      };
    }
    const orderNum = (player.name.charCodeAt(0) % 4) + 1; // 1 to 4
    return {
      isStarter: true,
      statusText: 'LINEUP CONFIRMED 🟢',
      color: 'text-emerald-400 bg-emerald-950/45 border-emerald-500/20',
      orderText: `Starting Roster: Batting #${orderNum}`,
      code: 'START'
    };
  };

  const starterInfo = getStarterLineupInfo(activePlayer);

  // Calculate Base Stats styled like game base stats (HP, ATK, DEF, SPD, SP.ATK, SP.DEF)
  const statsList = [
    {
      label: 'HP (Batting Prowess)',
      value: Math.round(parseFloat(activePlayer.seasonStats.ops) * 100),
      color: 'bg-emerald-500',
      desc: 'Formed from general seasonal OPS carry.'
    },
    {
      label: 'ATK (Multiplier Velocity)',
      value: Math.round((activePlayer.advanced.exitVelocity - 80) * 5 + 30),
      color: 'bg-orange-500',
      desc: 'Based on average exit velocity threshold.'
    },
    {
      label: 'DEF (Selective Discipline)',
      value: Math.round((45 - activePlayer.advanced.chasePercent) * 2.5 + 50),
      color: 'bg-blue-500',
      desc: 'Zone chase-avoidance capability rating.'
    },
    {
      label: 'SPD (Sprint/Reaction speed)',
      value: activePlayer.position.includes('Outfielder') ? 95 : activePlayer.position.includes('Shortstop') ? 90 : activePlayer.position.includes('Third') ? 70 : 60,
      color: 'bg-sky-500',
      desc: 'Determined from field position mobility.'
    },
    {
      label: 'SP. ATK (Launch Angle Lift)',
      value: Math.round(activePlayer.advanced.barrelPercent * 4 + 30),
      color: 'bg-red-500',
      desc: 'Extreme barrel contact trajectory.'
    },
    {
      label: 'SP. DEF (Splits Stability)',
      value: Math.round(parseFloat(activePlayer.splits.last10.ops) * 90),
      color: 'bg-yellow-500',
      desc: 'Resistance to opposing hand pitchers.'
    }
  ];

  // Circle Splits Graph data comparing splits
  const circleSplitsData = [
    { name: 'vs LHP OPS', value: parseFloat(activePlayer.splits.vLHP.ops), color: '#10b981' },
    { name: 'vs RHP OPS', value: parseFloat(activePlayer.splits.vRHP.ops), color: '#3b82f6' },
    { name: 'Home Splits', value: parseFloat(activePlayer.splits.home.ops), color: '#f59e0b' },
    { name: 'Away Splits', value: parseFloat(activePlayer.splits.away.ops), color: '#8b5cf6' }
  ];

  // Rolling last 10 games trend values
  const last10OPS = parseFloat(activePlayer.splits.last10.ops) || 0.8;
  const rollingTrendData = [
    { game: 'G1', Ind: parseFloat((last10OPS * 0.85).toFixed(3)) },
    { game: 'G2', Ind: parseFloat((last10OPS * 0.95).toFixed(3)) },
    { game: 'G3', Ind: parseFloat((last10OPS * 0.90).toFixed(3)) },
    { game: 'G4', Ind: parseFloat((last10OPS * 1.05).toFixed(3)) },
    { game: 'G5', Ind: parseFloat((last10OPS * 1.02).toFixed(3)) },
    { game: 'G6', Ind: parseFloat((last10OPS * 0.88).toFixed(3)) },
    { game: 'G7', Ind: parseFloat((last10OPS * 1.15).toFixed(3)) },
    { game: 'G8', Ind: parseFloat((last10OPS * 0.97).toFixed(3)) },
    { game: 'G9', Ind: parseFloat((last10OPS * 1.08).toFixed(3)) },
    { game: 'G10', Ind: last10OPS }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none" id="pokemon-saber-card-container">
      
      {/* COLUMN 1: THE COLLECTIBLE GAME CARD VIEW (SPAN 5) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div 
          id="retro-game-collectible-card"
          className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-[#13192b] to-[#1d2744] hover:shadow-[0_20px_50px_rgba(251,191,36,0.3)] shadow-2xl rounded-[32px] p-6 border-[5px] border-yellow-400 select-none overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5"
        >
          {/* Shiny foil lens diagonal highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none transform -skew-x-12 translate-x-1/2 scale-150" />

          {/* Top Row: Ribbon with Name, HP & Level */}
          <div className="flex bg-[#0a0d16]/95 border border-slate-800 rounded-2xl p-2.5 items-center justify-between mb-4 relative z-10" id="card-ribbon-header">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black font-mono text-yellow-400 shrink-0">BASIC</span>
              <h3 className="text-sm font-black text-white uppercase truncate font-mono tracking-wider">{activePlayer.name}</h3>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0 text-right">
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${pokemonType.text} shrink-0`}>
                {pokemonType.icon} {pokemonType.name}
              </span>
              <div className="font-mono flex flex-col justify-center leading-none">
                <span className="text-[10px] text-yellow-400 font-extrabold block">Lv.{adjustedScore}</span>
                <span className="text-[9px] text-red-400 font-black tracking-tight block mt-0.5">
                  {Math.round(parseFloat(activePlayer.seasonStats.ops) * 100)} HP
                </span>
              </div>
            </div>
          </div>

          {/* Today Matchup adjustments - Embed live calibration parameters within the Poke Card */}
          <div className="grid grid-cols-2 gap-2 mb-4 relative z-10 text-[10px] font-mono">
            {/* Live Lineup Order status details */}
            <div className={`p-2 rounded-xl border flex flex-col justify-center ${starterInfo.color}`}>
              <span className="text-[8px] text-slate-400/90 tracking-widest uppercase">LINEUP STATUS</span>
              <strong className="block text-[11px] truncate mt-0.5 font-bold">{starterInfo.statusText}</strong>
              <span className="block text-[9.5px] mt-0.5 text-slate-300 truncate">{starterInfo.orderText}</span>
            </div>

            {/* Platoon Ground Matchup modifier switch */}
            <div className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-center">
              <span className="text-[8px] text-slate-500 tracking-widest uppercase">MATCHUP PITCHER</span>
              <div className="flex gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => setOpposingPitcherType('RHP')}
                  className={`flex-1 text-[9px] font-black py-0.5 rounded transition-all border ${
                    opposingPitcherType === 'RHP'
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  vs RHP
                </button>
                <button
                  type="button"
                  onClick={() => setOpposingPitcherType('LHP')}
                  className={`flex-1 text-[9px] font-black py-0.5 rounded transition-all border ${
                    opposingPitcherType === 'LHP'
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  vs LHP
                </button>
              </div>
            </div>
          </div>

          {/* Foil Polaroid Illustration */}
          <div className="bg-[#0b0e1a]/95 border border-slate-800 p-2.5 rounded-2xl relative select-none mb-4" id="pokemon-polaroid-box">
            {/* Hologram gradient mesh overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-505/10 to-indigo-505/10 pointer-events-none" />
            <div className="border border-slate-800/80 rounded-xl overflow-hidden aspect-[16/10] bg-[#070a13] relative flex items-center justify-center">
              
              {/* Halftone retro background dots */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF176_1px,transparent_1px)] bg-[size:12px_12px]" />
              
              {/* Player face */}
              <img
                src={activePlayer.headshot}
                alt={activePlayer.name}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-24 h-24 object-contain relative z-10 transition-transform hover:scale-110 drop-shadow-[0_8px_16px_rgba(251,191,36,0.3)]"
              />

              {/* Rarity Gold Stars */}
              <div className="absolute bottom-1.5 left-2 z-20 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-[8px] font-mono text-yellow-400 font-extrabold">
                ★★★★★ {pokemonType.description}
              </div>

              {/* Position summary */}
              <div className="absolute bottom-1.5 right-2 z-20 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 text-[8px] font-mono text-slate-400">
                # {activePlayer.number} • {activePlayer.bats}/{activePlayer.throws} bats
              </div>
            </div>
          </div>

          {/* Pokédex description (Flavor text box representing scouts) */}
          <div className="bg-[#0c0f1b] border border-slate-850 p-3 rounded-xl mb-4 relative font-mono text-[10px]" id="flavor-quote-report">
            <span className="absolute -top-2 right-4 bg-[#13192b] border border-slate-850 px-2 py-0.5 text-[8px] font-black text-yellow-400 uppercase tracking-widest leading-none">
              CARD FLAVOR
            </span>
            <p className="text-slate-300 italic leading-relaxed text-center">
              "{activePlayer.scoutingReport.overallScouting}"
            </p>
          </div>

          {/* Cards special moves (Pro propositions translated as battle moves) */}
          <div className="space-y-2 select-none relative z-10" id="battle-moves-deck">
            <span className="text-[8px] font-black font-mono tracking-widest uppercase text-slate-400 block border-b border-slate-800/60 pb-1 flex items-center justify-between">
              <span>SPECIAL MOVES (PRO WAGERS)</span>
              <span>SLIP ODDS</span>
            </span>
            
            {activePlayer.propositions.map((prop) => {
              const isStaged = activeLegs.some(leg => leg.id === prop.id || leg.id.includes(prop.id) || prop.spec.includes(leg.selection));
              return (
                <div 
                  key={prop.id}
                  className="bg-[#090d18] border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between hover:border-yellow-400/20 transition-colors gap-2 text-xs"
                >
                  <div className="min-w-0 pr-1 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⚔️</span>
                    <div className="min-w-0">
                      <strong className="block text-[11px] uppercase font-bold text-slate-100 truncate tracking-tight font-mono">{prop.market}</strong>
                      <span className="block text-[9.5px] text-slate-450 text-slate-500 font-mono truncate leading-none mt-1">{prop.spec}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWagerProposition(activePlayer, prop)}
                    disabled={isStaged || starterInfo.code === 'IL'}
                    className={`py-1.5 px-3 rounded-lg text-[9px] font-mono font-black transition-all ${
                      isStaged
                        ? 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed'
                        : starterInfo.code === 'IL'
                        ? 'bg-red-950/20 border-red-950 text-red-500 cursor-not-allowed font-bold'
                        : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 hover:shadow-md active:scale-95 border border-yellow-300'
                    }`}
                  >
                    {isStaged ? 'STAGED' : starterInfo.code === 'IL' ? 'LOCKED' : `+${prop.odds.toFixed(2)}`}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* COLUMN 2: RETRO POKÉ-DEX BASE STATS & GRAPHS GRID (SPAN 7) */}
      <div className="lg:col-span-7 space-y-6" id="pokedex-stats-panel">
        
        {/* Row 1: Base Stats Progress Bars */}
        <div className="bg-slate-900/30 border border-slate-800/50 p-5 rounded-3xl shadow-lg space-y-4">
          <h4 className="text-xs font-black font-mono text-slate-300 uppercase tracking-widest border-b border-slate-800/60 pb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              🕹️ SABER-POCKET STATISTICAL ATTEMPTS (MAX 120)
            </span>
            <span className="text-yellow-400 font-black">Lv. {adjustedScore} CALIBRE</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {statsList.map((st, sidx) => (
              <div key={sidx} className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 font-bold">{st.label}</span>
                  <strong className="text-white font-black">{st.value}</strong>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full ${st.color} transition-all duration-500`}
                    style={{ width: `${Math.min(100, (st.value / 120) * 100)}%` }}
                  />
                </div>
                <span className="block text-[8.5px] text-slate-500 font-mono leading-none">{st.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Double Interactive Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
          
          {/* Trend Line Plot */}
          <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-3xl space-y-3">
            <div>
              <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest block flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                ROLLING HP TREND CORES
              </span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">OPS Level across the last 10 games logs</span>
            </div>

            <div className="h-36 w-full text-[9px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rollingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="game" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="Ind" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Splitting Donut Graph (Circle Graph) */}
          <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-3xl space-y-3">
            <div>
              <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                SITUATIONAL PLATOON CIRCLE GRAPH
              </span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Dual split distributions and home/away ratios</span>
            </div>

            <div className="h-36 w-full flex items-center justify-between">
              <div className="h-full w-[50%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={circleSplitsData}
                      cx="55%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={35}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {circleSplitsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} OPS`]} contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[9px] font-mono leading-normal text-slate-400 space-y-1 pr-1 shrink-0">
                <div className="flex items-center gap-1 min-w-[70px]"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> LHP: {activePlayer.splits.vLHP.ops}</div>
                <div className="flex items-center gap-1 min-w-[70px]"><span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> RHP: {activePlayer.splits.vRHP.ops}</div>
                <div className="flex items-center gap-1 min-w-[70px]"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> Home: {activePlayer.splits.home.ops}</div>
                <div className="flex items-center gap-1 min-w-[70px]"><span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" /> Away: {activePlayer.splits.away.ops}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Row 3: Live Sabermetrics, Batted Ball, and Statcast Tracking */}
        <div className="bg-slate-900/30 border border-slate-800/50 p-5 rounded-3xl shadow-lg space-y-4">
          <h4 className="text-xs font-black font-mono text-slate-300 uppercase tracking-widest border-b border-slate-800/60 pb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            📊 LIVE SABERMETRICS & BATTED BALL PROFILES
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Batted Ball Profile */}
            <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-3 font-mono">
              <span className="block text-[10px] text-yellow-300 font-extrabold uppercase tracking-wider">
                ⚾ Batted Ball Profile
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ground Ball Ratio (GB%)</span>
                  <span className="text-white font-bold">{activePlayer.battedBall?.gbPercent ?? 44}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Line Drive Ratio (LD%)</span>
                  <span className="text-white font-bold">{activePlayer.battedBall?.ldPercent ?? 21}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fly Ball Ratio (FB%)</span>
                  <span className="text-white font-bold">{activePlayer.battedBall?.fbPercent ?? 35}%</span>
                </div>
              </div>
              <div className="h-2 w-full flex bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-orange-500 h-full" style={{ width: `${activePlayer.battedBall?.gbPercent ?? 44}%` }} />
                <div className="bg-blue-500 h-full" style={{ width: `${activePlayer.battedBall?.ldPercent ?? 21}%` }} />
                <div className="bg-emerald-500 h-full" style={{ width: `${activePlayer.battedBall?.fbPercent ?? 35}%` }} />
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                <span>GB: {activePlayer.battedBall?.gbPercent ?? 44}%</span>
                <span>LD: {activePlayer.battedBall?.ldPercent ?? 21}%</span>
                <span>FB: {activePlayer.battedBall?.fbPercent ?? 35}%</span>
              </div>
            </div>

            {/* Box 2: Home Run Indicators */}
            <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-2.5 font-mono">
              <span className="block text-[10px] text-yellow-300 font-extrabold uppercase tracking-wider">
                🚀 Power & HR Indicators
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">HR / Fly Ball Rate</span>
                  <span className="text-white font-bold">{activePlayer.homeRunStats?.hrfbPercent ?? 15}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">At-Bats per HR (AB/HR)</span>
                  <span className="text-white font-bold">{activePlayer.homeRunStats?.abhr ?? '25'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected HRs (xHR)</span>
                  <span className="text-emerald-400 font-extrabold">{activePlayer.homeRunStats?.xHr ?? activePlayer.seasonStats.hr} xHR</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-1 mt-1">
                  <span className="text-slate-403 text-slate-400">No-Doubt HR / Barrels</span>
                  <span className="text-amber-400 font-bold">
                    {activePlayer.homeRunStats?.noDoubtHrs ?? 5} / {activePlayer.homeRunStats?.barrelsCount ?? 15}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 3: Standard & Advanced Triple Crown Expansion */}
            <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-2.5 font-mono">
              <span className="block text-[10px] text-yellow-300 font-extrabold uppercase tracking-wider">
                📈 Base Coverage & Hard Hit
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">On-Base % (OBP)</span>
                  <span className="text-white font-bold">{activePlayer.seasonStats.obp ?? '.340'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slugging % (SLG)</span>
                  <span className="text-white font-bold">{activePlayer.seasonStats.slg ?? '.450'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 text-slate-400">Hard Hit Percentage</span>
                  <span className="text-emerald-450 text-emerald-400 font-bold">{activePlayer.advanced.hardHitPercent}%</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-1 mt-1">
                  <span className="text-slate-300">Base-On-Balls (Walks)</span>
                  <span className="text-amber-400 font-bold">
                    {Math.round(80 * (parseFloat(activePlayer.seasonStats.obp || '.310') - parseFloat(activePlayer.seasonStats.avg || '.250')) * 10)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Healthy advisories & Platoon matchups caution cards */}
        <div className="bg-slate-900/30 border border-slate-800/50 p-4.5 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-900 space-y-1 flex flex-col justify-center">
            <span className="text-[9px] font-black text-rose-450 text-red-400 font-mono flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              SABER-POCKET RISK FACTOR (RISK: {activePlayer.scoutingReport.riskFactor})
            </span>
            <p className="text-[10px] text-slate-405 leading-normal text-slate-400 font-mono transition-colors">
              <b>{activePlayer.injuryStatus}</b> — {activePlayer.injuryNotes || 'Excellent player physical threshold status recorded.'}
            </p>
          </div>

          <div className="bg-indigo-950/10 p-3 rounded-2xl border border-indigo-950/30 flex flex-col justify-center">
            <span className="text-[9px] font-black text-indigo-400 font-mono flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              SABER DIRECT PLATOON COMBAT MULTIPLIER
            </span>
            <p className="text-[10px] text-slate-400 font-mono leading-normal">
              {activePlayer.name} bats <b>{activePlayer.bats}</b>. Facing a <b>{opposingPitcherType}</b> provides a custom <span className="text-yellow-400 font-bold">{opposingPitcherType === (activePlayer.bats === 'L' ? 'RHP' : 'LHP') ? '+12% Advantage' : '-6% Penalty'}</span> in launch dynamics.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
