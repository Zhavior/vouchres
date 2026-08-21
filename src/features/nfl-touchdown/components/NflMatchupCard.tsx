import React from 'react';
import { Target, TrendingUp, Activity, Clock } from 'lucide-react';
import { NflMatchupIntelligence, NflTeamIntelligence, NflLeader } from '../api/nflTouchdownApi';

interface NflMatchupCardProps {
  game: NflMatchupIntelligence;
}

export function NflMatchupCard({ game }: NflMatchupCardProps) {
  const isLive = game.status === 'in';
  const isPost = game.status === 'post';
  const isPre = game.status === 'pre';

  // Find offensive leaders for highlighting potential touchdowns
  const passingLeader = game.leaders.find((l) => l.category === 'passing');
  const rushingLeader = game.leaders.find((l) => l.category === 'rushing');
  const receivingLeader = game.leaders.find((l) => l.category === 'receiving');

  const renderTeam = (team: NflTeamIntelligence) => (
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 overflow-hidden"
        style={{ borderColor: `#${team.color}`, borderWidth: '2px' }}
      >
        {team.logo ? (
          <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-xs font-bold">{team.abbreviation}</span>
        )}
      </div>
      <div className="flex-1">
        <div className="font-bold text-white tracking-wide">{team.name}</div>
      </div>
      {!isPre && (
        <div className="text-2xl font-bold text-white w-8 text-right font-mono tabular-nums">
          {team.score}
        </div>
      )}
    </div>
  );

  const renderLeader = (leader: NflLeader | undefined, label: string) => {
    if (!leader) return null;
    return (
      <div className="flex items-center justify-between py-2 border-b border-zinc-800/80 last:border-0">
        <div className="flex items-center gap-2">
          {leader.athleteHeadshot ? (
            <img src={leader.athleteHeadshot} alt={leader.athleteName} className="w-8 h-8 rounded-full object-cover bg-zinc-900" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <Activity className="w-4 h-4 text-ve-silver-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-ve-silver-100 leading-tight">{leader.athleteName}</span>
            <span className="text-xs text-ve-silver-400 font-mono tracking-wider">{label.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-sm font-bold text-ve-green font-mono tabular-nums">{leader.displayValue}</div>
      </div>
    );
  };

  const hasIntelligence = passingLeader || rushingLeader || receivingLeader;

  const cardStyle = isLive 
    ? "border-ve-green/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-ve-green/30" 
    : "border-ve-obsidian-border/50 shadow-[2px_2px_0px_0px_#1e293b] hover:border-zinc-500 hover:shadow-[2px_2px_0px_0px_#52525b]";

  return (
    <div className={`ve-glass-panel relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 w-full group cursor-pointer border ${cardStyle}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="text-xs font-mono tabular-nums tracking-widest flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-2 text-ve-green font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ve-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ve-green"></span>
              </span>
              LIVE • Q{game.period} {game.clock}
            </span>
          )}
          {isPost && <span className="font-bold text-ve-silver-100">FINAL</span>}
          {isPre && (
            <span className="flex items-center gap-1.5 text-ve-silver-400">
              <Clock className="w-3.5 h-3.5" />
              {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-ve-silver-400 hover:text-white rounded-md hover:bg-zinc-800">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-3 p-5">
        {renderTeam(game.awayTeam)}
        {renderTeam(game.homeTeam)}
      </div>

      {/* Intelligence Data */}
      {!isPre && (
        <div className="p-4 pt-3 bg-gradient-to-b from-transparent to-zinc-900/50 mt-auto border-t border-zinc-800/80">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-ve-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-ve-gold">Touchdown Intelligence</span>
          </div>
          <div className="flex flex-col">
            {hasIntelligence ? (
              <>
                {renderLeader(passingLeader, 'Passing')}
                {renderLeader(rushingLeader, 'Rushing')}
                {renderLeader(receivingLeader, 'Receiving')}
              </>
            ) : (
              <div className="text-sm text-ve-silver-500 italic py-2">Intelligence data pending...</div>
            )}
          </div>
        </div>
      )}

      {/* Pre-game compact footer instead of huge empty card */}
      {isPre && (
         <div className="p-3 bg-zinc-900/30 mt-auto border-t border-zinc-800/80 flex justify-between items-center text-xs">
           <span className="text-ve-silver-400 font-medium">Awaiting Kickoff</span>
           <span className="text-ve-silver-500 font-mono">Live telemetry pending</span>
         </div>
      )}
    </div>
  );
}
