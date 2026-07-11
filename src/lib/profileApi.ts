import { apiClient } from './apiClient';
import { mapAuthMeToCreatorProof } from './profileFromAuth';
import type { CreatorProofProfile } from '../types';

export type ProfilePatchInput = {
  displayName?: string;
  username?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string | null;
};

type ProfilePatchBody = {
  display_name?: string;
  username?: string;
  handle?: string;
  bio?: string;
  avatar_url?: string | null;
};

/** Persist profile edits to the server (authoritative store). */
export async function patchAuthProfile(
  input: ProfilePatchInput,
  current?: CreatorProofProfile,
): Promise<CreatorProofProfile> {
  const body: ProfilePatchBody = {};

  if (input.displayName !== undefined) body.display_name = input.displayName.trim();
  if (input.bio !== undefined) body.bio = input.bio.trim();

  const handle = (input.handle ?? input.username)?.trim().toLowerCase();
  if (handle) {
    body.handle = handle;
    body.username = handle;
  }

  if (input.avatarUrl !== undefined) {
    body.avatar_url = input.avatarUrl;
  }

  if (Object.keys(body).length === 0) {
    throw new Error('No profile fields to update.');
  }

  const raw = await apiClient.patch<Record<string, unknown>>('/api/auth/profile', body);
  return mapAuthMeToCreatorProof(raw, current);
}
