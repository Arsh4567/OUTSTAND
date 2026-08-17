import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type FieldData = {
  particles: Float32Array;
  connections: Float32Array;
};

function createField(): FieldData {
  const count = 150;
  const particles = new Float32Array(count * 3);
  const connectionCount = 42;
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

function IntelligenceField() {
  const group = useRef<THREE.Group>(null);
  const data = useMemo(createField, []);

  useFrame((state, delta) => {
    if (!group.current) return;

    const targetY = state.pointer.x * 0.08;
    const targetX = -state.pointer.y * 0.045;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.035);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.035);
    group.current.rotation.z += delta * 0.008;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#7eeeff"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.48}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.connections, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#4ddffb" transparent opacity={0.075} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

function Core() {
  const group = useRef<THREE.Group>(null);
  const innerRing = useRef<THREE.Mesh>(null);
  const outerRing = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.045;
    if (innerRing.current) innerRing.current.rotation.z += delta * 0.22;
    if (outerRing.current) outerRing.current.rotation.x -= delta * 0.12;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshBasicMaterial color="#8cf3ff" wireframe transparent opacity={0.26} />
      </mesh>
      <mesh scale={0.68}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#dffcff" transparent opacity={0.72} />
      </mesh>
      <mesh ref={innerRing} rotation={[Math.PI / 2.4, 0.15, 0]}>
        <torusGeometry args={[1.45, 0.014, 6, 96]} />
        <meshBasicMaterial color="#5de7ff" transparent opacity={0.42} />
      </mesh>
      <mesh ref={outerRing} rotation={[0.6, 0.8, 0.2]}>
        <torusGeometry args={[1.78, 0.009, 6, 96]} />
        <meshBasicMaterial color="#8da6ff" transparent opacity={0.24} />
      </mesh>
      <pointLight color="#45dcff" intensity={7} distance={7} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.16} />
      <pointLight position={[3, 2, 4]} color="#65eaff" intensity={4} distance={10} />
      <IntelligenceField />
      <Core />
    </>
  );
}

export function CinematicScene() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#02040b]" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.15),transparent_25%),radial-gradient(circle_at_18%_30%,rgba(79,70,229,0.11),transparent_28%),radial-gradient(circle_at_84%_64%,rgba(6,182,212,0.09),transparent_28%)]" />
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 6.2], fov: 44 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(2,4,11,0.3)_68%,rgba(2,4,11,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,4,11,0.04),rgba(2,4,11,0.14)_42%,#02040b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#02040b] to-transparent" />
    </div>
  );
}
