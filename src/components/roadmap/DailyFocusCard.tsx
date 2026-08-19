import { Check, Clock3, ExternalLink, Sparkles } from "lucide-react";
import type { RoadmapTask } from "@/hooks/use-roadmap";

export function DailyFocusCard({ tasks, onToggle, loading }: { tasks: RoadmapTask[]; onToggle: (task: RoadmapTask) => Promise<void>; loading?: boolean }) {
  return (
    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_30px_90px_-60px_rgba(34,211,238,.4)] sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/80"><Sparkles className="h-4 w-4" />Today’s focus</div><h2 className="mt-1 text-2xl font-black text-white">Do the next right thing.</h2></div>
        <span className="rounded-full border border-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-500">{tasks.filter((task) => task.progress === "completed").length}/{tasks.length} done</span>
      </div>
      <div className="mt-6 space-y-3">
        {tasks.length ? tasks.map((task) => {
          const done = task.progress === "completed";
          return <article key={task.id} className={`rounded-2xl border p-4 transition ${done ? "border-emerald-300/15 bg-emerald-300/[0.03]" : "border-white/[0.07] bg-black/10"}`}>
            <div className="flex gap-3">
              <button type="button" aria-label={done ? "Mark incomplete" : "Mark complete"} onClick={() => void onToggle(task)} disabled={loading} className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${done ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-300" : "border-white/10 text-transparent hover:border-cyan-300/30"}`}><Check className="h-4 w-4" /></button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className={`text-sm font-black ${done ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</h3>{task.estimated_minutes && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600"><Clock3 className="h-3 w-3" />{task.estimated_minutes} min</span>}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{task.instructions}</p>
                {task.success_criteria && <p className="mt-2 text-xs font-semibold text-slate-500">Success: {task.success_criteria}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">{task.methodology_tags.map((tag) => <span key={tag} className="rounded-full bg-violet-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-violet-200/75">{tag.replaceAll("_", " ")}</span>)}</div>
                {!!task.resources.length && <div className="mt-3 flex flex-wrap gap-2">{task.resources.slice(0, 3).map((resource, index) => resource.url ? <a key={`${resource.url}-${index}`} href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-200/70 hover:text-cyan-100"><ExternalLink className="h-3 w-3" />{resource.title || "Resource"}</a> : null)}</div>}
              </div>
            </div>
          </article>;
        }) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">No tasks for today yet.</div>}
      </div>
    </section>
  );
}
