import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Play, Route, ShieldCheck, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { DailyLog } from "@/hooks/use-dopamine";

export function ExecutionSystemsCard({ logs }: { logs: DailyLog[] }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const recorded = logs.filter((l) => l.recorded);
  const recent = recorded.slice(-7);
  const scores = recorded.map((l) => l.score);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const high = recorded.filter((l) => l.score >= 80).length;
  const friction = recorded.filter((l) => l.negatives.length >= 2).length;
  const accelerator = recorded.filter((l) => l.positives.length >= 2).length;
  const consistency = recorded.length ? Math.round((recorded.filter((l) => l.positives.length > 0).length / recorded.length) * 100) : 0;
  const trend = useMemo(() => {
    if (recent.length < 4) return 0;
    const half = Math.floor(recent.length / 2);
    const a = recent.slice(0, half).reduce((s, l) => s + l.score, 0) / half;
    const b = recent.slice(half).reduce((s, l) => s + l.score, 0) / (recent.length - half);
    return Math.round(b - a);
  }, [recent]);
  const insight = !recorded.length ? "Start logging real days to unlock behavioral patterns." : friction > accelerator ? "Friction is outweighing your accelerators. Protect one important task before adding more goals." : trend >= 8 ? "Momentum is rising. Repeat the conditions behind your recent high-score days." : consistency >= 70 ? "You are consistent. Focus on quality of execution rather than adding more tasks." : "Your pattern is still forming. Keep the log simple and look for repeatable wins.";

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => {
      if (s >= 600) { setRunning(false); setDone(true); return 600; }
      return s + 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const remaining = 600 - seconds;
  const time = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const start = () => { setSeconds(0); setDone(false); setRunning(true); };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0f1a]/80 shadow-2xl">
      <div className="border-b border-white/7 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300"><Route className="h-3.5 w-3.5" /> Execution center</div>
            <h2 className="mt-2 text-2xl font-black">Turn momentum into action.</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">One place to protect your next task, recover when stuck, and see whether your execution is improving.</p>
          </div>
          <Link to="/roadmap" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950">Open roadmap <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
      </div>

      <div className="grid divide-y divide-white/7 md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3"><div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-2.5"><ShieldCheck className="h-4 w-4 text-amber-200" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200">Intervention mode</p><h3 className="mt-1 text-lg font-black">10-minute momentum reset</h3></div></div>
          <p className="mt-3 text-sm leading-6 text-slate-400">Phone away → reset → move → open your next task → work.</p>
          <div className="mt-4 flex items-center gap-2"><div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 font-mono text-xl font-black tracking-widest">{done ? "DONE" : time}</div><button type="button" onClick={start} className="inline-flex items-center rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950"><Play className="mr-2 h-4 w-4" />{running ? "Restart" : done ? "Run again" : "Start"}</button>{running && <button type="button" onClick={() => setRunning(false)} className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-black">Pause</button>}</div>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{["2m phone", "1m reset", "3m move", "1m task", "3m work"].map((item, i) => <span key={item} className="rounded-full border border-white/7 bg-white/[0.02] px-2.5 py-1">{i + 1}. {item}</span>)}</div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-3"><div className="rounded-xl border border-indigo-300/20 bg-indigo-300/10 p-2.5"><Trophy className="h-4 w-4 text-indigo-200" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">Personal records</p><h3 className="mt-1 text-lg font-black">Your strongest signals</h3></div></div>
          <div className="mt-5 grid grid-cols-2 gap-2.5"><Metric label="Best" value={`${best}/100`} /><Metric label="High days" value={String(high)} /><Metric label="Consistency" value={`${consistency}%`} /><Metric label="A / F" value={`${accelerator} / ${friction}`} /></div>
        </div>
      </div>

      <div className="grid divide-y divide-white/7 border-t border-white/7 md:grid-cols-[1.1fr_.9fr] md:divide-x md:divide-y-0">
        <div className="p-5 sm:p-7"><div className="flex items-center gap-3"><div className="rounded-xl border border-violet-300/20 bg-violet-300/10 p-2.5"><BrainCircuit className="h-4 w-4 text-violet-200" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">Behavioral analytics</p><h3 className="mt-1 text-lg font-black">What your data is saying</h3></div></div><p className="mt-4 text-sm leading-6 text-slate-300">{insight}</p><p className="mt-3 text-xs text-slate-500">{recorded.length} logged days · {trend >= 0 ? "+" : ""}{trend} recent signal</p></div>
        <div className="grid grid-cols-2 gap-2.5 p-5 sm:p-7"><Metric label="30d average" value={`${avg}/100`} /><Metric label="Logged days" value={String(recorded.length)} /><Metric label="Accelerator days" value={String(accelerator)} /><Metric label="Friction days" value={String(friction)} /></div>
      </div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/7 bg-black/20 p-3.5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
