import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  getPerformanceProfile,
  useElementVisibility,
  usePageVisibility,
  useReducedMotion,
} from "@/lib/performance";

type PathPoint = [number, number, number];

const AMBER = new THREE.Color("#fbbf24");
const GOLD = new THREE.Color("#fde68a");
const VIOLET = new THREE.Color("#8b5cf6");
const SKY = new THREE.Color("#a5b4fc");

function createMountainGeometry(points: number, radius: number, yScale: number) {
  const positions = new Float32Array(points * points * 3);
  const step = (radius * 2) / (points - 1);

  for (let z = 0; z < points; z += 1) {
    for (let x = 0; x < points; x += 1) {
      const px = -radius + x * step;
      const pz = -radius + z * step;
      const ridge = Math.max(0, 1 - Math.abs(px) / radius);
      const noise =
        Math.sin(px * 0.95 + pz * 0.65) * 0.32 +
        Math.cos(px * 0.42 - pz * 1.1) * 0.22 +
        Math.sin((px + pz) * 0.28) * 0.18;
      const height = (0.25 + ridge * 0.75 + noise) * yScale;
      const i = (z * points + x) * 3;
      positions[i] = px;
      positions[i + 1] = Math.max(0, height);
      positions[i + 2] = pz;
    }
  }

  return { positions, points, radius };
}

