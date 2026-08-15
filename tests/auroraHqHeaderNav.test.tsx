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
    const max = getByRole('button', { name: 'Command Desk' });
    const v10 = getByRole('button', { name: 'HR Intel V10' });
    expect(desk.getAttribute('aria-current')).toBe('page');
    expect(slate.getAttribute('aria-current')).toBeNull();
    expect(max.getAttribute('aria-current')).toBeNull();
    expect(v10.getAttribute('aria-current')).toBeNull();

    fireEvent.click(slate);
    expect(onNavigate).toHaveBeenCalledWith('aurora_daily_slate');

    fireEvent.click(max);
    expect(onNavigate).toHaveBeenCalledWith('hr_max');

    fireEvent.click(v10);
    expect(onNavigate).toHaveBeenCalledWith('hr_v10');

    rerender(<AuroraHqHeaderNav activeSection="aurora_daily_slate" onNavigate={onNavigate} />);
    expect(getByRole('button', { name: 'Daily Slate' }).getAttribute('aria-current')).toBe('page');
    expect(getByRole('button', { name: 'Aurora HQ' }).getAttribute('aria-current')).toBeNull();
  });
});
