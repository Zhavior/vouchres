import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Swallow-null boundary for optional chrome (chat, banners, Parlay OS).
 * A vendor/lazy chunk failure must not replace the product desk (L023).
 */
export class OptionalChromeBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn('[optional-chrome] chunk failed; desk continues', error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
