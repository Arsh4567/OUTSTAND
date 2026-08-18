import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  getPerformanceProfile,
  useElementVisibility,
  usePageVisibility,
  useReducedMotion,
} from "@/lib/performance";

type FieldData = {
  particles: Float32Array;
  connections: Float32Array;
};

function createField(): FieldData {
  const count = 120;
  const particles = new Float32Array(count * 3);
  const connectionCount = 32;
  const connections = new Float32Array(connectionCount * 6);

  for (let i = 0; i < count; i += 1) {
    const radius = 2.8 + Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 5.8;
    particles[i * 3] = Math.cos(theta) * radius;
    particles[i * 3 + 1] = y;
    particles[i * 3 + 2] = Math.sin(theta) * radius - 1.2;
  }

  for (let i = 0; i < connectionCount; i += 1) {
    const a = Math.floor(Math.random() * count);
    const b = Math.floor(Math.random() * count);
    connections.set(particles.slice(a * 3, a * 3 + 3), i * 6);
    connections.set(particles.slice(b * 3, b * 3 + 3), i * 6 + 3);
  }

  return { particles, connections };
}

const PALETTE = [
  new THREE.Color("#67e8f9"),
  new THREE.Color("#60a5fa"),
  new THREE.Color("#818cf8"),
  new THREE.Color("#a78bfa"),
];

function animatedColor(target: THREE.Color, time: number, offset = 0) {
  const wave = (Math.sin(time * 0.28 + offset) + 1) / 2;
  const scaled = wave * (PALETTE.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(index + 1, PALETTE.length - 1);
  target.copy(PALETTE[index]).lerp(PALETTE[next], scaled - index);
  return target;
}

function IntelligenceField({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointsMaterial = useRef<THREE.PointsMaterial>(null);
  const lineMaterial = useRef<THREE.LineBasicMaterial>(null);
  const data = useMemo(createField, []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!group.current || reducedMotion) return;

    const targetY = state.pointer.x * 0.08;
    const targetX = -state.pointer.y * 0.045;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.035);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.035);

    animatedColor(color, state.clock.elapsedTime, 1.8);
    if (pointsMaterial.current) {
      pointsMaterial.current.color.copy(color);
      pointsMaterial.current.opacity = 0.38 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
    }
    if (lineMaterial.current) {
      lineMaterial.current.color.copy(color).multiplyScalar(0.72);
      lineMaterial.current.opacity = 0.055 + Math.sin(state.clock.elapsedTime * 0.55) * 0.018;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMaterial}
          color="#67e8f9"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.connections, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMaterial}
          color="#67e8f9"
          transparent
          opacity={0.06}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

function Core({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const wireMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const innerMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const outerMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const color = useMemo(() => new THREE.Color(), []);
  const softColor = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!group.current || reducedMotion) return;

    const time = state.clock.elapsedTime;
    group.current.rotation.y += delta * 0.1;
    group.current.rotation.x = Math.sin(time * 0.22) * 0.045;

    animatedColor(color, time);
    animatedColor(softColor, time + 1.1);

    coreMaterial.current?.color.copy(color).lerp(new THREE.Color("#ffffff"), 0.48);
    wireMaterial.current?.color.copy(color);
    innerMaterial.current?.color.copy(color);
    outerMaterial.current?.color.copy(softColor);

    const pulse = 0.78 + Math.sin(time * 1.25) * 0.14;
    if (coreMaterial.current) coreMaterial.current.opacity = 0.64 * pulse;
    if (wireMaterial.current) wireMaterial.current.opacity = 0.2 + pulse * 0.08;
    if (innerMaterial.current) innerMaterial.current.opacity = 0.32 + pulse * 0.1;
    if (outerMaterial.current) outerMaterial.current.opacity = 0.16 + pulse * 0.06;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial ref={wireMaterial} color="#67e8f9" wireframe transparent opacity={0.26} />
      </mesh>
      <mesh scale={0.68}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial ref={coreMaterial} color="#eaffff" transparent opacity={0.68} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.15, 0]}>
        <torusGeometry args={[1.45, 0.014, 6, 64]} />
        <meshBasicMaterial ref={innerMaterial} color="#67e8f9" transparent opacity={0.42} />
      </mesh>
      <mesh rotation={[0.6, 0.8, 0.2]}>
        <torusGeometry args={[1.78, 0.009, 6, 64]} />
        <meshBasicMaterial ref={outerMaterial} color="#818cf8" transparent opacity={0.24} />
      </mesh>
    </group>
  );
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <IntelligenceField reducedMotion={reducedMotion} />
      <Core reducedMotion={reducedMotion} />
    </>
  );
}

export function CinematicScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(hostRef);
  const pageVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();
  const profile = getPerformanceProfile(reducedMotion);
  const shouldAnimate = visible && pageVisible && !reducedMotion;

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden perf-contain"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.09),transparent_27%),radial-gradient(circle_at_18%_30%,rgba(79,70,229,0.07),transparent_30%),radial-gradient(circle_at_84%_64%,rgba(6,182,212,0.06),transparent_30%)]" />
      <Canvas
        dpr={profile.dpr}
        frameloop={shouldAnimate ? "always" : "never"}
        camera={{ position: [0, 0, 6.2], fov: 44 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
        }}
        performance={{ min: 0.65, max: 1, debounce: 120 }}
      >
        <Scene reducedMotion={!shouldAnimate} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(2,4,11,0.12)_72%,rgba(2,4,11,0.3)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,4,11,0.02),rgba(2,4,11,0.06)_50%,rgba(2,4,11,0.22)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#02040b]/55 to-transparent" />
    </div>
  );
}
