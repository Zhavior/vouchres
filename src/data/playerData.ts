import { MLBPlayer } from '../types';
import { getFounderPointsLabel } from "../lib/founderAccess";

const originalPlayers: MLBPlayer[] = [
  {
    id: "mlb_ohtani",
    name: "Shohei Ohtani",
    team: "Los Angeles Dodgers",
    position: "Designated Hitter / Pitcher",
    number: "17",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660271/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE",
    injuryNotes: "No injury reports. Peak conditioning with a 98% offensive velocity rating.",
    batterScore: 98,
    seasonStats: { avg: ".312", hr: "44", rbi: "95", ops: "1.034" },
    bats: "L",
    throws: "R",
    height: "6'4\"",
    weight: "210 lbs",
    birthdate: "July 5, 1994",
    advanced: {
      barrelPercent: 19.6,
      launchAngle: 15.2,
      exitVelocity: 94.7,
      hardHitPercent: 54.8,
      chasePercent: 21.8,
      woba: 0.418,
      xwoba: 0.429,
      sweetSpotPercent: 41.2
    },
    splits: {
      vLHP: { avg: ".295", obp: ".378", slg: ".580", ops: ".958" },
      vRHP: { avg: ".320", obp: ".402", slg: ".665", ops: "1.067" },
      home: { avg: ".325", obp: ".410", slg: ".670", ops: "1.080" },
      away: { avg: ".299", obp: ".375", slg: ".598", ops: ".973" },
      last10: { avg: ".358", obp: ".432", slg: ".718", ops: "1.150" }
    },
    scoutingReport: {
      powerText: "Elite 80-grade raw power. Leads the league in barrel % and hard-hit velocity. Drives low-sweeper varieties beyond right-center fields with absolute ease.",
      contactText: "Outstanding barrel control despite high extension swing. Adjusts instantly to fastballs above the zone.",
      disciplineText: "Very solid check-swing discipline. Chase rate is well below league averages, forcing pitches into his wheelhouse.",
      overallScouting: "Shohei remains a generational hitting package. Statistically exceptional on barrels at home. Matches up with severe advantages against right-handed power pitching.",
      hotZones: ["Down & In", "Middle-Middle", "Up & Away"],
      riskFactor: "LOW"
    },
    gameLogs: [
      { opponent: "San Diego Padres", date: "June 18", result: "W 6-3", ab: 4, h: 2, hr: 1, rbi: 2, r: 2, batterScore: 99 },
      { opponent: "San Francisco Giants", date: "June 16", result: "L 2-5", ab: 3, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 88 },
      { opponent: "New York Yankees", date: "June 14", result: "W 11-5", ab: 5, h: 3, hr: 2, rbi: 4, r: 3, batterScore: 100 },
      { opponent: "Boston Red Sox", date: "June 11", result: "W 8-4", ab: 4, h: 2, hr: 0, rbi: 1, r: 1, batterScore: 92 },
      { opponent: "Atlanta Braves", date: "June 09", result: "W 4-1", ab: 3, h: 1, hr: 1, rbi: 1, r: 2, batterScore: 95 }
    ],
    propositions: [
      { id: "prop_ohtani_hits", market: "To Record 1+ Hits", odds: 1.52, spec: "Shohei Ohtani Over 0.5 Hits" },
      { id: "prop_ohtani_hr", market: "To Hit 1+ Home Run", odds: 3.20, spec: "Shohei Ohtani Over 0.5 HRs" },
      { id: "prop_ohtani_bases", market: "Total Bases Prop", odds: 1.82, spec: "Shohei Ohtani Over 1.5 Total Bases" }
    ]
  },
  {
    id: "mlb_judge",
    name: "Aaron Judge",
    team: "New York Yankees",
    position: "Outfielder",
    number: "99",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/592450/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE",
    injuryNotes: "Fully fit. Active hitting streak. Clear atmospheric carry advantage.",
    batterScore: 97,
    seasonStats: { avg: ".304", hr: "48", rbi: "112", ops: "1.062" },
    bats: "R",
    throws: "R",
    height: "6'7\"",
    weight: "282 lbs",
    birthdate: "April 26, 1992",
    advanced: {
      barrelPercent: 22.4,
      launchAngle: 18.1,
      exitVelocity: 96.2,
      hardHitPercent: 61.2,
      chasePercent: 19.5,
      woba: 0.435,
      xwoba: 0.441,
      sweetSpotPercent: 39.8
    },
    splits: {
      vLHP: { avg: ".310", obp: ".425", slg: ".680", ops: "1.105" },
      vRHP: { avg: ".301", obp: ".412", slg: ".650", ops: "1.062" },
      home: { avg: ".318", obp: ".430", slg: ".695", ops: "1.125" },
      away: { avg: ".290", obp: ".395", slg: ".620", ops: "1.015" },
      last10: { avg: ".333", obp: ".420", slg: ".700", ops: "1.120" }
    },
    scoutingReport: {
      powerText: "Legendary strength with massive leverage. Has recorded an exit velocity up to 118.5 mph. Smashes fastballs up in the zone down to the bleachers.",
      contactText: "Surprisingly disciplined and short-handed to the ball given his large strike frame. High contact consistency against breaking lines.",
      disciplineText: "Superlative grasp of the strike margin. Works extended counts frequently, elevating walks stats.",
      overallScouting: "An offensive powerhouse who presents extreme mismatch risks for any style of pitching. Particularly dominant in hot/humid stadium temperatures with high vertical elevation.",
      hotZones: ["Middle-Middle", "Up & In", "Down & Away"],
      riskFactor: "LOW"
    },
    gameLogs: [
      { opponent: "Boston Red Sox", date: "June 18", result: "W 5-2", ab: 4, h: 2, hr: 1, rbi: 3, r: 2, batterScore: 98 },
      { opponent: "Houston Astros", date: "June 15", result: "W 6-1", ab: 4, h: 1, hr: 0, rbi: 0, r: 1, batterScore: 85 },
      { opponent: "Los Angeles Dodgers", date: "June 14", result: "L 5-11", ab: 4, h: 2, hr: 1, rbi: 1, r: 1, batterScore: 94 },
      { opponent: "Toronto Blue Jays", date: "June 12", result: "W 3-0", ab: 3, h: 1, hr: 1, rbi: 2, r: 1, batterScore: 93 },
      { opponent: "San Diego Padres", date: "June 08", result: "L 4-7", ab: 4, h: 0, hr: 0, rbi: 0, r: 0, batterScore: 60 }
    ],
    propositions: [
      { id: "prop_judge_hits", market: "To Record 1+ Hits", odds: 1.48, spec: "Aaron Judge Over 0.5 Hits" },
      { id: "prop_judge_hr", market: "To Hit 1+ Home Run", odds: 2.90, spec: "Aaron Judge Over 0.5 HRs" },
      { id: "prop_judge_rbi", market: "Runs Batted In Prop", odds: 1.95, spec: "Aaron Judge Over 0.5 RBIs" }
    ]
  },
  {
    id: "mlb_betts",
    name: "Mookie Betts",
    team: "Los Angeles Dodgers",
    position: "Shortstop / Outfielder",
    number: "50",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/605141/headshot/67/current",
    injuryStatus: "Questionable / Day-to-Day",
    injurySeverity: "DAY_TO_DAY",
    injuryNotes: "Slight left wrist soreness. Cleared for light batting cage work, lineup placement to be updated 1 hour pre-game.",
    batterScore: 84,
    seasonStats: { avg: ".288", hr: "19", rbi: "54", ops: ".892" },
    bats: "R",
    throws: "R",
    height: "5'9\"",
    weight: "180 lbs",
    birthdate: "October 7, 1992",
    advanced: {
      barrelPercent: 11.2,
      launchAngle: 16.4,
      exitVelocity: 90.8,
      hardHitPercent: 43.5,
      chasePercent: 14.8,
      woba: 0.368,
      xwoba: 0.375,
      sweetSpotPercent: 45.1
    },
    splits: {
      vLHP: { avg: ".302", obp: ".390", slg: ".520", ops: ".910" },
      vRHP: { avg: ".282", obp: ".365", slg: ".480", ops: ".845" },
      home: { avg: ".295", obp: ".381", slg: ".510", ops: ".891" },
      away: { avg: ".281", obp: ".369", slg: ".474", ops: ".843" },
      last10: { avg: ".250", obp: ".320", slg: ".390", ops: ".710" }
    },
    scoutingReport: {
      powerText: "Surprising pull power given physical stature. Rotates exceptionally well at the hips to find leverage on inside pitches.",
      contactText: "Among the premier contact hitters in major leagues. Elite hand-eye alignment rarely registers whiff or swing-and-miss columns.",
      disciplineText: "Incredible eye. Extremely low strikeout ratios with highly tactical zone selection.",
      overallScouting: "Currently managing light wrist soreness, which has temporarily dampened exit speed coefficients. However, plate discipline remains fully intact as an OBP baseline.",
      hotZones: ["Middle-In", "Up-Middle", "Down & In"],
      riskFactor: "MEDIUM"
    },
    gameLogs: [
      { opponent: "San Diego Padres", date: "June 18", result: "W 6-3", ab: 2, h: 0, hr: 0, rbi: 0, r: 1, batterScore: 65 },
      { opponent: "San Francisco Giants", date: "June 16", result: "L 2-5", ab: 4, h: 2, hr: 1, rbi: 2, r: 1, batterScore: 92 },
      { opponent: "New York Yankees", date: "June 14", result: "W 11-5", ab: 5, h: 1, hr: 0, rbi: 1, r: 2, batterScore: 80 },
      { opponent: "Boston Red Sox", date: "June 11", result: "W 8-4", ab: 4, h: 3, hr: 1, rbi: 3, r: 2, batterScore: 98 },
      { opponent: "Atlanta Braves", date: "June 09", result: "W 4-1", ab: 4, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 78 }
    ],
    propositions: [
      { id: "prop_betts_hits", market: "To Record 1+ Hits", odds: 1.40, spec: "Mookie Betts Over 0.5 Hits" },
      { id: "prop_betts_runs", market: "To Record 1+ Runs", odds: 1.65, spec: "Mookie Betts Over 0.5 Runs" },
      { id: "prop_betts_hr", market: "To Hit 1+ Home Run", odds: 4.10, spec: "Mookie Betts Over 0.5 HRs" }
    ]
  },
  {
    id: "mlb_alvarez",
    name: "Yordan Alvarez",
    team: "Houston Astros",
    position: "Outfielder / DH",
    number: "44",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/670541/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE",
    injuryNotes: "Active and cleared. Showing supreme barrel-velocity on low-and-inside slider variations.",
    batterScore: 96,
    seasonStats: { avg: ".301", hr: "31", rbi: "86", ops: ".965" },
    bats: "L",
    throws: "R",
    height: "6'5\"",
    weight: "225 lbs",
    birthdate: "June 27, 1997",
    advanced: {
      barrelPercent: 18.2,
      launchAngle: 14.1,
      exitVelocity: 93.9,
      hardHitPercent: 53.9,
      chasePercent: 23.0,
      woba: 0.395,
      xwoba: 0.408,
      sweetSpotPercent: 38.9
    },
    splits: {
      vLHP: { avg: ".265", obp: ".330", slg: ".470", ops: ".800" },
      vRHP: { avg: ".315", obp: ".420", slg: ".610", ops: "1.030" },
      home: { avg: ".311", obp: ".411", slg: ".599", ops: "1.010" },
      away: { avg: ".291", obp: ".380", slg: ".531", ops: ".911" },
      last10: { avg: ".324", obp: ".415", slg: ".649", ops: "1.064" }
    },
    scoutingReport: {
      powerText: "Gargantuan physical structure translates to easy pull and straightaway center power. Master of punishing mistake breakers.",
      contactText: "Highly fluid, elite extension stroke that covers multiple quarters of the strike plane. High sweet-spot percentage.",
      disciplineText: "Very composed. Highly selective, takes walks consistently when pitchers try to chip around her margins.",
      overallScouting: "Superbly suited against high-velocity righty sliders and fastballs alike. Generates tremendous leverage metrics at home where air pressure is favorable.",
      hotZones: ["Down & In", "Middle-Middle", "Low-Away"],
      riskFactor: "LOW"
    },
    gameLogs: [
      { opponent: "Boston Red Sox", date: "June 18", result: "L 3-4", ab: 4, h: 2, hr: 1, rbi: 2, r: 1, batterScore: 96 },
      { opponent: "New York Yankees", date: "June 15", result: "L 1-6", ab: 3, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 81 },
      { opponent: "San Diego Padres", date: "June 13", result: "W 5-2", ab: 4, h: 2, hr: 1, rbi: 1, r: 1, batterScore: 94 },
      { opponent: "San Francisco Giants", date: "June 10", result: "W 8-2", ab: 5, h: 3, hr: 1, rbi: 3, r: 2, batterScore: 99 },
      { opponent: "Atlanta Braves", date: "June 07", result: "W 5-4", ab: 4, h: 1, hr: 0, rbi: 1, r: 1, batterScore: 83 }
    ],
    propositions: [
      { id: "prop_alvarez_hits", market: "To Record 1+ Hits", odds: 1.45, spec: "Yordan Alvarez Over 0.5 Hits" },
      { id: "prop_alvarez_hr", market: "To Hit 1+ Home Run", odds: 3.10, spec: "Yordan Alvarez Over 0.5 HRs" },
      { id: "prop_alvarez_bases", market: "Total Bases Prop", odds: 1.78, spec: "Yordan Alvarez Over 1.5 Total Bases" }
    ]
  },
  {
    id: "mlb_acuna",
    name: "Ronald Acuña Jr.",
    team: "Atlanta Braves",
    position: "Outfielder",
    number: "13",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/660670/headshot/67/current",
    injuryStatus: "Injured List / IL-60 (High Risk)",
    injurySeverity: "IL_60",
    injuryNotes: "Placed on 60-Day IL due to left knee ACL strain reconstruction. Out indefinitely.",
    batterScore: 15,
    seasonStats: { avg: ".250", hr: "4", rbi: "15", ops: ".710" },
    bats: "R",
    throws: "R",
    height: "6'0\"",
    weight: "205 lbs",
    birthdate: "December 18, 1997",
    advanced: {
      barrelPercent: 6.8,
      launchAngle: 10.2,
      exitVelocity: 88.5,
      hardHitPercent: 32.4,
      chasePercent: 28.5,
      woba: 0.301,
      xwoba: 0.295,
      sweetSpotPercent: 28.1
    },
    splits: {
      vLHP: { avg: ".240", obp: ".310", slg: ".380", ops: ".690" },
      vRHP: { avg: ".254", obp: ".332", slg: ".410", ops: ".742" },
      home: { avg: ".260", obp: ".340", slg: ".420", ops: ".760" },
      away: { avg: ".240", obp: ".315", slg: ".370", ops: ".685" },
      last10: { avg: ".150", obp: ".220", slg: ".150", ops: ".370" }
    },
    scoutingReport: {
      powerText: "Historically matches top-tier raw punch when healthy, but currently completely suppressed by recovery rehabilitation mechanics.",
      contactText: "Severe breakdown in lower-body torque transfer metrics directly associated with ACL knee strain. High rolling ground ball rates prior to IL designation.",
      disciplineText: "Frustrated chasing trends noticeable before benching. Unable to sit comfortably on back-foot velocity.",
      overallScouting: "Placed on critical long range roster reserve (60-Day IL). Absolutely do not place active wager elements here as recovery extends into late summer segments.",
      hotZones: ["Middle-Middle", "Up & Away"],
      riskFactor: "HIGH"
    },
    gameLogs: [
      { opponent: "New York Mets", date: "May 26", result: "W 3-1", ab: 1, h: 0, hr: 0, rbi: 0, r: 0, batterScore: 10 },
      { opponent: "San Diego Padres", date: "May 24", result: "L 2-6", ab: 4, h: 1, hr: 0, rbi: 0, r: 1, batterScore: 70 },
      { opponent: "San Francisco Giants", date: "May 22", result: "W 5-0", ab: 3, h: 2, hr: 1, rbi: 2, r: 2, batterScore: 98 }
    ],
    propositions: [
      { id: "prop_acuna_hits", market: "To Record 1+ Hits", odds: 1.62, spec: "Ronald Acuña Jr. Over 0.5 Hits" },
      { id: "prop_acuna_hr", market: "To Hit 1+ Home Run", odds: 3.60, spec: "Ronald Acuña Jr. Over 0.5 HRs" }
    ]
  },
  {
    id: "mlb_tatis",
    name: "Fernando Tatís Jr.",
    team: "San Diego Padres",
    position: "Outfielder",
    number: "23",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/665489/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE",
    injuryNotes: "Fully healed. Elite defensive agility. High confidence hitting against right-handers.",
    batterScore: 94,
    seasonStats: { avg: ".279", hr: "22", rbi: "61", ops: ".862" },
    bats: "R",
    throws: "R",
    height: "6'3\"",
    weight: "217 lbs",
    birthdate: "January 2, 1999",
    advanced: {
      barrelPercent: 15.1,
      launchAngle: 14.8,
      exitVelocity: 92.8,
      hardHitPercent: 49.2,
      chasePercent: 24.5,
      woba: 0.364,
      xwoba: 0.372,
      sweetSpotPercent: 37.5
    },
    splits: {
      vLHP: { avg: ".260", obp: ".330", slg: ".490", ops: ".820" },
      vRHP: { avg: ".286", obp: ".358", slg: ".540", ops: ".898" },
      home: { avg: ".290", obp: ".362", slg: ".560", ops: ".922" },
      away: { avg: ".268", obp: ".338", slg: ".490", ops: ".828" },
      last10: { avg: ".315", obp: ".382", slg: ".605", ops: ".987" }
    },
    scoutingReport: {
      powerText: "Dynamic torque-laden whip power. Exceptionally capable at catching low sliders and whipping them over left-field partitions with high rotational speed.",
      contactText: "Aggressive visual approach, but balances whiffs with extremely solid hard-hit contact rates when he connects.",
      disciplineText: "Will choose to chase sliding lines away from him to protect deep counts, but overall bat coverage allows contact anyway.",
      overallScouting: "Excellent athletic ceiling. Currently exhibiting peak exit-velocity clusters over the past 10 games. Highly recommended against standard slider pitchers.",
      hotZones: ["Down & In", "Middle-Middle", "Middle-Away"],
      riskFactor: "LOW"
    },
    gameLogs: [
      { opponent: "Los Angeles Dodgers", date: "June 18", result: "L 3-6", ab: 4, h: 2, hr: 1, rbi: 2, r: 1, batterScore: 95 },
      { opponent: "Houston Astros", date: "June 13", result: "L 2-5", ab: 4, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 78 },
      { opponent: "Boston Red Sox", date: "June 10", result: "W 7-3", ab: 5, h: 3, hr: 1, rbi: 3, r: 2, batterScore: 99 },
      { opponent: "New York Yankees", date: "June 08", result: "W 7-4", ab: 4, h: 2, hr: 0, rbi: 1, r: 1, batterScore: 90 },
      { opponent: "Atlanta Braves", date: "June 05", result: "W 5-2", ab: 4, h: 1, hr: 0, rbi: 0, r: 1, batterScore: 80 }
    ],
    propositions: [
      { id: "prop_tatis_hits", market: "To Record 1+ Hits", odds: 1.44, spec: "Fernando Tatís Jr. Over 0.5 Hits" },
      { id: "prop_tatis_hr", market: "To Hit 1+ Home Run", odds: 3.50, spec: "Fernando Tatís Jr. Over 0.5 HRs" },
      { id: "prop_tatis_bases", market: "Total Bases Prop", odds: 1.80, spec: "Fernando Tatís Jr. Over 1.5 Total Bases" }
    ]
  },
  {
    id: "mlb_tucker",
    name: "Kyle Tucker",
    team: "Houston Astros",
    position: "Outfielder",
    number: "30",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/663656/headshot/67/current",
    injuryStatus: "Injured List / IL-10 (High Risk)",
    injurySeverity: "IL_10",
    injuryNotes: "Right shin contusion. Placed on 10-day IL on June 7 after fouling ball off shin bone. Still feeling discomfort jogging.",
    batterScore: 32,
    seasonStats: { avg: ".266", hr: "19", rbi: "40", ops: ".979" },
    bats: "L",
    throws: "R",
    height: "6'4\"",
    weight: "210 lbs",
    birthdate: "January 17, 1997",
    advanced: {
      barrelPercent: 14.8,
      launchAngle: 19.4,
      exitVelocity: 91.1,
      hardHitPercent: 44.5,
      chasePercent: 19.8,
      woba: 0.380,
      xwoba: 0.392,
      sweetSpotPercent: 40.5
    },
    splits: {
      vLHP: { avg: ".245", obp: ".330", slg: ".470", ops: ".800" },
      vRHP: { avg: ".278", obp: ".395", slg: ".580", ops: ".975" },
      home: { avg: ".270", obp: ".382", slg: ".560", ops: ".942" },
      away: { avg: ".262", obp: ".376", slg: ".552", ops: ".928" },
      last10: { avg: ".160", obp: ".250", slg: ".300", ops: ".550" }
    },
    scoutingReport: {
      powerText: "Superb high-launch mechanics. Converts low inside fastballs into easy sky-high runs effortlessly.",
      contactText: "Short looping path that maintains consistent level through the contact zone. Very rare swing-and-miss profile.",
      disciplineText: "Elite understanding of base-on-balls values. Refuses to assist opposing pitching by chasing outside limits.",
      overallScouting: "Excellent player profile when active, currently experiencing significant shin soreness. High caution recommended as return timeframe remains questionable.",
      hotZones: ["Down & In", "Middle-Middle"],
      riskFactor: "HIGH"
    },
    gameLogs: [
      { opponent: "St. Louis Cardinals", date: "June 03", result: "W 5-2", ab: 4, h: 1, hr: 1, rbi: 1, r: 1, batterScore: 90 },
      { opponent: "St. Louis Cardinals", date: "June 02", result: "W 7-4", ab: 3, h: 0, hr: 0, rbi: 0, r: 0, batterScore: 50 }
    ],
    propositions: [
      { id: "prop_tucker_hits", market: "To Record 1+ Hits", odds: 1.50, spec: "Kyle Tucker Over 0.5 Hits" },
      { id: "prop_tucker_rbi", market: "Runs Batted In Prop", odds: 2.10, spec: "Kyle Tucker Over 0.5 RBIs" }
    ]
  },
  {
    id: "mlb_devers",
    name: "Rafael Devers",
    team: "Boston Red Sox",
    position: "Third Baseman",
    number: "11",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/646240/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE",
    injuryNotes: "Left shoulder discomfort fully cleared. Swings at full expansion.",
    batterScore: 91,
    seasonStats: { avg: ".285", hr: "24", rbi: "68", ops: ".934" },
    bats: "L",
    throws: "R",
    height: "6'0\"",
    weight: "240 lbs",
    birthdate: "October 24, 1996",
    advanced: {
      barrelPercent: 14.5,
      launchAngle: 12.8,
      exitVelocity: 93.1,
      hardHitPercent: 51.4,
      chasePercent: 32.1,
      woba: 0.385,
      xwoba: 0.395,
      sweetSpotPercent: 36.8
    },
    splits: {
      vLHP: { avg: ".250", obp: ".315", slg: ".430", ops: ".745" },
      vRHP: { avg: ".302", obp: ".390", slg: ".610", ops: "1.000" },
      home: { avg: ".299", obp: ".381", slg: ".590", ops: ".971" },
      away: { avg: ".271", obp: ".349", slg: ".525", ops: ".874" },
      last10: { avg: ".300", obp: ".365", slg: ".575", ops: ".940" }
    },
    scoutingReport: {
      powerText: "Fierce, violent bat speed. Punishes low and outside offspeed drops, transferring high body torque to deep center fences.",
      contactText: "Vicious hacking approach. Covers high areas impressively well despite aggressive lunges.",
      disciplineText: "Aggressive chaser on wide sliders, but counteracts chase fractions with elite contact rate on balls in play.",
      overallScouting: "Shoulder issues are fully resolved. Displaying full violent whip speed through the plate. Advantageous matchup versus standard right-hand four-seamers.",
      hotZones: ["Middle-Middle", "Low-Away", "Middle-In"],
      riskFactor: "LOW"
    },
    gameLogs: [
      { opponent: "New York Yankees", date: "June 18", result: "L 2-5", ab: 4, h: 2, hr: 1, rbi: 1, r: 1, batterScore: 92 },
      { opponent: "Houston Astros", date: "June 18", result: "W 4-3", ab: 4, h: 1, hr: 0, rbi: 1, r: 0, batterScore: 82 },
      { opponent: "Los Angeles Dodgers", date: "June 11", result: "L 4-8", ab: 3, h: 1, hr: 0, rbi: 0, r: 1, batterScore: 78 },
      { opponent: "San Diego Padres", date: "June 10", result: "L 3-7", ab: 4, h: 2, hr: 1, rbi: 2, r: 1, batterScore: 91 }
    ],
    propositions: [
      { id: "prop_devers_hits", market: "To Record 1+ Hits", odds: 1.45, spec: "Rafael Devers Over 0.5 Hits" },
      { id: "prop_devers_hr", market: "To Hit 1+ Home Run", odds: 3.30, spec: "Rafael Devers Over 0.5 HRs" }
    ]
  },
  {
    id: "mlb_machado",
    name: "Manny Machado",
    team: "San Diego Padres",
    position: "Third Baseman",
    number: "13",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/592518/headshot/67/current",
    injuryStatus: "Questionable / Day-to-Day",
    injurySeverity: "DAY_TO_DAY",
    injuryNotes: "Mild hip strain. Day-to-day evaluation; rested in recent game but expected to participate on Friday.",
    batterScore: 80,
    seasonStats: { avg: ".268", hr: "14", rbi: "52", ops: ".780" },
    bats: "R",
    throws: "R",
    height: "6'3\"",
    weight: "218 lbs",
    birthdate: "July 6, 1992",
    advanced: {
      barrelPercent: 11.8,
      launchAngle: 13.5,
      exitVelocity: 91.5,
      hardHitPercent: 44.1,
      chasePercent: 28.1,
      woba: 0.332,
      xwoba: 0.340,
      sweetSpotPercent: 35.8
    },
    splits: {
      vLHP: { avg: ".290", obp: ".350", slg: ".510", ops: ".860" },
      vRHP: { avg: ".258", obp: ".320", slg: ".432", ops: ".752" },
      home: { avg: ".275", obp: ".338", slg: ".480", ops: ".818" },
      away: { avg: ".260", obp: ".318", slg: ".421", ops: ".739" },
      last10: { avg: ".250", obp: ".312", slg: ".438", ops: ".750" }
    },
    scoutingReport: {
      powerText: "Strong visual carry. Excels at dropping the barrel head on low changeups and whipping them to the deep left corners.",
      contactText: "Smooth, level swing. Occasionally rolls over breaking pitches when hip transfer is restricted by minor strains.",
      disciplineText: "Disciplined hitter, highly competitive in two-strike situations. Aggressive style but smart under crunch pressure.",
      overallScouting: "Presenting day-to-day hip tightness, which limits optimal lower half rotation. Still holds excellent matchup advantages against weak sweeping lefties.",
      hotZones: ["Middle-In", "Low-Away", "Up-Middle"],
      riskFactor: "MEDIUM"
    },
    gameLogs: [
      { opponent: "Los Angeles Dodgers", date: "June 18", result: "L 3-6", ab: 3, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 75 },
      { opponent: "Houston Astros", date: "June 13", result: "L 2-5", ab: 4, h: 0, hr: 0, rbi: 0, r: 0, batterScore: 55 },
      { opponent: "Boston Red Sox", date: "June 10", result: "W 7-3", ab: 4, h: 2, hr: 1, rbi: 3, r: 1, batterScore: 92 }
    ],
    propositions: [
      { id: "prop_machado_hits", market: "To Record 1+ Hits", odds: 1.47, spec: "Manny Machado Over 0.5 Hits" },
      { id: "prop_machado_rbi", market: "Runs Batted In Prop", odds: 2.05, spec: "Manny Machado Over 0.5 RBIs" }
    ]
  },
  {
    id: "mlb_soto",
    name: "Juan Soto",
    team: "New York Yankees",
    position: "Outfielder",
    number: "22",
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/665742/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE",
    injuryNotes: "Cleared of forearm inflammation. Full range of motion achieved with elite plate discipline walks.",
    batterScore: 98,
    seasonStats: { avg: ".305", hr: "28", rbi: "77", ops: "1.020" },
    bats: "L",
    throws: "R",
    height: "6'2\"",
    weight: "220 lbs",
    birthdate: "October 25, 1998",
    advanced: {
      barrelPercent: 17.5,
      launchAngle: 12.5,
      exitVelocity: 94.2,
      hardHitPercent: 54.2,
      chasePercent: 12.5,
      woba: 0.420,
      xwoba: 0.428,
      sweetSpotPercent: 42.0
    },
    splits: {
      vLHP: { avg: ".280", obp: ".420", slg: ".520", ops: ".940" },
      vRHP: { avg: ".315", obp: ".455", slg: ".620", ops: "1.075" },
      home: { avg: ".310", obp: ".440", slg: ".600", ops: "1.040" },
      away: { avg: ".300", obp: ".435", slg: ".590", ops: "1.025" },
      last10: { avg: ".333", obp: ".471", slg: ".625", ops: "1.096" }
    },
    scoutingReport: {
      powerText: "Elite pull and opposite-field power. Beautiful compact left-handed stride that maintains massive back-side drive force.",
      contactText: "Spectacular bat-to-ball accuracy. Capable of driving balls with high velocities to all fields regardless of pitch style.",
      disciplineText: "All-time legendary plate awareness. Leads the major leagues in base on balls percentage year after year. Performs his signature shuffle during defensive zone misses.",
      overallScouting: "Outstanding matchup scores across all pitching variations. Particularly dangerous when paired with bases-loaded counts, maintaining the lowest pressure coefficient in the sport.",
      hotZones: ["Down & In", "Middle-Middle", "Down & Away", "Up & Away"],
      riskFactor: "LOW"
    },
    gameLogs: [
      { opponent: "Boston Red Sox", date: "June 18", result: "W 5-2", ab: 3, h: 1, hr: 0, rbi: 1, r: 2, batterScore: 90 },
      { opponent: "Houston Astros", date: "June 15", result: "W 6-1", ab: 3, h: 2, hr: 1, rbi: 2, r: 2, batterScore: 99 },
      { opponent: "Los Angeles Dodgers", date: "June 14", result: "L 5-11", ab: 4, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 78 },
      { opponent: "Toronto Blue Jays", date: "June 12", result: "W 3-0", ab: 4, h: 2, hr: 1, rbi: 1, r: 1, batterScore: 94 }
    ],
    propositions: [
      { id: "prop_soto_hits", market: "To Record 1+ Hits", odds: 1.42, spec: "Juan Soto Over 0.5 Hits" },
      { id: "prop_soto_walks", market: "Base On Balls Prop", odds: 1.85, spec: "Juan Soto Over 0.5 Walks" },
      { id: "prop_soto_rbi", market: "Runs Batted In Prop", odds: 2.15, spec: "Juan Soto Over 0.5 RBIs" }
    ]
  }
];

