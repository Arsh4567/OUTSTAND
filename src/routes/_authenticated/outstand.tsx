import { createFileRoute, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Activity, ArrowUpRight, CircleDot, Flame, Gauge, Sparkles, WifiOff } from "lucide-react";
import { FocusEngine } from "@/components/outstand/FocusEngine";
import { EnvironmentEffects } from "@/components/outstand/EnvironmentEffects";
import { OfflineBanner } from "@/components/outstand/OfflineBanner";
import { useOutstand } from "@/hooks/use-outstand";
import { CHALLENGES } from "@/lib/Index";

type OutstandSearch = { challengeId?: string };
export const Route = createFileRoute("/_authenticated/outstand")({
  validateSearch: (search: Record<string, unknown>): OutstandSearch => ({ challengeId: typeof search.challengeId === "string" ? search.challengeId : undefined }),
  component: OutstandPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

export function OutstandPage() {
  const searchParams = useSearch({ strict: false }) as OutstandSearch;
  const challengeId = searchParams?.challengeId;
  const { challenge, running, setRunning, setRemaining, isShuffling, shuffleDisplay, completionStage, generate, complete, mins, secs, loadChallenge } = useOutstand();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!challengeId) return;
    const timer = window.setTimeout(() => loadChallenge(challengeId), 100);
    return () => window.clearTimeout(timer);
  }, [challengeId, loadChallenge]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setReducedMotion(media.matches);
    setReducedMotion(media.matches);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    media.addEventListener?.("change", onMotionChange);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      media.removeEventListener?.("change", onMotionChange);
    };
  }, []);

  const availableCount = CHALLENGES.length;
  const categoryCount = useMemo(() => new Set(CHALLENGES.map((item) => item.category)).size, []);
  const missionMinutes = challenge?.durationMinutes ?? 0;
  const progress = challenge && missionMinutes > 0 ? Math.min(100, Math.max(0, ((missionMinutes * 60 - (mins * 60 + secs)) / (missionMinutes * 60)) * 100)) : 0;

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#03050b] text-white selection:bg-cyan-400/20">
        <EnvironmentEffects completionStage={completionStage} isShuffling={isShuffling} />
        <OfflineBanner isOnline={isOnline} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.10),transparent_35%),radial-gradient(circle_at_90%_70%,rgba(129,140,248,0.08),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

        <main className="relative z-20 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/80"><Sparkles className="h-3.5 w-3.5" /> Outstand protocol</div>
              <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">One mission.<br /><span className="bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">Full attention.</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Choose a challenge that moves the needle. Start when you are ready, stay present, and leave with proof that you did the work.</p>
            </motion.div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Metric icon={<CircleDot />} value={String(availableCount)} label="missions" />
              <Metric icon={<Gauge />} value={String(categoryCount)} label="paths" />
              <Metric icon={<Flame />} value={challenge ? String(challenge.xpReward) : "—"} label="xp ready" />
            </div>
          </header>

          <div className="mt-7 flex-1 rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-3 lg:mt-8">
            <div className="relative flex min-h-[620px] items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/[0.05] bg-black/20 px-1 py-8 sm:px-5 lg:min-h-[680px]">
              {challenge && !isShuffling && <div className="pointer-events-none absolute inset-x-6 top-5 z-30 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:inset-x-8"><span className="flex items-center gap-2"><Activity className="h-3 w-3 text-cyan-300" /> Mission active</span><span>{Math.round(progress)}% complete</span></div>}
              {!challenge && !isShuffling && <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/5 bg-black/30 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 backdrop-blur-md"><ArrowUpRight className="h-3 w-3" /> Tap the core to generate a mission</div>}
              <FocusEngine challenge={challenge} isShuffling={isShuffling} shuffleDisplay={shuffleDisplay} completionStage={completionStage} running={running} mins={mins} secs={secs} setRunning={setRunning} setRemaining={setRemaining} generate={generate} complete={complete} />
            </div>
          </div>

          <footer className="mt-4 flex flex-col gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">{isOnline ? <WifiStatus /> : <><WifiOff className="h-3 w-3" /> Offline mode</>}</span>
            <span>Progress is saved automatically when a mission is cleared.</span>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return <div className="min-w-[78px] rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-3 text-center backdrop-blur-md sm:min-w-[92px]"><div className="mx-auto mb-1.5 flex w-fit text-cyan-300/70">{icon}</div><div className="text-lg font-black tracking-tight text-white">{value}</div><div className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</div></div>;
}
function WifiStatus() { return <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> System online</span>; }
