import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Visual Layer decoupled from DOM tree
// Renders an ambient particle field that sits behind the HRNext board
function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const [positions] = React.useState(() => {
    const p = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00d9a0"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

export function HrNextVisualLayer({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div 
      className="pointer-events-none fixed inset-0 -z-10 w-screen h-screen overflow-hidden mix-blend-screen"
      style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 2]}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}