const ADDITIONAL_TEMPLATES = [
  { name: "Corbin Carroll", team: "Arizona Diamondbacks", number: "7", position: "Outfielder", bats: "L" as const, stats: { avg: ".265", hr: "18", rbi: "60", ops: ".805" } },
  { name: "Ketel Marte", team: "Arizona Diamondbacks", number: "4", position: "Second Baseman", bats: "S" as const, stats: { avg: ".285", hr: "28", rbi: "82", ops: ".850" } },
  { name: "Gunnar Henderson", team: "Baltimore Orioles", number: "2", position: "Shortstop", bats: "L" as const, stats: { avg: ".282", hr: "33", rbi: "88", ops: ".915" } },
  { name: "Adley Rutschman", team: "Baltimore Orioles", number: "35", position: "Catcher", bats: "S" as const, stats: { avg: ".274", hr: "21", rbi: "78", ops: ".810" } },
  { name: "Cody Bellinger", team: "Chicago Cubs", number: "24", position: "Outfielder / First Baseman", bats: "L" as const, stats: { avg: ".275", hr: "22", rbi: "75", ops: ".820" } },
  { name: "Seiya Suzuki", team: "Chicago Cubs", number: "27", position: "Outfielder", bats: "R" as const, stats: { avg: ".280", hr: "21", rbi: "74", ops: ".840" } },
  { name: "Elly De La Cruz", team: "Cincinnati Reds", number: "44", position: "Shortstop", bats: "S" as const, stats: { avg: ".262", hr: "25", rbi: "70", ops: ".830" } },
  { name: "José Ramírez", team: "Cleveland Guardians", number: "11", position: "Third Baseman", bats: "S" as const, stats: { avg: ".280", hr: "36", rbi: "105", ops: ".875" } },
  { name: "Steven Kwan", team: "Cleveland Guardians", number: "38", position: "Outfielder", bats: "L" as const, stats: { avg: ".310", hr: "14", rbi: "52", ops: ".800" } },
  { name: "Nolan Jones", team: "Colorado Rockies", number: "22", position: "Outfielder", bats: "L" as const, stats: { avg: ".260", hr: "16", rbi: "58", ops: ".780" } },
  { name: "Riley Greene", team: "Detroit Tigers", number: "31", position: "Outfielder", bats: "L" as const, stats: { avg: ".268", hr: "24", rbi: "72", ops: ".815" } },
  { name: "Bobby Witt Jr.", team: "Kansas City Royals", number: "7", position: "Shortstop", bats: "R" as const, stats: { avg: ".318", hr: "32", rbi: "109", ops: ".955" } },
  { name: "Salvador Perez", team: "Kansas City Royals", number: "13", position: "Catcher", bats: "R" as const, stats: { avg: ".272", hr: "26", rbi: "95", ops: ".810" } },
  { name: "Mike Trout", team: "Los Angeles Angels", number: "27", position: "Outfielder", bats: "R" as const, stats: { avg: ".260", hr: "22", rbi: "55", ops: ".920" } },
  { name: "Christian Yelich", team: "Milwaukee Brewers", number: "22", position: "Outfielder", bats: "L" as const, stats: { avg: ".285", hr: "16", rbi: "65", ops: ".835" } },
  { name: "William Contreras", team: "Milwaukee Brewers", number: "24", position: "Catcher", bats: "R" as const, stats: { avg: ".280", hr: "20", rbi: "80", ops: ".815" } },
  { name: "Carlos Correa", team: "Minnesota Twins", number: "4", position: "Shortstop", bats: "R" as const, stats: { avg: ".275", hr: "18", rbi: "68", ops: ".800" } },
  { name: "Francisco Lindor", team: "New York Mets", number: "12", position: "Shortstop", bats: "S" as const, stats: { avg: ".270", hr: "30", rbi: "90", ops: ".835" } },
  { name: "Pete Alonso", team: "New York Mets", number: "20", position: "First Baseman", bats: "R" as const, stats: { avg: ".245", hr: "34", rbi: "92", ops: ".820" } },
  { name: "Brent Rooker", team: "Oakland Athletics", number: "25", position: "Designated Hitter", bats: "R" as const, stats: { avg: ".280", hr: "34", rbi: "102", ops: ".880" } },
  { name: "Bryce Harper", team: "Philadelphia Phillies", number: "3", position: "First Baseman", bats: "L" as const, stats: { avg: ".285", hr: "28", rbi: "88", ops: ".900" } },
  { name: "Kyle Schwarber", team: "Philadelphia Phillies", number: "12", position: "Designated Hitter", bats: "L" as const, stats: { avg: ".248", hr: "38", rbi: "94", ops: ".865" } },
  { name: "Bryan Reynolds", team: "Pittsburgh Pirates", number: "10", position: "Outfielder", bats: "S" as const, stats: { avg: ".278", hr: "24", rbi: "80", ops: ".825" } },
  { name: "Matt Chapman", team: "San Francisco Giants", number: "26", position: "Third Baseman", bats: "R" as const, stats: { avg: ".248", hr: "24", rbi: "72", ops: ".780" } },
  { name: "Heliot Ramos", team: "San Francisco Giants", number: "17", position: "Outfielder", bats: "R" as const, stats: { avg: ".272", hr: "20", rbi: "65", ops: ".815" } },
  { name: "Julio Rodríguez", team: "Seattle Mariners", number: "44", position: "Outfielder", bats: "R" as const, stats: { avg: ".275", hr: "22", rbi: "78", ops: ".810" } },
  { name: "Cal Raleigh", team: "Seattle Mariners", number: "29", position: "Catcher", bats: "S" as const, stats: { avg: ".230", hr: "32", rbi: "84", ops: ".785" } },
  { name: "Nolan Arenado", team: "St. Louis Cardinals", number: "28", position: "Third Baseman", bats: "R" as const, stats: { avg: ".265", hr: "18", rbi: "72", ops: ".745" } },
  { name: "Yandy Díaz", team: "Tampa Bay Rays", number: "2", position: "First Baseman", bats: "R" as const, stats: { avg: ".282", hr: "14", rbi: "65", ops: ".780" } },
  { name: "Corey Seager", team: "Texas Rangers", number: "5", position: "Shortstop", bats: "L" as const, stats: { avg: ".285", hr: "33", rbi: "84", ops: ".885" } },
  { name: "Vladimir Guerrero Jr.", team: "Toronto Blue Jays", number: "27", position: "First Baseman", bats: "R" as const, stats: { avg: ".310", hr: "30", rbi: "98", ops: ".925" } },
  { name: "CJ Abrams", team: "Washington Nationals", number: "5", position: "Shortstop", bats: "L" as const, stats: { avg: ".254", hr: "20", rbi: "68", ops: ".765" } }
];

