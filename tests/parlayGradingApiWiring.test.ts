import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const userRoutes = readFileSync(
  new URL('../server/routes/parlay/parlayUserRoutes.ts', import.meta.url),
  'utf8',
);
const supportRoutes = readFileSync(
  new URL('../server/routes/parlay/mountParlaySupportRoutes.ts', import.meta.url),
  'utf8',
);
const parlayActions = readFileSync(
  new URL('../src/domain/parlayActions.ts', import.meta.url),
  'utf8',
);
const clientGrading = readFileSync(
  new URL('../src/lib/parlayGrading.ts', import.meta.url),
  'utf8',
);
const cronRoutes = readFileSync(
  new URL('../server/routes/parlay/parlayCronRoutes.ts', import.meta.url),
  'utf8',
);

describe('parlay grading API wiring', () => {
  it('removes legacy lifecycle routes from the non-V3 router', () => {
    expect(userRoutes).not.toContain('"/me/parlays"');
    expect(userRoutes).not.toContain('"/parlays/save"');
    expect(userRoutes).not.toContain('saveMeParlayHandler');
  });

  it('keeps the canonical V3 save and grade endpoints mounted', () => {
    expect(supportRoutes).toContain('"/parlays/grade"');
    expect(cronRoutes).toContain('"/cron/parlays/grade-due"');
    expect(cronRoutes).toContain('gradePendingPicks');
  });

  it('saves from the client through the V3 write path and grades through the API', () => {
    expect(parlayActions).toContain("'/api/v3/parlays/save'");
    expect(clientGrading).toContain("'/api/parlays/grade'");
  });
});
