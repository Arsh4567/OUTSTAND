import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock3, Crosshair, ShieldCheck, Target } from "lucide-react";
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
  const next = tasks.find((task) => task.progress !== "completed");
  const current = tasks.find(isCurrent);
  const executionTarget = next || current;

  return (
    <section aria-labelledby="daily-focus-title" className="overflow-hidden rounded-[2rem] border border-white/[0.09] bg-slate-950/65 shadow-[0_30px_100px_-65px_rgba(34,211,238,.45)] backdrop-blur-xl">
      <div className="border-b border-white/[0.06] p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200"><Target className="h-4 w-4" aria-hidden="true" />Today</div>
            <h2 id="daily-focus-title" className="mt-2 text-3xl font-black tracking-[-.03em] text-white">One high-leverage objective.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">OUTSTAND keeps the day deliberately small. Finish the next useful block, prove the result, then move on.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Done</p><p className="mt-1 text-xl font-black text-white tabular-nums">{completed}/{required.length}</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Remaining</p><p className="mt-1 text-xl font-black text-white tabular-nums">{Math.max(0, required.length - completed)}</p></div>
          </div>
        </div>

        {executionTarget ? (
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mt-6 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.045] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/75">{current ? "Right now" : "Next"}</p>
                <div className="mt-2 flex items-start gap-3"><span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${current ? "animate-pulse bg-cyan-300" : "bg-cyan-300/60"}`} /><h3 className="text-xl font-black tracking-tight text-white">{executionTarget.title}</h3></div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{formatTime(executionTarget.start_time)} — {formatTime(executionTarget.end_time)} · {executionTarget.estimated_minutes || 30} min</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-slate-950/50 px-3 py-2 text-left lg:min-w-[230px]"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Do this first</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{executionTarget.instructions}</p></div>
            </div>
            {executionTarget.success_criteria && <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.025] p-3 text-xs font-semibold leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden="true" /><span><span className="text-emerald-200">Done when:</span> {executionTarget.success_criteria}</span></div>}
          </motion.div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/[0.045] p-5"><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200/75">Day complete</p><h3 className="mt-2 text-xl font-black text-white">Your planned work is done.</h3><p className="mt-1 text-sm text-slate-400">Protect the gain. A short review is more valuable than adding filler work.</p></div>
        )}
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Execution</p><p className="mt-1 text-sm font-bold text-slate-300">The minimum effective sequence for today.</p></div><Crosshair className="h-4 w-4 text-slate-600" aria-hidden="true" /></div>
        <div className="mt-5 space-y-2">
          {tasks.length ? tasks.map((task, index) => {
            const done = task.progress === "completed";
            const active = isCurrent(task);
            return <motion.article key={task.id} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { duration: 0.25, delay: Math.min(index * 0.025, 0.15) }} className={`rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 ${active ? "border-cyan-300/20 bg-cyan-300/[0.035]" : done ? "border-white/[0.06] bg-white/[0.012]" : "border-white/[0.07] bg-white/[0.012]"}`}>
              <div className="flex gap-3">
                <button type="button" aria-label={done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} aria-pressed={done} onClick={() => void onToggle(task)} disabled={loading} className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-slate-950 transition-[transform,border-color,color,background-color] duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hover:scale-100 ${done ? "border-emerald-300/35 text-emerald-300" : active ? "border-cyan-300/40 text-cyan-300" : "border-white/10 text-transparent hover:border-cyan-300/30"}`}><Check className="h-4 w-4" aria-hidden="true" /></button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black text-slate-500">{formatTime(task.start_time)} — {formatTime(task.end_time)}</span>{active && <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-cyan-200">Now</span>}</div>
                  <h4 className={`mt-1 text-sm font-black ${done ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</h4>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{task.instructions}</p>
                  {task.success_criteria && <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500"><span className="text-slate-300">Done when:</span> {task.success_criteria}</p>}
                </div>
              </div>
            </motion.article>;
          }) : <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center"><p className="text-sm font-bold text-slate-300">No execution blocks are ready yet.</p><p className="mt-1 text-xs text-slate-500">OUTSTAND will keep the day intentionally light instead of filling it with generic work.</p></div>}
        </div>
      </div>
    </section>
  );
}
