import { useEffect, useState } from "react";
import { CheckCircle2, Flame, LockKeyhole, RotateCcw, Target } from "lucide-react";

import type { DailyLog } from "@/hooks/use-dopamine";

const challenges = [
  { key: "scrolling", title: "The Attention Shield", text: "Complete your next focused block without opening entertainment apps.", reward: "+15 momentum", action: "Protect one focus block." },
  { key: "broke_focus", title: "The Deep Start", text: "Finish one uninterrupted 20-minute work sprint before switching tasks.", reward: "+15 momentum", action: "Start one clean sprint." },
  { key: "slept_late", title: "The Night Lock", text: "Begin your wind-down at your planned bedtime tonight.", reward: "+15 momentum", action: "Protect tomorrow." },
  { key: "snoozed", title: "The First Move", text: "Get out of bed on the first alarm tomorrow and complete your first planned action.", reward: "+15 momentum", action: "Win the first move." },
  { key: "skipped_habits", title: "One-Win Rule", text: "Pick one important habit and complete it before the day ends.", reward: "+15 momentum", action: "Create one win." },
  { key: "default", title: "Momentum Builder", text: "Complete one OUTSTAND task with your phone out of reach.", reward: "+10 momentum", action: "Execute one task." },
];

export function AdaptiveChallengeCard({ logs }: { logs: DailyLog[] }) {
  const recent = logs.filter((log) => log.recorded).slice(-7);
  const negatives = new Map<string, number>();
  recent.forEach((log) => log.negatives.forEach((key) => negatives.set(key, (negatives.get(key) ?? 0) + 1)));
  const top = [...negatives.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "default";
  const challenge = challenges.find((item) => item.key === top) ?? challenges[challenges.length - 1];
  const storageKey = `outstand_adaptive_challenge_${new Date().toISOString().slice(0, 10)}`;
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setCompleted(window.localStorage.getItem(storageKey) === "complete");
  }, [storageKey]);

  const markComplete = () => {
    setCompleted(true);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, "complete");
  };

  const reset = () => {
    setCompleted(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-amber-300/15 bg-amber-950/10 p-6 shadow-2xl sm:p-8">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-2.5"><Target className="h-4 w-4 text-amber-200" /></div><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-200"><Flame className="h-3.5 w-3.5" /> Adaptive challenge</div><h2 className="mt-1 text-2xl font-black">{challenge.title}</h2></div></div><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Personalized</span></div>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">{challenge.text}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {completed ? <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-5 text-sm font-black text-emerald-200 transition hover:bg-emerald-300/15"><CheckCircle2 className="mr-2 h-4 w-4" /> Completed today</button> : <button type="button" onClick={markComplete} className="inline-flex h-11 items-center rounded-xl bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200"><CheckCircle2 className="mr-2 h-4 w-4" /> Mark complete</button>}
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-bold text-amber-100"><LockKeyhole className="h-3.5 w-3.5" /> {challenge.reward}</span>
          {completed && <button type="button" onClick={reset} aria-label="Reset challenge" className="rounded-xl border border-white/10 p-3 text-slate-500 hover:text-white"><RotateCcw className="h-4 w-4" /></button>}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">{completed ? "Momentum win recorded on this device." : challenge.action}</p>
      </div>
    </section>
  );
}
