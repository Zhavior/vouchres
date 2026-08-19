/** My HR List transport. Thin wrapper over apiClient so the store stays pure. */
import { apiClient } from '../../../lib/apiClient';
import type { HrList, HrListEntry, HrListShareBundle, HrListVisibility } from '../hrListTypes';

export async function fetchHrLists(): Promise<HrList[]> {
  const payload = await apiClient.get<{ lists: HrList[] }>('/api/hr-lists');
  return payload?.lists ?? [];
}

export async function createHrListRequest(input: {
  title: string;
  slateDate?: string | null;
  entries?: HrListEntry[];
}): Promise<HrList> {
  const payload = await apiClient.post<{ list: HrList }>('/api/hr-lists', input);
  return payload.list;
}

export async function updateHrListRequest(
  listId: string,
  patch: {
    title?: string;
    slateDate?: string | null;
    entries?: HrListEntry[];
    visibility?: HrListVisibility;
  },
): Promise<HrList> {
  const payload = await apiClient.patch<{ list: HrList }>(`/api/hr-lists/${listId}`, patch);
  return payload.list;
}

export async function deleteHrListRequest(listId: string): Promise<void> {
  await apiClient.delete(`/api/hr-lists/${listId}`);
}

/**
 * Publishes the list and returns the share bundle. Publishing is what makes
 * /l/:id resolve — the server does not post anything anywhere.
 */
export async function shareHrListRequest(
  listId: string,
): Promise<{ list: HrList; share: HrListShareBundle }> {
  return apiClient.post<{ list: HrList; share: HrListShareBundle }>(
    `/api/hr-lists/${listId}/share`,
  );
}
