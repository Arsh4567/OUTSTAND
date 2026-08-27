import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PerspectiveCamera } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type Roadmap3DSceneProps = {
  progress: number;
  accent?: "cyan" | "violet";
};

function RoadMesh() {
  const geometry = useMemo(() => {
    const segments = 80;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const z = i * -0.9;
      const t = i / segments;
      const width = 2.2 + t * 7.2;
      const y = -0.4 + Math.sin(t * Math.PI) * 0.08;
      positions.push(-width, y, z, width, y, z);
      uvs.push(0, t, 1, t);
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI * 0.01, 0, 0]}>
      <meshStandardMaterial color="#071525" metalness={0.65} roughness={0.7} />
    </mesh>
  );
}

function RoadLines({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current || reduced) return;
    group.current.children.forEach((child) => {
      child.position.z += delta * 4.2;
      if (child.position.z > 1) child.position.z = -55;
    });
  });
  return (
    <group ref={group} position={[0, -0.33, 0]}>
      {Array.from({ length: 28 }).map((_, index) => (
        <mesh key={index} position={[0, 0, -index * 2.1]} scale={[0.06 + index * 0.008, 1, 0.7]}>
          <boxGeometry args={[1, 0.05, 0.48]} />
          <meshStandardMaterial emissive="#22d3ee" emissiveIntensity={2.6} color="#b9f9ff" />
        </mesh>
      ))}
    </group>
  );
}

function Terrain() {
  const points = useMemo(() => {
    return Array.from({ length: 45 }, (_, index) => {
      const x = -14 + (index % 9) * 3.5;
      const z = -4 - Math.floor(index / 9) * 7;
      const scale = 1 + (index % 3) * 0.5;
      return [x, -1.2 + Math.sin(index) * 0.35, z, scale] as const;
    });
  }, []);
  return (
    <group>
      {points.map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} scale={[scale, scale * (1.5 + (index % 2) * 0.7), scale]}>
          <coneGeometry args={[1, 2.6, 6]} />
          <meshStandardMaterial color={index % 2 ? "#0e2138" : "#102a48"} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Destination({ progress, reduced }: { progress: number; reduced: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ring.current || reduced) return;
    ring.current.rotation.y += delta * 0.35;
    ring.current.rotation.z += delta * 0.18;
  });
  const scale = 0.9 + progress / 240;
  return (
    <Float speed={reduced ? 0 : 1.1} rotationIntensity={reduced ? 0 : 0.1} floatIntensity={reduced ? 0 : 0.25}>
      <group position={[0, 0.4, -18]} scale={scale}>
        <mesh ref={ring}>
          <torusGeometry args={[1.15, 0.09, 16, 64]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={5} metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.45, 2]} />
          <meshStandardMaterial color="#bdf7ff" emissive="#22d3ee" emissiveIntensity={4} metalness={0.35} roughness={0.15} />
        </mesh>
        <pointLight color="#22d3ee" intensity={12} distance={8} />
        <pointLight color="#8b5cf6" intensity={10} distance={6} />
      </group>
    </Float>
  );
}

function SceneContents({ progress, reduced }: { progress: number; reduced: boolean }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.8, 8.5]} fov={46} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 8, 7]} intensity={1.8} color="#cfeaff" />
      <pointLight position={[-6, 1, -7]} intensity={8} color="#22d3ee" />
      <pointLight position={[6, 0, -10]} intensity={7} color="#8b5cf6" />
      <fog attach="fog" args={["#050b15", 9, 46]} />
      <RoadMesh />
      <RoadLines reduced={reduced} />
      <Terrain />
      <Destination progress={progress} reduced={reduced} />
      <Environment preset="night" environmentIntensity={0.45} />
    </>
  );
}

export function Roadmap3DScene({ progress, accent = "cyan" }: Roadmap3DSceneProps) {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.18),transparent_35%),radial-gradient(circle_at_75%_45%,rgba(139,92,246,.12),transparent_30%)] ${accent === "violet" ? "opacity-90" : ""}`} />
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}>
        <SceneContents progress={progress} reduced={reduced} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#06101f] to-transparent" />
    </div>
  );
}
