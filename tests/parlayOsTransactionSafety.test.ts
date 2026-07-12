import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workspaceSource = readFileSync(
  new URL('../src/components/parlay/ParlayOsWorkspace.tsx', import.meta.url),
  'utf8',
);
const actionsSource = readFileSync(
  new URL('../src/domain/parlayActions.ts', import.meta.url),
  'utf8',
);

describe('ParlayOS transaction safety contract', () => {
  it('never falls back to an arbitrary saved slip when locking', () => {
    expect(workspaceSource).not.toContain('savedSlips[0]');
    expect(workspaceSource).toContain('const saved = saveResult.parlay;');
  });

  it('requires confirmed backend persistence before trust commitment', () => {
    expect(workspaceSource).toContain("saveResult.syncState !== 'synced'");
    expect(actionsSource).toContain('const pickId = working.backendPickId;');
    expect(actionsSource).not.toContain('working.backendPickId ?? working.id');
  });

  it('uses one stable value for the draft id and client reference', () => {
    expect(workspaceSource).toContain('id: draftId,');
    expect(workspaceSource).toContain('clientRef: draftId,');
  });
});
