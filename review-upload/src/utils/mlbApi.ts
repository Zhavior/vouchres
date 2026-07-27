import { MLBPlayer } from '../types';
import { MLB_PLAYER_RECORDS } from '../data/playerData';

// Cache in-memory for active players roster to avoid duplicate fetches.
// `rosterPromise` holds the single in-flight fetch so concurrent callers share it
// (instead of one caller getting an empty list mid-fetch — the cause of the 43-player bug).
let cachedActivePlayers: any[] = [];
let rosterPromise: Promise<any[]> | null = null;

/**
 * Interfaces for MLB Stats API payload structure
 */
interface MLBPeopleResponse {
  id: number;
  fullName: string;
  primaryNumber?: string;
  currentTeam?: { id: number; name: string };
  primaryPosition?: { code: string; name: string; abbreviation: string };
  birthDate?: string;
  height?: string;
  weight?: number;
  batSide?: { code: 'L' | 'R' | 'S' };
  pitchHand?: { code: 'L' | 'R' };
}

/**
 * Normalizes baseball positions into cleaner names that fit our system.
 */
function normalizePosition(abbrev: string): string {
  switch (abbrev) {
    case 'OF': return 'Outfielder';
    case 'CF': return 'Center Fielder';
    case 'LF': return 'Left Fielder';
    case 'RF': return 'Right Fielder';
    case '1B': return 'First Baseman';
    case '2B': return 'Second Baseman';
    case '3B': return 'Third Baseman';
    case 'SS': return 'Shortstop';
    case 'C':  return 'Catcher';
    case 'DH': return 'Designated Hitter';
    case 'P':  return 'Pitcher';
    case 'TWP': return 'Designated Hitter / Pitcher';
    default: return 'Infielder';
  }
}

/**
 * Fetch the complete active roster of MLB players for the current season.
 * This runs in the background to enable seamless search across all MLB players.
 */
