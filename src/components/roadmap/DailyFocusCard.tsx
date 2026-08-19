import { Check, ChevronRight, Clock3, ExternalLink, Sparkles } from "lucide-react";
import type { RoadmapTask } from "@/hooks/use-roadmap";

function formatTime(value: string | null) {
  if (!value) return "Flexible";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function isCurrent(task: RoadmapTask) {
  if (!task.start_time || !task.end_time) return false;
  const now = new Date(); const current = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = task.start_time.split(":").map(Number); const [eh, em] = task.end_time.split(":").map(Number);
  return current >= sh * 60 + sm && current < eh * 60 + em;
}

export function DailyFocusCard({ tasks, onToggle, loading }: { tasks: RoadmapTask[]; onToggle: (task: RoadmapTask) => Promise<void>; loading?: boolean }) {
  const required = tasks.filter((task) => task.is_required);
  const completed = required.filter((task) => task.progress === "completed").length;
  const current = tasks.find(isCurrent);

  return (
    <section className="rounded-[2rem] border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(13,25,40,.92),rgba(4,8,20,.98))] p-5 shadow-[0_30px_100px_-55px_rgba(34,211,238,.35)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-300"><Sparkles className="h-4 w-4" />Hourly execution plan</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">What to do. When to do it.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">OUTSTAND turns today's goal into a time-blocked sequence. Follow the next block, then move forward.</p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-right">
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Today</p>
          <p className="mt-1 text-lg font-black text-white">{completed}/{required.length || 0}</p>
          <p className="text-[10px] text-slate-600">required blocks complete</p>
        </div>
      </div>

      {current && <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4 shadow-[0_0_40px_-25px_rgba(34,211,238,.7)]"><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/70">Right now</p><div className="mt-1 flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /><h3 className="text-lg font-black text-white">{current.title}</h3></div><p className="mt-1 text-xs text-cyan-100/60">{formatTime(current.start_time)} — {formatTime(current.end_time)}</p></div>}

      <div className="relative mt-7 space-y-3">
        <div className="absolute bottom-5 left-[23px] top-5 w-px bg-gradient-to-b from-cyan-300/30 via-violet-300/20 to-transparent" />
        {tasks.length ? tasks.map((task, index) => {
          const done = task.progress === "completed"; const active = isCurrent(task);
          return <article key={task.id} className={`relative rounded-2xl border p-4 transition ${active ? "border-cyan-300/25 bg-cyan-300/[0.045]" : done ? "border-emerald-300/15 bg-emerald-300/[0.025]" : "border-white/[0.07] bg-black/10"}`}>
            <div className="flex gap-3">
              <button type="button" aria-label={done ? "Mark incomplete" : "Mark complete"} onClick={() => void onToggle(task)} disabled={loading} className={`relative z-10 mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-slate-950 transition ${done ? "border-emerald-300/40 text-emerald-300" : active ? "border-cyan-300/50 text-cyan-300" : "border-white/10 text-transparent hover:border-cyan-300/30"}`}><Check className="h-4 w-4" /></button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black text-cyan-200/70">{formatTime(task.start_time)} — {formatTime(task.end_time)}</span>{active && <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-cyan-200">Now</span>}</div>
                <div className="mt-1 flex items-center gap-2"><h3 className={`text-base font-black ${done ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</h3><ChevronRight className="h-4 w-4 text-slate-700" /></div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><Clock3 className="h-3 w-3" />{task.estimated_minutes || 30} min · {task.task_type.replaceAll("_", " ")}</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{task.instructions}</p>
                {task.success_criteria && <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 p-3 text-xs font-semibold leading-5 text-slate-500"><span className="text-slate-400">Done when:</span> {task.success_criteria}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">{task.methodology_tags.map((tag) => <span key={tag} className="rounded-full bg-violet-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-violet-200/75">{tag.replaceAll("_", " ")}</span>)}</div>
                {!!task.resources.length && <div className="mt-3 flex flex-wrap gap-2">{task.resources.slice(0, 3).map((resource, resourceIndex) => resource.url ? <a key={`${resource.url}-${resourceIndex}`} href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-200/70 hover:text-cyan-100"><ExternalLink className="h-3 w-3" />{resource.title || "Resource"}</a> : null)}</div>}
                {index < tasks.length - 1 && <p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-slate-700">Next block →</p>}
              </div>
            </div>
          </article>;
        }) : <div className="rounded-2xl border border-dashed border-cyan-300/15 bg-cyan-300/[0.02] p-8 text-center"><p className="text-sm font-bold text-slate-400">Today's hourly schedule is being prepared.</p><p className="mt-1 text-xs text-slate-600">The AI will build the next schedule from your availability and progress.</p></div>}
      </div>
    </section>
  );
}
