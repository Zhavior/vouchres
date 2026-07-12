import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('Home Run Intelligence profile layout', () => {
  it('keeps the desktop app rail visible and uses the full mobile viewport', () => {
    const component = fs.readFileSync(
      path.join(root, 'src/features/hr/components/Profile/HrPlayerProfile.tsx'),
      'utf8',
    );
    const css = fs.readFileSync(path.join(root, 'src/styles/z8-hr-lens.css'), 'utf8');

    expect(component).toContain('z8-hr-profile-backdrop');
    expect(component).toContain('z8-hr-profile-panel');
    expect(css).toContain('left: 0;');
    expect(css).toContain('right: 0;');
    expect(css).toContain('left: max(272px, calc((100vw - 1500px) / 2 + 272px));');
    expect(css).toContain('right: max(0px, calc((100vw - 1500px) / 2));');
  });
});
