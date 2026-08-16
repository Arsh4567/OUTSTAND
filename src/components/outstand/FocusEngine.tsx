import { memo, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Crosshair, Layers3, Target, Zap } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { OutstandChallenge } from "@/lib/challenges.types";

const cinematicEase = [0.16, 1, 0.3, 1] as const;
const explosiveEase = [0.19, 1, 0.22, 1] as const;
const TRANSFORM_OPT = { transform: "translateZ(0)" } as const;

interface FocusEngineProps {
  challenge: OutstandChallenge | null;
  isShuffling: boolean;
  shuffleDisplay: { emoji: string; title: string };
  completionStage: number;
  running: boolean;
  mins: string;
  secs: string;
  setRunning: (state: boolean) => void;
  setRemaining: (time: number) => void;
  generate: () => void;
  complete: () => void;
}

export const FocusEngine = memo((props: FocusEngineProps) => {
  const { challenge, isShuffling, shuffleDisplay, running, mins, secs, setRunning, setRemaining, generate, complete, completionStage } = props;
  const sceneSeed = useMemo(() => challenge?.id?.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) ?? 42, [challenge?.id]);

  return <AnimatePresence mode="wait" initial={false}>
    {!challenge && !isShuffling ? <IdleScene generate={generate} /> : isShuffling ? <AcquisitionScene display={shuffleDisplay} /> : <ActiveScene challenge={challenge!} sceneSeed={sceneSeed} completionStage={completionStage} running={running} mins={mins} secs={secs} setRunning={setRunning} setRemaining={setRemaining} generate={generate} complete={complete} />}
  </AnimatePresence>;
});
FocusEngine.displayName = "FocusEngine";

function IdleScene({ generate }: { generate: () => void }) {
  return <motion.div key="idle" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease: cinematicEase }} className="relative flex w-full flex-col items-center justify-center gap-10 overflow-hidden py-10 text-center" style={TRANSFORM_OPT}>
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.06] blur-[90px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.06),transparent_45%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
    </div>
    <div className="relative z-10 max-w-2xl px-6">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.3em] text-cyan-100/80"><Layers3 className="h-3.5 w-3.5" /> Focus chamber</div>
      <h2 className="mt-5 text-5xl font-black tracking-[-.06em] text-white sm:text-7xl">Make the next move count.</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Outstand chooses a focused challenge, builds a timebox around it, and gets out of your way.</p>
    </div>
    <MagneticCore generate={generate} />
    <div className="relative z-10 flex flex-wrap justify-center gap-2 px-6 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600"><span className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-1.5">No feeds</span><span className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-1.5">One mission</span><span className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-1.5">Full attention</span></div>
  </motion.div>;
}

function AcquisitionScene({ display }: { display: { emoji: string; title: string } }) {
  return <motion.div key="shuffling" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35, ease: explosiveEase }} className="relative flex h-[560px] w-full items-center justify-center overflow-hidden" style={TRANSFORM_OPT}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.11),transparent_40%),radial-gradient(circle_at_center,rgba(99,102,241,.08),transparent_58%)]" />
    <motion.div className="absolute h-[360px] w-[360px] rounded-full border border-cyan-300/15" animate={{ rotate: 360, scale: [1, 1.04, 1] }} transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 1.8, repeat: Infinity } }} />
    <motion.div className="absolute h-[290px] w-[290px] rounded-full border border-indigo-400/20 border-dashed" animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
    <motion.div className="absolute h-[190px] w-[190px] rounded-full bg-cyan-300/[0.06] blur-2xl" animate={{ scale: [0.9, 1.12, 0.9] }} transition={{ duration: 1.2, repeat: Infinity }} />
    <motion.div className="absolute inset-0 opacity-30" animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 0.9, repeat: Infinity }}><div className="absolute left-1/2 top-1/2 h-px w-[85%] -translate-x-1/2 bg-cyan-300/40" /><div className="absolute left-1/2 top-1/2 h-[85%] w-px -translate-y-1/2 bg-cyan-300/40" /></motion.div>
    <Crosshair className="absolute h-28 w-28 text-cyan-200/30" strokeWidth={0.5} />
    <div className="relative z-20 w-full max-w-sm px-6 text-center">
      <div className="text-[9px] font-black uppercase tracking-[.35em] text-cyan-200/60">Selecting your next move</div>
      <div className="mt-4 rounded-3xl border border-white/10 bg-black/55 p-6 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-xl">
        <div className="text-5xl">{display.emoji}</div><div className="mt-4 text-xl font-black text-white">{display.title}</div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/8"><motion.div className="h-full w-1/3 bg-gradient-to-r from-cyan-300 to-indigo-400" animate={{ x: ["-120%", "420%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} /></div>
        <p className="mt-3 text-[9px] font-bold uppercase tracking-[.24em] text-slate-600">Calibrating duration · intensity · reward</p>
      </div>
    </div>
  </motion.div>;
}