function RoadmapPath() {
  const points = useMemo<PathPoint[]>(
    () => [
      [-4.2, 0.1, 2.4],
      [-3.35, 0.16, 1.55],
      [-2.4, 0.18, 1.0],
      [-1.25, 0.22, 0.55],
      [-0.25, 0.25, -0.2],
      [0.9, 0.34, -0.8],
      [1.9, 0.45, -1.35],
      [2.9, 0.62, -1.65],
      [3.8, 0.9, -2.0],
    ],
    [],
  );
  const positions = useMemo(() => new Float32Array(points.flat()), [points]);
  const particles = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 42 }, (_, index) => {
          const t = index / 41;
          const point = points[Math.floor(t * (points.length - 1))];
          const jitter = (Math.random() - 0.5) * 0.18;
          return [point[0] + jitter, point[1] + 0.05 + Math.random() * 0.18, point[2] + jitter];
        }).flat(),
      ),
    [points],
  );
  const glow = useRef<THREE.LineBasicMaterial>(null);
  const pointMaterial = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    const pulse = 0.72 + Math.sin(clock.elapsedTime * 2.1) * 0.16;
    if (glow.current) glow.current.opacity = pulse;
    if (pointMaterial.current) pointMaterial.current.opacity = Math.min(1, pulse + 0.08);
  });

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={glow}
          color="#fbbf24"
          transparent
          opacity={0.85}
          linewidth={2}
          blending={THREE.AdditiveBlending}
        />
      </line>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointMaterial}
          color="#fde68a"
          size={0.085}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function MountainRange() {
  const near = useMemo(() => createMountainGeometry(34, 5.7, 2.5), []);
  const far = useMemo(() => createMountainGeometry(28, 7.2, 1.8), []);

  return (
    <group position={[0, -1.1, -1.1]}>
      <mesh geometry={new THREE.BufferGeometry()} position={[0, 0, -0.7]}>
        <planeGeometry args={[13, 5]} />
        <meshBasicMaterial color="#090d1a" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0, -0.8]}>
        <planeGeometry args={[12.8, 6.2]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0, -2.2]}>
        <planeGeometry args={[15, 7]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, -0.1, -1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 10]} />
        <meshBasicMaterial color="#0a1020" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, -0.2, -0.25]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[near.positions, 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#1f2937" wireframe transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, -0.35, -2.5]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[far.positions, 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#334155" wireframe transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

function OverlookAndPerson() {
  const body = useMemo(() => new THREE.Group(), []);
  const figure = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!figure.current) return;
    figure.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.012;
  });

  return (
    <group>
      <group ref={figure} position={[0.05, -0.02, 2.1]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.68, 0]}>
          <capsuleGeometry args={[0.19, 0.52, 8, 12]} />
          <meshStandardMaterial color="#111827" roughness={0.82} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#0b1020" roughness={0.72} />
        </mesh>
        <mesh position={[-0.12, 0.7, 0]} rotation={[0, 0, -0.18]}>
          <capsuleGeometry args={[0.05, 0.42, 6, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.86} />
        </mesh>
        <mesh position={[0.12, 0.7, 0]} rotation={[0, 0, 0.18]}>
          <capsuleGeometry args={[0.05, 0.42, 6, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.86} />
        </mesh>
        <mesh position={[-0.09, 0.26, 0]}>
          <capsuleGeometry args={[0.06, 0.55, 6, 10]} />
          <meshStandardMaterial color="#111827" roughness={0.88} />
        </mesh>
        <mesh position={[0.09, 0.26, 0]}>
          <capsuleGeometry args={[0.06, 0.55, 6, 10]} />
          <meshStandardMaterial color="#111827" roughness={0.88} />
        </mesh>
      </group>

      <mesh position={[0, -0.32, 1.95]} rotation={[0, 0, 0]}>
        <boxGeometry args={[8.6, 0.18, 2.6]} />
        <meshPhysicalMaterial color="#64748b" transmission={0.82} roughness={0.08} metalness={0.15} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, 0.08, 0.72]}>
        <boxGeometry args={[8.6, 0.08, 0.08]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function DawnLighting() {
  return (
    <>
      <ambientLight intensity={0.45} color="#7c86a8" />
      <directionalLight position={[-4, 5, -4]} intensity={3.6} color="#f59e0b" />
      <directionalLight position={[5, 3, 2]} intensity={1.35} color="#8b5cf6" />
      <pointLight position={[0, 0.8, 1.5]} intensity={3.2} distance={6} color="#fbbf24" />
    </>
  );
}

function AtmosphericFog() {
  return <fog attach="fog" args={["#0b1020", 5, 15]} />;
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const scene = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!scene.current || reducedMotion) return;
    const t = state.clock.elapsedTime / 15;
    const eased = Math.min(1, t);
    const smooth = eased * eased * (3 - 2 * eased);
    scene.current.position.x = smooth * 0.55;
    scene.current.position.y = -smooth * 0.35;
    scene.current.rotation.x = THREE.MathUtils.degToRad(smooth * 3.5);
    scene.current.rotation.y = THREE.MathUtils.degToRad(-smooth * 8.5);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, smooth * 1.55, 0.018);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.2 + smooth * 1.0, 0.018);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 7.6 + smooth * 3.0, 0.018);
    state.camera.lookAt(0.2 + smooth * 0.35, 0.5 + smooth * 0.5, -0.3 - smooth * 1.4);
  });

  return (
    <group ref={scene}>
      <AtmosphericFog />
      <DawnLighting />
      <MountainRange />
      <RoadmapPath />
      <OverlookAndPerson />
    </group>
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
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#05070d] perf-contain"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(245,158,11,0.2),transparent_25%),linear-gradient(180deg,#1a1730_0%,#111827_38%,#05070d_82%)]" />
      <Canvas
        dpr={profile.dpr}
        frameloop={shouldAnimate ? "always" : "never"}
        camera={{ position: [0, 0.9, 7.6], fov: 42 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", depth: true, stencil: false, preserveDrawingBuffer: false }}
        performance={{ min: 0.6, max: 1, debounce: 120 }}
      >
        <Scene reducedMotion={!shouldAnimate} />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(2,4,11,0.12)_58%,rgba(2,4,11,0.72)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#05070d]/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#02040b] via-[#02040b]/72 to-transparent" />
      <div className="absolute left-1/2 top-1/3 h-32 w-2/3 -translate-x-1/2 rounded-full bg-amber-300/10 blur-[85px]" />
      <div className="absolute left-1/2 top-1/2 h-2/3 w-1/2 -translate-x-1/2 rounded-full bg-violet-500/[0.07] blur-[110px]" />
    </div>
  );
}
