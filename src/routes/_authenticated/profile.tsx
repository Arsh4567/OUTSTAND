import { createFileRoute } from "@tanstack/react-router";
import { motion, MotionConfig, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Copy, Edit3, Flame, Save, Target, Timer, Trophy, TrendingUp, UserRound, Zap, X } from "lucide-react";

import { useProfileState } from "@/hooks/use-profile-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Outstand" },
      { name: "description", content: "Your Outstand identity, progress, momentum, habits, and achievements." },
    ],
  }),
  component: ProfilePage,
});

const ease = [0.22, 1, 0.36, 1] as const;
const card = "rounded-[2rem] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

function ProfilePage() {
  const state = useProfileState();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 160, damping: 18 });
  const springY = useSpring(y, { stiffness: 160, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-8deg", "8deg"]);
  const initial = (state.name || "U").charAt(0).toUpperCase();

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return <MotionConfig reducedMotion="user">
    <motion.main initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }} className="mx-auto max-w-7xl space-y-5 px-4 pb-20 pt-3 sm:px-6 lg:space-y-7 lg:px-8">
      <motion.section variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }} className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.12),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(129,140,248,.10),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.015))] p-5 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <button type="button" onClick={() => state.fileInputRef.current?.click()} aria-label="Change avatar" className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950 shadow-2xl sm:h-28 sm:w-28">
                {state.isUploading ? <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">Saving</div> : state.profile?.avatar_url ? <img src={state.profile.avatar_url} alt="Profile avatar" className="h-full w-full object-cover" /> : <span className="bg-gradient-to-br from-cyan-200 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent">{initial}</span>}
                <span className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-2 text-center text-[9px] font-black uppercase tracking-[.2em] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">Change photo</span>
              </button>
              <input ref={state.fileInputRef} type="file" accept="image/*" onChange={state.handleAvatarUpload} className="sr-only" />
              <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.85)]" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">Profile</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{state.getRankTitle(state.level)}</span></div>
              <h1 className="mt-3 truncate text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{state.name}</h1>
              {state.profile?.username && <div className="mt-1 text-sm font-semibold text-cyan-200/70">@{state.profile.username}</div>}
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{state.profile?.bio || "Build a bio that says what you are working toward."}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400"><button type="button" onClick={state.handleCopyId} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-3 py-1.5 transition hover:bg-white/[0.06]"><UserRound className="h-3.5 w-3.5 text-cyan-300" />{state.copiedId ? "Copied" : `ID ${(state.user?.id || "unknown").slice(0, 8)}`}<Copy className="h-3 w-3 opacity-50" /></button><span className="rounded-full border border-white/8 bg-black/20 px-3 py-1.5">{state.bestStreak} day best streak</span></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!state.isEditing ? <button type="button" onClick={state.beginEdit} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.1]"><Edit3 className="h-4 w-4" />Edit profile</button> : <div className="flex gap-2"><button type="button" onClick={state.saveProfile} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950"><Save className="h-4 w-4" />Save</button><button type="button" onClick={() => state.setIsEditing(false)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white"><X className="h-4 w-4" />Cancel</button></div>}
          </div>
        </div>

        {state.isEditing && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative mt-7 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
          <Field label="Name"><input value={state.draftName} onChange={(event) => state.setDraftName(event.target.value)} maxLength={80} className="profile-input" /></Field>
          <Field label="Username"><input value={state.draftUsername} onChange={(event) => state.setDraftUsername(event.target.value)} maxLength={24} placeholder="arsh_01" className="profile-input" /></Field>
          <Field label="Bio"><textarea value={state.draftBio} onChange={(event) => state.setDraftBio(event.target.value)} maxLength={240} rows={2} placeholder="What are you building?" className="profile-input resize-none" /></Field>
        </motion.div>}
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Zap className="text-cyan-300" />} label="Total XP" value={String(state.xp)} note="Lifetime progress" />
        <StatCard icon={<TrendingUp className="text-emerald-300" />} label="Productivity" value={`${state.stats.productivity}%`} note="Current momentum" />
        <StatCard icon={<Flame className="text-orange-300" />} label="Best streak" value={`${state.bestStreak}d`} note="Consistency peak" />
        <StatCard icon={<Target className="text-fuchsia-300" />} label="Completions" value={String(state.stats.totalCompletions)} note="Actions completed" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <motion.section variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }} className={cn(card, "p-6 sm:p-8")} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="flex min-h-[300px] flex-col justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.25em] text-indigo-300/70">Current level</div><div className="mt-2 text-7xl font-black tracking-tighter text-white">{state.level}</div><p className="text-sm text-slate-500">{state.getRankTitle(state.level)} class</p></div><div style={{ transform: "translateZ(28px)" }}><div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>Progress</span><span className="text-white">{state.into} / {state.need}</span></div><div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/40"><motion.div initial={{ width: 0 }} animate={{ width: `${state.pct}%` }} transition={{ duration: .9, ease }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-300" /></div><p className="mt-3 text-xs text-slate-600">{Math.max(0, state.need - state.into)} XP to next level.</p></div></motion.div>
        </motion.section>

        <section className={cn(card, "p-6 sm:p-8")}><div className="flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.24em] text-cyan-300/80"><TrendingUp className="h-4 w-4" /> Momentum</div><h2 className="mt-2 text-2xl font-black text-white">Your recent signal</h2></div><div className="text-right"><div className="text-3xl font-black text-white">{state.stats.avg}</div><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">Avg score</div></div></div><div className="mt-6 h-52 overflow-hidden rounded-2xl border border-white/[0.05] bg-black/10 p-2"><SimpleTrend logs={state.logs} /></div></section>
      </div>

      <section className={cn(card, "p-6 sm:p-8")}><div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.24em] text-orange-300/80"><Flame className="h-4 w-4" /> Habits</div><h2 className="mt-2 text-2xl font-black text-white">Strongest repetitions</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{state.habits.slice(0, 6).map((habit) => { const streak = state.streaks.find((item) => item?.id === habit.id)?.streak ?? 0; return <div key={habit.id} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/10 p-4"><div className="flex min-w-0 items-center gap-3"><span className="text-xl">{habit.emoji}</span><span className="truncate text-sm font-bold text-slate-200">{habit.name}</span></div><span className="rounded-full border border-orange-400/15 bg-orange-400/10 px-2.5 py-1 text-xs font-black text-orange-200">{streak}d</span></div>; })}{state.habits.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500">Build your first habit to start your profile history.</div>}</div></section>

      <section className={cn(card, "p-6 sm:p-8")}><div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.24em] text-emerald-300/80"><TrendingUp className="h-4 w-4" /> Consistency</div><h2 className="mt-2 text-2xl font-black text-white">30-day action map</h2><div className="mt-8 flex h-40 items-end gap-1 overflow-x-auto">{state.stats.dayStats.map((item) => <div key={item.d} className="group relative flex h-full min-w-[8px] flex-1 items-end rounded-lg bg-white/[0.012]"><div className={cn("w-full rounded-md", item.ratio === 0 ? "bg-white/5" : item.ratio < .5 ? "bg-indigo-900" : item.ratio < 1 ? "bg-indigo-500" : "bg-emerald-400")} style={{ height: `${Math.max(10, item.ratio * 100)}%` }} /><div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-[10px] font-bold text-white opacity-0 shadow-xl transition group-hover:opacity-100">{item.done}/{item.total} habits</div></div>)}</div></section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MiniMetric icon={<Timer className="text-indigo-300" />} label="Focus sessions" value={String(state.stats.focusCompleted)} /><MiniMetric icon={<Timer className="text-emerald-300" />} label="Focus minutes" value={String(state.stats.focusMinutes)} /><MiniMetric icon={<Zap className="text-yellow-300" />} label="Challenges" value={String(state.outstand.length)} /><MiniMetric icon={<Trophy className="text-purple-300" />} label="Habits built" value={String(state.habits.length)} /></section>
    </motion.main>
  </MotionConfig>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.18em] text-slate-600">{label}</span>{children}</label>; }
function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <motion.div whileHover={{ y: -3 }} className={cn(card, "p-5 transition hover:border-white/[0.14]")}><div className="grid h-10 w-10 place-items-center rounded-xl border border-white/8 bg-white/[0.04]">{icon}</div><div className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-slate-600">{label}</div><div className="mt-1 text-3xl font-black tracking-tight text-white">{value}</div><div className="mt-1 text-xs text-slate-700">{note}</div></motion.div>; }
function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className={cn(card, "p-4")}><div className="flex items-center gap-2">{icon}<span className="text-[9px] font-black uppercase tracking-[.18em] text-slate-600">{label}</span></div><div className="mt-2 text-xl font-black text-white">{value}</div></div>; }
function SimpleTrend({ logs }: { logs: Array<{ date?: string; score?: number }> }) { const values = logs.map((item) => Math.max(0, Math.min(100, item.score ?? 0))); const maxX = Math.max(1, values.length - 1); const points = (values.length ? values : [0]).map((value, index) => `${(index / maxX) * 100},${100 - value}`).join(" "); return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full"><polyline points={`0,100 ${points} 100,100`} fill="rgba(34,211,238,.08)" stroke="none" /><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" className="text-cyan-300" /></svg>; }
