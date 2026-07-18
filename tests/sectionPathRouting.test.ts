// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { resolveDevSectionFromLocation, sectionToPath } from '../src/app/sectionNavigation';

describe('section path routing', () => {
  it('maps mobile deep links to section ids', () => {
    window.history.replaceState(null, '', '/judge-home');
    expect(resolveDevSectionFromLocation()).toBe('judge_home');

    window.history.replaceState(null, '', '/judge_home');
    expect(resolveDevSectionFromLocation()).toBe('judge_home');

    window.history.replaceState(null, '', '/judges');
    expect(resolveDevSectionFromLocation()).toBe('judge_home');

    window.history.replaceState(null, '', '/feed');
    expect(resolveDevSectionFromLocation()).toBe('feed');

    window.history.replaceState(null, '', '/board');
    expect(resolveDevSectionFromLocation()).toBe('board');

    window.history.replaceState(null, '', '/settings');
    expect(resolveDevSectionFromLocation()).toBe('settings');
  });

  it('emits kebab paths for history sync', () => {
    expect(sectionToPath('judge_home')).toBe('/judge-home');
    expect(sectionToPath('hr_board')).toBe('/hr-board');
    expect(sectionToPath('vouchedge_intro')).toBe('/vouchedge');
  });
});
