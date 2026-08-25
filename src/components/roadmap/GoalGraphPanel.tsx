import { ArrowDown, CircleAlert, GitBranch, Lock, Target, Zap } from "lucide-react";
import type { GoalGraph } from "@/lib/roadmap-goal-graph";

function statusClass(status: string) {
  if (status === "complete") return "border-emerald-300/15 bg-emerald-300/[0.045] text-emerald-200";
  if (status === "blocked") return "border-amber-300/15 bg-amber-300/[0.045] text-amber-200";
  if (status === "in_progress") return "border-cyan-300/15 bg-cyan-300/[0.045] text-cyan-200";
  return "border-white/[0.07] bg-white/[0.025] text-slate-300";
}

export function GoalGraphPanel({ graph }: { graph: GoalGraph }) {
  const outcomes = graph.nodes.filter((node) => node.type === "outcome");
  const blocked = outcomes.filter((node) => node.status === "blocked");

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_32px_90px_-72px_rgba(34,211,238,.35)] sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-300/[0.05] blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-slate-600"><GitBranch className="h-3.5 w-3.5" />Goal graph</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">What is actually driving the outcome?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">OUTSTAND turns milestones into dependencies so a blocked outcome becomes visible before it quietly drags the whole roadmap.</p>
        </div>
        {graph.bottleneck && (
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] px-4 py-3 sm:max-w-sm">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-amber-200"><CircleAlert className="h-3.5 w-3.5" />Current bottleneck</div>
            <p className="mt-1 text-sm font-black text-white">{graph.bottleneck.title}</p>
            <p className="mt-1 text-xs leading-5 text-amber-100/60">{graph.bottleneck.blockers.length ? `Waiting on ${graph.bottleneck.blockers.join(", ")}.` : "This is the highest-leverage unresolved outcome right now."}</p>
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {outcomes.map((node, index) => (
          <article key={node.id} className={`rounded-2xl border p-4 ${statusClass(node.status)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-500"><Target className="h-3.5 w-3.5" />Outcome {index + 1}</div>
              {node.status === "blocked" ? <Lock className="h-4 w-4 text-amber-200" /> : node.status === "complete" ? <Zap className="h-4 w-4 text-emerald-200" /> : <ArrowDown className="h-4 w-4 text-cyan-200" />}
            </div>
            <h3 className="mt-3 text-base font-black text-white">{node.title}</h3>
            {node.outcome && <p className="mt-1 text-xs leading-5 text-slate-500">{node.outcome}</p>}
            <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-slate-600"><span>{node.status.replace("_", " ")}</span><span className="tabular-nums text-slate-400">{node.progress}%</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white/40" style={{ width: `${node.progress}%` }} /></div>
            {node.blockers.length > 0 && <p className="mt-3 text-[11px] font-bold text-amber-100/70">Blocked by: {node.blockers.join(", ")}</p>}
          </article>
        ))}
      </div>

      {blocked.length === 0 && outcomes.length > 0 && (
        <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.018] px-4 py-3 text-xs font-bold text-emerald-100/65">
          No milestone dependency is currently blocking the path.
        </div>
      )}
    </section>
  );
}
