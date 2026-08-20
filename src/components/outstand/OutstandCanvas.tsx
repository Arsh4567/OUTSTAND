import { Canvas, useFrame } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
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

class CanvasGuard extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[OUTSTAND] Decorative canvas disabled after runtime error.", error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function StaticCore({ accent, active }: { accent: string; active: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-cyan-400/[0.06] shadow-[0_0_50px_rgba(34,211,238,.12)]"
        style={{ borderColor: `${accent}55`, opacity: active ? 1 : 0.72 }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/30 blur-[1px]"
        style={{ backgroundColor: `${accent}66` }}
      />
    </div>
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
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    setProfile(getPerformanceProfile(reducedMotion || prefersReducedMotion));
  }, [reducedMotion, prefersReducedMotion]);

  useEffect(() => {
    if (reducedMotion || prefersReducedMotion || typeof window === "undefined") {
      setCanRender3D(false);
      return;
    }

    // This canvas is decorative. Never let a missing/blocked WebGL context become
    // a fatal dependency for the surrounding product UI, especially on mobile or
    // browsers that disable hardware acceleration.
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!desktop) {
      setCanRender3D(false);
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ??
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
      setCanRender3D(Boolean(context));
    } catch {
      setCanRender3D(false);
    }
  }, [prefersReducedMotion, reducedMotion]);

  const shouldAnimate = visible && pageVisible && !profile.reducedMotion;
  const fallback = <StaticCore accent={accent} active={active} />;

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{ contain: "layout paint" }}
    >
      {canRender3D ? (
        <CanvasGuard fallback={fallback}>
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
        </CanvasGuard>
      ) : (
        fallback
      )}
    </div>
  );
}
