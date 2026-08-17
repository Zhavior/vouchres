import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';

/*
 * The single ambient particle field behind every Next surface (HR Next, Today
 * Next, Live Games, Settings). It exists once so the R3F contract lives in
 * one place: `useFrame` is only ever called from `Field`, which is only ever
 * rendered as a direct child of the `Canvas` below.
 *
 * Three deliberate hardening choices, all learned from this layer breaking the
 * pages it decorates:
 *
 * 1. No `@react-three/drei`. The equivalent raw three.js primitives keep the
 *    R3F module surface to `@react-three/fiber` alone. Two copies of fiber in
 *    one page — which a mid-session Vite dep re-optimize can produce — is what
 *    throws "R3F: Hooks can only be used within the Canvas component!", since
 *    Canvas writes the store into one module instance and useFrame reads the
 *    other. Fewer packages in that graph, fewer ways to end up with two.
 * 2. An error boundary. This layer is decorative; nothing it renders is worth a
 *    blank route. Any throw inside the canvas subtree drops the background and
 *    leaves the page intact.
 * 3. Pointer events forced off, on the wrapper and on R3F's own container.
 *    R3F re-enables pointer events and sets `touch-action: none` on the
 *    elements it creates, so a full-viewport canvas can absorb wheel and
 *    trackpad gestures aimed at the page behind it.
 */

const PARTICLE_COUNT = 300;
const FIELD_SPREAD = 10;

export interface DecorativeParticleFieldProps {
  isVisible: boolean;
  /** Point color. Defaults to the Aurora primary. */
  color?: string;
  /** Point opacity — the only per-surface variation that existed before. */
  opacity?: number;
  /** Seconds-scaled rotation rate on each axis; negative reverses. */
  spin?: { x: number; y: number };
  /** Marks the layer in the DOM for debugging which surface owns it. */
  surface: string;
}

function Field({
  color,
  opacity,
  spin,
}: Required<Pick<DecorativeParticleFieldProps, 'color' | 'opacity' | 'spin'>>) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const p = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      p[i] = (Math.random() - 0.5) * FIELD_SPREAD;
    }
    return p;
  }, []);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * spin.x;
    ref.current.rotation.y += delta * spin.y;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={opacity}
      />
    </points>
  );
}

/**
 * A ResizeObserver stand-in for R3F's measurement hook.
 *
 * `<Canvas>` measures its container with react-use-measure, which is a
 * ResizeObserver underneath, and only initialises the renderer once that
 * measurement is non-zero. Inside this app's frame the observer never delivers
 * a single entry — verified directly: a fresh `ResizeObserver` on the canvas
 * container, itself a correctly sized 1440×900 element, receives zero callbacks
 * where the spec requires an initial one. It is the same caveat the HR Next
 * toolbar and the Projection Matrix already carry about their own measurements.
 *
 * So the field never initialised at all: the canvas sat at its 300×150 HTML
 * default in the corner of a full-viewport container, which is what read as a
 * missing 3D layer.
 *
 * react-use-measure ignores the entries it is handed and re-measures with
 * `getBoundingClientRect` itself, so this only has to invoke the callback at
 * the right moments. It already listens for window resizes on its own; what it
 * lacks without a working observer is the initial measurement and anything that
 * changes layout without a window resize.
 */
class ViewportResizeObserver implements ResizeObserver {
  private readonly targets = new Set<Element>();
  private readonly callback: () => void;
  private pending = 0;
  private timers: number[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = () => callback([], this);
  }

  /**
   * Timers rather than `requestAnimationFrame`, deliberately.
   *
   * rAF is exactly what is unavailable in the case this class exists to cover:
   * a tab the browser is not painting stops running animation frames, and the
   * resize-observation step rides the same frame lifecycle — which is why the
   * native observer delivers nothing there either. An rAF-based fallback would
   * be broken in precisely the situation it is meant to rescue. `setTimeout`
   * keeps running, so the canvas gets its size whether or not the tab is being
   * painted, and is correctly sized the moment it becomes visible.
   */
  private schedule = () => {
    if (this.pending !== 0) return;
    this.pending = window.setTimeout(() => {
      this.pending = 0;
      if (this.targets.size > 0) this.callback();
    }, 0);
  };

  observe(target: Element): void {
    this.targets.add(target);
    if (this.targets.size === 1) {
      window.addEventListener('resize', this.schedule);
      window.addEventListener('orientationchange', this.schedule);
    }
    // The container measures zero on the first layout pass, so measure again
    // once layout has settled.
    this.schedule();
    this.timers.push(
      window.setTimeout(this.schedule, 120),
      window.setTimeout(this.schedule, 400),
    );
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
    window.clearTimeout(this.pending);
    this.pending = 0;
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
    window.removeEventListener('resize', this.schedule);
    window.removeEventListener('orientationchange', this.schedule);
  }
}

