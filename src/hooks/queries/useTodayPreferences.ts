import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { TodayPreferences, TodayPreferencesUpdate } from '../../types/todayPreferences';
import { queryKeys } from './queryKeys';

const EMPTY_TODAY_PREFERENCES: TodayPreferences = {
  favoriteMlbTeamIds: [],
  followedPlayers: [],
  researchInterests: [],
  inAppAlertTypes: [],
  updatedAt: null,
};

function normalizeTodayPreferences(preferences?: Partial<TodayPreferences>): TodayPreferences {
  return {
    favoriteMlbTeamIds: preferences?.favoriteMlbTeamIds ?? [],
    followedPlayers: preferences?.followedPlayers ?? [],
    researchInterests: preferences?.researchInterests ?? [],
    inAppAlertTypes: preferences?.inAppAlertTypes ?? [],
    updatedAt: preferences?.updatedAt ?? null,
  };
}

async function fetchTodayPreferences(): Promise<TodayPreferences> {
  const response = await apiClient.get<{ preferences?: TodayPreferences }>('/api/today/preferences');
  return response.preferences ? normalizeTodayPreferences(response.preferences) : EMPTY_TODAY_PREFERENCES;
}

async function updateTodayPreferences(input: TodayPreferencesUpdate): Promise<TodayPreferences> {
  const response = await apiClient.put<{ preferences?: TodayPreferences }>('/api/today/preferences', input);
  return response.preferences
    ? normalizeTodayPreferences(response.preferences)
    : { ...input, updatedAt: new Date().toISOString() };
}

export function useTodayPreferences(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.todayPreferences(),
    queryFn: fetchTodayPreferences,
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const mutation = useMutation({
    mutationFn: updateTodayPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.todayPreferences(), preferences);
    },
  });

  return {
    ...query,
    preferences: query.data ?? EMPTY_TODAY_PREFERENCES,
    savePreferences: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}
