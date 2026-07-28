import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const feedCss = readFileSync(
  new URL('../src/styles/legacy/feed.css', import.meta.url),
  'utf8',
);

describe('mobile app shell scrolling', () => {
  it('uses the document element as the single mobile scroll owner', () => {
    const mobileScrollRules = feedCss.match(
      /\/\* Mobile should use natural document scroll \*\/[\s\S]*?@media \(max-width: 1180px\) \{([\s\S]*?)\n\}/,
    )?.[1] ?? '';

    expect(mobileScrollRules).toContain('html {');
    expect(mobileScrollRules).toContain('overflow: auto !important;');
    expect(mobileScrollRules).toContain('body,\n  #root {\n    overflow: visible !important;');
    expect(mobileScrollRules).not.toContain('html,\n  body,\n  #root');
  });
});
