import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, RotateCcw, Sparkles } from "lucide-react";

const SCENE_LENGTH = 10_000;
const FIRE_START = 6_000;

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function StarField({ reduced }: { reduced: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const random = seededRandom(42);
    const count = reduced ? 900 : 3200;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const radius = 5 + Math.pow(random(), 0.55) * 18;
      const theta = random() * Math.PI * 2;
      const vertical = (random() - 0.5) * 11;
      const spiral = theta + radius * 0.28;
      positions[i * 3] = Math.cos(spiral) * radius + (random() - 0.5) * 2.5;
      positions[i * 3 + 1] = vertical + Math.sin(radius * 0.42) * 0.8;
      positions[i * 3 + 2] = Math.sin(spiral) * radius - 5;
      sizes[i] = 0.45 + random() * 1.9;
    }
    return { positions, sizes };
  }, [reduced]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * (reduced ? 0.004 : 0.012);
    pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.025;
    if (materialRef.current) {
      materialRef.current.opacity = 0.72 + Math.sin(state.clock.elapsedTime * 1.6) * 0.08;
      materialRef.current.size = 0.026 + Math.sin(state.clock.elapsedTime * 1.25) * 0.004;
    }
  });

  return (
    <points ref={pointsRef} geometry={(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(geometry.positions, 3)); return g; })()}>
      <pointsMaterial ref={materialRef} color="#e8f7ff" size={0.028} sizeAttenuation transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function GalaxyCore({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * (reduced ? 0.006 : 0.018);
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.11) * 0.06;
  });
  return (
    <group ref={group} position={[0, 0, -9]}>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#bcefff" transparent opacity={0.11} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 2.15, 0.2, 0.3]}>
        <torusGeometry args={[2.2, 0.06, 16, 160]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.7, 0]}>
        <torusGeometry args={[3.1, 0.035, 12, 180]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.14} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function FireField({ visible, reduced }: { visible: boolean; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const random = seededRandom(777);
    const count = reduced ? 550 : 1500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const t = random();
      const y = t * 7 - 2.8;
      const width = (1 - t) * 1.9 + 0.18;
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 0.6) * width;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (random() - 0.5) * 2.4 + Math.sin(t * Math.PI) * 0.35;
    }
    return positions;
  }, [reduced]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.08;
    const material = ref.current.material as THREE.PointsMaterial;
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 7) * 0.1;
    material.opacity = visible ? pulse : 0;
    material.size = visible ? 0.075 + Math.sin(state.clock.elapsedTime * 8) * 0.008 : 0;
    ref.current.position.y = -0.35 + Math.sin(state.clock.elapsedTime * 2.2) * 0.04;
  });

  const g = useMemo(() => {
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(geometry, 3));
    return next;
  }, [geometry]);

  return (
    <points ref={ref} geometry={g}>
      <pointsMaterial color="#ff7a18" size={0.08} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function CinematicWorld({ showFire, reduced }: { showFire: boolean; reduced: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.5, 12], fov: 55, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
      className="absolute inset-0"
    >
      <color attach="background" args={["#010208"]} />
      <fog attach="fog" args={["#010208", 12, 38]} />
      <ambientLight intensity={0.08} />
      <StarField reduced={reduced} />
      <GalaxyCore reduced={reduced} />
      <FireField visible={showFire} reduced={reduced} />
    </Canvas>
  );
}

function playCue(audioContext: AudioContext, kind: "swell" | "impact" | "finish") {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(kind === "swell" ? 900 : 2200, now);
  oscillator.type = kind === "finish" ? "sine" : "triangle";

  if (kind === "swell") {
    oscillator.frequency.setValueAtTime(75, now);
    oscillator.frequency.exponentialRampToValueAtTime(220, now + 1.8);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
  } else if (kind === "impact") {
    oscillator.frequency.setValueAtTime(72, now);
    oscillator.frequency.exponentialRampToValueAtTime(38, now + 0.7);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
  } else {
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(520, now + 1.15);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
  }

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 2.1);
}

