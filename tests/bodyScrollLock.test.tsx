// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useBodyScrollLock, resetBodyScrollLockForTests } from '../src/lib/scroll/useBodyScrollLock';

function LockOwner({ open }: { open: boolean }) {
  useBodyScrollLock(open);
  return null;
}

afterEach(() => {
  resetBodyScrollLockForTests();
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
});

describe('body scroll lock', () => {
  it('locks both roots while an auth-style owner is open and restores prior inline styles on close', () => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'scroll';
    const view = render(<LockOwner open />);

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    view.rerender(<LockOwner open={false} />);
    expect(document.body.style.overflow).toBe('auto');
    expect(document.documentElement.style.overflow).toBe('scroll');
  });

  it('cleans up on unmount and does not unlock before every overlay is closed', () => {
    const first = render(<LockOwner open />);
    const second = render(<LockOwner open />);

    first.unmount();
    expect(document.body.style.overflow).toBe('hidden');

    second.unmount();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });
});