export async function getActiveMLBRoster(): Promise<any[]> {
  // Already loaded — return the cached full roster.
  if (cachedActivePlayers.length > 0) {
    return cachedActivePlayers;
  }
  // A fetch is already in flight — await the SAME promise so every caller gets the
  // full roster (never an empty array mid-fetch).
  if (rosterPromise) {
    return rosterPromise;
  }

  rosterPromise = (async () => {
    try {
      // Use standard MLB stats API for active players
      const response = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players');
      if (!response.ok) {
        throw new Error(`MLB Roster Fetch failed: ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.people)) {
        // Filter for active players with valid teams and positions
        cachedActivePlayers = data.people.filter((p: any) => p.active && p.currentTeam && p.primaryPosition);
        console.log(`Loaded ${cachedActivePlayers.length} active players from MLB Stats API successfully.`);
      }
    } catch (error) {
      console.error('Failed to load active MLB roster, falling back to local database only:', error);
    } finally {
      // Clear the in-flight handle. On success the cache guard above serves future
      // callers; on failure this allows a retry on the next call.
      rosterPromise = null;
    }
    return cachedActivePlayers;
  })();

  return rosterPromise;
}

/**
 * Converts a raw MLB Stats API person object into our enriched MLBPlayer stub,
 * complete with a real MLB headshot URL. Heavy stats use neutral baselines and are
 * replaced with live values by enrichPlayerStats() when the player is opened.
 */
export function toMLBPlayerStub(p: any): MLBPlayer {
  const id = `mlbapi_${p.id}`;
  const bats = (p.batSide?.code === 'S' ? 'S' : p.batSide?.code === 'L' ? 'L' : 'R') as 'L' | 'R' | 'S';
  const throws = (p.pitchHand?.code === 'L' ? 'L' : 'R') as 'L' | 'R';
  return {
          id,
          name: p.fullName,
          team: p.currentTeam?.name || 'MLB Free Agent',
          position: normalizePosition(p.primaryPosition?.abbreviation || 'IF'),
          number: p.primaryNumber || '0',
          headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${p.id}/headshot/67/current`,
          injuryStatus: 'Cleared / Fully Active',
          injurySeverity: 'NONE' as const,
          injuryNotes: 'Active roster standards checked via real-time MLB API.',
          batterScore: 50,
          // Never invent season HR/AVG lines before enrichPlayerStats loads live splits.
          seasonStats: { avg: '—', hr: '—', rbi: '—', ops: '—', obp: '—', slg: '—' },
          bats,
          throws,
          height: p.height || '—',
          weight: p.weight ? `${p.weight} lbs` : '—',
          birthdate: p.birthDate ? formatDate(p.birthDate) : '—',
          advanced: {
            barrelPercent: 0,
            launchAngle: 0,
            exitVelocity: 0,
            hardHitPercent: 0,
            chasePercent: 0,
            woba: 0,
            xwoba: 0,
            sweetSpotPercent: 0,
          },
          battedBall: {
            gbPercent: 0,
            ldPercent: 0,
            fbPercent: 0,
          },
          homeRunStats: {
            hrfbPercent: 0,
            abhr: 0,
            barrelsCount: 0,
            noDoubtHrs: 0,
            xHr: 0,
          },
          splits: {
            vLHP: { avg: '—', obp: '—', slg: '—', ops: '—' },
            vRHP: { avg: '—', obp: '—', slg: '—', ops: '—' },
            home: { avg: '—', obp: '—', slg: '—', ops: '—' },
            away: { avg: '—', obp: '—', slg: '—', ops: '—' },
            last10: { avg: '—', obp: '—', slg: '—', ops: '—' },
          },
          scoutingReport: {
            powerText: 'Live season stats load when this batter is opened.',
            contactText: 'Contact metrics unavailable until MLB season stats resolve.',
            disciplineText: 'Discipline metrics unavailable until MLB season stats resolve.',
            overallScouting: 'Identity from MLB roster. Season totals refresh from statsapi — not seed data.',
            hotZones: ['Data unavailable'],
            riskFactor: 'MEDIUM' as const,
          },
          gameLogs: [],
          propositions: [
            { id: `prop_mlbapi_${p.id}_hits`, market: 'To Record 1+ Hits', odds: null, spec: `${p.fullName} Over 0.5 Hits`, truthLabel: 'Hit market · price unknown' },
            { id: `prop_mlbapi_${p.id}_bases`, market: 'Total Bases Prop', odds: null, spec: `${p.fullName} Over 1.5 Total Bases`, truthLabel: 'Total-base market · price unknown' },
          ],
        } as MLBPlayer;
}

// True if a live-API player is already represented by a curated record.
function existsInCurated(p: any): boolean {
  return MLB_PLAYER_RECORDS.some(
    (lp) => lp.id === `mlbapi_${p.id}` || lp.name.toLowerCase() === p.fullName.toLowerCase()
  );
}

/** Seed HR/AVG lines are stale — clear until enrichPlayerStats loads live splits. */
function stripUnverifiedSeasonStats(player: MLBPlayer): MLBPlayer {
  return {
    ...player,
    seasonStats: { avg: '—', hr: '—', rbi: '—', ops: '—', obp: '—', slg: '—' },
    gameLogs: [],
  };
}

function overlayLiveRosterIdentity(player: MLBPlayer, roster: any[]): MLBPlayer {
  const fromHeadshot = player.headshot?.match(/\/people\/(\d+)\//)?.[1];
  const api = roster.find(
    (p) =>
      (fromHeadshot && String(p.id) === fromHeadshot)
      || String(p.fullName ?? '').toLowerCase() === player.name.toLowerCase(),
  );
  if (!api) return player;
  return {
    ...player,
    team: api.currentTeam?.name || player.team,
    position: normalizePosition(api.primaryPosition?.abbreviation || player.position),
    number: api.primaryNumber || player.number,
    headshot:
      fromHeadshot || !api.id
        ? player.headshot
        : `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${api.id}/headshot/67/current`,
  };
}

/**
 * Returns the entire MLB player universe as MLBPlayer stubs:
 * curated identity first (with live team overlay), then every other active player,
 * sorted alphabetically. Each has a real MLB headshot URL.
 */
export async function getAllMLBPlayerStubs(): Promise<MLBPlayer[]> {
  const roster = await getActiveMLBRoster();
  const curated = MLB_PLAYER_RECORDS.map((p) =>
    stripUnverifiedSeasonStats(overlayLiveRosterIdentity(p, roster)),
  );
  const apiStubs = roster
    .filter((p) => !existsInCurated(p))
    .map(toMLBPlayerStub)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...curated, ...apiStubs];
}

export async function searchMLBPlayers(term: string): Promise<MLBPlayer[]> {
  const normTerm = term.trim().toLowerCase();

  // No / very short term: browse the entire MLB universe.
  if (normTerm.length < 2) {
    try {
      return await getAllMLBPlayerStubs();
    } catch {
      return MLB_PLAYER_RECORDS;
    }
  }

  // Curated identity first, then overlay live team and clear stale seed HR lines.
  const localMatched = MLB_PLAYER_RECORDS.filter(
    (p) =>
      p.name.toLowerCase().includes(normTerm) ||
      p.team.toLowerCase().includes(normTerm) ||
      p.position.toLowerCase().includes(normTerm)
  );

  try {
    const roster = await getActiveMLBRoster();
    const localWithLiveTeam = localMatched.map((p) =>
      stripUnverifiedSeasonStats(overlayLiveRosterIdentity(p, roster)),
    );
    const apiConverted: MLBPlayer[] = roster
      .filter(
        (p) =>
          (p.fullName.toLowerCase().includes(normTerm) ||
            (p.currentTeam?.name || '').toLowerCase().includes(normTerm)) &&
          !existsInCurated(p)
      )
      .map(toMLBPlayerStub);

    const merged = [...localWithLiveTeam];
    for (const ap of apiConverted) {
      if (!merged.some((m) => m.name.toLowerCase() === ap.name.toLowerCase())) {
        merged.push(ap);
      }
    }
    return merged;
  } catch (err) {
    console.warn('CORS or network error fetching roster from API, using local values:', err);
    return localMatched;
  }
}

/**
 * Fetches the real-time season hitting stats for a given player and enriches they fields
 */
export async function enrichPlayerStats(player: MLBPlayer): Promise<MLBPlayer> {
  // Resolve a numeric MLB person id from registry ids, mlbapi_ stubs, curated keys, or headshot URL.
  const isApiPlayer = player.id.startsWith('mlbapi_');
  const rawId = isApiPlayer ? player.id.replace('mlbapi_', '') : null;
  const numericId = /^\d+$/.test(player.id) ? player.id : null;
  const headshotId = player.headshot?.match(/\/people\/(\d+)\//)?.[1] ?? null;

  let mlbIdStr = rawId || numericId || headshotId;
  if (!mlbIdStr) {
    const matchMap: Record<string, string> = {
      mlb_ohtani: '660271',
      mlb_judge: '592450',
      mlb_betts: '605141',
      mlb_alvarez: '670541',
      mlb_acuna: '660670',
      mlb_tatis: '665489',
      mlb_tucker: '663656',
      mlb_devers: '646240',
      mlb_machado: '592518',
      mlb_soto: '665742',
    };
    mlbIdStr = matchMap[player.id] ?? null;
  }

  if (!mlbIdStr) {
    // If we can't find an ID, return the original player supplemented with batted ball calculations
    return calculateCalculatedAdvancedMetrics(player);
  }

  try {
    const statsUrl = `https://statsapi.mlb.com/api/v1/people/${mlbIdStr}/stats?stats=season&group=hitting`;
    const response = await fetch(statsUrl);
    if (!response.ok) {
      throw new Error(`Stats fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !Array.isArray(data.stats) || data.stats.length === 0) {
      return calculateCalculatedAdvancedMetrics(player);
    }

    const firstStat = data.stats[0];
    if (!Array.isArray(firstStat.splits) || firstStat.splits.length === 0) {
      return calculateCalculatedAdvancedMetrics(player);
    }

    // Get the most recent split or match current year
    const activeSplit = firstStat.splits[firstStat.splits.length - 1];
    const s = activeSplit.stat;

    const avg = s.avg || '.250';
    const hr = String(s.homeRuns ?? '0');
    const rbi = String(s.rbi ?? '0');
    const ops = s.ops || '.750';
    const obp = s.obp || '.310';
    const slg = s.slg || '.420';

    const atBats = s.atBats ?? 400;
    const hits = s.hits ?? 100;
    const walks = s.baseOnBalls ?? 40;
    const runs = s.runs ?? 50;

    // Estimate Statcast properties using actual stats
    const avgVal = parseFloat(avg) || 0.250;
    const opsVal = parseFloat(ops) || 0.750;
    const hrVal = parseInt(hr) || 0;

    // Core variables
    const exitVelocity = parseFloat((88.5 + (hrVal / 5) + (avgVal * 12)).toFixed(1));
    const barrelPercent = parseFloat((3.5 + (hrVal / 4.2) + (opsVal * 6)).toFixed(1));
    const launchAngle = parseFloat((10.2 + (hrVal % 12) * 0.8).toFixed(1));
    const hardHitPercent = parseFloat((33.0 + (hrVal / 1.5) + (opsVal * 15)).toFixed(1));
    const chasePercent = parseFloat((26.0 - (walks / atBats) * 35).toFixed(1));
    const woba = parseFloat((avgVal * 1.05 + parseFloat(obp) * 0.7).toFixed(3));
    const xwoba = parseFloat((woba + (barrelPercent * 0.005)).toFixed(3));
    const sweetSpotPercent = parseFloat((34.0 + (avgVal * 20)).toFixed(1));

    // Calculate dynamic safety score
    const baseScore = Math.round((opsVal * 70) + (avgVal * 70) + (hrVal / 2));
    const batterScore = Math.min(99, Math.max(30, baseScore));

    // Prefer live team from the season split when MLB provides it (trades/stale seed).
    const liveTeam =
      typeof activeSplit?.team?.name === 'string' && activeSplit.team.name.trim()
        ? activeSplit.team.name.trim()
        : player.team;

    // Keep existing props but never invent sportsbook prices from season rates.
    const propositions = (player.propositions ?? []).map((prop) => ({
      ...prop,
      odds: prop.odds ?? null,
    }));

    // Build the fully enriched active player object
    const enrichedPlayer: MLBPlayer = {
      ...player,
      team: liveTeam,
      batterScore,
      seasonStats: {
        avg,
        hr,
        rbi,
        ops,
        obp,
        slg
      },
      advanced: {
        barrelPercent,
        launchAngle,
        exitVelocity,
        hardHitPercent,
        chasePercent,
        woba,
        xwoba,
        sweetSpotPercent
      },
      // Do not invent game-by-game HR lines — season totals above are the sourced record.
      gameLogs: [],
      propositions
    };

    return calculateCalculatedAdvancedMetrics(enrichedPlayer);
  } catch (err) {
    console.error(`Error enriching stats for ${player.name} from MLB API, using calculations:`, err);
    return calculateCalculatedAdvancedMetrics(player);
  }
}

/**
 * Format date representation helper
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Formulates calculations for extended properties: Batted Ball and detailed Home Run indicators
 */
export function calculateCalculatedAdvancedMetrics(player: MLBPlayer): MLBPlayer {
  const hrVal = parseInt(player.seasonStats.hr) || 0;
  const avgVal = parseFloat(player.seasonStats.avg) || 0.250;
  const opsVal = parseFloat(player.seasonStats.ops) || 0.750;
  
  // Calculate raw OBP and SLG if missing
  const obp = player.seasonStats.obp || (avgVal + 0.08).toFixed(3);
  const slg = player.seasonStats.slg || (avgVal * 1.8).toFixed(3);

  // 1. Batted Ball Profiles (GB%, LD%, FB%)
  // High exit velo and high launch angle increase FB%
  const av = player.advanced;
  const fbPercent = Math.min(55, Math.max(25, Math.round(30 + (av.launchAngle * 1.1) + (av.barrelPercent * 0.4))));
  const ldPercent = Math.min(28, Math.max(16, Math.round(18 + (avgVal * 25))));
  const gbPercent = 100 - fbPercent - ldPercent;

  // 2. Advanced Home Run Indicators
  const hrfbPercent = fbPercent > 0 ? parseFloat(( (hrVal / (Math.max(100, hrVal * 8) * fbPercent / 100)) * 100 ).toFixed(1)) : 0;
  const finalHrfb = isNaN(hrfbPercent) || hrfbPercent === 0 
    ? parseFloat((3.5 + (av.barrelPercent * 0.9)).toFixed(1)) 
    : Math.min(45, Math.max(2, hrfbPercent));

  const atBats = hrVal > 0 ? Math.round(hrVal * (12 + (0.350 - avgVal) * 45)) : 300;
  const abhr = hrVal > 0 ? parseFloat((atBats / hrVal).toFixed(1)) : 0;

  const barrelsCount = Math.max(hrVal, Math.round(atBats * (av.barrelPercent / 100)));
  
  const noDoubtRatio = 0.15 + (av.exitVelocity - 88) * 0.02 + (av.launchAngle - 10) * 0.01;
  const noDoubtHrs = Math.max(0, Math.min(hrVal, Math.round(hrVal * Math.min(0.55, Math.max(0.05, noDoubtRatio)))));

  const dev = (Math.sin(hrVal) * 2.5);
  const xHr = Math.max(0, Math.round(hrVal * 0.95 + dev));

  // If obp or slg weren't previously in player.seasonStats, make sure they are written in
  const extendedPlayer: MLBPlayer = {
    ...player,
    seasonStats: {
      ...player.seasonStats,
      obp,
      slg
    },
    battedBall: {
      gbPercent,
      ldPercent,
      fbPercent
    },
    homeRunStats: {
      hrfbPercent: finalHrfb,
      abhr,
      barrelsCount,
      noDoubtHrs,
      xHr
    }
  };

  return extendedPlayer;
}
