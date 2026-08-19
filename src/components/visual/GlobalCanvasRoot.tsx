import { TerminalBackground } from '../layout/TerminalBackground';
import { GlobalAmbientBackdrop } from './GlobalAmbientBackdrop';

/**
 * The app's persistent backdrop stack, mounted once at the React root.
 *
 * This is the Vite equivalent of dropping the canvas into a Next `layout.tsx`
 * outside `{children}`: it is a sibling of the route tree in `App`, so nothing
 * the router does can unmount it. That is the fix for the field disappearing —
 * it used to live inside `AppShell`, which is inside the lazy `AuthenticatedApp`
 * chunk, so the logged-out landing had no field at all and signing in tore the
 * WebGL context down and rebuilt it. Same for `/auth/callback` and
 * `/auth/reset-password`, which never rendered the shell.
 *
 * Stacking order, all in the root stacking context:
 *   1. `TerminalBackground`  — fixed, z-0, opaque obsidian + starfield/storm.
 *   2. `#global-3d-canvas-wrapper` — fixed, z-0, later in DOM so it paints on
 *      top of the slate. `z-0` on a positioned element makes it a stacking
 *      context, which contains the field's own `-z-10`.
 *   3. The route tree — `relative z-10`, transparent, in `App`.
 *
 * Because everything above the canvas is z-10, route surfaces must stay
 * translucent: `.z8-app-shell` and `.aurora-max-shell` had opaque obsidian
 * bases that hid the field on exactly the routes that mount them.
 */
export function GlobalCanvasRoot() {
  return (
    <>
      <TerminalBackground />
      <div
        id="global-3d-canvas-wrapper"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <GlobalAmbientBackdrop />
      </div>
    </>
  );
}

export default GlobalCanvasRoot;
