import { AlertTriangle, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { RecoveryPlan } from "@/lib/recovery-intelligence";

export function RecoveryModeCard({ plan, saving, applied, onApply }: { plan: RecoveryPlan; saving?: boolean; applied?: boolean; onApply?: () => void }) {
  const recovery = plan.shouldRecover;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={"relative overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl sm:p-7 " + (recovery ? "border-violet-300/12 bg-violet-300/[0.035]" : "border-emerald-300/12 bg-emerald-300/[0.025]")}
      aria-labelledby="recovery-mode-heading"
    >
      <div className={"pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl " + (recovery ? "bg-violet-400/8" : "bg-emerald-300/8")} />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">
            {recovery ? <AlertTriangle className="h-3.5 w-3.5 text-violet-200" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />}
            Recovery intelligence
          </div>
          <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] ${recovery ? "border-violet-300/15 bg-violet-300/10 text-violet-200" : "border-emerald-300/15 bg-emerald-300/10 text-emerald-200"}`}>
            {recovery ? "Recovery recommended" : "Stable"}
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="recovery-mode-heading" className="text-2xl font-black tracking-tight text-white sm:text-3xl">{plan.primaryInsight.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{plan.primaryInsight.explanation}</p>
          </div>
          <button type="button" onClick={onApply} disabled={saving || applied} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-60">
            {applied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {applied ? "Recovery applied" : saving ? "Applying…" : recovery ? "Enter recovery mode" : "Save insight"}
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Focus tasks" value={String(plan.focusTasks)} />
          <Metric label="Max recovery" value={`${plan.maxMinutes} min`} />
          <Metric label="Signal confidence" value={plan.primaryInsight.confidence} />
        </div>
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Recovery protocol</p>
          <div className="mt-3 space-y-2">
            {plan.steps.map((step, index) => <div key={step} className="flex gap-3 text-sm text-slate-300"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.05] text-[9px] font-black text-slate-500">{index + 1}</span><span>{step}</span></div>)}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-1 text-lg font-black capitalize tabular-nums text-white">{value}</p></div>;
}
