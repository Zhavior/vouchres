import { ChunkA, ChunkB, ChunkC } from './contracts';

// Ensure every player object in the daily slate payload (ChunkA) includes xSLG, barrelRate, and parkFactor upfront
export const mockChunkAData: ChunkA[] = [
  {
    playerId: 'p_592450',
    identity: { id: 'p_592450', mlbId: '592450', name: 'Aaron Judge', teamId: 'NYY', teamAbbreviation: 'NYY', handedness: 'R' },
    opponentTeamId: 'BOS', opposingPitcherId: 'p_sale_41', opposingPitcherName: 'Chris Sale', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_nyy_bos', lifecycle: 'live', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'NYY', awayTeamId: 'BOS', stadiumId: 's_yankee', inning: 2, inningHalf: 'top', scoreDifferential: 0, outs: 1, runnersOnBase: 1 },
    score: { hrIndex: 92, confidence: { level: 'very_high', score: 0.94, reasons: ['Elite barrel rate (24.2%)', 'Crushing LHP fastballs (.680 xSLG)', 'Wind blowing out 12mph'] }, primaryRecommendation: 'Strongest power signal on today slate', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 1, odds: { price: 230, impliedProbability: 0.303, provider: 'DraftKings', updatedAt: new Date().toISOString() },
    statcastSummary: { xSLG: 0.685, barrelRate: 0.242, parkFactor: 110 },
    updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_660271',
    identity: { id: 'p_660271', mlbId: '660271', name: 'Shohei Ohtani', teamId: 'LAD', teamAbbreviation: 'LAD', handedness: 'L' },
    opponentTeamId: 'SF', opposingPitcherId: 'p_webb_62', opposingPitcherName: 'Logan Webb', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_lad_sf', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'LAD', awayTeamId: 'SF', stadiumId: 's_dodger', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 89, confidence: { level: 'very_high', score: 0.91, reasons: ['118.4 mph max exit velocity', 'Elevated launch angle trend (32°)', 'Favorable stadium temperature (84°F)'] }, primaryRecommendation: 'Elite ISO and barrel probability', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 2, odds: { price: 260, impliedProbability: 0.278, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_665742',
    identity: { id: 'p_665742', mlbId: '665742', name: 'Juan Soto', teamId: 'NYY', teamAbbreviation: 'NYY', handedness: 'L' },
    opponentTeamId: 'BOS', opposingPitcherId: 'p_sale_41', opposingPitcherName: 'Chris Sale', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_nyy_bos', lifecycle: 'live', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'NYY', awayTeamId: 'BOS', stadiumId: 's_yankee', inning: 2, inningHalf: 'top', scoreDifferential: 0, outs: 1, runnersOnBase: 1 },
    score: { hrIndex: 87, confidence: { level: 'very_high', score: 0.89, reasons: ['Short right porch pull advantage', '.610 xSLG against secondary pitches'] }, primaryRecommendation: 'High contact quality with pull-side trajectory', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 3, odds: { price: 310, impliedProbability: 0.244, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_542303',
    identity: { id: 'p_542303', mlbId: '542303', name: 'Marcell Ozuna', teamId: 'ATL', teamAbbreviation: 'ATL', handedness: 'R' },
    opponentTeamId: 'NYM', opposingPitcherId: 'p_quintana_62', opposingPitcherName: 'Jose Quintana', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 5400000).toISOString(),
    gameState: { gameId: 'g_atl_nym', lifecycle: 'pregame', gameTime: new Date(Date.now() + 5400000).toISOString(), homeTeamId: 'ATL', awayTeamId: 'NYM', stadiumId: 's_truist', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 86, confidence: { level: 'very_high', score: 0.88, reasons: ['Crushing soft-tossing LHP', '58% hard hit rate over last 14 days'] }, primaryRecommendation: 'Heavy matchup advantage vs left-handed changeups', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 4, odds: { price: 250, impliedProbability: 0.286, provider: 'Caesars', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_670541',
    identity: { id: 'p_670541', mlbId: '670541', name: 'Yordan Alvarez', teamId: 'HOU', teamAbbreviation: 'HOU', handedness: 'L' },
    opponentTeamId: 'TEX', opposingPitcherId: 'p_eovaldi_17', opposingPitcherName: 'Nathan Eovaldi', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 9000000).toISOString(),
    gameState: { gameId: 'g_hou_tex', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 9000000).toISOString(), homeTeamId: 'HOU', awayTeamId: 'TEX', stadiumId: 's_minute_maid', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 85, confidence: { level: 'very_high', score: 0.87, reasons: ['Crawford boxes short porch target', '.640 xSLG vs 4-seam fastballs'] }, primaryRecommendation: 'Exceptional sweet-spot percentage', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 5, odds: { price: 280, impliedProbability: 0.263, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_656941',
    identity: { id: 'p_656941', mlbId: '656941', name: 'Kyle Schwarber', teamId: 'PHI', teamAbbreviation: 'PHI', handedness: 'L' },
    opponentTeamId: 'WSH', opposingPitcherId: 'p_gore_1', opposingPitcherName: 'MacKenzie Gore', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_phi_wsh', lifecycle: 'pregame', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'PHI', awayTeamId: 'WSH', stadiumId: 's_citizens_bank', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 84, confidence: { level: 'high', score: 0.84, reasons: ['Leadoff home run specialist', 'High flyball rate (46%)'] }, primaryRecommendation: 'Citizens Bank Park right field power corridor', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 6, odds: { price: 275, impliedProbability: 0.267, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_683002',
    identity: { id: 'p_683002', mlbId: '683002', name: 'Gunnar Henderson', teamId: 'BAL', teamAbbreviation: 'BAL', handedness: 'L' },
    opponentTeamId: 'TB', opposingPitcherId: 'p_eflin_24', opposingPitcherName: 'Zach Eflin', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_bal_tb', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'BAL', awayTeamId: 'TB', stadiumId: 's_camden', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 83, confidence: { level: 'high', score: 0.83, reasons: ['Elite contact metrics vs sinkers', 'Warm Camden weather (86°F)'] }, primaryRecommendation: 'Top-tier exit velocity on first-pitch swings', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 7, odds: { price: 320, impliedProbability: 0.238, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_547180',
    identity: { id: 'p_547180', mlbId: '547180', name: 'Bryce Harper', teamId: 'PHI', teamAbbreviation: 'PHI', handedness: 'L' },
    opponentTeamId: 'WSH', opposingPitcherId: 'p_gore_1', opposingPitcherName: 'MacKenzie Gore', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_phi_wsh', lifecycle: 'pregame', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'PHI', awayTeamId: 'WSH', stadiumId: 's_citizens_bank', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 82, confidence: { level: 'high', score: 0.82, reasons: ['High barrel rate L14D', 'Excellent plate discipline creating hitter counts'] }, primaryRecommendation: 'Dangerous with runners on base in power spots', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 8, odds: { price: 340, impliedProbability: 0.227, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_624413',
    identity: { id: 'p_624413', mlbId: '624413', name: 'Pete Alonso', teamId: 'NYM', teamAbbreviation: 'NYM', handedness: 'R' },
    opponentTeamId: 'ATL', opposingPitcherId: 'p_fried_54', opposingPitcherName: 'Max Fried', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 5400000).toISOString(),
    gameState: { gameId: 'g_atl_nym', lifecycle: 'pregame', gameTime: new Date(Date.now() + 5400000).toISOString(), homeTeamId: 'ATL', awayTeamId: 'NYM', stadiumId: 's_truist', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 81, confidence: { level: 'high', score: 0.81, reasons: ['Historical dominance vs Max Fried (4 HR in 28 ABs)', 'Truist Park warm evening air'] }, primaryRecommendation: 'Proven head-to-head power ceiling', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 9, odds: { price: 290, impliedProbability: 0.256, provider: 'Caesars', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_677951',
    identity: { id: 'p_677951', mlbId: '677951', name: 'Bobby Witt Jr.', teamId: 'KC', teamAbbreviation: 'KC', handedness: 'R' },
    opponentTeamId: 'MIN', opposingPitcherId: 'p_lopez_49', opposingPitcherName: 'Pablo López', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 10800000).toISOString(),
    gameState: { gameId: 'g_kc_min', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 10800000).toISOString(), homeTeamId: 'KC', awayTeamId: 'MIN', stadiumId: 's_kauffman', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 80, confidence: { level: 'high', score: 0.80, reasons: ['Elite bat speed (76.4 mph avg)', 'Hitting line drives to deep center'] }, primaryRecommendation: 'All-fields power threat in top form', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 10, odds: { price: 360, impliedProbability: 0.217, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_623993',
    identity: { id: 'p_623993', mlbId: '623993', name: 'Anthony Santander', teamId: 'BAL', teamAbbreviation: 'BAL', handedness: 'S' },
    opponentTeamId: 'TB', opposingPitcherId: 'p_eflin_24', opposingPitcherName: 'Zach Eflin', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_bal_tb', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'BAL', awayTeamId: 'TB', stadiumId: 's_camden', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 79, confidence: { level: 'high', score: 0.79, reasons: ['Switch hitter from left side vs Eflin', '44% flyball rate this season'] }, primaryRecommendation: 'High home run per flyball conversion', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 11, odds: { price: 300, impliedProbability: 0.250, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_621566',
    identity: { id: 'p_621566', mlbId: '621566', name: 'Matt Olson', teamId: 'ATL', teamAbbreviation: 'ATL', handedness: 'L' },
    opponentTeamId: 'NYM', opposingPitcherId: 'p_quintana_62', opposingPitcherName: 'Jose Quintana', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 5400000).toISOString(),
    gameState: { gameId: 'g_atl_nym', lifecycle: 'pregame', gameTime: new Date(Date.now() + 5400000).toISOString(), homeTeamId: 'ATL', awayTeamId: 'NYM', stadiumId: 's_truist', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 78, confidence: { level: 'high', score: 0.78, reasons: ['Heavy hard-hit profile (52%)', 'Elevation on low in-zone pitches'] }, primaryRecommendation: 'Power swing capable of clearing any park', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 12, odds: { price: 320, impliedProbability: 0.238, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_608369',
    identity: { id: 'p_608369', mlbId: '608369', name: 'Corey Seager', teamId: 'TEX', teamAbbreviation: 'TEX', handedness: 'L' },
    opponentTeamId: 'HOU', opposingPitcherId: 'p_valdez_59', opposingPitcherName: 'Framber Valdez', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 9000000).toISOString(),
    gameState: { gameId: 'g_hou_tex', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 9000000).toISOString(), homeTeamId: 'HOU', awayTeamId: 'TEX', stadiumId: 's_minute_maid', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 77, confidence: { level: 'high', score: 0.77, reasons: ['Elite line-drive velocity', 'Handles sinkers down in the zone'] }, primaryRecommendation: 'Short porch pull target in Houston', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 13, odds: { price: 350, impliedProbability: 0.222, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_646240',
    identity: { id: 'p_646240', mlbId: '646240', name: 'Rafael Devers', teamId: 'BOS', teamAbbreviation: 'BOS', handedness: 'L' },
    opponentTeamId: 'NYY', opposingPitcherId: 'p_cole_45', opposingPitcherName: 'Gerrit Cole', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_nyy_bos', lifecycle: 'live', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'NYY', awayTeamId: 'BOS', stadiumId: 's_yankee', inning: 2, inningHalf: 'top', scoreDifferential: 0, outs: 1, runnersOnBase: 1 },
    score: { hrIndex: 77, confidence: { level: 'high', score: 0.77, reasons: ['Historical mastery vs Gerrit Cole (8 career HR)', 'Short porch target in right'] }, primaryRecommendation: 'Prime matchup narrative with hard data backing', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 14, odds: { price: 330, impliedProbability: 0.233, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_606192',
    identity: { id: 'p_606192', mlbId: '606192', name: 'Teoscar Hernández', teamId: 'LAD', teamAbbreviation: 'LAD', handedness: 'R' },
    opponentTeamId: 'SF', opposingPitcherId: 'p_webb_62', opposingPitcherName: 'Logan Webb', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_lad_sf', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'LAD', awayTeamId: 'SF', stadiumId: 's_dodger', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 76, confidence: { level: 'high', score: 0.76, reasons: ['Home run derby champion power', 'Aggressive swing metrics on first-pitch strikes'] }, primaryRecommendation: 'Dodger Stadium evening warm draft', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 15, odds: { price: 380, impliedProbability: 0.208, provider: 'Caesars', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_519317',
    identity: { id: 'p_519317', mlbId: '519317', name: 'Giancarlo Stanton', teamId: 'NYY', teamAbbreviation: 'NYY', handedness: 'R' },
    opponentTeamId: 'BOS', opposingPitcherId: 'p_sale_41', opposingPitcherName: 'Chris Sale', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_nyy_bos', lifecycle: 'live', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'NYY', awayTeamId: 'BOS', stadiumId: 's_yankee', inning: 2, inningHalf: 'top', scoreDifferential: 0, outs: 1, runnersOnBase: 1 },
    score: { hrIndex: 76, confidence: { level: 'high', score: 0.76, reasons: ['116+ mph maximum exit velo', 'Hits low-inside fastballs out to left'] }, primaryRecommendation: 'High power ceiling on clean contact', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 16, odds: { price: 290, impliedProbability: 0.256, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_518692',
    identity: { id: 'p_518692', mlbId: '518692', name: 'Freddie Freeman', teamId: 'LAD', teamAbbreviation: 'LAD', handedness: 'L' },
    opponentTeamId: 'SF', opposingPitcherId: 'p_webb_62', opposingPitcherName: 'Logan Webb', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_lad_sf', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'LAD', awayTeamId: 'SF', stadiumId: 's_dodger', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 75, confidence: { level: 'high', score: 0.75, reasons: ['Exceptional barrel control', 'High xBA and xSLG vs Webb changeup'] }, primaryRecommendation: 'Consistent line-to-line contact', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 17, odds: { price: 420, impliedProbability: 0.192, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_605141',
    identity: { id: 'p_605141', mlbId: '605141', name: 'Mookie Betts', teamId: 'LAD', teamAbbreviation: 'LAD', handedness: 'R' },
    opponentTeamId: 'SF', opposingPitcherId: 'p_webb_62', opposingPitcherName: 'Logan Webb', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_lad_sf', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'LAD', awayTeamId: 'SF', stadiumId: 's_dodger', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 74, confidence: { level: 'high', score: 0.74, reasons: ['Elite pull-rate on high fastballs', 'Leadoff plate appearances advantage'] }, primaryRecommendation: 'Strong EV on long odds', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 18, odds: { price: 400, impliedProbability: 0.200, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_663656',
    identity: { id: 'p_663656', mlbId: '663656', name: 'Kyle Tucker', teamId: 'HOU', teamAbbreviation: 'HOU', handedness: 'L' },
    opponentTeamId: 'TEX', opposingPitcherId: 'p_eovaldi_17', opposingPitcherName: 'Nathan Eovaldi', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 9000000).toISOString(),
    gameState: { gameId: 'g_hou_tex', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 9000000).toISOString(), homeTeamId: 'HOU', awayTeamId: 'TEX', stadiumId: 's_minute_maid', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 74, confidence: { level: 'high', score: 0.74, reasons: ['Quick trigger on inside fastballs', 'Right porch short target'] }, primaryRecommendation: 'High power conversion rate at home', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 19, odds: { price: 340, impliedProbability: 0.227, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_663728',
    identity: { id: 'p_663728', mlbId: '663728', name: 'Cal Raleigh', teamId: 'SEA', teamAbbreviation: 'SEA', handedness: 'S' },
    opponentTeamId: 'OAK', opposingPitcherId: 'p_sears_38', opposingPitcherName: 'JP Sears', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 10800000).toISOString(),
    gameState: { gameId: 'g_sea_oak', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 10800000).toISOString(), homeTeamId: 'SEA', awayTeamId: 'OAK', stadiumId: 's_tmobile', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 73, confidence: { level: 'high', score: 0.73, reasons: ['Catcher home run leader', 'Crushes LHP flyballs (.560 xSLG)'] }, primaryRecommendation: 'Top power threat from the right side of the plate', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 20, odds: { price: 310, impliedProbability: 0.244, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_665487',
    identity: { id: 'p_665487', mlbId: '665487', name: 'Fernando Tatis Jr.', teamId: 'SD', teamAbbreviation: 'SD', handedness: 'R' },
    opponentTeamId: 'ARI', opposingPitcherId: 'p_gallen_23', opposingPitcherName: 'Zac Gallen', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 12600000).toISOString(),
    gameState: { gameId: 'g_sd_ari', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 12600000).toISOString(), homeTeamId: 'SD', awayTeamId: 'ARI', stadiumId: 's_petco', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 73, confidence: { level: 'high', score: 0.73, reasons: ['112+ mph maximum exit velocity', 'Elevated sweet spot percentage'] }, primaryRecommendation: 'Petco park marine layer factor offset by pure EV', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 21, odds: { price: 370, impliedProbability: 0.213, provider: 'Caesars', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_666969',
    identity: { id: 'p_666969', mlbId: '666969', name: 'Adolis García', teamId: 'TEX', teamAbbreviation: 'TEX', handedness: 'R' },
    opponentTeamId: 'HOU', opposingPitcherId: 'p_valdez_59', opposingPitcherName: 'Framber Valdez', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 9000000).toISOString(),
    gameState: { gameId: 'g_hou_tex', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 9000000).toISOString(), homeTeamId: 'HOU', awayTeamId: 'TEX', stadiumId: 's_minute_maid', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 72, confidence: { level: 'high', score: 0.72, reasons: ['Favorable split vs LHP sinkers', 'High swing-and-miss offset by elite raw power'] }, primaryRecommendation: 'High variance power profile', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 22, odds: { price: 330, impliedProbability: 0.233, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_663586',
    identity: { id: 'p_663586', mlbId: '663586', name: 'Austin Riley', teamId: 'ATL', teamAbbreviation: 'ATL', handedness: 'R' },
    opponentTeamId: 'NYM', opposingPitcherId: 'p_quintana_62', opposingPitcherName: 'Jose Quintana', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 5400000).toISOString(),
    gameState: { gameId: 'g_atl_nym', lifecycle: 'pregame', gameTime: new Date(Date.now() + 5400000).toISOString(), homeTeamId: 'ATL', awayTeamId: 'NYM', stadiumId: 's_truist', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 72, confidence: { level: 'high', score: 0.72, reasons: ['Strong barrel connection on inside zone', 'Warm weather in Atlanta'] }, primaryRecommendation: 'Middle of the order run-producer', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 23, odds: { price: 360, impliedProbability: 0.217, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_677594',
    identity: { id: 'p_677594', mlbId: '677594', name: 'Julio Rodríguez', teamId: 'SEA', teamAbbreviation: 'SEA', handedness: 'R' },
    opponentTeamId: 'OAK', opposingPitcherId: 'p_sears_38', opposingPitcherName: 'JP Sears', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 10800000).toISOString(),
    gameState: { gameId: 'g_sea_oak', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 10800000).toISOString(), homeTeamId: 'SEA', awayTeamId: 'OAK', stadiumId: 's_tmobile', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 71, confidence: { level: 'high', score: 0.71, reasons: ['Elite sprint & bat speed combination', 'Trending upward in hard-hit percentage'] }, primaryRecommendation: 'Dynamic power threat in favorable park setting', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 24, odds: { price: 410, impliedProbability: 0.196, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_596001',
    identity: { id: 'p_596001', mlbId: '596001', name: 'Francisco Lindor', teamId: 'NYM', teamAbbreviation: 'NYM', handedness: 'S' },
    opponentTeamId: 'ATL', opposingPitcherId: 'p_fried_54', opposingPitcherName: 'Max Fried', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 5400000).toISOString(),
    gameState: { gameId: 'g_atl_nym', lifecycle: 'pregame', gameTime: new Date(Date.now() + 5400000).toISOString(), homeTeamId: 'ATL', awayTeamId: 'NYM', stadiumId: 's_truist', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 71, confidence: { level: 'high', score: 0.71, reasons: ['Right-handed pull side power vs LHP', 'Leadoff power catalyst'] }, primaryRecommendation: 'Positive line value on long odds', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 25, odds: { price: 430, impliedProbability: 0.189, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_641933',
    identity: { id: 'p_641933', mlbId: '641933', name: "Tyler O'Neill", teamId: 'BOS', teamAbbreviation: 'BOS', handedness: 'R' },
    opponentTeamId: 'NYY', opposingPitcherId: 'p_cole_45', opposingPitcherName: 'Gerrit Cole', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_nyy_bos', lifecycle: 'live', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'NYY', awayTeamId: 'BOS', stadiumId: 's_yankee', inning: 2, inningHalf: 'top', scoreDifferential: 0, outs: 1, runnersOnBase: 1 },
    score: { hrIndex: 70, confidence: { level: 'high', score: 0.70, reasons: ['Elite barrel rate per plate appearance', 'Yankee stadium left-field alley target'] }, primaryRecommendation: 'High variance power upside', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 26, odds: { price: 340, impliedProbability: 0.227, provider: 'Caesars', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_592518',
    identity: { id: 'p_592518', mlbId: '592518', name: 'Manny Machado', teamId: 'SD', teamAbbreviation: 'SD', handedness: 'R' },
    opponentTeamId: 'ARI', opposingPitcherId: 'p_gallen_23', opposingPitcherName: 'Zac Gallen', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 12600000).toISOString(),
    gameState: { gameId: 'g_sd_ari', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 12600000).toISOString(), homeTeamId: 'SD', awayTeamId: 'ARI', stadiumId: 's_petco', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 69, confidence: { level: 'medium', score: 0.69, reasons: ['Solid line drive authority', 'Elevates offspeed pitches out to left'] }, primaryRecommendation: 'Veteran power presence with high floor', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 27, odds: { price: 400, impliedProbability: 0.200, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_521692',
    identity: { id: 'p_521692', mlbId: '521692', name: 'Salvador Perez', teamId: 'KC', teamAbbreviation: 'KC', handedness: 'R' },
    opponentTeamId: 'MIN', opposingPitcherId: 'p_lopez_49', opposingPitcherName: 'Pablo López', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 10800000).toISOString(),
    gameState: { gameId: 'g_kc_min', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 10800000).toISOString(), homeTeamId: 'KC', awayTeamId: 'MIN', stadiumId: 's_kauffman', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 68, confidence: { level: 'medium', score: 0.68, reasons: ['Heavy flyball profile', 'Experienced matchup history vs Twins'] }, primaryRecommendation: 'Reliable power bat in run scoring positions', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 28, odds: { price: 380, impliedProbability: 0.208, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_607208',
    identity: { id: 'p_607208', mlbId: '607208', name: 'Trea Turner', teamId: 'PHI', teamAbbreviation: 'PHI', handedness: 'R' },
    opponentTeamId: 'WSH', opposingPitcherId: 'p_gore_1', opposingPitcherName: 'MacKenzie Gore', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_phi_wsh', lifecycle: 'pregame', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'PHI', awayTeamId: 'WSH', stadiumId: 's_citizens_bank', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 67, confidence: { level: 'medium', score: 0.67, reasons: ['Line-drive exit velocity surge', 'Strong career numbers against lefties'] }, primaryRecommendation: 'Solid value on long odds proposition', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 29, odds: { price: 460, impliedProbability: 0.179, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_668939',
    identity: { id: 'p_668939', mlbId: '668939', name: 'Adley Rutschman', teamId: 'BAL', teamAbbreviation: 'BAL', handedness: 'S' },
    opponentTeamId: 'TB', opposingPitcherId: 'p_eflin_24', opposingPitcherName: 'Zach Eflin', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 7200000).toISOString(),
    gameState: { gameId: 'g_bal_tb', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 7200000).toISOString(), homeTeamId: 'BAL', awayTeamId: 'TB', stadiumId: 's_camden', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 66, confidence: { level: 'medium', score: 0.66, reasons: ['Balanced split profile', 'Camden right-field porch target'] }, primaryRecommendation: 'Consistent on-base power threat', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 30, odds: { price: 450, impliedProbability: 0.182, provider: 'Caesars', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_608324',
    identity: { id: 'p_608324', mlbId: '608324', name: 'Alex Bregman', teamId: 'HOU', teamAbbreviation: 'HOU', handedness: 'R' },
    opponentTeamId: 'TEX', opposingPitcherId: 'p_eovaldi_17', opposingPitcherName: 'Nathan Eovaldi', opposingPitcherHandedness: 'R',
    gameTime: new Date(Date.now() + 9000000).toISOString(),
    gameState: { gameId: 'g_hou_tex', lifecycle: 'scheduled', gameTime: new Date(Date.now() + 9000000).toISOString(), homeTeamId: 'HOU', awayTeamId: 'TEX', stadiumId: 's_minute_maid', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 65, confidence: { level: 'medium', score: 0.65, reasons: ['Crawford boxes pull specialist', 'Low chase rate on pitcher pitches'] }, primaryRecommendation: 'Crawford boxes target in left', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 31, odds: { price: 480, impliedProbability: 0.172, provider: 'BetMGM', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_664761',
    identity: { id: 'p_664761', mlbId: '664761', name: 'Alec Bohm', teamId: 'PHI', teamAbbreviation: 'PHI', handedness: 'R' },
    opponentTeamId: 'WSH', opposingPitcherId: 'p_gore_1', opposingPitcherName: 'MacKenzie Gore', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 3600000).toISOString(),
    gameState: { gameId: 'g_phi_wsh', lifecycle: 'pregame', gameTime: new Date(Date.now() + 3600000).toISOString(), homeTeamId: 'PHI', awayTeamId: 'WSH', stadiumId: 's_citizens_bank', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 64, confidence: { level: 'medium', score: 0.64, reasons: ['RBI leader with increased flyball lift', 'Citizens Bank park favorable wind'] }, primaryRecommendation: 'High contact rate on hittable counts', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 32, odds: { price: 500, impliedProbability: 0.167, provider: 'DraftKings', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  },
  {
    playerId: 'p_607043',
    identity: { id: 'p_607043', mlbId: '607043', name: 'Brandon Nimmo', teamId: 'NYM', teamAbbreviation: 'NYM', handedness: 'L' },
    opponentTeamId: 'ATL', opposingPitcherId: 'p_fried_54', opposingPitcherName: 'Max Fried', opposingPitcherHandedness: 'L',
    gameTime: new Date(Date.now() + 5400000).toISOString(),
    gameState: { gameId: 'g_atl_nym', lifecycle: 'pregame', gameTime: new Date(Date.now() + 5400000).toISOString(), homeTeamId: 'ATL', awayTeamId: 'NYM', stadiumId: 's_truist', inning: 0, inningHalf: 'top', scoreDifferential: 0, outs: 0, runnersOnBase: 0 },
    score: { hrIndex: 62, confidence: { level: 'medium', score: 0.62, reasons: ['Quality plate appearances', 'Truist park warm evening carry'] }, primaryRecommendation: 'Long-shot power flyer with high walk rate', provenance: { generatedAt: new Date().toISOString(), versions: { scorer: 'hr-v10.1', weather: 'atmo-v4', matchup: 'matchup-v7' }, freshness: { batter: new Date().toISOString(), pitcher: new Date().toISOString(), weather: new Date().toISOString(), odds: new Date().toISOString() } } },
    lineupStatus: 'confirmed_starter' as const,
    rank: 33, odds: { price: 520, impliedProbability: 0.161, provider: 'FanDuel', updatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString()
  }
];

export const mockChunkBData: Record<string, ChunkB> = mockChunkAData.reduce((acc, player) => {
  acc[player.playerId] = {
    playerId: player.playerId,
    signals: [
      {
        id: `sig_${player.playerId}`,
        name: `${player.identity.name} Matchup Metric`,
        value: `Expected Slugging .${Math.floor(player.score.hrIndex * 7.2)}`,
        normalizedScore: player.score.hrIndex,
        direction: 'positive',
        confidence: player.score.confidence.score,
        freshness: new Date().toISOString(),
        source: 'Vouch Analytics'
      }
    ],
    metrics: {
      barrelRate: Number((player.score.hrIndex / 420).toFixed(3)),
      hardHitRate: Number((player.score.hrIndex / 160).toFixed(2)),
      xSLG: Number((player.score.hrIndex * 0.0072).toFixed(3)),
      parkFactor: 100 + (player.score.hrIndex % 15) - 5,
      weatherInfluence: 1.05,
      pitcherHrTendencies: 1.08,
      contactQuality: player.score.hrIndex + 5,
      recentForm: player.score.hrIndex
    },
    insights: player.score.confidence.reasons,
    updatedAt: new Date().toISOString()
  };
  return acc;
}, {} as Record<string, ChunkB>);

export const mockChunkCData: Record<string, ChunkC> = mockChunkAData.reduce((acc, player) => {
  acc[player.playerId] = {
    playerId: player.playerId,
    historicalPitches: [
      { id: `hp_${player.playerId}_1`, type: 'FF', speed: 96.4, result: 'HR', distance: 410 + (player.score.hrIndex % 20) },
      { id: `hp_${player.playerId}_2`, type: 'SL', speed: 85.2, result: 'Foul' }
    ],
    battedBallEvents: [
      { id: `bbe_${player.playerId}_1`, exitVelocity: Number((106 + (player.score.hrIndex % 10)).toFixed(1)), launchAngle: 28, distance: 410 + (player.score.hrIndex % 20) }
    ],
    gameLogExplorer: [
      { date: '2026-08-12', opponent: player.opponentTeamId, atBats: 4, hits: 2, hr: 1 }
    ]
  };
  return acc;
}, {} as Record<string, ChunkC>);
