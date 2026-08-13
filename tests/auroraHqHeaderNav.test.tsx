// @vitest-environment happy-dom

import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuroraHqHeaderNav } from '../src/features/aurora-hr-hq/components/AuroraHqHeaderNav';

describe('AuroraHqHeaderNav', () => {
  it('keeps Daily Slate as a peer Aurora header page', () => {
    const onNavigate = vi.fn();
    const { getByRole, rerender } = render(
      <AuroraHqHeaderNav activeSection="aurora_hr_hq" onNavigate={onNavigate} />,
    );

    const desk = getByRole('button', { name: 'Aurora HQ' });
    const slate = getByRole('button', { name: 'Daily Slate' });
    expect(desk.getAttribute('aria-current')).toBe('page');
    expect(slate.getAttribute('aria-current')).toBeNull();

    fireEvent.click(slate);
    expect(onNavigate).toHaveBeenCalledWith('aurora_daily_slate');

    rerender(<AuroraHqHeaderNav activeSection="aurora_daily_slate" onNavigate={onNavigate} />);
    expect(getByRole('button', { name: 'Daily Slate' }).getAttribute('aria-current')).toBe('page');
    expect(getByRole('button', { name: 'Aurora HQ' }).getAttribute('aria-current')).toBeNull();
  });
});
