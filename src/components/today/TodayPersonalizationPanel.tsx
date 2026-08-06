import { Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { logoByTeamId } from '../../lib/teamLogos';
import type {
  TodayFollowedPlayer,
  TodayInAppAlertType,
  TodayPreferences,
  TodayPreferencesUpdate,
  TodayResearchInterest,
} from '../../types/todayPreferences';

export interface TodayTeamOption {
  id: number;
  name: string;
  abbreviation: string;
}

export interface TodayPlayerOption extends TodayFollowedPlayer {
  team: string;
  headshotUrl?: string | null;
}

interface Props {
  preferences: TodayPreferences;
  teams: TodayTeamOption[];
  players: TodayPlayerOption[];
  isSaving: boolean;
  saveError?: unknown;
  onSave: (preferences: TodayPreferencesUpdate) => Promise<unknown>;
  onClose: () => void;
}

const INTEREST_OPTIONS: Array<{ id: TodayResearchInterest; label: string; detail: string }> = [
  { id: 'home_runs', label: 'Home run signals', detail: 'Player-level HR research' },
  { id: 'pitching_matchups', label: 'Pitching matchups', detail: 'Pitcher and handedness context' },
  { id: 'lineup_status', label: 'Lineup status', detail: 'Confirmed and projected availability' },
  { id: 'weather_park_factors', label: 'Weather & parks', detail: 'Only when sourced inputs are available' },
  { id: 'player_form', label: 'Player form', detail: 'Recent verified performance' },
  { id: 'live_games', label: 'Live games', detail: 'Current game-state changes' },
  { id: 'active_slips', label: 'Active slips', detail: 'Work already in progress' },
  { id: 'results_accountability', label: 'Results', detail: 'Projection-versus-outcome review' },
];

const ALERT_OPTIONS: Array<{ id: TodayInAppAlertType; label: string; detail: string }> = [
  { id: 'favorite_team_game_state', label: 'Favorite-team game changes', detail: 'Pregame, live and final changes while Today is open' },
  { id: 'followed_player_lineup', label: 'Followed-player lineups', detail: 'Projected-to-official lineup changes' },
  { id: 'research_change', label: 'Material research changes', detail: 'Meaningful evidence or risk changes' },
  { id: 'tracked_result', label: 'Tracked result updates', detail: 'Accountability changes for saved slips' },
];

export default function TodayPersonalizationPanel({
  preferences,
  teams,
  players,
  isSaving,
  saveError,
  onSave,
  onClose,
}: Props) {
  const [favoriteMlbTeamIds, setFavoriteMlbTeamIds] = useState(preferences.favoriteMlbTeamIds);
  const [followedPlayers, setFollowedPlayers] = useState(preferences.followedPlayers);
  const [researchInterests, setResearchInterests] = useState(preferences.researchInterests);
  const [inAppAlertTypes, setInAppAlertTypes] = useState(preferences.inAppAlertTypes);
  const [saved, setSaved] = useState(false);

  const toggleTeam = (teamId: number) => {
    setSaved(false);
    setFavoriteMlbTeamIds((current) => current.includes(teamId)
      ? current.filter((id) => id !== teamId)
      : current.length < 5 ? [...current, teamId] : current);
  };
  const togglePlayer = (player: TodayPlayerOption) => {
    setSaved(false);
    setFollowedPlayers((current) => current.some((item) => item.id === player.id)
      ? current.filter((item) => item.id !== player.id)
      : [...current, { id: player.id, name: player.name }]);
  };
  const toggleInterest = (interest: TodayResearchInterest) => {
    setSaved(false);
    setResearchInterests((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest]);
  };
  const clearAll = () => {
    setFavoriteMlbTeamIds([]);
    setFollowedPlayers([]);
    setResearchInterests([]);
    setInAppAlertTypes([]);
    setSaved(false);
  };
  const toggleAlert = (alertType: TodayInAppAlertType) => {
    setSaved(false);
    setInAppAlertTypes((current) => current.includes(alertType)
      ? current.filter((item) => item !== alertType)
      : [...current, alertType]);
  };
  const save = async () => {
    try {
      await onSave({ favoriteMlbTeamIds, followedPlayers, researchInterests, inAppAlertTypes });
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <section
      id="today-personalization-panel"
      className="relative overflow-hidden rounded-3xl border border-vouch-cyan/25 bg-[linear-gradient(145deg,rgba(8,23,36,.98),rgba(4,9,17,.98))] p-4 shadow-[0_24px_70px_rgba(0,0,0,.48),0_0_36px_rgba(79,184,220,.08)] sm:p-6"
      aria-labelledby="today-personalization-title"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/80 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-vouch-emerald">
            <Sparkles className="h-3.5 w-3.5" /> Your Aurora briefing
          </p>
          <h2 id="today-personalization-title" className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            Personalize Today
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Choose what matters to you. These explicit choices rank your briefing; they do not create or change any research signal.
          </p>
        </div>
        <button type="button" onClick={onClose} className="z8-control shrink-0 rounded-full border border-white/10 bg-black/30 text-white/60 hover:text-white" aria-label="Close personalization">
          <X className="h-4 w-4" />
        </button>
      </div>

      <PreferenceGroup title="Favorite teams" helper={`${favoriteMlbTeamIds.length}/5 selected`}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {teams.map((team) => {
            const selected = favoriteMlbTeamIds.includes(team.id);
            const disabled = !selected && favoriteMlbTeamIds.length >= 5;
            return (
              <button key={team.id} type="button" onClick={() => toggleTeam(team.id)} aria-pressed={selected} disabled={disabled} className={`z8-control flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${selected ? 'border-vouch-emerald/55 bg-vouch-emerald/12 text-white' : 'border-white/10 bg-black/25 text-white/62 hover:border-vouch-cyan/35'}`}>
                <img src={logoByTeamId(team.id) ?? ''} alt="" className="h-7 w-7 shrink-0 object-contain" loading="lazy" />
                <span className="min-w-0">
                  <span className="block text-xs font-black">{team.abbreviation}</span>
                  <span className="block truncate text-[10px] text-white/65">{team.name}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PreferenceGroup>

      {players.length > 0 ? (
        <PreferenceGroup title="Players to follow" helper="From today’s verified player pool">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {players.map((player) => {
              const selected = followedPlayers.some((item) => item.id === player.id);
              return (
                <button key={player.id} type="button" onClick={() => togglePlayer(player)} aria-pressed={selected} className={`z8-control flex min-w-44 shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-left ${selected ? 'border-vouch-emerald/55 bg-vouch-emerald/12' : 'border-white/10 bg-black/25 hover:border-vouch-cyan/35'}`}>
                  <span className="flex h-9 w-9 shrink-0 items-end justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {player.headshotUrl ? <img src={player.headshotUrl} alt="" className="h-full w-full object-contain object-bottom" loading="lazy" /> : <span className="pb-2 text-xs font-black text-vouch-cyan">{player.name.slice(0, 1)}</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-white">{player.name}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-white/65">{player.team}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </PreferenceGroup>
      ) : null}

      <PreferenceGroup title="Research interests" helper={`${researchInterests.length} selected`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = researchInterests.includes(interest.id);
            return (
              <button key={interest.id} type="button" onClick={() => toggleInterest(interest.id)} aria-pressed={selected} className={`z8-control rounded-xl border p-3 text-left ${selected ? 'border-vouch-cyan/55 bg-vouch-cyan/10' : 'border-white/10 bg-black/25 hover:border-vouch-cyan/35'}`}>
                <span className="flex items-center justify-between gap-2 text-xs font-black text-white">
                  {interest.label}{selected ? <Check className="h-3.5 w-3.5 text-vouch-emerald" /> : null}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-white/65">{interest.detail}</span>
              </button>
            );
          })}
        </div>
      </PreferenceGroup>

      <PreferenceGroup title="In-app change alerts" helper={`${inAppAlertTypes.length} selected`}>
        <p className="mb-2 text-[10px] leading-4 text-white/65">
          These appear inside Today when you return or refresh. Background push delivery is not enabled.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ALERT_OPTIONS.map((alert) => {
            const selected = inAppAlertTypes.includes(alert.id);
            const disabled = (alert.id === 'favorite_team_game_state' && favoriteMlbTeamIds.length === 0)
              || (alert.id === 'followed_player_lineup' && followedPlayers.length === 0);
            return (
              <button key={alert.id} type="button" onClick={() => toggleAlert(alert.id)} aria-pressed={selected} disabled={disabled} className={`z8-control rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-35 ${selected ? 'border-vouch-emerald/55 bg-vouch-emerald/10' : 'border-white/10 bg-black/25 hover:border-vouch-cyan/35'}`}>
                <span className="flex items-center justify-between gap-2 text-xs font-black text-white">
                  {alert.label}{selected ? <Check className="h-3.5 w-3.5 text-vouch-emerald" /> : null}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-white/65">{alert.detail}</span>
              </button>
            );
          })}
        </div>
      </PreferenceGroup>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={clearAll} className="z8-control inline-flex items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-white/48 hover:text-white">
          <RotateCcw className="h-3.5 w-3.5" /> Clear choices
        </button>
        <div className="flex items-center gap-3">
          {saveError ? <p role="alert" className="text-xs text-rose-300">Preferences could not be saved. Try again.</p> : null}
          {saved ? <p role="status" className="text-xs font-bold text-vouch-emerald">Saved to your account</p> : null}
          <button type="button" onClick={() => void save()} disabled={isSaving} className="z8-control inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-vouch-emerald/50 bg-vouch-emerald px-5 text-xs font-black text-[#03110c] shadow-[0_0_22px_rgba(49,181,131,.22)] disabled:cursor-wait disabled:opacity-60 sm:flex-none">
            {isSaving ? 'Saving…' : 'Save personalization'}
          </button>
        </div>
      </div>
    </section>
  );
}

function PreferenceGroup({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-end justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-white/88">{title}</h3>
        <p className="text-[10px] text-white/62">{helper}</p>
      </div>
      {children}
    </div>
  );
}
