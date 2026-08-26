import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock3, Crosshair, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { RoadmapTask } from "@/hooks/use-roadmap";

function formatTime(value: string | null) {
  if (!value) return "Flexible";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function minutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function isCurrent(task: RoadmapTask) {
  if (!task.start_time || !task.end_time) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= minutes(task.start_time) && current < minutes(task.end_time);
}

export function DailyFocusCard({ tasks, onToggle, loading }: { tasks: RoadmapTask[]; onToggle: (task: RoadmapTask) => Promise<void>; loading?: boolean }) {
  const reduceMotion = useReducedMotion();
  const required = tasks.filter((task) => task.is_required);
  const completed = required.filter((task) => task.progress === "completed").length;
  const percent = required.length ? Math.round((completed / required.length) * 100) : 0;
  const next = tasks.find((task) => task.progress !== "completed");
  const current = tasks.find(isCurrent);
  const executionTarget = current || next;

  return (
    <section aria-labelledby="daily-focus-title" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1528]/90 shadow-[0_35px_110px_-75px_rgba(34,211,238,.6)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative border-b border-white/10 p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200"><Target className="h-4 w-4" aria-hidden="true" /> Today's mission</div>
            <h2 id="daily-focus-title" className="mt-2 text-[clamp(1.7rem,4vw,2.5rem)] font-black tracking-[-.04em] text-white">Make the next block count.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Finish the useful work first. OUTSTAND keeps the plan focused instead of filling your day with noise.</p>
          </div>

          <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full p-[7px]" style={{ background: `conic-gradient(rgb(103 232 249) ${percent * 3.6}deg, rgba(255,255,255,.08) 0deg)` }} aria-label={`${percent}% of today's required work complete`} role="img">
            <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-[#0a1120]">
              <div className="text-center"><div className="text-2xl font-black tabular-nums text-white">{percent}%</div><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">today</div></div>
            </div>
          </div>
        </div>

        {executionTarget ? (
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mt-6 overflow-hidden rounded-[1.5rem] border border-cyan-200/15 bg-gradient-to-br from-cyan-300/[0.09] via-white/[0.025] to-violet-400/[0.06]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200"><span className={`h-2 w-2 rounded-full ${current ? "animate-pulse bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" : "bg-cyan-300/60"}`} />{current ? "In progress now" : "Next recommended block"}</div>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">{executionTarget.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-400"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{formatTime(executionTarget.start_time)} — {formatTime(executionTarget.end_time)}</span><span>{executionTarget.estimated_minutes || 30} min</span></div>
                </div>
                <div className="max-w-md rounded-xl border border-white/10 bg-black/15 px-4 py-3"><p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-500">How to execute</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{executionTarget.instructions}</p></div>
              </div>
              {executionTarget.success_criteria && <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] px-3.5 py-3 text-xs font-semibold leading-5 text-slate-300"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /><span><span className="font-black text-emerald-200">Finish line:</span> {executionTarget.success_criteria}</span></div>}
            </div>
          </motion.div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.09] to-cyan-300/[0.04] p-5 sm:p-6"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-emerald-200"><Sparkles className="h-4 w-4" /> Day complete</div><h3 className="mt-2 text-xl font-black text-white">The planned work is done.</h3><p className="mt-1 text-sm leading-6 text-slate-400">Protect the gain. A short review is more useful than inventing extra work.</p></div>
        )}
      </div>

      <div className="relative p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">Today's blocks</p><p className="mt-1 text-sm font-bold text-slate-300">{completed} of {required.length} required blocks complete</p></div><Crosshair className="h-4 w-4 text-slate-600" aria-hidden="true" /></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label="Today's required completion" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${percent}%` }} transition={reduceMotion ? { duration: 0 } : { duration: .55, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" /></div>

        <div className="mt-5 space-y-2">
          {tasks.length ? tasks.map((task, index) => {
            const done = task.progress === "completed";
            const active = isCurrent(task);
            return <motion.article key={task.id} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { duration: .24, delay: Math.min(index * .02, .12) }} className={`group rounded-2xl border p-4 transition-[border-color,background-color,transform,box-shadow] duration-200 ${active ? "border-cyan-300/25 bg-cyan-300/[0.055] shadow-[0_12px_40px_-30px_rgba(34,211,238,.8)]" : done ? "border-emerald-300/10 bg-emerald-300/[0.015]" : "border-white/[0.07] bg-white/[0.012] hover:-translate-y-px hover:border-white/[0.12] hover:bg-white/[0.025]"}`}>
              <div className="flex gap-3">
                <button type="button" aria-label={done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} aria-pressed={done} onClick={() => void onToggle(task)} disabled={loading} className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-[transform,border-color,color,background-color] duration-150 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1528] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hover:scale-100 ${done ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-300" : active ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-[#0a1120] text-transparent group-hover:border-cyan-300/25"}`}><Check className="h-4 w-4" aria-hidden="true" /></button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black tabular-nums text-slate-500">{formatTime(task.start_time)} — {formatTime(task.end_time)}</span>{active && <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-cyan-200">Now</span>}{done && <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-200">Done</span>}</div>
                  <h4 className={`mt-1 text-sm font-black leading-5 ${done ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</h4>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{task.instructions}</p>
                  {task.success_criteria && <p className="mt-2.5 text-[11px] leading-5 text-slate-500"><span className="font-black text-slate-300">Done when:</span> {task.success_criteria}</p>}
                </div>
              </div>
            </motion.article>;
          }) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center"><p className="text-sm font-bold text-slate-300">No execution blocks are ready yet.</p><p className="mt-1 text-xs text-slate-500">The planner will avoid inventing filler work.</p></div>}
        </div>
      </div>
    </section>
  );
}
