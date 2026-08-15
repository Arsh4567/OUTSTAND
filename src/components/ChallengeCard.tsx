import { useEffect, useRef, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChallengeStyles } from "@/lib/challenges.styles";
import { type OutstandChallenge } from "@/lib/challenges.types";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: OutstandChallenge;
  completionStage: 0 | 1 | 2;
  running: boolean;
  mins: number | string;
  secs: number | string;
  setRunning: (running: boolean) => void;
  setRemaining: (remaining: number) => void;
  generate: () => void;
  complete: () => void;
}

function XPCounter({ xp, color }: { xp: number; color?: string }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(0, xp, {
      duration: 1.15,
      ease: "easeOut",
      onUpdate: (value) => { node.textContent = `+${Math.floor(value)} XP`; },
    });
    return () => controls.stop();
  }, [xp]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.65, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center text-5xl font-black tracking-[-0.06em] sm:text-6xl md:text-8xl"
      style={{ color: color || "#fff", textShadow: `0 0 36px ${color || "#fff"}` }}
      ref={nodeRef}
    />
  );
}

export function ChallengeCard({
  challenge,
  completionStage,
  running,
  mins,
  secs,
  setRunning,
  setRemaining,
  generate,
  complete,
}: ChallengeCardProps) {
  const styles = getChallengeStyles(challenge);
  const primaryColor = styles.particleColors[0] || "#67e8f9";
  const xpValue = challenge.xpReward || 50;
  const durationFallback = challenge.durationMinutes || 10;
  const totalMinsInt = typeof mins === "number' ? mins : parseInt(mins as string, 10) || 0;
  const secsInt = typeof secs === "number" ? secs : parseInt(secs as string, 10) || 0;
  const totalSecondsRemaining = Math.max(0, totalMinsInt * 60 + secsInt);
  const maxSeconds = Math.max(60, durationFallback * 60);

  const timerColor = useMemo(() => {
    const ratio = Math.min(1, totalSecondsRemaining / maxSeconds);
    const hue = Math.round(ratio * 180 + 8);
    return `hsl(${hue}, 92%, 62%)`;
  }, [totalSecondsRemaining, maxSeconds]);

  const isUrgent = totalSecondsRemaining > 0 && totalSecondsRemaining <= 60;
  const isFinished = totalSecondsRemaining === 0;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 140, damping: 22, mass: 0.55 });
  const mouseYSpring = useSpring(y, { stiffness: 140, damping: 22, mass: 0.55 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (completionStage !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX / rect.width - (rect.left / rect.width) - 0.5);
    y.set(event.clientY / rect.height - (rect.top / rect.height) - 0.5);
  };

  const formatTime = () => {
    const hours = Math.floor(totalMinsInt / 60);
    const remainingMins = totalMinsInt % 60;
    return `${hours > 0 ? `${hours}:` : ""}${String(remainingMins).padStart(2, "0")}:${String(secsInt).padStart(2, "0")}`;
  };

  return (
    <motion.div
      style={completionStage === 0 ? { rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1400 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="group relative z-10 mx-auto flex w-full max-w-4xl justify-center"
    >
      <motion.div
        key="active"
        initial={{ opacity: 0, scale: 0.97, y: 18 }}
        animate={completionStage === 1
          ? { scale: 0.96, y: 0, rotateZ: [0, -1.2, 1.2, 0], filter: "brightness(1.25)" }
          : completionStage === 2
          ? { scale: [0.96, 1.04, 0.98], y: [0, -10, -640], opacity: [1, 1, 0], filter: "brightness(1.8)" }
          : { opacity: 1, scale: 1, y: 0 }}
        transition={completionStage === 1 ? { duration: 0.9, ease: "easeInOut" } : completionStage === 2 ? { duration: 0.75, ease: "easeIn" } : { type: "spring", stiffness: 170, damping: 24 }}
        className={cn(
          "relative flex w-full items-center justify-center",
          completionStage > 0 ? "h-24 max-w-sm" : "min-h-[460px] sm:min-h-[520px] md:min-h-[590px]",
        )}
      >
        {completionStage === 0 && <div className="pointer-events-none absolute inset-5 -z-10 rounded-[2.5rem] opacity-35 blur-3xl transition-opacity duration-700 group-hover:opacity-55" style={{ background: `radial-gradient(circle at 50% 10%, ${timerColor}, transparent 68%)` }} />}

        <div className={cn(styles.cardBase, "absolute inset-0")}> 
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
        <div className={styles.innerGlow} />
        <div className={styles.flare} />

        {completionStage === 2 && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden rounded-[2rem]">
            <motion.div initial={{ scale: 0.45, opacity: 1, borderWidth: "16px" }} animate={{ scale: 5.5, opacity: 0, borderWidth: "0px" }} transition={{ duration: 0.7, ease: "easeOut" }} className="absolute h-32 w-32 rounded-full border-solid" style={{ borderColor: timerColor }} />
            {Array.from({ length: 14 }, (_, index) => {
              const angle = (index / 14) * Math.PI * 2;
              const distance = 260 + (index % 4) * 55;
              return <motion.div key={index} initial={{ x: 0, y: 0, opacity: 1, scale: 0 }} animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: [0, 1.5, 0.2] }} transition={{ duration: 0.9, ease: "easeOut", delay: index * 0.012 }} className="absolute h-2.5 w-2.5 rounded-full" style={{ backgroundColor: styles.particleColors[index % styles.particleColors.length], boxShadow: `0 0 18px ${styles.particleColors[index % styles.particleColors.length]}` }} />;
            })}
          </div>
        )}

        <motion.div animate={completionStage > 0 ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }} className={cn("relative z-10 flex w-full flex-col items-center text-center", completionStage === 0 ? "p-7 sm:p-10 md:p-14" : "p-0")} style={completionStage === 0 ? { transform: "translateZ(48px)" } : undefined}>
          <div className="flex w-full items-center justify-between gap-4 px-1 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-[11px]">
            <span className="rounded-full border px-3 py-1.5 backdrop-blur-md" style={{ color: timerColor, borderColor: `${timerColor}45`, backgroundColor: `${timerColor}0f` }}>{challenge.rarity}</span>
            <span className="text-zinc-500">{challenge.category}</span>
          </div>

          <div className="relative mt-7 sm:mt-9">
            <motion.div animate={{ scale: running ? [1, 1.06, 1] : 1, opacity: running ? [0.18, 0.26, 0.18] : 0.18 }} transition={{ duration: 2.8, repeat: running ? Infinity : 0, ease: "easeInOut" }} className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: timerColor }} />
            <div className="relative text-6xl drop-shadow-[0_12px_35px_rgba(0,0,0,0.45)] sm:text-7xl md:text-8xl">{challenge.emoji}</div>
          </div>

          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl md:text-5xl">{challenge.title}</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-400 sm:text-base">{challenge.description}</p>

          <div className="my-8 sm:my-10">
            <div className="rounded-[1.6rem] border border-white/[0.07] bg-black/20 px-7 py-3 backdrop-blur-md sm:px-10 sm:py-4">
              <motion.span animate={isUrgent && running ? { scale: [1, 1.035, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: isUrgent && running ? Infinity : 0, ease: "easeInOut" }} className="inline-block font-mono text-5xl font-light tracking-[-0.06em] tabular-nums sm:text-6xl md:text-7xl" style={{ color: timerColor, textShadow: `0 0 28px ${timerColor}35` }}>{formatTime()}</motion.span>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-center gap-4 sm:gap-6">
            <motion.button type="button" whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.94 }} onClick={() => { setRemaining(durationFallback * 60); setRunning(false); }} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white sm:h-14 sm:w-14" aria-label="Reset challenge">
              <RotateCcw className="h-5 w-5" />
            </motion.button>
            <motion.button type="button" whileHover={{ scale: 1.045 }} whileTap={{ scale: 0.95 }} onClick={() => setRunning(!running)} disabled={isFinished} className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border shadow-[0_15px_50px_-18px_rgba(34,211,238,0.5)] sm:h-24 sm:w-24 md:h-28 md:w-28 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: running ? "rgba(255,255,255,0.08)" : `${timerColor}20`, borderColor: running ? "rgba(255,255,255,0.16)" : `${timerColor}55`, color: running ? "#fff" : timerColor }} aria-label={running ? "Pause challenge" : "Start challenge"}>
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.18),transparent_35%)]" />
              {running ? <Pause className="relative z-10 h-8 w-8 fill-current sm:h-10 sm:w-10" /> : <Play className="relative z-10 ml-1 h-8 w-8 fill-current sm:h-10 sm:w-10" />}
            </motion.button>
            <motion.button type="button" whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.94 }} onClick={generate} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white sm:h-14 sm:w-14" aria-label="Skip challenge">
              <SkipForward className="h-5 w-5" />
            </motion.button>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
            <InfoTile label="Duration" value={`${durationFallback} min`} />
            <InfoTile label="Reward" value={`+${xpValue} XP`} accent={primaryColor} />
            <InfoTile label="Status" value={isFinished ? "Ready to claim" : running ? "In progress" : "Paused"} className="col-span-2 sm:col-span-1" />
          </div>

          <div className="mt-4 w-full">
            <Button onClick={complete} disabled={!isFinished} className={cn("h-14 w-full rounded-2xl text-sm font-bold uppercase tracking-[0.16em] transition-all sm:h-16", isFinished ? "bg-white text-black shadow-[0_16px_50px_-18px_rgba(255,255,255,0.65)] hover:scale-[1.01] hover:bg-cyan-50" : "border border-white/8 bg-white/[0.04] text-zinc-600")}> 
              {isFinished ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete mission</> : "Complete when timer reaches zero"}
            </Button>
          </div>
        </motion.div>

        {completionStage === 2 && <XPCounter xp={xpValue} color={primaryColor} />}
      </motion.div>
    </motion.div>
  );
}

function InfoTile({ label, value, accent, className }: { label: string; value: string; accent?: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.06] bg-black/15 px-4 py-3 text-left", className)}>
      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-zinc-200" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
