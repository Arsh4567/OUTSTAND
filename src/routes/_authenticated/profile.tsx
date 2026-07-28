import { createFileRoute } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Flame, Target, Timer, Trophy, Zap, Activity, TrendingUp, Hexagon } from "lucide-react";

import { useProfileState } from "@/hooks/use-profile-state";
import { cn } from "@/lib/utils";

// Extracted Components
import { ProfileErrorBoundary } from "@/components/profile/ProfileErrorBoundary";
import { SpotlightCard } from "@/components/profile/SpotlightCard";
import { BigStat, MiniCard } from "@/components/profile/StatsCards";
import { TrendChart } from "@/components/profile/TrendChart";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Outstand" },
      { name: "description", content: "Your XP, level, streaks, focus, challenges, and progress." },
    ],
  }),
  component: () => (
    <ProfileErrorBoundary>
      <ProfilePage />
    </ProfileErrorBoundary>
  ),
});

const smoothEase = [0.22, 1, 0.36, 1];
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05, ease: smoothEase } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } } };

function ProfilePage() {
  const state = useProfileState();

  // 3D Parallax logic for Level Badge
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleBadgeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      
      <ProfileHeader state={state} itemVariants={itemVariants} />

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Holographic Level Badge */}
        <motion.div variants={itemVariants} className="xl:col-span-1 xl:row-span-2 perspective-[1000px]" onMouseMove={handleBadgeMouseMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="h-full relative p-8 rounded-[2rem] border border-white/10 bg-gradient-to-b from-indigo-900/40 to-black/60 shadow-[0_20px_50px_-15px_rgba(99,102,241,0.3)] backdrop-blur-3xl flex flex-col items-center justify-center group">
            <motion.div style={{ transform: "translateZ(60px)" }} className="text-center w-full relative z-10">
              <Hexagon className="h-32 w-32 mx-auto text-indigo-500/20 absolute left-1/2 -translate-x-1/2 -top-4 -z-10" strokeWidth={1} />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Current Rank</div>
              <div className="font-mono text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">{state.level}</div>
              <div className="mt-12 w-full text-left">
                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-3 tracking-wider">
                  <span>PROGRESS</span>
                  <span className="text-white"><span className="text-indigo-400">{state.into}</span> / {state.need}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/60 border border-white/10 shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${state.pct}%` }} transition={{ duration: 1.5, ease: smoothEase, delay: 0.2 }} className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.8)] relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat icon={<Zap />} label="Total XP" value={String(state.xp)} color="text-yellow-400" glowColor="rgba(234,179,8,0.2)" />
          <BigStat icon={<Activity />} label="Productivity" value={`${state.stats.productivity}%`} color="text-emerald-400" glowColor="rgba(52,211,153,0.2)" />
          <BigStat icon={<Flame />} label="Best Streak" value={`${state.bestStreak}d`} color="text-orange-400" glowColor="rgba(249,115,22,0.2)" />
          <BigStat icon={<Target />} label="Habits" value={String(state.stats.totalCompletions)} color="text-cyan-400" glowColor="rgba(6,182,212,0.2)" />
        </motion.div>

        <SpotlightCard className="md:col-span-3 xl:col-span-3 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 relative z-10">
            <div>
              <h2 className="font-display text-2xl font-black text-white tracking-tight">Dopamine Velocity</h2>
              <p className="text-sm font-medium text-zinc-500 mt-1">7-day performance momentum mapping</p>
            </div>
            <div className="text-right mt-4 sm:mt-0">
              <div className="text-3xl font-black text-white">{state.stats.avg}<span className="text-sm text-zinc-500 ml-1">avg</span></div>
            </div>
          </div>
          <div className="h-64 w-full">
            <TrendChart logs={state.logs} />
          </div>
        </SpotlightCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SpotlightCard className="lg:col-span-1 p-8 flex flex-col max-h-[500px]">
          <h2 className="font-display text-xl font-black text-white flex items-center gap-2 mb-6"><Flame className="text-orange-500" /> Active Fire</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar mask-image-bottom">
            {state.habits.length === 0 && <div className="text-sm text-zinc-500 italic p-4 border border-dashed border-white/10 rounded-2xl text-center">Awaiting your first habit completion.</div>}
            {state.habits.map((h, i) => {
              const streakVal = state.streaks.find((s) => s?.id === h?.id)?.streak ?? 0;
              return (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={h.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group">
                  <span className="flex items-center gap-4 min-w-0">
                    <span className="text-3xl drop-shadow-lg group-hover:scale-110 transition-transform">{h.emoji}</span>
                    <span className="truncate font-bold text-zinc-300 group-hover:text-white transition-colors">{h.name}</span>
                  </span>
                  <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-sm font-black text-orange-400 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">{streakVal}d</span>
                </motion.div>
              );
            })}
          </div>
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-2 p-8">
          <h2 className="font-display text-xl font-black text-white flex items-center gap-2 mb-2"><TrendingUp className="text-emerald-400" /> Consistency Matrix</h2>
          <p className="text-sm font-medium text-zinc-500 mb-8">30-day habit completion density</p>
          <div className="flex items-end gap-1 sm:gap-2 h-40 w-full">
            {state.stats.dayStats.map((s, i) => (
              <motion.div key={s.d} initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ delay: i * 0.01, duration: 0.8, ease: smoothEase }} className="group/bar relative flex-1 flex flex-col justify-end">
                <div className={cn("w-full rounded-md transition-all duration-300", s.ratio === 0 ? "bg-white/5 hover:bg-white/20" : s.ratio < 0.5 ? "bg-indigo-900 hover:bg-indigo-700" : s.ratio < 1 ? "bg-indigo-500 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.6)] z-10", "group-hover/bar:scale-y-110 group-hover/bar:brightness-125 origin-bottom cursor-crosshair")} style={{ height: `${Math.max(15, s.ratio * 100)}%` }} />
                <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white opacity-0 shadow-2xl transition-all duration-300 group-hover/bar:opacity-100 group-hover/bar:-translate-y-2 whitespace-nowrap z-50">
                  <div className="text-zinc-400 mb-1">{new Date(s.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  <span className={s.done === s.total && s.total > 0 ? "text-emerald-400" : "text-white"}>{s.done} / {s.total} Habits</span>
                </div>
              </motion.div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard icon={<Timer className="text-indigo-400" />} label="Focus Sessions" value={String(state.stats.focusCompleted)} />
        <MiniCard icon={<Activity className="text-emerald-400" />} label="Focus Minutes" value={String(state.stats.focusMinutes)} />
        <MiniCard icon={<Zap className="text-yellow-400" />} label="Challenges" value={String(state.outstand.length)} />
        <MiniCard icon={<Trophy className="text-purple-400" />} label="Total Built" value={String(state.habits.length)} />
      </div>
    </motion.div>
  );
        }
                    
