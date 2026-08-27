import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, ShieldAlert, Sparkles, Target, TrendingUp } from "lucide-react";
import type { AdaptiveRecommendation } from "@/lib/adaptive-planning";

const statusMeta = {
  ahead: { label: "Ahead", icon: TrendingUp },
  on_track: { label: "On track", icon: CheckCircle2 },
  at_risk: { label: "At risk", icon: ShieldAlert },
  recovery: { label: "Recovery", icon: Target },
} as const;

export function AdaptivePlanCard({ recommendation, saving, onSave }: { recommendation: AdaptiveRecommendation; saving?: boolean; onSave?: () => void }) {
  const meta = statusMeta[recommendation.status];
  const Icon = meta.icon;
  const pace = Math.round(recommendation.paceRatio * 100);
  const variance = recommendation.variancePct > 0 ? `+${recommendation.variancePct}` : `${recommendation.variancePct}`;
  const confidenceLabel = recommendation.confidence === "high" ? "High confidence" : recommendation.confidence === "medium" ? "Moderate confidence" : "Early signal";

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#07101d]/92 p-5 shadow-[0_28px_90px_-65px_rgba(34,211,238,.45)] backdrop-blur-xl sm:p-7" aria-labelledby="adaptive-intelligence-heading">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-400/8 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Adaptive intelligence</div><div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] ${recommendation.status === "recovery" || recommendation.status === "at_risk" ? "border-violet-300/15 bg-violet-300/10 text-violet-200" : "border-cyan-300/15 bg-cyan-300/10 text-cyan-200"}`}><Icon className="h-3.5 w-3.5" /> {meta.label}</div></div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><h2 id="adaptive-intelligence-heading" className="text-2xl font-black tracking-tight text-white sm:text-3xl">{recommendation.headline}</h2><span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{confidenceLabel}</span></div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{recommendation.explanation}</p></div><button type="button" onClick={onSave} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : "Use this adjustment"}<ArrowUpRight className="h-3.5 w-3.5" /></button></div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"><Metric label="Completion" value={`${recommendation.completionPct}%`} detail={`Expected ${recommendation.expectedCompletionPct}%`} /><Metric label="Pace" value={`${pace}%`} detail="vs today's plan" /><Metric label="Variance" value={variance} detail="points vs timeline" /><Metric label="Remaining" value={`${recommendation.remainingRequired}`} detail={`${recommendation.availableDays} days available`} /></div>
        <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] px-4 py-3.5"><p className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-100/55">Recommended move</p><p className="mt-1 text-sm font-bold text-slate-200">{recommendation.action}</p></div>
      </div>
    </motion.section>
  );
}
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-1 text-xl font-black tabular-nums text-white">{value}</p><p className="mt-0.5 text-[9px] text-slate-600">{detail}</p></div>; }
