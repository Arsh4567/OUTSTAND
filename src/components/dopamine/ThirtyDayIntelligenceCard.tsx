import { CalendarDays, Gauge, TrendingDown, TrendingUp } from "lucide-react";

import type { DailyLog } from "@/hooks/use-dopamine";

export function ThirtyDayIntelligenceCard({ logs }: { logs: DailyLog[] }) {
  const recorded = logs.filter((log) => log.recorded);
  const scores = recorded.map((log) => log.score);
  const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
  const firstHalf = recorded.slice(0, Math.ceil(recorded.length / 2));
  const secondHalf = recorded.slice(Math.ceil(recorded.length / 2));
  const avg = (items: DailyLog[]) => items.length ? items.reduce((sum, log) => sum + log.score, 0) / items.length : 0;
  const change = Math.round(avg(secondHalf) - avg(firstHalf));
  const best = recorded.reduce<DailyLog | null>((bestLog, log) => !bestLog || log.score > bestLog.score ? log : bestLog, null);
  const highDays = recorded.filter((log) => log.score >= 70).length;
  const maxBars = 30;

  return (
    <section className="rounded-[2rem] border border-violet-400/15 bg-violet-950/10 p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-300"><CalendarDays className="h-3.5 w-3.5" /> 30-day intelligence</div><h2 className="text-2xl font-black">Your momentum trajectory.</h2><p className="mt-1 text-sm text-slate-500">Real logged days only. Missing days stay blank.</p></div><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3"><Gauge className="h-4 w-4 text-violet-300" /><span className="text-xs font-black">{average || "—"}<span className="ml-1 text-slate-500">avg</span></span></div></div>

      {recorded.length ? <>
        <div className="flex h-36 items-end gap-1 rounded-2xl border border-white/7 bg-black/20 p-4">
          {logs.slice(-maxBars).map((log, index) => <div key={`${log.log_date}-${index}`} className="group flex h-full flex-1 items-end" title={`${log.log_date}: ${log.recorded ? `${log.score}/100` : "No log"}`}><div className={`w-full rounded-t-md transition-all ${log.recorded ? "bg-violet-400/70 group-hover:bg-violet-300" : "bg-white/5"}`} style={{ height: log.recorded ? `${Math.max(8, log.score)}%` : "6%" }} /></div>)}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/7 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trend</div><div className="mt-2 flex items-center gap-2 text-lg font-black">{change >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-300" /> : <TrendingDown className="h-4 w-4 text-rose-300" />}{change > 0 ? "+" : ""}{change} pts</div></div>
          <div className="rounded-2xl border border-white/7 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">High-momentum days</div><div className="mt-2 text-lg font-black">{highDays}<span className="ml-1 text-sm text-slate-500">/ {recorded.length}</span></div></div>
          <div className="rounded-2xl border border-white/7 bg-black/20 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Best day</div><div className="mt-2 text-lg font-black">{best ? `${best.score}/100` : "—"}</div></div>
        </div>
      </> : <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">Log your first day to start building your 30-day intelligence.</div>}
    </section>
  );
}
