import React from 'react';
import { Target, TrendingUp, Activity } from 'lucide-react';
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
        <div className="font-semibold text-ve-silver-100">{team.name}</div>
      </div>
      <div className="text-2xl font-bold text-white w-8 text-right">
        {!isPre ? team.score : '-'}
      </div>
    </div>
  );

  const renderLeader = (leader: NflLeader | undefined, label: string) => {
    if (!leader) return null;
    return (
      <div className="flex items-center justify-between py-2 border-b border-ve-obsidian-border/50 last:border-0">
        <div className="flex items-center gap-2">
          {leader.athleteHeadshot ? (
            <img src={leader.athleteHeadshot} alt={leader.athleteName} className="w-8 h-8 rounded-full object-cover bg-ve-obsidian" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-ve-obsidian flex items-center justify-center">
              <Activity className="w-4 h-4 text-ve-silver-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ve-silver-100 leading-tight">{leader.athleteName}</span>
            <span className="text-xs text-ve-silver-400 font-mono tracking-wider">{label.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-sm font-bold text-ve-green font-mono">{leader.displayValue}</div>
      </div>
    );
  };

  return (
    <div className="ve-glass-panel relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:border-ve-silver-500/30 w-full group">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-ve-obsidian-border/50">
        <div className="text-xs font-mono tracking-widest text-ve-silver-400 flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-ve-green">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ve-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ve-green"></span>
              </span>
              LIVE • Q{game.period} {game.clock}
            </span>
          )}
          {isPost && <span>FINAL</span>}
          {isPre && <span>{new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-ve-silver-400 hover:text-white rounded-md hover:bg-ve-obsidian-hover">
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
      <div className="p-4 pt-2 bg-gradient-to-b from-transparent to-ve-obsidian-hover/30 mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-ve-gold" />
          <span className="text-xs font-semibold uppercase tracking-widest text-ve-gold">Touchdown Intelligence</span>
        </div>
        <div className="flex flex-col">
          {renderLeader(passingLeader, 'Passing')}
          {renderLeader(rushingLeader, 'Rushing')}
          {renderLeader(receivingLeader, 'Receiving')}
          {!passingLeader && !rushingLeader && !receivingLeader && (
            <div className="text-sm text-ve-silver-500 italic py-2">Intelligence data pending...</div>
          )}
        </div>
      </div>
    </div>
  );
}
