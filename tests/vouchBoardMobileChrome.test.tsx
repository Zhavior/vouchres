// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('VouchBoard mobile chrome', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/VouchBoard.tsx'), 'utf8');

  it('keeps a compact phone tab switcher separate from desktop cards', () => {
    expect(source).toContain('board-tabs-belt-mobile');
    expect(source).toContain('md:hidden');
    expect(source).toContain("label: 'Studio'");
    expect(source).toContain('Feed (${savedVouches.length})');
  });

  it('pads the board shell for the mobile dock', () => {
    expect(source).toContain('ve-safe-bottom');
    expect(source).toContain('overflow-x-hidden');
    expect(source).toContain('pb-28');
  });
});
