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

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-amber-200/15 bg-[#1b1712]/90 p-5 shadow-[0_30px_100px_-70px_rgba(251,191,36,.45)] backdrop-blur-xl sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-200"><Sparkles className="h-3.5 w-3.5" /> Adaptive intelligence</div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-500/20 bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-stone-300"><Icon className="h-3.5 w-3.5" /> {meta.label}</div>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><h2 className="text-2xl font-black tracking-tight sm:text-3xl">{recommendation.headline}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">{recommendation.explanation}</p></div>
          <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-300 px-4 py-2.5 text-xs font-black text-stone-950 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : "Use this adjustment"}<ArrowUpRight className="h-3.5 w-3.5" /></button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric label="Roadmap" value={`${recommendation.completionPct}%`} />
          <Metric label="Pace" value={`${pace}%`} />
          <Metric label="Remaining" value={`${recommendation.remainingRequired}`} />
        </div>
        <div className="mt-4 rounded-2xl border border-stone-500/15 bg-black/15 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[.14em] text-stone-500">Recommended move</p><p className="mt-1 text-sm font-bold text-stone-200">{recommendation.action}</p></div>
      </div>
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-stone-500/15 bg-black/15 px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-stone-500">{label}</p><p className="mt-1 text-xl font-black tabular-nums">{value}</p></div>; }
