import { z } from "zod";

export const MlbTeamSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  abbreviation: z.string().optional(),
  teamCode: z.string().optional(),
}).passthrough();

export const MlbPlayerSchema = z.object({
  id: z.number().optional(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  pitchHand: z.object({ code: z.string().optional() }).passthrough().optional(),
  batSide: z.object({ code: z.string().optional() }).passthrough().optional(),
  primaryPosition: z.object({ abbreviation: z.string().optional() }).passthrough().optional(),
  currentTeam: MlbTeamSchema.optional(),
}).passthrough();

const MlbRosterEntrySchema = z.object({
  person: MlbPlayerSchema.optional(),
  position: z.object({ abbreviation: z.string().optional() }).passthrough().optional(),
}).passthrough();

const MlbLeagueRecordSchema = z.object({
  wins: z.number().optional(),
  losses: z.number().optional(),
}).passthrough();

const MlbGameTeamSideSchema = z.object({
  team: MlbTeamSchema.optional(),
  score: z.number().optional(),
  leagueRecord: MlbLeagueRecordSchema.optional(),
  probablePitcher: MlbPlayerSchema.optional(),
}).passthrough();

export const MlbScheduleGameSchema = z.object({
  gamePk: z.number(),
  gameDate: z.string().optional(),
  status: z.object({
    detailedState: z.string().optional(),
    abstractGameState: z.string().optional(),
  }).passthrough().optional(),
  teams: z.object({
    away: MlbGameTeamSideSchema.optional(),
    home: MlbGameTeamSideSchema.optional(),
  }).passthrough().optional(),
  venue: z.object({ name: z.string().optional() }).passthrough().optional(),
  linescore: z.unknown().optional(),
  lineups: z.unknown().optional(),
}).passthrough();

const MlbScheduleDateSchema = z.object({
  games: z.array(z.unknown()).optional(),
}).passthrough();

const MlbScheduleResponseSchema = z.object({
  dates: z.array(MlbScheduleDateSchema).optional(),
}).passthrough();

export type MlbScheduleGame = z.infer<typeof MlbScheduleGameSchema>;
export type MlbPlayer = z.infer<typeof MlbPlayerSchema>;
export type MlbTeam = z.infer<typeof MlbTeamSchema>;
export type MlbRosterEntry = z.infer<typeof MlbRosterEntrySchema>;

export interface ParsedMlbSchedule {
  games: MlbScheduleGame[];
  warnings: string[];
}

export function parseMlbScheduleResponse(input: unknown, context = "mlbSchedule"): ParsedMlbSchedule {
  const response = MlbScheduleResponseSchema.safeParse(input);
  if (!response.success) {
    return {
      games: [],
      warnings: [`${context}: MLB schedule response shape changed or was invalid.`],
    };
  }

  const warnings: string[] = [];
  const games: MlbScheduleGame[] = [];

  for (const dateEntry of response.data.dates ?? []) {
    for (const rawGame of dateEntry.games ?? []) {
      const parsed = MlbScheduleGameSchema.safeParse(rawGame);
      if (parsed.success) {
        games.push(parsed.data);
      } else {
        warnings.push(`${context}: skipped malformed MLB game row.`);
      }
    }
  }

  return { games, warnings };
}

export function parseMlbPeopleResponse(input: unknown, context = "mlbPeople"): { people: MlbPlayer[]; warnings: string[] } {
  const response = z.object({ people: z.array(z.unknown()).optional() }).passthrough().safeParse(input);
  if (!response.success) {
    return { people: [], warnings: [`${context}: MLB people response shape changed or was invalid.`] };
  }

  const people: MlbPlayer[] = [];
  const warnings: string[] = [];

  for (const rawPerson of response.data.people ?? []) {
    const parsed = MlbPlayerSchema.safeParse(rawPerson);
    if (parsed.success && typeof parsed.data.id === "number") {
      people.push(parsed.data);
    } else {
      warnings.push(`${context}: skipped malformed MLB person row.`);
    }
  }

  return { people, warnings };
}

export function parseMlbTeamsResponse(input: unknown, context = "mlbTeams"): { teams: MlbTeam[]; warnings: string[] } {
  const response = z.object({ teams: z.array(z.unknown()).optional() }).passthrough().safeParse(input);
  if (!response.success) {
    return { teams: [], warnings: [`${context}: MLB teams response shape changed or was invalid.`] };
  }

  const teams: MlbTeam[] = [];
  const warnings: string[] = [];

  for (const rawTeam of response.data.teams ?? []) {
    const parsed = MlbTeamSchema.safeParse(rawTeam);
    if (parsed.success && typeof parsed.data.id === "number" && parsed.data.name) {
      teams.push(parsed.data);
    } else {
      warnings.push(`${context}: skipped malformed MLB team row.`);
    }
  }

  return { teams, warnings };
}

export function parseMlbRosterResponse(input: unknown, context = "mlbRoster"): { roster: MlbRosterEntry[]; warnings: string[] } {
  const response = z.object({ roster: z.array(z.unknown()).optional() }).passthrough().safeParse(input);
  if (!response.success) {
    return { roster: [], warnings: [`${context}: MLB roster response shape changed or was invalid.`] };
  }

  const roster: MlbRosterEntry[] = [];
  const warnings: string[] = [];

  for (const rawEntry of response.data.roster ?? []) {
    const parsed = MlbRosterEntrySchema.safeParse(rawEntry);
    if (parsed.success && typeof parsed.data.person?.id === "number" && parsed.data.person.fullName) {
      roster.push(parsed.data);
    } else {
      warnings.push(`${context}: skipped malformed MLB roster row.`);
    }
  }

  return { roster, warnings };
}
