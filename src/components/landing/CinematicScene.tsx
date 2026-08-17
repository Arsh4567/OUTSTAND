import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars, TorusKnot } from "@react-three/drei";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function Core() {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
    }
    if (ring.current) {
      ring.current.rotation.z += delta * 0.3;
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.35}>
        <TorusKnot ref={ring} args={[1.05, 0.24, 180, 32, 2, 3]} scale={1.15}>
          <meshStandardMaterial
            color="#65e6ff"
            emissive="#0b75a8"
            emissiveIntensity={2.4}
            metalness={0.82}
            roughness={0.18}
          />
        </TorusKnot>
      </Float>
      <mesh scale={0.72}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#dffbff" transparent opacity={0.82} />
      </mesh>
      <pointLight color="#42ddff" intensity={35} distance={7} />
    </group>
  );
}

export function CinematicScene() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#02040b]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(20,184,255,0.14),transparent_32%),radial-gradient(circle_at_15%_25%,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(6,182,212,0.1),transparent_28%)]" />
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} color="#dffbff" />
        <Core />
        <Sparkles count={90} scale={[9, 6, 6]} size={1.6} speed={0.22} color="#8beaff" />
        <Stars radius={12} depth={5} count={900} factor={1.4} saturation={0} fade speed={0.18} />
      </Canvas>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,4,11,0.08),rgba(2,4,11,0.35)_55%,#02040b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#02040b] to-transparent" />
    </div>
  );
}
