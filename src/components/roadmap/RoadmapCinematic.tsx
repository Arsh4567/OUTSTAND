import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

const DURATION = 10_000;
const FIRE_START = 6_000;

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

function Galaxy({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const random = rng(1337);
    const count = reduced ? 1200 : 5200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = Math.pow(random(), 0.62) * 24 + 0.6;
      const arm = Math.floor(random() * 4);
      const angle = arm * (Math.PI / 2) + radius * 0.32 + (random() - 0.5) * 0.72;
      const thickness = (random() - 0.5) * (1.8 + radius * 0.08);
      positions[i * 3] = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * thickness;
      positions[i * 3 + 1] = (random() - 0.5) * (1.3 + radius * 0.045);
      positions[i * 3 + 2] = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * thickness - 8;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [reduced]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (reduced ? 0.006 : 0.018);
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.07) * 0.025;
    if (material.current) material.current.opacity = 0.72 + Math.sin(state.clock.elapsedTime * 1.7) * 0.08;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial ref={material} color="#d9f6ff" size={0.035} sizeAttenuation transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function GalaxyNebula() {
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh position={[0, 0, -17]} scale={[22, 15, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{ uTime: { value: 0 } }} vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`} fragmentShader={`varying vec2 vUv; uniform float uTime; float blob(vec2 p,vec2 c,float s){return exp(-dot((p-c)/s,(p-c)/s));} void main(){vec2 p=vUv-.5;float r=length(p);float arms=0.0;for(float i=0.0;i<4.0;i++){float a=atan(p.y,p.x)+i*1.5708;float spiral=sin(a+r*18.0-uTime*.12)*.5+.5;arms+=spiral*exp(-r*5.5);}float core=exp(-r*r*30.0);float glow=core*.9+arms*.12+blob(p,vec2(.18,-.08),.28)*.08;vec3 c=mix(vec3(.03,.16,.38),vec3(.24,.06,.55),arms);c+=vec3(.18,.62,1.0)*core*.9;gl_FragColor=vec4(c,glow*.42);}`} />
    </mesh>
  );
}

function Fire({ visible, reduced }: { visible: boolean; reduced: boolean }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const random = rng(9001);
    const count = reduced ? 900 : 3000;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const y = random() * 9 - 3.8;
      const width = Math.max(0.18, 2.5 * (1 - (y + 3.8) / 12));
      positions[i * 3] = (random() - 0.5) * width;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (random() - 0.5) * 3.2;
      seeds[i] = random();
      sizes[i] = 0.45 + random() * 1.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [reduced]);

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
      material.current.uniforms.uVisible.value = THREE.MathUtils.damp(material.current.uniforms.uVisible.value, visible ? 1 : 0, 5, 1 / 60);
    }
    if (points.current) points.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
  });

  return (
    <points ref={points} geometry={geometry} scale={[1.45, 1, 1]}>
      <shaderMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{ uTime: { value: 0 }, uVisible: { value: 0 } }} vertexShader={`attribute float aSeed; attribute float aSize; uniform float uTime; uniform float uVisible; varying float vLife; varying float vSeed; void main(){vec3 p=position;float phase=uTime*(1.15+aSeed*1.8)+aSeed*30.0;p.x+=sin(phase+p.y*1.7)*(.22+.32*aSeed)*(1.0-(p.y+3.8)/12.0);p.x+=sin(phase*.47)*.18;p.y+=mod(uTime*(1.0+aSeed*.75),5.4);p.y=mod(p.y+3.8,9.2)-3.8;float flicker=.78+.22*sin(phase*1.7);vLife=clamp((p.y+3.8)/8.8,0.0,1.0);vSeed=aSeed;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=(aSize*(1.0+vLife*.9)*flicker)*uVisible*(90.0/-mv.z);gl_Position=projectionMatrix*mv;}`} fragmentShader={`varying float vLife; varying float vSeed; void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.0;float alpha=smoothstep(1.0,.05,d);float hot=smoothstep(.55,.05,d)*(1.0-vLife*.35);vec3 red=vec3(1.0,.08,.015);vec3 orange=vec3(1.0,.34,.025);vec3 gold=vec3(1.0,.86,.22);vec3 c=mix(red,orange,clamp(vLife*1.25,0.0,1.0));c=mix(c,gold,hot*.65);gl_FragColor=vec4(c,alpha*(.6+.4*hot));}`} />
    </points>
  );
}

function World({ fire, reduced }: { fire: boolean; reduced: boolean }) {
  return (
    <Canvas className="absolute inset-0" dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 52 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      <GalaxyNebula />
      <Galaxy reduced={reduced} />
      <Fire visible={fire} reduced={reduced} />
    </Canvas>
  );
}

export function RoadmapCinematic() {
  const reduced = Boolean(useReducedMotion());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(now - started, DURATION);
      setElapsed(next);
      if (next >= DURATION) setDone(true);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const fire = elapsed >= FIRE_START;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#020108] text-white">
      <World fire={fire} reduced={reduced} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(73,184,255,.08),transparent_38%)]" />
      <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,69,0,.34),transparent_48%)]" animate={{ opacity: fire ? [0.35, 0.8, 0.45] : 0 }} transition={{ duration: 1.1, repeat: fire ? Infinity : 0, ease: "easeInOut" }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,.46)_100%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-6 py-7 sm:px-10 sm:py-9">
        <div className="flex items-center gap-3 opacity-75">
          <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-200/25 bg-cyan-100/5"><Sparkles className="h-4 w-4 text-cyan-100" /></div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/65">OUTSTAND</span>
        </div>

        <div className="flex flex-1 items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {!fire ? (
              <motion.div key="galaxy-copy" initial={{ opacity: 0, y: 28, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.12, filter: "blur(18px)" }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="max-w-5xl px-2">
                <p className="text-[clamp(.7rem,1.4vw,.9rem)] font-medium uppercase tracking-[.55em] text-cyan-100/75">There is more in you.</p>
                <h1 className="mt-6 text-[clamp(3.2rem,10vw,9rem)] font-black leading-[.82] tracking-[-.075em] text-white/90 [text-shadow:0_0_34px_rgba(180,235,255,.25),0_0_90px_rgba(70,160,255,.18)]"><span className="block">BECOME</span><span className="block text-cyan-100/80">UNSTOPPABLE.</span></h1>
              </motion.div>
            ) : (
              <motion.div key="fire-copy" initial={{ opacity: 0, y: 46, scale: .94, filter: "blur(14px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} transition={{ duration: .9, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl px-2">
                <p className="text-[clamp(.72rem,1.5vw,.95rem)] font-semibold uppercase tracking-[.6em] text-orange-100/80">Your next chapter starts here</p>
                <h2 className="mt-5 text-[clamp(3.4rem,10.5vw,9.5rem)] font-black leading-[.8] tracking-[-.08em] text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-50 to-orange-300 [text-shadow:0_0_25px_rgba(255,110,30,.48),0_0_90px_rgba(255,60,0,.28)]">SHOW UP.<br />LEVEL UP.<br />OUTSTAND.</h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-h-12" aria-hidden="true" />
      </div>
    </section>
  );
}
