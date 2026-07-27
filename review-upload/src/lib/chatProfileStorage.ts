import type { CreatorProofProfile } from '../types';
import { Z8_AMBER_HEX, Z8_CYAN_HEX, Z8_EMERALD_HEX } from '../theme/z8Tokens';

export const CHAT_PROFILE_STORAGE_KEY = 'vouchedge_chat_profile';

export type ChatAccentColor = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';

export interface VouchEdgeChatProfile {
  statusLine: string;
  accentColor: ChatAccentColor;
  tag?: string;
}

export interface ResolvedChatProfile extends VouchEdgeChatProfile {
  displayName: string;
  username: string;
  avatarUrl: string;
  borderId?: string;
  isVerified?: boolean;
  winRate?: number;
  subscriptionTier?: CreatorProofProfile['subscriptionTier'];
}

export const CHAT_ACCENT_PALETTE: { id: ChatAccentColor; hex: string; label: string }[] = [
  { id: 'cyan', hex: Z8_CYAN_HEX, label: 'Cyan' },
  { id: 'emerald', hex: Z8_EMERALD_HEX, label: 'Emerald' },
  { id: 'amber', hex: Z8_AMBER_HEX, label: 'Amber' },
  { id: 'rose', hex: '#fb7185', label: 'Rose' },
  { id: 'violet', hex: '#a78bfa', label: 'Violet' },
];

const DEFAULT_CHAT_PROFILE: VouchEdgeChatProfile = {
  statusLine: 'Researching edges',
  accentColor: 'cyan',
};

export function accentHex(color: ChatAccentColor): string {
  return CHAT_ACCENT_PALETTE.find((c) => c.id === color)?.hex ?? Z8_CYAN_HEX;
}

export function loadChatProfile(): VouchEdgeChatProfile {
  try {
    const raw = localStorage.getItem(CHAT_PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHAT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<VouchEdgeChatProfile>;
    return {
      statusLine: typeof parsed.statusLine === 'string' ? parsed.statusLine.slice(0, 80) : DEFAULT_CHAT_PROFILE.statusLine,
      accentColor: CHAT_ACCENT_PALETTE.some((c) => c.id === parsed.accentColor)
        ? (parsed.accentColor as ChatAccentColor)
        : DEFAULT_CHAT_PROFILE.accentColor,
      tag: typeof parsed.tag === 'string' ? parsed.tag.slice(0, 32) : undefined,
    };
  } catch {
    return { ...DEFAULT_CHAT_PROFILE };
  }
}

export function saveChatProfile(patch: Partial<VouchEdgeChatProfile>): VouchEdgeChatProfile {
  const current = loadChatProfile();
  const next: VouchEdgeChatProfile = {
    statusLine: patch.statusLine !== undefined ? patch.statusLine.slice(0, 80) : current.statusLine,
    accentColor: patch.accentColor ?? current.accentColor,
    tag: patch.tag !== undefined ? patch.tag.slice(0, 32) : current.tag,
  };
  localStorage.setItem(CHAT_PROFILE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function mergeChatProfile(
  serverProfile?: CreatorProofProfile | null,
  stored?: VouchEdgeChatProfile,
  serverChat?: Partial<VouchEdgeChatProfile> | null,
): ResolvedChatProfile {
  const local = stored ?? loadChatProfile();
  const remote = serverChat ?? {};
  const displayName = serverProfile?.displayName?.trim() || 'Guest';
  const username = serverProfile?.username?.trim() || 'guest';

  return {
    displayName,
    username,
    avatarUrl: serverProfile?.avatarUrl ?? '',
    borderId: serverProfile?.profileBorderId,
    isVerified: serverProfile?.verified,
    winRate: serverProfile?.winRate,
    subscriptionTier: serverProfile?.subscriptionTier,
    statusLine: remote.statusLine ?? local.statusLine,
    accentColor: (remote.accentColor as ChatAccentColor) ?? local.accentColor,
    tag: remote.tag ?? local.tag,
  };
}
