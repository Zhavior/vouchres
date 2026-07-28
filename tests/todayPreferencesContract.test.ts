import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TODAY_PREFERENCES,
  TODAY_IN_APP_ALERT_TYPES as SERVER_ALERT_TYPES,
  TODAY_RESEARCH_INTERESTS as SERVER_RESEARCH_INTERESTS,
  TodayPreferencesPutSchema,
} from '../server/services/personalization/todayPreferencesService';
import {
  TODAY_IN_APP_ALERT_TYPES as CLIENT_ALERT_TYPES,
  TODAY_RESEARCH_INTERESTS as CLIENT_RESEARCH_INTERESTS,
} from '../src/types/todayPreferences';

const routesSource = readFileSync(
  resolve(import.meta.dirname, '../server/routes/todayPreferencesRoutes.ts'),
  'utf8',
);
const routeIndexSource = readFileSync(
  resolve(import.meta.dirname, '../server/routes/index.ts'),
  'utf8',
);
const clientHookSource = readFileSync(
  resolve(import.meta.dirname, '../src/hooks/queries/useTodayPreferences.ts'),
  'utf8',
);
const migration = readFileSync(
  resolve(import.meta.dirname, '../supabase/migrations/20260728044827_today_personalization_preferences.sql'),
  'utf8',
).toLowerCase();
const alertsMigration = readFileSync(
  resolve(import.meta.dirname, '../supabase/migrations/20260728050559_today_contextual_alert_preferences.sql'),
  'utf8',
).toLowerCase();

const validPreferences = {
  favoriteMlbTeamIds: [111, 147],
  followedPlayers: [{ id: 592450, name: 'Aaron Judge' }],
  researchInterests: ['home_runs', 'lineup_status'],
  inAppAlertTypes: ['favorite_team_game_state', 'research_change'],
} as const;

describe('Today personalization input contract', () => {
  it('accepts a bounded, explicit preference replacement', () => {
    expect(TodayPreferencesPutSchema.parse(validPreferences)).toEqual(validPreferences);
  });

  it('is strict and requires the complete replacement shape', () => {
    expect(() => TodayPreferencesPutSchema.parse({ favoriteMlbTeamIds: [] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, inferredAffinity: 'NYY' })).toThrow();
  });

  it('rejects unknown teams, malformed players, unknown interests, and oversized lists', () => {
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, favoriteMlbTeamIds: [999] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, followedPlayers: [{ id: 0, name: '' }] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, researchInterests: ['guaranteed_winners'] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, favoriteMlbTeamIds: [108, 109, 110, 111, 112, 113] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, inAppAlertTypes: ['push_guaranteed'] })).toThrow();
  });

  it('rejects duplicate team, player, and interest identities', () => {
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, favoriteMlbTeamIds: [147, 147] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, followedPlayers: [validPreferences.followedPlayers[0], validPreferences.followedPlayers[0]] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, researchInterests: ['home_runs', 'home_runs'] })).toThrow();
    expect(() => TodayPreferencesPutSchema.parse({ ...validPreferences, inAppAlertTypes: ['research_change', 'research_change'] })).toThrow();
  });

  it('returns neutral defaults instead of invented personalization', () => {
    expect(DEFAULT_TODAY_PREFERENCES).toEqual({
      favoriteMlbTeamIds: [],
      followedPlayers: [],
      researchInterests: [],
      inAppAlertTypes: [],
      updatedAt: null,
    });
  });

  it('keeps the client and server research-interest vocabularies identical', () => {
    expect(CLIENT_RESEARCH_INTERESTS).toEqual(SERVER_RESEARCH_INTERESTS);
    expect(CLIENT_ALERT_TYPES).toEqual(SERVER_ALERT_TYPES);
  });
});

describe('Today preferences API and RLS ownership', () => {
  it('mounts authenticated GET and validated PUT routes under /api', () => {
    expect(routesSource).toMatch(/\.get\([\s\S]*?["']\/today\/preferences["'][\s\S]*?requireAuth/);
    expect(routesSource).toMatch(/\.put\([\s\S]*?["']\/today\/preferences["'][\s\S]*?requireAuth[\s\S]*?TodayPreferencesPutSchema/);
    expect(routeIndexSource).toContain('app.use("/api", todayPreferencesRoutes)');
  });

  it('uses the shared authenticated API client and one canonical query cache key', () => {
    expect(clientHookSource).toContain("apiClient.get<{ preferences?: TodayPreferences }>('/api/today/preferences')");
    expect(clientHookSource).toContain("apiClient.put<{ preferences?: TodayPreferences }>('/api/today/preferences', input)");
    expect(clientHookSource).toContain('queryKeys.todayPreferences()');
    expect(clientHookSource).not.toContain('fetch(');
  });

  it('creates a user-owned table with bounded persisted arrays', () => {
    expect(migration).toContain('create table public.today_personalization_preferences');
    expect(migration).toContain('user_id uuid primary key references public.profiles(id) on delete cascade');
    expect(migration).toContain('cardinality(favorite_mlb_team_ids) <= 5');
    expect(migration).toContain('cardinality(followed_mlb_player_ids) <= 50');
    expect(migration).toContain('cardinality(research_interests) <= 8');
    expect(migration).toContain('cardinality(followed_mlb_player_ids) = cardinality(followed_mlb_player_names)');
  });

  it('adds bounded in-app alert choices without claiming push delivery', () => {
    expect(alertsMigration).toContain('add column in_app_alert_types text[]');
    expect(alertsMigration).toContain('cardinality(in_app_alert_types) <= 4');
    expect(alertsMigration).toContain("'favorite_team_game_state'");
    expect(alertsMigration).toContain("'followed_player_lineup'");
  });

  it('enables RLS, closes anon access, and applies ownership to every authenticated operation', () => {
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('revoke all on public.today_personalization_preferences from anon, authenticated');
    expect(migration).toContain('grant select, insert, update, delete on public.today_personalization_preferences to authenticated');

    for (const operation of ['select', 'insert', 'update', 'delete']) {
      expect(migration).toContain(`today_personalization_preferences_${operation}_own`);
    }
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(5);
  });
});