export function RoadmapCinematic({ onEnter }: { onEnter?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const cueRef = useRef<string>("");

  const enableSound = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const context = audioRef.current ?? new AudioCtor();
    audioRef.current = context;
    if (context.state === "suspended") void context.resume();
    setSoundOn(true);
  }, []);

  const replay = useCallback(() => {
    setElapsed(0);
    setRunning(true);
    cueRef.current = "";
    if (soundOn && audioRef.current) playCue(audioRef.current, "swell");
  }, [soundOn]);

  useEffect(() => {
    if (!running) return;
    const started = performance.now() - elapsed;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(now - started, SCENE_LENGTH);
      setElapsed(next);
      if (soundOn && audioRef.current) {
        if (next >= 0 && cueRef.current !== "start") {
          cueRef.current = "start";
          playCue(audioRef.current, "swell");
        }
        if (next >= FIRE_START && cueRef.current !== "fire") {
          cueRef.current = "fire";
          playCue(audioRef.current, "impact");
        }
        if (next >= SCENE_LENGTH - 100 && cueRef.current !== "finish") {
          cueRef.current = "finish";
          playCue(audioRef.current, "finish");
        }
      }
      if (next < SCENE_LENGTH) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, soundOn]);

  useEffect(() => () => { void audioRef.current?.close(); }, []);

  const showFire = elapsed >= FIRE_START;
  const progress = Math.min(100, (elapsed / SCENE_LENGTH) * 100);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#010208] text-white">
      <CinematicWorld showFire={showFire} reduced={Boolean(reduceMotion)} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,.08),transparent_32%),radial-gradient(circle_at_50%_78%,rgba(255,87,34,.10),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(0,0,0,.82)_100%)]" />
      <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,90,20,.22),transparent_62%)]" animate={{ opacity: showFire ? [0.35, 0.72, 0.45] : 0 }} transition={{ duration: 1.2, repeat: showFire ? Infinity : 0, ease: "easeInOut" }} />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-8 pt-6 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] shadow-[0_0_30px_rgba(34,211,238,.12)]"><Sparkles className="h-4 w-4 text-cyan-200" /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Outstand</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">The Masterpiece</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={soundOn ? () => setSoundOn(false) : enableSound} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/20 text-slate-300 backdrop-blur-md transition hover:border-cyan-300/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label={soundOn ? "Mute cinematic sound" : "Enable cinematic sound"}>{soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
            <button type="button" onClick={replay} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/20 text-slate-300 backdrop-blur-md transition hover:border-cyan-300/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Replay cinematic"><RotateCcw className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {!showFire ? (
              <motion.div key="galaxy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08, filter: "blur(16px)" }} transition={{ duration: 0.8 }} className="max-w-4xl">
                <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8 }} className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-200/70 sm:text-xs">A new chapter is forming</motion.p>
                <motion.div aria-hidden initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: [0.92, 1.02, 0.96], opacity: [0.2, 0.55, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mt-8 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
                <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1, ease: [0.22, 1, 0.36, 1] }} className="mt-[-4rem] text-[clamp(3rem,9vw,8rem)] font-black leading-[0.88] tracking-[-0.06em]">You kept going.</motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.15, duration: 0.8 }} className="mx-auto mt-7 max-w-xl text-sm font-medium leading-7 text-slate-400 sm:text-base">Now watch what happens when consistency becomes part of who you are.</motion.p>
              </motion.div>
            ) : (
              <motion.div key="fire" initial={{ opacity: 0, scale: 0.92, filter: "blur(18px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }} className="relative max-w-5xl px-3">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-200/80 sm:text-xs">ROADMAP COMPLETE</p>
                <h1 className="mt-5 text-[clamp(2.9rem,8.5vw,7.8rem)] font-black leading-[0.86] tracking-[-0.065em] text-white drop-shadow-[0_0_35px_rgba(255,110,30,.18)]">YOU BECAME<br />THE PERSON<br /><span className="text-orange-100">WHO SHOWED UP.</span></h1>
                <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }} className="mx-auto mt-7 max-w-2xl text-sm font-semibold leading-7 text-slate-200/80 sm:text-base">Energy. Focus. Learning. Discipline. Not perfection — proof that you can keep your word to yourself.</motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="space-y-4">
          <div className="flex items-center gap-3"><div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full origin-left bg-gradient-to-r from-cyan-300 via-blue-400 to-orange-400" style={{ width: `${progress}%` }} /></div><span className="w-9 text-right font-mono text-[9px] font-bold text-slate-500">0:{Math.ceil(elapsed / 1000).toString().padStart(2, "0")}</span></div>
          <div className="flex items-center justify-between gap-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">10 seconds · galaxy → fire → next chapter</p><AnimatePresence>{!running && <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={onEnter} type="button" className="group inline-flex items-center gap-2 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-orange-100 shadow-[0_0_35px_rgba(255,110,30,.12)] transition hover:border-orange-300/40 hover:bg-orange-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70">Enter the Masterpiece <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></motion.button>}</AnimatePresence></div>
        </footer>
      </div>
    </section>
  );
}
