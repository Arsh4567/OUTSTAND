import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, RotateCcw, Sparkles } from "lucide-react";

const SCENE_LENGTH = 30_000;

const scenes = [
  { start: 0, end: 5_500, eyebrow: "THE OLD YOU", title: "You stopped waiting for motivation.", detail: "You built a system that keeps moving when motivation disappears." },
  { start: 5_500, end: 11_000, eyebrow: "THE SHIFT", title: "Small decisions became momentum.", detail: "Sleep. Focus. Movement. Learning. Recovery. Repeated until they became yours." },
  { start: 11_000, end: 18_000, eyebrow: "THE PROOF", title: "You didn't chase a perfect day.", detail: "You learned how to win the next decision — again and again." },
  { start: 18_000, end: 24_500, eyebrow: "ROADMAP COMPLETE", title: "Look at what consistency built.", detail: "More energy. More confidence. More control. A stronger foundation for what's next." },
  { start: 24_500, end: 30_000, eyebrow: "OUTSTAND", title: "This isn't the finish line.", detail: "It's proof that you can change your trajectory. Your next chapter starts now." },
];

function playCue(audioContext: AudioContext, kind: "hit" | "swell" | "finish") {
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(kind === "swell" ? 900 : 1_800, now);
  oscillator.type = kind === "finish" ? "sine" : "triangle";

  if (kind === "hit") {
    oscillator.frequency.setValueAtTime(68, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.55);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
  } else if (kind === "swell") {
    oscillator.frequency.setValueAtTime(110, now);
    oscillator.frequency.exponentialRampToValueAtTime(260, now + 1.6);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  } else {
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 1.1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
  }

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + (kind === "swell" ? 1.85 : 1.4));
}

export function RoadmapCinematic({ onEnter }: { onEnter?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const cueRef = useRef(-1);

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
    cueRef.current = -1;
    if (soundOn && audioRef.current) {
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
      playCue(audioRef.current, "swell");
    }
  }, [soundOn]);

  useEffect(() => {
    if (!running) return;
    const started = performance.now() - elapsed;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(now - started, SCENE_LENGTH);
      setElapsed(next);
      if (soundOn && audioRef.current) {
        const cueIndex = scenes.findIndex((scene) => next >= scene.start && next < scene.start + 120);
        if (cueIndex !== -1 && cueIndex !== cueRef.current) {
          cueRef.current = cueIndex;
          playCue(audioRef.current, cueIndex === scenes.length - 1 ? "finish" : cueIndex === 0 ? "swell" : "hit");
        }
      }
      if (next < SCENE_LENGTH) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, soundOn]);

  useEffect(() => () => { void audioRef.current?.close(); }, []);

  const current = scenes.find((scene) => elapsed >= scene.start && elapsed < scene.end) ?? scenes[scenes.length - 1];
  const progress = Math.min(100, (elapsed / SCENE_LENGTH) * 100);

  return (
    <section className="relative min-h-[min(820px,100svh)] overflow-hidden bg-[#020308] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.13),transparent_30%),radial-gradient(circle_at_78%_72%,rgba(99,102,241,.11),transparent_28%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,.72)_100%)]" />

      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[44%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10"
        animate={reduceMotion ? undefined : { scale: [0.86, 1.12, 0.94], opacity: [0.15, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[44%] h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[0.06] blur-3xl"
        animate={reduceMotion ? undefined : { scale: [0.9, 1.25, 0.96], opacity: [0.25, 0.55, 0.28] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-[min(820px,100svh)] max-w-6xl flex-col px-5 pb-8 pt-7 sm:px-8 sm:pt-9">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] shadow-[0_0_30px_rgba(34,211,238,.12)]"><Sparkles className="h-4 w-4 text-cyan-200" /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Outstand</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">Roadmap complete</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={soundOn ? () => setSoundOn(false) : enableSound} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-400 transition hover:border-cyan-300/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label={soundOn ? "Mute cinematic sound" : "Enable cinematic sound"}>
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" onClick={replay} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-400 transition hover:border-cyan-300/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Replay cinematic">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.eyebrow}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, filter: "blur(8px)" }}
              transition={{ duration: reduceMotion ? 0.2 : 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-cyan-300/80 sm:text-xs">{current.eyebrow}</p>
              <h1 className="mt-6 text-[clamp(2.8rem,8vw,7.6rem)] font-black leading-[0.9] tracking-[-0.055em] text-white [text-wrap:balance]">{current.title}</h1>
              <p className="mx-auto mt-7 max-w-2xl text-sm font-medium leading-7 text-slate-400 sm:text-base sm:leading-8">{current.detail}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="space-y-5">
          <div className="flex items-center gap-4"><div className="h-px flex-1 overflow-hidden bg-white/8"><motion.div className="h-full origin-left bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${progress}%` }} /></div><span className="w-12 text-right font-mono text-[9px] font-bold text-slate-600">00:{Math.min(30, Math.ceil(elapsed / 1000)).toString().padStart(2, "0")}</span></div>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 sm:text-left">30 seconds · one chapter closes · another begins</p>
            <AnimatePresence>
              {!running && (
                <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={onEnter} type="button" className="group inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,.12)] transition hover:border-cyan-300/35 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                  Enter your next chapter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </footer>
      </div>
    </section>
  );
}
