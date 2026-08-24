import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Collision Field — the spatial evidence layer for the selected candidate.
 *
 * Three deliberate constraints, all inherited from what this codebase already
 * learned about putting R3F on a working page (see DecorativeParticleField):
 *
 * 1. No @react-three/drei. Two copies of @react-three/fiber in one page is what
 *    throws "R3F: Hooks can only be used within the Canvas component!", and a
 *    mid-session Vite dep re-optimize can produce exactly that. Every primitive
 *    here is raw three.js, so the R3F module graph stays a single package.
 * 2. `frameloop="demand"`. The field is static until the pointer moves or the
 *    selection changes, so it renders on invalidation instead of holding a
 *    60fps loop open under a page that already streams live data.
 * 3. `useFrame` is only ever called from components rendered as direct children
 *    of the Canvas below.
 *
 * The geometry is not a simulation. Each axis is one evidence sub-score the
 * board already publishes, drawn to its own normalised length; the node sits at
 * their convergence. Nothing is inferred, and a missing layer is simply not
 * drawn rather than guessed at.
 */

export interface CollisionAxis {
  key: string;
  label: string;
  /** 0–100 board sub-score. Null means the layer is unavailable. */
  value: number | null;
  color: string;
  /** Unit direction in field space. */
  dir: [number, number, number];
}

const AXIS_LENGTH = 1.55;

function norm(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value / 100));
}

/** One evidence vector: a full-length guide plus the filled portion. */
function EvidenceVector({ axis }: { axis: CollisionAxis }) {
  const t = norm(axis.value);
  const dir = useMemo(() => new THREE.Vector3(...axis.dir).normalize(), [axis.dir]);

  const guide = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints([new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(AXIS_LENGTH)]);
    return g;
  }, [dir]);

  const filled = useMemo(() => {
    if (t == null) return null;
    const g = new THREE.BufferGeometry();
    g.setFromPoints([new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(AXIS_LENGTH * t)]);
    return g;
  }, [dir, t]);

  const tip = useMemo(
    () => (t == null ? null : dir.clone().multiplyScalar(AXIS_LENGTH * t)),
    [dir, t],
  );

  return (
    <group>
      <primitive object={new THREE.Line(guide, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1 }))} />
      {filled && (
        <primitive object={new THREE.Line(filled, new THREE.LineBasicMaterial({ color: axis.color, transparent: true, opacity: 0.9 }))} />
      )}
      {tip && (
        <mesh position={tip}>
          <boxGeometry args={[0.07, 0.07, 0.07]} />
          <meshBasicMaterial color={axis.color} />
        </mesh>
      )}
    </group>
  );
}

/** Square reference grid on the field's floor plane. */
function ReferenceGrid() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const half = 1.5;
    for (let i = -3; i <= 3; i += 1) {
      const p = (i / 3) * half;
      pts.push(new THREE.Vector3(-half, -1.05, p), new THREE.Vector3(half, -1.05, p));
      pts.push(new THREE.Vector3(p, -1.05, -half), new THREE.Vector3(p, -1.05, half));
    }
    const g = new THREE.BufferGeometry();
    g.setFromPoints(pts);
    return g;
  }, []);

  return (
    <primitive
      object={new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.06 }))}
    />
  );
}

/**
 * The convergence node plus its projection lines back to each evidence tip.
 * Position is the mean of the available vectors — with one layer missing the
 * node simply resolves against the layers that exist.
 */
function CollisionNode({ axes, verified }: { axes: CollisionAxis[]; verified: boolean }) {
  const present = axes.filter((a) => norm(a.value) != null);

  const point = useMemo(() => {
    if (present.length === 0) return null;
    const v = new THREE.Vector3();
    present.forEach((a) => {
      v.add(new THREE.Vector3(...a.dir).normalize().multiplyScalar(AXIS_LENGTH * (norm(a.value) as number)));
    });
    return v.divideScalar(present.length);
  }, [present]);

  const links = useMemo(() => {
    if (!point) return null;
    const pts: THREE.Vector3[] = [];
    present.forEach((a) => {
      pts.push(point.clone());
      pts.push(new THREE.Vector3(...a.dir).normalize().multiplyScalar(AXIS_LENGTH * (norm(a.value) as number)));
    });
    const g = new THREE.BufferGeometry();
    g.setFromPoints(pts);
    return g;
  }, [point, present]);

  if (!point) return null;
  const nodeColor = verified ? '#31B583' : '#D99C4A';

  return (
    <group>
      {links && (
        <primitive
          object={new THREE.LineSegments(links, new THREE.LineBasicMaterial({ color: nodeColor, transparent: true, opacity: 0.35 }))}
        />
      )}
      <mesh position={point}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshBasicMaterial color={nodeColor} />
      </mesh>
    </group>
  );
}

/**
 * Pointer parallax. A few degrees of tilt, damped, and only while the pointer
 * is over the canvas — never an idle rotation. Reduced motion pins it flat.
 */
function FieldRig({
  children,
  reducedMotion,
}: {
  children: React.ReactNode;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { pointer, invalidate } = useThree();

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const targetY = reducedMotion ? 0.5 : 0.5 + pointer.x * 0.35;
    const targetX = reducedMotion ? 0.28 : 0.28 - pointer.y * 0.2;
    const dy = targetY - g.rotation.y;
    const dx = targetX - g.rotation.x;
    if (Math.abs(dy) < 0.0004 && Math.abs(dx) < 0.0004) return;
    g.rotation.y += dy * 0.12;
    g.rotation.x += dx * 0.12;
    invalidate();
  });

  return <group ref={group}>{children}</group>;
}

export interface HrNextCollisionSceneProps {
  axes: CollisionAxis[];
  verified: boolean;
  reducedMotion: boolean;
}

export function HrNextCollisionScene({ axes, verified, reducedMotion }: HrNextCollisionSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [2.6, 1.9, 2.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ background: 'transparent' }}
    >
      <FieldRig reducedMotion={reducedMotion}>
        <ReferenceGrid />
        {axes.map((axis) => (
          <EvidenceVector key={axis.key} axis={axis} />
        ))}
        <CollisionNode axes={axes} verified={verified} />
      </FieldRig>
    </Canvas>
  );
}

export default HrNextCollisionScene;
