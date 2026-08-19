import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const FIRE_START = 6_000;

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

function StarField({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { width, height } = useThree((state) => state.size);
  const mobile = width < 768;
  const geometry = useMemo(() => {
    const random = rng(2718);
    const count = reduced ? 900 : mobile ? 2400 : 4200;
    const positions = new Float32Array(count * 3);
    const aspect = Math.max(width / Math.max(height, 1), 0.55);
    const spreadX = 17 * aspect;
    const spreadY = 13;
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * spreadX;
      positions[i * 3 + 1] = (random() - 0.5) * spreadY;
      positions[i * 3 + 2] = -2 - random() * 32;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [height, mobile, reduced, width]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (reduced ? 0.001 : 0.004);
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.035) * 0.015;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#dff7ff" size={reduced ? 0.025 : 0.038} sizeAttenuation transparent opacity={0.78} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function GalaxyDisk({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const random = rng(7331);
    const count = reduced ? 900 : 2600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 0.8 + Math.pow(random(), 0.58) * 18;
      const arm = Math.floor(random() * 5);
      const angle = arm * (Math.PI * 2 / 5) + radius * 0.42 + (random() - 0.5) * (0.55 + radius * 0.018);
      const thickness = (random() - 0.5) * (0.45 + radius * 0.11);
      positions[i * 3] = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * thickness;
      positions[i * 3 + 1] = (random() - 0.5) * (0.5 + radius * 0.035);
      positions[i * 3 + 2] = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * thickness - 11;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [reduced]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (reduced ? 0.004 : 0.012);
    ref.current.rotation.x = -0.2 + Math.sin(state.clock.elapsedTime * 0.08) * 0.025;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#bfefff" size={reduced ? 0.035 : 0.055} sizeAttenuation transparent opacity={0.82} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Nebula() {
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh position={[0, 0, -25]} scale={[38, 30, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={`varying vec2 vUv;uniform float uTime;float soft(vec2 p,vec2 c,float s){vec2 q=(p-c)/s;return exp(-dot(q,q));}void main(){vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);float spiral=0.;for(float i=0.;i<5.;i++){float arm=sin(a+i*1.2566+r*20.-uTime*.05)*.5+.5;spiral+=arm*exp(-r*4.8);}float core=exp(-r*r*34.);float cloud=soft(p,vec2(-.2,.12),.42)+soft(p,vec2(.23,-.18),.34);vec3 c=vec3(.015,.05,.14)+vec3(.08,.22,.7)*spiral*.42+vec3(.38,.08,.8)*cloud*.12+vec3(.2,.7,1.)*core*.9;float alpha=(spiral*.13+cloud*.08+core*.36)*smoothstep(.78,.05,r);gl_FragColor=vec4(c,alpha);}`}
      />
    </mesh>
  );
}

function Fire({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const random = rng(9917);
    const count = reduced ? 700 : 1900;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 15;
      positions[i * 3 + 1] = (random() - 0.5) * 18;
      positions[i * 3 + 2] = -2 - random() * 16;
      seeds[i] = random();
      sizes[i] = 0.5 + random() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [reduced]);

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`attribute float aSeed;attribute float aSize;uniform float uTime;varying float vLife;void main(){vec3 p=position;float phase=uTime*(.8+aSeed*1.8)+aSeed*25.;float rise=mod(uTime*(1.0+aSeed*.6)+aSeed*12.,13.);p.y+=rise-6.5;p.y=clamp(p.y,-9.,9.);p.x+=sin(phase+p.y*.9)*(.35+.55*aSeed);p.z+=sin(phase*.63)*.8;vLife=clamp((p.y+8.)/16.,0.,1.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=aSize*(1.+vLife*1.5)*(75./-mv.z);gl_Position=projectionMatrix*mv;}`}
        fragmentShader={`varying float vLife;void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.;float glow=smoothstep(1.,.05,d);float core=smoothstep(.62,.02,d);vec3 red=vec3(1.,.035,.005);vec3 orange=vec3(1.,.28,.015);vec3 gold=vec3(1.,.82,.18);vec3 c=mix(red,orange,vLife);c=mix(c,gold,core*.72);gl_FragColor=vec4(c,glow*(.22+.58*core));}`}
      />
    </points>
  );
}

function World({ fire, reduced }: { fire: boolean; reduced: boolean }) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={reduced ? 1 : [1, 1.25]}
      camera={{ position: [0, 0, 12], fov: 58, near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      frameloop="always"
    >
      <Nebula />
      <StarField reduced={reduced} />
      <GalaxyDisk reduced={reduced} />
      {fire && <Fire reduced={reduced} />}
    </Canvas>
  );
}

export function RoadmapCinematic() {
  const reduced = Boolean(useReducedMotion());
  const [fire, setFire] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFire(true), FIRE_START);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#01020a] text-white">
      <World fire={fire} reduced={reduced} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(85,190,255,.07),transparent_45%)]" />
      <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,60,0,.5),transparent_62%)]" animate={{ opacity: fire ? [0.35, 0.8, 0.45] : 0 }} transition={{ duration: 1.2, repeat: fire ? Infinity : 0, ease: "easeInOut" }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,.32)_100%)]" />

      <div className="relative z-10 flex h-full items-center justify-center px-5 text-center">
        <AnimatePresence mode="wait">
          {!fire ? (
            <motion.h1
              key="galaxy"
              initial={{ opacity: 0, scale: 0.82, filter: "blur(18px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.22, filter: "blur(20px)" }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl text-[clamp(4rem,13vw,11rem)] font-black leading-[0.78] tracking-[-0.09em] text-white/75 mix-blend-screen [text-shadow:0_0_28px_rgba(160,235,255,.72),0_0_90px_rgba(70,140,255,.48)]"
            >
              BECOME
            </motion.h1>
          ) : (
            <motion.h2
              key="fire"
              initial={{ opacity: 0, scale: 0.86, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl text-[clamp(3.1rem,10vw,9rem)] font-black leading-[0.78] tracking-[-0.085em] text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-400 [text-shadow:0_0_24px_rgba(255,125,35,.7),0_0_100px_rgba(255,55,0,.45)]"
            >
              SHOW UP.
              <br />
              LEVEL UP.
              <br />
              OUTSTAND.
            </motion.h2>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
