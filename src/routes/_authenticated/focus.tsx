import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, ChevronRight, ListChecks, Pause, Play, RotateCcw, Settings2, Sparkles, Timer, Trash2 } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import { useFocusTimer } from "@/hooks/use-focus-timer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus — Outstand" }, { name: "description", content: "Focus timer with AI-powered task breakdown and a personal focus queue." }] }),
  component: FocusPage,
});

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const QUEUE_KEY = "outstand_focus_queue_v1";
type QueueItem = { id: string; title: string; minutes: number; completed?: boolean };

function loadQueue(): QueueItem[] {
  try { const raw = localStorage.getItem(QUEUE_KEY); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value.filter((item) => item?.id && item?.title && Number(item?.minutes) > 0) : []; } catch { return []; }
}

function FocusPage() {
  const { sessions, recordSession } = useAppState();
  const [task, setTask] = useState("");
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [milestone, setMilestone] = useState("");
  const [budget, setBudget] = useState(120);
  const [breakingDown, setBreakingDown] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(FOCUS_MINUTES);

  const handleFocusSuccess = (completedMinutes: number) => {
    if (mode !== "focus") return;
    recordSession(completedMinutes, true);
    const active = queue.find((item) => !item.completed && item.title === task);
    if (active) setQueue((items) => items.map((item) => item.id === active.id ? { ...item, completed: true } : item));
    toast.success("Focus session complete", { description: "Nice work. Take a short break." });
    setMode("break");
    setTimerMinutes(BREAK_MINUTES);
  };
  const { minutes: timerMinutes, seconds, progressPercent, state, isSaving, saveError, start, pause, reset: resetTimer, setDuration } = useFocusTimer(handleFocusSuccess);

  function setTimerMinutes(value: number) { const safe = Math.min(240, Math.max(1, Math.round(value))); setCustomMinutes(safe); setDuration(safe); }
  useEffect(() => setQueue(loadQueue()), []);
  useEffect(() => { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }, [queue]);
  useEffect(() => { if (saveError) toast.error(saveError); }, [saveError]);
  useEffect(() => { const raw = Number(localStorage.getItem("outstand_timer_duration")); if (Number.isFinite(raw) && raw > 0) setCustomMinutes(Math.min(240, Math.max(1, Math.round(raw / 60000)))); }, []);

  const createBreakdown = async () => {
    const value = milestone.trim();
    if (value.length < 5) return toast.error("Enter a milestone first.");
    setBreakingDown(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in first.");
      const response = await fetch("/api/task-breakdown", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ milestone: value, availableMinutes: budget }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not break down that milestone.");
      const newTasks: QueueItem[] = (data.tasks || []).map((item: QueueItem) => ({ id: item.id || crypto.randomUUID(), title: item.title, minutes: item.minutes, completed: false }));
      setQueue((items) => [...items.filter((item) => !item.completed), ...newTasks]); setMilestone("");
      toast.success(`${newTasks.length} focused tasks added to your queue.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create the focus queue."); }
    finally { setBreakingDown(false); }
  };

  const startSelected = () => { if (state === "running") return; setMode("focus"); const selected = queue.find((item) => !item.completed && item.title === task); setTimerMinutes(selected?.minutes ?? customMinutes); start(); };
  const stopOrStart = () => state === "running" ? pause() : startSelected();
  const startQueueItem = (item: QueueItem) => { if (state === "running") return; setMode("focus"); setTask(item.title); setTimerMinutes(item.minutes); resetTimer(); setTimeout(start, 0); };
  const removeQueueItem = (id: string) => setQueue((items) => items.filter((item) => item.id !== id));
  const clearCompleted = () => setQueue((items) => items.filter((item) => !item.completed));
  const completedSessions = sessions.filter((session) => session.completed).length;
  const focusMinutes = sessions.filter((session) => session.completed).reduce((total, session) => total + session.durationMin, 0);
  const progress = Math.max(0, Math.min(1, progressPercent / 100));
  const circumference = 2 * Math.PI * 108;
  const presetTimes = useMemo(() => [15, 25, 45, 60, 90], []);

  return <main className="min-h-[calc(100vh-72px)] px-3 py-6 sm:px-6 sm:py-12"><div className="mx-auto max-w-5xl">
    <header className="mb-6 sm:mb-8"><div className="flex items-center gap-3 text-cyan-300"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10"><Timer className="h-5 w-5" /></div><span className="text-[10px] font-black uppercase tracking-[.25em] text-slate-500">Focus</span></div><h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">One thing. Then the next.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">OUTSTAND can turn a big milestone into small, timed actions and place them directly in your focus queue.</p></header>
    <section className="mb-5 rounded-[2rem] border border-cyan-300/10 bg-cyan-300/[0.035] p-4 shadow-2xl backdrop-blur-xl sm:p-7"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><BrainCircuit className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Smart task breakdown</p><h2 className="mt-1 text-xl font-black text-white">What feels too big to start?</h2><p className="mt-1 text-xs leading-5 text-slate-500">AI turns the milestone into 5–45 minute tasks, ordered by dependency.</p></div></div><textarea value={milestone} onChange={(e) => setMilestone(e.target.value)} maxLength={2000} rows={3} placeholder="e.g. Finish the Chemical Reactions chapter and prepare for my test" className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40 focus-visible:ring-2 focus-visible:ring-cyan-300/50" /><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 text-xs font-bold text-slate-500">Time budget <input type="number" min={15} max={240} value={budget} onChange={(e) => setBudget(Math.min(240, Math.max(15, Number(e.target.value) || 15)))} className="h-11 w-20 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50" /> min</label><Button onClick={() => void createBreakdown()} disabled={breakingDown || milestone.trim().length < 5} className="h-11 w-full rounded-xl bg-cyan-300 px-5 text-sm font-black text-slate-950 hover:bg-cyan-200 disabled:opacity-50 sm:w-auto"><Sparkles className="mr-2 h-4 w-4" />{breakingDown ? "Building your queue…" : "Break it down"}</Button></div></section>
    <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]"><section className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.035] shadow-2xl backdrop-blur-xl"><div className="border-b border-white/[0.06] p-4 sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><button type="button" onClick={() => { if (state !== "running") { setMode("focus"); setTimerMinutes(queue.find((item) => !item.completed)?.minutes ?? customMinutes); } }} className={`min-h-11 rounded-xl px-4 py-2 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${mode === "focus" ? "bg-cyan-300 text-slate-950" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}>Focus</button><button type="button" onClick={() => { if (state !== "running") { setMode("break"); setTimerMinutes(BREAK_MINUTES); } }} className={`min-h-11 rounded-xl px-4 py-2 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${mode === "break" ? "bg-white text-slate-950" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}>Break · 5m</button></div><button type="button" onClick={() => setShowTimerSettings((value) => !value)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-400 hover:border-cyan-300/20 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 sm:w-auto"><Settings2 className="h-4 w-4" /> Timer length</button></div>{showTimerSettings && <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3 sm:p-4"><div className="flex flex-wrap items-center gap-2">{presetTimes.map((value) => <button key={value} type="button" disabled={state === "running"} onClick={() => setTimerMinutes(value)} className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${customMinutes === value ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-black/10 text-slate-500 hover:text-white"}`}>{value}m</button>)}<label className="flex w-full items-center justify-between gap-2 text-xs font-bold text-slate-500 sm:ml-auto sm:w-auto"><input type="number" min={1} max={240} disabled={state === "running"} value={customMinutes} onChange={(e) => setTimerMinutes(Number(e.target.value) || 1)} className="h-10 w-20 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50" /> custom min</label></div><p className="mt-3 text-[10px] leading-5 text-slate-600">Choose any focus length from 1–240 minutes.</p></div>}<label className="mt-5 block"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-600">What are you working on?</span><input value={task} onChange={(e) => setTask(e.target.value)} disabled={state === "running"} maxLength={160} placeholder="e.g. Finish chemistry notes" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40 focus-visible:ring-2 focus-visible:ring-cyan-300/50 disabled:opacity-60" /></label></div><div className="flex flex-col items-center px-3 py-8 sm:py-14"><div className="relative h-56 w-56 sm:h-72 sm:w-72"><svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="120" cy="120" r="108" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/[0.06]" /><circle cx="120" cy="120" r="108" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-cyan-300 transition-all duration-1000" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} /></svg><div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-mono text-5xl font-black tabular-nums tracking-tight text-white sm:text-7xl">{String(timerMinutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</p><p className="mt-2 text-[10px] font-black uppercase tracking-[.25em] text-slate-600">{mode === "focus" ? "Focus" : "Break"}</p></div></div></div>{task && <p className="mt-5 max-w-[90%] truncate text-center text-sm font-bold text-slate-400">{task}</p>}<div className="mt-6 flex w-full max-w-sm items-center gap-3 sm:mt-7"><Button onClick={stopOrStart} disabled={isSaving} className="h-12 flex-1 rounded-xl bg-cyan-300 px-5 text-sm font-black text-slate-950 hover:bg-cyan-200 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-300/60">{state === "running" ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start focus</>}</Button><Button variant="ghost" onClick={resetTimer} disabled={isSaving} className="h-12 w-12 shrink-0 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60" aria-label="Reset timer"><RotateCcw className="h-4 w-4" /></Button></div></div></section><section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><div className="flex items-center justify-between gap-2"><div><div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-cyan-300" /><h2 className="text-lg font-black text-white">Focus queue</h2></div><p className="mt-1 text-xs text-slate-600">{queue.filter((item) => !item.completed).length} tasks remaining</p></div>{queue.some((item) => item.completed) && <button type="button" onClick={clearCompleted} className="min-h-10 rounded-lg px-2 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60">Clear done</button>}</div><div className="mt-5 space-y-2">{queue.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center"><ListChecks className="mx-auto h-6 w-6 text-slate-700" /><p className="mt-3 text-sm font-bold text-slate-500">Your queue is empty.</p><p className="mt-1 text-xs leading-5 text-slate-700">Break down a milestone above and the AI will fill it.</p></div> : queue.map((item) => <div key={item.id} className={`group flex items-center gap-2 rounded-2xl border p-3 ${item.completed ? "border-white/[0.04] bg-white/[0.015] opacity-50" : "border-white/[0.06] bg-black/15"}`}><button type="button" disabled={item.completed || state === "running"} onClick={() => startQueueItem(item)} className="min-h-11 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.completed ? "bg-emerald-400/10 text-emerald-300" : "bg-cyan-300/10 text-cyan-200"}`}>{item.completed ? <CheckCircle2 className="h-4 w-4" /> : <Timer className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className={`truncate text-sm font-bold ${item.completed ? "line-through text-slate-600" : "text-slate-300"}`}>{item.title}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-700">{item.minutes} min</div></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-700" /></div></button>{!item.completed && <button type="button" onClick={() => removeQueueItem(item.id)} aria-label={`Remove ${item.title}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-white/5 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"><Trash2 className="h-4 w-4" /></button>}</div>)}</div></section></div>
    <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-600">Completed sessions</p><p className="mt-2 text-2xl font-black text-white">{completedSessions}</p></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-600">Focus minutes</p><p className="mt-2 text-2xl font-black text-white">{focusMinutes}</p></div><div className="col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:col-span-1"><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-600">Queue</p><p className="mt-2 text-2xl font-black text-white">{queue.filter((item) => !item.completed).length}</p></div></section>
  </div></main>;
}