/**
 * Sizes the canvas from its container, and keeps the WebGL context alive across
 * route changes.
 *
 * R3F measures its container with `react-use-measure`, which is a
 * ResizeObserver underneath. That observer does not deliver entries inside this
 * app's route frame — the same caveat the HR Next toolbar and the Projection
 * Matrix both carry about their own measurements. The consequence here was
 * worse than a stale number: with no measurement the canvas never left its
 * 300×150 HTML default while its container was the full 1440×900 viewport, so
 * the ambient field was a speck in the top-left corner behind an opaque page
 * and read as simply missing.
 *
 * `setSize` is R3F's own API and updates the camera aspect with the drawing
 * buffer, so driving it from a plain `resize` listener is a supported path
 * rather than a workaround around the renderer.
 *
 * The context handlers matter for the same reason the canvas is mounted once at
 * the shell: a browser that drops the WebGL context — GPU pressure, a
 * backgrounded tab, a driver reset — otherwise leaves a permanently blank layer
 * that only a reload fixes, since nothing remounts it on navigation any more.
 */
function CanvasLifecycle() {
  const gl = useThree((state) => state.gl);
  const setSize = useThree((state) => state.setSize);
  const setDpr = useThree((state) => state.setDpr);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const element = gl.domElement;

    const syncSize = () => {
      const parent = element.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      if (width > 0 && height > 0) setSize(width, height);
    };

    syncSize();
    // The container can still measure zero on the first layout pass, so take a
    // second reading once layout has settled. Timers rather than rAF, for the
    // same reason ViewportResizeObserver uses them.
    const settle = window.setTimeout(syncSize, 250);

    const handleLost = (event: Event) => {
      // Preventing the default is what makes the context restorable at all;
      // without it the browser never fires `webglcontextrestored`.
      event.preventDefault();
    };

    const handleRestored = () => {
      setDpr(Math.min(2, Math.max(1, window.devicePixelRatio || 1)));
      syncSize();
      invalidate();
    };

    window.addEventListener('resize', syncSize);
    window.addEventListener('orientationchange', syncSize);
    element.addEventListener('webglcontextlost', handleLost as EventListener);
    element.addEventListener('webglcontextrestored', handleRestored);

    // An observer is attached too, so the sizing stays live wherever the
    // platform does deliver it.
    const parent = element.parentElement;
    const observer =
      parent && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncSize) : null;
    if (parent) observer?.observe(parent);

    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('orientationchange', syncSize);
      element.removeEventListener('webglcontextlost', handleLost as EventListener);
      element.removeEventListener('webglcontextrestored', handleRestored);
      observer?.disconnect();
    };
  }, [gl, setSize, setDpr, invalidate]);

  return null;
}

interface BoundaryState {
  failed: boolean;
}

/**
 * Drops the decorative layer instead of the page. Renders nothing on failure —
 * there is no fallback worth showing for a background.
 */
class DecorativeLayerBoundary extends Component<{ surface: string; children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.warn(
        `[DecorativeParticleField] ${this.props.surface} background disabled after a render error; page is unaffected.`,
        error,
      );
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** True when the browser can actually give us a WebGL context. */
function canRenderWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Tracks tab visibility so the canvas can stop rendering while hidden.
 *
 * Browsers already starve rAF in a backgrounded tab, but that only stalls the
 * loop — R3F keeps its scheduler armed and resumes with a large accumulated
 * delta, which snaps the field forward on return. Flipping `frameloop` to
 * `never` stops the loop outright and makes the resume continuous.
 */
function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return visible;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function DecorativeParticleField({
  isVisible,
  color = '#00d9a0',
  opacity = 0.4,
  spin = { x: -0.1, y: -0.067 },
  surface,
}: DecorativeParticleFieldProps) {
  const documentVisible = useDocumentVisible();

  // Both checks are environment-stable for the life of the page, so reading
  // them during render costs nothing and avoids a first frame that mounts a
  // canvas only to tear it down. The hook above runs first — this early return
  // must never sit above a hook call.
  if (!isVisible || prefersReducedMotion() || !canRenderWebGL()) return null;

  return (
    <DecorativeLayerBoundary surface={surface}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen overflow-hidden opacity-60 mix-blend-screen"
        style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
        aria-hidden="true"
        data-decorative-layer={surface}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ alpha: true, antialias: false, failIfMajorPerformanceCaveat: false }}
          dpr={[1, 2]}
          // Without this the renderer is never configured at all in this frame:
          // R3F waits for a non-zero measurement and the native observer never
          // reports one. See ViewportResizeObserver above.
          resize={{ polyfill: ViewportResizeObserver, debounce: 0, scroll: false }}
          // Hard-stops the render loop while the tab is backgrounded, rather
          // than leaving it to the browser's rAF throttling.
          frameloop={documentVisible ? 'always' : 'never'}
          style={{ pointerEvents: 'none', touchAction: 'auto' }}
          onCreated={({ gl }) => {
            const parent = gl.domElement.parentElement;
            if (parent) {
              parent.style.pointerEvents = 'none';
              parent.style.touchAction = 'auto';
            }
            gl.domElement.style.pointerEvents = 'none';
            gl.domElement.style.touchAction = 'auto';
          }}
        >
          <CanvasLifecycle />
          <Field color={color} opacity={opacity} spin={spin} />
        </Canvas>
      </div>
    </DecorativeLayerBoundary>
  );
}
