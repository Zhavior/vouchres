const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBackendProofPickId(value: unknown): boolean {
  return UUID_RE.test(String(value ?? "").trim());
}

export function resolvePublicProofPickId(input: {
  backendPickId?: string | null;
  sourceId?: string | null;
  id?: string | null;
}): string | null {
  for (const candidate of [input.backendPickId, input.sourceId, input.id]) {
    if (isBackendProofPickId(candidate)) return String(candidate);
  }
  return null;
}

export function resolveLocalSlipId(input: {
  sourceId?: string | null;
  id?: string | null;
}): string | null {
  const id = String(input.sourceId ?? input.id ?? "").trim();
  if (!id || isBackendProofPickId(id)) return null;
  return id;
}
