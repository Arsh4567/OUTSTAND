import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  getPerformanceProfile,
  useElementVisibility,
  usePageVisibility,
  useReducedMotion,
} from "@/lib/performance";

type Props = {
  accent?: string;
  active?: boolean;
  reducedMotion?: boolean;
};

function Scene({ accent, active, reducedMotion }: Required<Props>) {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const count = 96;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 1.65 + Math.random() * 0.55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!group.current || reducedMotion) return;
    const speed = active ? 0.16 : 0.08;
    group.current.rotation.y += delta * speed;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.045;
  });

  return (
    <group ref={group} scale={active ? 1.04 : 0.92}>
      <mesh>
        <icosahedronGeometry args={[1.18, 1]} />
        <meshBasicMaterial
          color={accent}
          wireframe
          transparent
          opacity={active ? 0.32 : 0.18}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.48, 0.012, 6, 56]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={active ? 0.55 : 0.28}
        />
      </mesh>
      <mesh rotation={[0.4, 0.8, 0]}>
        <torusGeometry args={[1.7, 0.008, 6, 56]} />
        <meshBasicMaterial
          color="#a5b4fc"
          transparent
          opacity={active ? 0.3 : 0.14}
        />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={accent}
          size={0.026}
          sizeAttenuation
          transparent
          opacity={active ? 0.62 : 0.34}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export function OutstandCanvas({
  accent = "#67e8f9",
  active = false,
  reducedMotion = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(hostRef);
  const pageVisible = usePageVisibility();
  const prefersReducedMotion = useReducedMotion();
  const [profile, setProfile] = useState(() =>
    getPerformanceProfile(reducedMotion || prefersReducedMotion),
  );

  useEffect(() => {
    setProfile(getPerformanceProfile(reducedMotion || prefersReducedMotion));
  }, [reducedMotion, prefersReducedMotion]);

  const shouldAnimate = visible && pageVisible && !profile.reducedMotion;

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{ contain: "layout paint" }}
    >
      <Canvas
        dpr={profile.dpr}
        frameloop={shouldAnimate ? "always" : "never"}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        performance={{ min: 0.65, max: 1, debounce: 120 }}
      >
        <Scene
          accent={accent}
          active={active}
          reducedMotion={!shouldAnimate || profile.reducedMotion}
        />
      </Canvas>
    </div>
  );
}
