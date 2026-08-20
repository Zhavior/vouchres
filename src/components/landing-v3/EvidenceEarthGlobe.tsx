import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type IntegrityPhase = 1 | 2 | 3 | 4;

type Waypoint = {
  phase: IntegrityPhase;
  lat: number;
  lon: number;
  code: string;
};

const WAYPOINTS: readonly Waypoint[] = [
  { phase: 1, lat: 39.0997, lon: -94.5786, code: 'RESEARCH_SCAN' },
  { phase: 2, lat: 37.7749, lon: -122.4194, code: 'REC_LOCK' },
  { phase: 3, lat: 40.7128, lon: -74.006, code: 'RESULT_LINK' },
  { phase: 4, lat: 34.0522, lon: -118.2437, code: 'LEDGER_KEEP' },
] as const;

const PHASE_CAMERA: Record<IntegrityPhase, THREE.Vector3Tuple> = {
  1: [0.12, 0.05, 4.7],
  2: [-0.22, 0.12, 4.25],
  3: [0.22, -0.08, 4.45],
  4: [-0.12, -0.05, 4.65],
};

const ORBIT_NODE_POSITION: Record<IntegrityPhase, THREE.Vector3Tuple> = {
  1: [-1.82, 0.98, 0.34],
  2: [1.9, 0.7, 0.3],
  3: [1.72, -0.9, 0.38],
  4: [-1.88, -0.72, 0.42],
};

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function focusQuaternionFor(waypoint: Waypoint) {
  const source = latLonToVector3(waypoint.lat, waypoint.lon, 1).normalize();
  const destination = new THREE.Vector3(-0.18, 0.12, 1).normalize();
  return new THREE.Quaternion().setFromUnitVectors(source, destination);
}

const PHASE_FOCUS: Record<IntegrityPhase, THREE.Quaternion> = {
  1: focusQuaternionFor(WAYPOINTS[0]),
  2: focusQuaternionFor(WAYPOINTS[1]),
  3: focusQuaternionFor(WAYPOINTS[2]),
  4: focusQuaternionFor(WAYPOINTS[3]),
};

const PHASE_CAMERA_VECTOR: Record<IntegrityPhase, THREE.Vector3> = {
  1: new THREE.Vector3(...PHASE_CAMERA[1]),
  2: new THREE.Vector3(...PHASE_CAMERA[2]),
  3: new THREE.Vector3(...PHASE_CAMERA[3]),
  4: new THREE.Vector3(...PHASE_CAMERA[4]),
};

const PRIMARY_RING_TILT = new THREE.Euler(0.2, 0.16, -0.15);
const SECONDARY_RING_TILT = new THREE.Euler(1.08, -0.18, 0.55);

function isLand(lat: number, lon: number) {
  const ellipses = [
    [-104, 47, 42, 25, -0.15],
    [-82, 18, 20, 16, 0.2],
    [-61, -17, 18, 34, -0.1],
    [14, 50, 23, 15, 0.05],
    [20, 5, 22, 34, 0.08],
    [74, 40, 58, 25, -0.08],
    [107, 5, 25, 18, 0.2],
    [135, -25, 20, 14, -0.05],
    [-42, 72, 12, 8, 0],
  ] as const;

  return ellipses.some(([centerLon, centerLat, width, height, tilt]) => {
    const dx = (lon - centerLon) / width;
    const dy = (lat - centerLat) / height;
    const x = dx * Math.cos(tilt) - dy * Math.sin(tilt);
    const y = dx * Math.sin(tilt) + dy * Math.cos(tilt);
    return x * x + y * y < 1;
  });
}

