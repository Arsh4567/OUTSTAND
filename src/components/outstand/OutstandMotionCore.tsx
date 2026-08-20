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
  className?: string;
  accent?: string;
  size?: "sm" | "md" | "lg";
};

function Scene({ accent, reducedMotion }: { accent: string; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(accent), [accent]);
  const secondary = useMemo(() => new THREE.Color("#8da6ff"), []);
  const particles = useMemo(() => {
    const count = 48;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 1.25 + Math.random() * 1.15;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.4;
      data[i * 3] = Math.cos(a) * r;
      data[i * 3 + 1] = y;
      data[i * 3 + 2] = Math.sin(a) * r;
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (root.current) {
      root.current.rotation.y += delta * 0.08;
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, state.pointer.y * -0.025, 0.03);
    }
    if (core.current) {
      const pulse = 1 + Math.sin(t * 1.15) * 0.035;
      core.current.scale.setScalar(pulse);
      core.current.rotation.x += delta * 0.12;
      core.current.rotation.y -= delta * 0.16;
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.22;
    if (ringB.current) ringB.current.rotation.x -= delta * 0.12;
  });

  return (
    <group ref={root}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.46} />
      </mesh>
      <mesh scale={0.45}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e9fcff" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh ref={ringA} rotation={[Math.PI / 2.3, 0.2, 0]}>
        <torusGeometry args={[1.05, 0.012, 5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.62} />
      </mesh>
      <mesh ref={ringB} rotation={[0.4, 0.7, 0.2]}>
        <torusGeometry args={[1.28, 0.008, 5, 48]} />
        <meshBasicMaterial color={secondary} transparent opacity={0.34} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.022} sizeAttenuation transparent opacity={0.42} depthWrite={false} />
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
    console.warn("[OUTSTAND] Decorative 3D scene disabled after runtime error.", error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function StaticCore({ accent, size, className }: { accent: string; size: "sm" | "md" | "lg"; className: string }) {
  const sizes = { sm: "h-24 w-24", md: "h-40 w-40", lg: "h-56 w-56" } as const;
  return (
    <div className={`pointer-events-none relative ${sizes[size]} ${className}`} aria-hidden="true">
      <div className="absolute inset-2 rounded-full border border-cyan-300/20 bg-cyan-400/[0.06] shadow-[0_0_50px_rgba(34,211,238,.12)]" />
      <div className="absolute inset-[24%] rounded-full border border-cyan-200/30" style={{ borderColor: `${accent}55` }} />
      <div className="absolute inset-[40%] rounded-full bg-cyan-200/50 blur-[1px]" style={{ backgroundColor: `${accent}99` }} />
    </div>
  );
}

export function OutstandMotionCore({ className = "", accent = "#67e8f9", size = "md" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(hostRef);
  const pageVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();
  const profile = getPerformanceProfile(reducedMotion);
  const [canRender3D, setCanRender3D] = useState(false);
  const sizes = { sm: "h-24 w-24", md: "h-40 w-40", lg: "h-56 w-56" } as const;
  const shouldAnimate = visible && pageVisible && !reducedMotion;

  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") {
      setCanRender3D(false);
      return;
    }

    // The dashboard previously mounted the WebGL scene even when Tailwind's
    // `hidden lg:block` made it invisible on mobile. Some mobile browsers can
    // throw while creating a WebGL context; a decorative scene must never take
    // down the authenticated application.
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!desktop) {
      setCanRender3D(false);
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false })
        ?? canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
      setCanRender3D(Boolean(context));
      const media = window.matchMedia("(min-width: 1024px)");
      const onChange = () => setCanRender3D(media.matches && Boolean(context));
      media.addEventListener?.("change", onChange);
      return () => media.removeEventListener?.("change", onChange);
    } catch {
      setCanRender3D(false);
    }
  }, [reducedMotion]);

  const fallback = <StaticCore accent={accent} size={size} className={className} />;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none relative ${sizes[size]} ${className}`}
      aria-hidden="true"
      style={{ contain: "layout paint" }}
    >
      <div className="absolute inset-0 rounded-full bg-cyan-400/[0.07] blur-2xl" />
      {!canRender3D ? fallback : (
        <CanvasGuard fallback={fallback}>
          <Canvas
            dpr={profile.dpr}
            frameloop={shouldAnimate ? "always" : "never"}
            camera={{ position: [0, 0, 4.2], fov: 42 }}
            gl={{ antialias: false, alpha: true, powerPreference: "high-performance", depth: true, stencil: false, preserveDrawingBuffer: false }}
            performance={{ min: 0.65, max: 1, debounce: 120 }}
          >
            <Scene accent={accent} reducedMotion={!shouldAnimate} />
          </Canvas>
        </CanvasGuard>
      )}
    </div>
  );
}