function ActiveScene({ challenge, sceneSeed, completionStage, running, mins, secs, setRunning, setRemaining, generate, complete }: { challenge: OutstandChallenge; sceneSeed: number; completionStage: number; running: boolean; mins: string; secs: string; setRunning: (state: boolean) => void; setRemaining: (time: number) => void; generate: () => void; complete: () => void }) {
  const rot = useMotionValue(0);
  const springRot = useSpring(rot, { stiffness: 45, damping: 14, mass: 0.8 });
  const accent = challenge.theme.particleColors[0] || "#22d3ee";

  return <motion.div key="active" initial={{ opacity: 0, scale: 0.985, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -16 }} transition={{ duration: 0.55, ease: cinematicEase }} className="relative w-full" style={{ ...TRANSFORM_OPT, rotateZ: springRot }}>
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.2rem]">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${accent}22, transparent 68%)` }} />
      <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <motion.div className="absolute inset-x-12 top-10 h-px" style={{ background: `linear-gradient(90deg,transparent,${accent}80,transparent)` }} animate={{ opacity: [0.25, 0.65, 0.25] }} transition={{ duration: 2.2 + (sceneSeed % 11) / 10, repeat: Infinity }} />
    </div>
    <div className="relative z-20">
      <div className="mb-5 flex items-center justify-between px-1"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.28em] text-slate-500"><Target className="h-3.5 w-3.5 text-cyan-300" /> Your mission is ready</div><button type="button" onClick={generate} className="text-[9px] font-black uppercase tracking-[.22em] text-slate-600 transition hover:text-white">New mission</button></div>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.25 }}><ChallengeCard challenge={challenge} completionStage={completionStage} running={running} mins={mins} secs={secs} setRunning={setRunning} setRemaining={setRemaining} generate={generate} complete={complete} /></motion.div>
    </div>
  </motion.div>;
}

const MagneticCore = memo(({ generate }: { generate: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 25, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 260, damping: 25, mass: 0.5 });
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 18);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 18);
  };
  return <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={() => { x.set(0); y.set(0); }} style={{ x: springX, y: springY, ...TRANSFORM_OPT }} className="relative flex cursor-pointer items-center justify-center p-16">
    <motion.div className="absolute inset-3 rounded-full border border-white/5 border-t-cyan-300/45 border-b-indigo-400/35" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
    <motion.div className="absolute inset-10 rounded-full border border-dashed border-cyan-300/15 border-l-cyan-300/45" animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
    <motion.div className="absolute h-48 w-48 rounded-full bg-cyan-400/[0.06] blur-2xl" animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.5, 0.95, 0.5] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
    <motion.button type="button" onClick={() => { generate(); x.set(0); y.set(0); }} whileHover={{ scale: 1.045 }} whileTap={{ scale: 0.95 }} className="group relative z-10 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#070b14] shadow-[0_0_60px_rgba(34,211,238,.14),inset_0_0_50px_rgba(99,102,241,.07)] sm:h-44 sm:w-44">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,.22),transparent_30%),radial-gradient(circle_at_70%_75%,rgba(129,140,248,.18),transparent_38%)]" />
      <span className="absolute inset-4 rounded-full border border-white/5" />
      <Zap className="relative z-10 h-14 w-14 text-cyan-300 transition duration-300 group-hover:scale-110 sm:h-16 sm:w-16" fill="currentColor" />
      <motion.span className="absolute bottom-4 text-[8px] font-black uppercase tracking-[.3em] text-cyan-100/55" animate={{ opacity: [0.35, 0.8, 0.35] }} transition={{ duration: 2, repeat: Infinity }}>Start</motion.span>
    </motion.button>
  </motion.div>;
});
MagneticCore.displayName = "MagneticCore";