function DotMatrixContinents() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const points = useMemo(() => {
    const result: THREE.Vector3[] = [];
    for (let lat = -72; lat <= 78; lat += 3) {
      const longitudeStep = 3 / Math.max(0.28, Math.cos(THREE.MathUtils.degToRad(lat)));
      for (let lon = -180; lon < 180; lon += longitudeStep) {
        if (isLand(lat, lon)) result.push(latLonToVector3(lat, lon, 1.615));
      }
    }
    return result;
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3(0.014, 0.014, 0.014);
    const quaternion = new THREE.Quaternion();
    points.forEach((point, index) => {
      matrix.compose(point, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [points]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]} frustumCulled>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#b9f8ff" transparent opacity={0.62} toneMapped={false} />
    </instancedMesh>
  );
}

function FresnelAtmosphere() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: { glowColor: { value: new THREE.Color('#00F0FF') } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), 2.65);
        gl_FragColor = vec4(glowColor, fresnel * 0.18);
      }
    `,
  }), []);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh scale={1.075}>
      <sphereGeometry args={[1.6, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function DashedOrbit({ tilt, speed, reverse = false }: { tilt: THREE.Euler; speed: number; reverse?: boolean }) {
  const lineRef = useRef<THREE.LineLoop>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(192 * 3);
    for (let index = 0; index < 192; index += 1) {
      const angle = (index / 192) * Math.PI * 2;
      values[index * 3] = Math.cos(angle) * 2.22;
      values[index * 3 + 1] = Math.sin(angle) * 0.72;
      values[index * 3 + 2] = Math.sin(angle) * 0.18;
    }
    return values;
  }, []);

  useEffect(() => {
    lineRef.current?.computeLineDistances();
  }, []);

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    lineRef.current.rotation.z += delta * speed * (reverse ? -1 : 1);
  });

  return (
    <lineLoop ref={lineRef} rotation={tilt}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineDashedMaterial color="#55e9f7" transparent opacity={0.25} dashSize={0.11} gapSize={0.085} depthWrite={false} />
    </lineLoop>
  );
}

function WaypointNode({ waypoint, active, onSelect }: { waypoint: Waypoint; active: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const nodeRef = useRef<THREE.Mesh>(null);
  const position = ORBIT_NODE_POSITION[waypoint.phase];

  useFrame(({ clock }) => {
    if (!nodeRef.current || !active) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 5.5) * 0.16;
    nodeRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={position}>
      <mesh
        ref={nodeRef}
        onClick={(event) => { event.stopPropagation(); onSelect(); }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[active ? 0.065 : 0.045, 16, 16]} />
        <meshBasicMaterial color={active ? '#67e8f9' : '#667078'} toneMapped={false} />
      </mesh>
      {active && <pointLight color="#00F0FF" intensity={2.4} distance={0.8} decay={2} />}
      <Html center distanceFactor={7.5} zIndexRange={[12, 0]}>
        <button
          type="button"
          className={active ? 've-earthNodeLabel is-active' : 've-earthNodeLabel'}
          onClick={onSelect}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={`Phase 0${waypoint.phase} waypoint`}
        >
          0{waypoint.phase}
        </button>
        {active && <span className="ve-earthReticle" aria-hidden="true"><i /><i /><i /><i /></span>}
        {hovered && (
          <span className="ve-earthTooltip" role="tooltip">
            LAT: {Math.abs(waypoint.lat).toFixed(4)}° {waypoint.lat >= 0 ? 'N' : 'S'}, LON: {Math.abs(waypoint.lon).toFixed(4)}° {waypoint.lon >= 0 ? 'E' : 'W'} // {waypoint.code}
          </span>
        )}
      </Html>
    </group>
  );
}

function GlobeScene({ active, onSelect, reduceMotion }: { active: IntegrityPhase; onSelect: (phase: IntegrityPhase) => void; reduceMotion: boolean }) {
  const globeRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const [autoRotate, setAutoRotate] = useState(!reduceMotion);
  const resumeTimer = useRef<number | undefined>(undefined);
  const userControlRef = useRef(false);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  useEffect(() => {
    if (spinRef.current) spinRef.current.rotation.y = 0;
    userControlRef.current = false;
  }, [active]);

  useEffect(() => () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    document.body.style.cursor = '';
  }, []);

  useFrame((_, delta) => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.quaternion.slerp(PHASE_FOCUS[active], 1 - Math.exp(-delta * 3.2));

    if (autoRotate && !reduceMotion && spinRef.current) spinRef.current.rotation.y += delta * 0.055;

    if (!userControlRef.current) {
      camera.position.lerp(PHASE_CAMERA_VECTOR[active], 1 - Math.exp(-delta * 2.6));
      camera.lookAt(0, 0, 0);
    }
  });

  const pauseAutoRotation = () => {
    userControlRef.current = true;
    setAutoRotate(false);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  };

  const scheduleAutoRotation = () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      userControlRef.current = false;
      setAutoRotate(!reduceMotion);
    }, 3000);
  };

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[4.5, 5.5, 5]} intensity={1.55} color="#dffcff" />
      <pointLight position={[-3, -2, 2]} intensity={0.3} color="#00F0FF" />

      <group ref={globeRef}>
        <group ref={spinRef}>
          <mesh>
            <sphereGeometry args={[1.6, 96, 96]} />
            <meshStandardMaterial color="#0d1117" roughness={0.74} metalness={0.22} />
          </mesh>
          <mesh scale={1.002}>
            <sphereGeometry args={[1.6, 42, 42]} />
            <meshBasicMaterial color="#83dfe8" wireframe transparent opacity={0.075} depthWrite={false} />
          </mesh>
          <DotMatrixContinents />
          <FresnelAtmosphere />
        </group>
      </group>

      <DashedOrbit tilt={PRIMARY_RING_TILT} speed={0.045} />
      <DashedOrbit tilt={SECONDARY_RING_TILT} speed={0.035} reverse />
      {WAYPOINTS.map((waypoint) => (
        <WaypointNode key={waypoint.phase} waypoint={waypoint} active={active === waypoint.phase} onSelect={() => onSelect(waypoint.phase)} />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.48}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        onStart={pauseAutoRotation}
        onEnd={scheduleAutoRotation}
      />
    </>
  );
}

export default function EvidenceEarthGlobe({
  active,
  onSelect,
  reduceMotion,
}: {
  active: IntegrityPhase;
  onSelect: (phase: IntegrityPhase) => void;
  reduceMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '160px', threshold: 0.01 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="ve-integrityJourney__canvas bg-black" data-render-state={inView ? 'active' : 'paused'}>
      <Canvas
        frameloop={inView && !reduceMotion ? 'always' : 'demand'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor('#000000', 1)}
        camera={{ position: PHASE_CAMERA[active], fov: 42, near: 0.1, far: 100 }}
        fallback={<div className="ve-integrityJourney__canvasFallback">3D EVIDENCE WORLD UNAVAILABLE</div>}
      >
        <GlobeScene active={active} onSelect={onSelect} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
