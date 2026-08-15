import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Flame, Target, Trophy, Zap, ArrowRight } from "lucide-react";
import { XpBadge } from "@/components/xp-badge";
import type { DashboardMission, DashboardSnapshot } from "@/hooks/useDashboard";

const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } };

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_-50px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-7 ${className}`}>{children}</div>;
}

export function DashboardHero({ snapshot }: { snapshot: DashboardSnapshot }) {
  return <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-7">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80"><Zap className="h-3.5 w-3.5" /> Personal command center</div>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">Welcome back, <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">{snapshot.userName}</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">One meaningful action at a time. Your momentum is built today, not someday.</p></div>
      <div className="flex items-center gap-3"><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Current level</p><p className="mt-1 text-xl font-black text-white">{snapshot.level}</p></div><XpBadge xp={snapshot.totalXp} /></div>
    </div>
  </motion.section>;
}

export function DashboardStats({ snapshot }: { snapshot: DashboardSnapshot }) {
  const stats = [[<Zap />, "Total XP", snapshot.totalXp.toLocaleString()], [<Trophy />, "Level", String(snapshot.level)], [<Flame />, "Streak", `${snapshot.streak}d`], [<Target />, "Missions", `${snapshot.completedCount}/${snapshot.missions.length}`]];
  return <motion.section variants={fadeUp} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {stats.map(([icon, label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.055]"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-cyan-300">{icon}</span><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-0.5 text-lg font-black text-white">{value}</p></div></div></div>)}
  </motion.section>;
}

export function DashboardProgress({ snapshot }: { snapshot: DashboardSnapshot }) {
  return <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
    <Panel><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Level progress</p><p className="mt-2 text-2xl font-black text-white">Level {snapshot.level}</p></div><span className="text-sm font-bold text-cyan-300">{snapshot.xpPct}%</span></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${snapshot.xpPct}%` }} transition={{ duration: 0.8, ease }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" /></div><p className="mt-2 text-xs text-slate-500">Keep stacking actions to reach the next level.</p></Panel>
    <Panel><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Today’s signal</p><p className="mt-3 text-base font-bold leading-6 text-white">{snapshot.quote.quote}</p><p className="mt-2 text-xs text-slate-500">— {snapshot.quote.author}</p></Panel>
  </div>;
}

export function DashboardMissions({ snapshot, onComplete, onFocus }: { snapshot: DashboardSnapshot; onComplete: (id: string) => void; onFocus: () => void }) {
  return <Panel className="overflow-hidden"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">Daily missions</p><h2 className="mt-1 text-2xl font-black text-white">Build momentum</h2></div><div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">{snapshot.completionPct}% complete</div></div>
    <div className="mt-5 space-y-2">
      {snapshot.missions.map((mission) => <MissionRow key={mission.id} mission={mission} onComplete={() => onComplete(mission.id)} />)}
    </div>
    <button type="button" onClick={onFocus} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01]">Enter focus mode <ArrowRight className="h-4 w-4" /></button>
  </Panel>;
}

function MissionRow({ mission, onComplete }: { mission: DashboardMission; onComplete: () => void }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/10 p-3 transition-colors hover:bg-white/[0.035]">
    <button type="button" onClick={onComplete} disabled={mission.completed || mission.mutating} aria-label={mission.completed ? `${mission.title} completed` : `Complete ${mission.title}`} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all ${mission.completed ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-500 hover:border-cyan-300/30 hover:text-cyan-300"}`}>{mission.completed ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}</button>
    <div className="min-w-0 flex-1"><p className={`truncate text-sm font-bold ${mission.completed ? "text-slate-500 line-through" : "text-white"}`}>{mission.title}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{mission.category} · +{mission.xpReward} XP</p></div>
    {mission.mutating && <span className="text-[10px] font-bold text-cyan-300">Saving…</span>}
  </div>;
}

export function DashboardNextMission({ mission }: { mission?: DashboardMission }) {
  return <Panel className="flex min-h-full flex-col justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-300/80">Your next move</p><h2 className="mt-2 text-2xl font-black text-white">{mission?.title || "You’re all caught up"}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{mission ? `A ${mission.category.toLowerCase()} mission worth ${mission.xpReward} XP. Finish it before adding more noise.` : "Take the win. Protect the rest of your day."}</p></div><div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Progress</p><p className="mt-1 text-3xl font-black text-white">{mission ? "1 next action" : "Complete"}</p></div></Panel>;
}
