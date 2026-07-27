let activeAccountId: string | null = null;

export function setAccountStorageScope(accountId: string | null): void {
  activeAccountId = accountId?.trim() || null;
}

export function accountStorageKey(baseKey: string): string {
  const scope = activeAccountId ? `account:${encodeURIComponent(activeAccountId)}` : 'guest';
  return `${baseKey}:${scope}`;
}
