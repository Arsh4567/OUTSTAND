import { AlertTriangle, ArrowDown, ArrowRight, Sparkles, Zap } from "lucide-react";

import type { DailyLog } from "@/hooks/use-dopamine";

function pct(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function TriggerMapCard({ logs }: { logs: DailyLog[] }) {
  const recorded = logs.filter((log) => log.recorded);
  const lowDays = recorded.filter((log) => log.score < 60);
  const highDays = recorded.filter((log) => log.score >= 70);

  const negativeKeys = [
    { key: "scrolling", label: "Doomscrolling", emoji: "📱" },
    { key: "broke_focus", label: "Fractured focus", emoji: "💥" },
    { key: "slept_late", label: "Late sleep", emoji: "🌒" },
    { key: "snoozed", label: "Snoozing", emoji: "⏰" },
  ];

  const trigger = negativeKeys
    .map((item) => {
      const all = recorded.filter((log) => log.negatives.includes(item.key as never)).length;
      const low = lowDays.filter((log) => log.negatives.includes(item.key as never)).length;
      return { ...item, all, low, impact: lowDays.length ? low / lowDays.length : 0 };
    })
    .sort((a, b) => b.impact - a.impact || b.all - a.all)[0];

  const accelerator = ["pomodoro", "workout", "sleep_on_time", "outstand", "read"]
    .map((key) => {
      const all = recorded.filter((log) => log.positives.includes(key as never)).length;
      const high = highDays.filter((log) => log.positives.includes(key as never)).length;
      return { key, all, high };
    })
    .sort((a, b) => b.high - a.high || b.all - a.all)[0];

  if (!recorded.length) {
    return (
      <section className="rounded-[2rem] border border-cyan-400/15 bg-cyan-950/10 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-cyan-300" /><div><h2 className="text-xl font-black">Your trigger map</h2><p className="text-sm text-slate-500">OUTSTAND needs a few logged days to discover your patterns.</p></div></div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-cyan-400/15 bg-cyan-950/10 p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2.5"><Sparkles className="h-4 w-4 text-cyan-300" /></div><div><h2 className="text-xl font-black">Your trigger map</h2><p className="text-sm text-slate-500">Patterns found across {recorded.length} logged days.</p></div></div>
        <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:block">Pattern engine</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-300"><AlertTriangle className="h-4 w-4" /> Friction trigger</div>
          {trigger?.all ? <><div className="text-lg font-black">{trigger.emoji} {trigger.label}</div><p className="mt-2 text-sm leading-6 text-slate-400">Appeared on {trigger.all} of your logged days and on {trigger.low} low-momentum days.</p><div className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-200"><ArrowDown className="h-4 w-4" /> {pct(trigger.low, lowDays.length)}% of low days</div></> : <p className="text-sm text-slate-400">No recurring friction trigger yet.</p>}
        </div>

        <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-300"><Zap className="h-4 w-4" /> Momentum accelerator</div>
          {accelerator?.all ? <><div className="text-lg font-black">{accelerator.key.replaceAll("_", " ")}</div><p className="mt-2 text-sm leading-6 text-slate-400">This action showed up on {accelerator.high} high-momentum days.</p><div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-200"><ArrowRight className="h-4 w-4" /> Keep repeating it</div></> : <p className="text-sm text-slate-400">No recurring accelerator yet.</p>}
        </div>
      </div>
    </section>
  );
}
