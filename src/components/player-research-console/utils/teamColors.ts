import type { TeamColorSpec } from '../types';

export function getTeamColors(teamName: string): TeamColorSpec {
    if (teamName.includes('Dodgers')) {
      return { 
        gradient: 'from-vouch-cyan/15 via-black/40 to-black/55', 
        border: 'border-white/10', 
        text: 'text-vouch-cyan', 
        glow: 'shadow-blue-500/10',
        badge: 'bg-black/40 text-vouch-cyan border border-white/10'
      };
    }
    if (teamName.includes('Yankees')) {
      return { 
        gradient: 'from-white/5 via-black/50 to-black/80', 
        border: 'border-gray-500/20', 
        text: 'text-white/70', 
        glow: 'shadow-black/10',
        badge: 'bg-black/30 text-white/70 border border-white/10'
      };
    }
    if (teamName.includes('Padres')) {
      return { 
        gradient: 'from-vouch-amber/15 via-black/40 to-vouch-amber/10', 
        border: 'border-amber-600/20', 
        text: 'text-amber-400', 
        glow: 'shadow-amber-500/10',
        badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      };
    }
    if (teamName.includes('Astros')) {
      return { 
        gradient: 'from-vouch-amber/15 via-black/45 to-vouch-amber/10', 
        border: 'border-orange-500/20', 
        text: 'text-orange-400', 
        glow: 'shadow-orange-500/10',
        badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
      };
    }
    if (teamName.includes('Braves')) {
      return { 
        gradient: 'from-red-600/16 via-black/40 to-black/55', 
        border: 'border-red-500/20', 
        text: 'text-red-400', 
        glow: 'shadow-red-500/10',
        badge: 'bg-red-500/10 text-red-400 border border-red-500/20'
      };
    }
    return { 
      gradient: 'from-vouch-cyan/15 via-black/40 to-black/55', 
      border: 'border-white/10', 
      text: 'text-vouch-cyan', 
      glow: 'shadow-black/20',
      badge: 'bg-black/40 text-vouch-cyan border border-white/10'
    };
}