const generatedPlayers: MLBPlayer[] = ADDITIONAL_TEMPLATES.map(t => {
  const pId = "mlb_" + t.name.toLowerCase().replace(/\s+/g, "_");
  const hrVal = parseInt(t.stats.hr) || 0;
  const avgVal = parseFloat(t.stats.avg) || .250;
  const score = Math.min(99, 80 + (hrVal % 15));

  return {
    id: pId,
    name: t.name,
    team: t.team,
    position: t.position,
    number: t.number,
    headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current",
    injuryStatus: "Cleared / Fully Active",
    injurySeverity: "NONE" as const,
    injuryNotes: "Passed velocity physical threshold reviews.",
    batterScore: score,
    seasonStats: t.stats,
    bats: t.bats,
    throws: (t.bats === 'L' ? 'L' : 'R') as 'L' | 'R',
    height: "6'2\"",
    weight: "205 lbs",
    birthdate: "October 16, 1996",
    advanced: {
      barrelPercent: parseFloat((7.2 + (hrVal % 12) * 1.1).toFixed(1)),
      launchAngle: parseFloat((11.4 + (hrVal % 8) * 0.9).toFixed(1)),
      exitVelocity: parseFloat((89.8 + (hrVal % 6) * 1.0).toFixed(1)),
      hardHitPercent: parseFloat((38.5 + (hrVal % 15) * 1.2).toFixed(1)),
      chasePercent: 21.4,
      woba: parseFloat((avgVal * 1.3).toFixed(3)),
      xwoba: parseFloat((avgVal * 1.34).toFixed(3)),
      sweetSpotPercent: 36.5
    },
    splits: {
      vLHP: { avg: (avgVal - 0.015).toFixed(3), obp: (avgVal + 0.06).toFixed(3), slg: (avgVal * 1.8).toFixed(3), ops: (avgVal * 2.5).toFixed(3) },
      vRHP: { avg: (avgVal + 0.01).toFixed(3), obp: (avgVal + 0.08).toFixed(3), slg: (avgVal * 1.9).toFixed(3), ops: (avgVal * 2.7).toFixed(3) },
      home: { avg: (avgVal + 0.02).toFixed(3), obp: (avgVal + 0.09).toFixed(3), slg: (avgVal * 2.0).toFixed(3), ops: t.stats.ops },
      away: { avg: (avgVal - 0.01).toFixed(3), obp: (avgVal + 0.06).toFixed(3), slg: (avgVal * 1.7).toFixed(3), ops: (parseFloat(t.stats.ops) - 0.05).toFixed(3) },
      last10: { avg: (avgVal + 0.03).toFixed(3), obp: (avgVal + 0.11).toFixed(3), slg: (avgVal * 2.2).toFixed(3), ops: (parseFloat(t.stats.ops) + 0.09).toFixed(3) }
    },
    scoutingReport: {
      powerText: `Stunning extension metrics. Season stats registered ${hrVal} home runs under hard-hit velocity sweep overlays.`,
      contactText: "Short compact level path that minimizes whiff ratios on breaking lines.",
      disciplineText: "Superb plate control and strikeout-avoidance numbers under late pressure counts.",
      overallScouting: `Excellent star batter. Dominates fastballs up in the zone. Fast rotational hips generate massive projection coefficients.`,
      hotZones: ["Middle-Middle", "Up & In", "Down & Away"],
      riskFactor: "LOW" as const
    },
    gameLogs: [
      { opponent: "League Opponent", date: "June 18", result: "W 4-2", ab: 4, h: 2, hr: 1, rbi: 2, r: 1, batterScore: score },
      { opponent: "Division Rival", date: "June 16", result: "L 1-3", ab: 3, h: 1, hr: 0, rbi: 0, r: 0, batterScore: 78 },
      { opponent: "Regular Matchup", date: "June 13", result: "W 5-0", ab: 4, h: 2, hr: 0, rbi: 1, r: 1, batterScore: score + 1 }
    ],
    propositions: [
      { id: `prop_${pId}_hits`, market: "To Record 1+ Hits", odds: 1.45, spec: `${t.name} Over 0.5 Hits` },
      { id: `prop_${pId}_hr`, market: "To Hit 1+ Home Run", odds: 3.80, spec: `${t.name} Over 0.5 HRs` },
      { id: `prop_${pId}_rbi`, market: "Runs Batted In Prop", odds: 2.10, spec: `${t.name} Over 0.5 RBIs` }
    ]
  };
});

export const MLB_PLAYER_RECORDS: MLBPlayer[] = [...originalPlayers, ...generatedPlayers];
