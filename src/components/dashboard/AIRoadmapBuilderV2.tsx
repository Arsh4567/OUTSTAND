import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, Loader2, Sparkles, Target, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Habit } from "@/lib/habits";

export type AIRoadmapPlan = { title: string; summary: string; durationDays: number; difficulty: string; assumptions: string[]; milestones: { day: number; title: string; outcome: string; actions: string[] }[]; today: string[]; metrics: string[]; adaptationRule: string };
type Question = { id: string; question: string; type: "text" | "number" | "choice" | "multiline"; required: boolean; options?: string[]; placeholder?: string };
const categories = [
  ["academics", "Exams & academics", "Marks, boards, syllabus and exams"], ["fitness", "Fitness", "Strength, conditioning and healthy routines"], ["business", "Business", "Build, validate or grow a business"], ["money", "Money & earning", "Skills and realistic earning paths"], ["skill", "Learn a skill", "Programming, editing, design and more"], ["content", "Content creation", "YouTube, social media and creator workflows"], ["sports", "Sports & chess", "Performance, rating and competition"], ["productivity", "Habits & productivity", "Focus, routines and consistency"], ["custom", "Something else", "Any other meaningful goal"],
] as const;

export function AIRoadmapBuilderV2({ habits, name, level, xp, streak, onClose, onPlanCreated }: { habits: Habit[]; name: string; level: number; xp: number; streak: number; onClose: () => void; onPlanCreated: (plan: AIRoadmapPlan) => void }) {
  const [category, setCategory] = useState("academics");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"category" | "interview" | "plan">("category");
  const [plan, setPlan] = useState<AIRoadmapPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(() => categories.find((item) => item[0] === category) ?? categories[0], [category]);
  const pending = questions.filter((q) => !answers[q.id]?.trim());

  async function request(mode: "questions" | "plan") {
    setLoading(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const res = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode, category, answers, habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji })), context: { name, level, xp, streak } }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The AI roadmap service is unavailable.");
      if (mode === "questions") {
        const next = Array.isArray(data.questions) ? data.questions as Question[] : [];
        if (!next.length) throw new Error("The AI could not determine the next useful questions. Try again.");
        setQuestions((current) => [...current, ...next.filter((q) => !current.some((old) => old.id === q.id))]);
        setStep("interview");
      } else {
        const nextPlan = data.plan as AIRoadmapPlan;
        setPlan(nextPlan); setStep("plan"); onPlanCreated(nextPlan);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  function start() { setStep("interview"); void request("questions"); }
  function continueInterview() {
    const missing = questions.find((q) => q.required && !answers[q.id]?.trim());
    if (missing) { setError(`Please answer: ${missing.question}`); return; }
    void request("questions");
  }
  function build() {
    const missing = questions.find((q) => q.required && !answers[q.id]?.trim());
    if (missing) { setError(`Please answer: ${missing.question}`); return; }
    void request("plan");
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
    <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#080b13] shadow-[0_30px_120px_-35px_rgba(34,211,238,.35)]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Brain className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">OUTSTAND Intelligence</p><h2 className="text-lg font-black text-white">Build your roadmap</h2></div></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] text-slate-500 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7"><AnimatePresence mode="wait">
        {step === "category" && <motion.div key="category" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">AI roadmap interview</p><h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">What kind of goal are we solving?</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">This is only the starting context. After you choose it, the AI will ask for your exact goal, timeline, difficulty and the details that actually change your plan.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(([id, label, description]) => <button key={id} type="button" onClick={() => { setCategory(id); setQuestions([]); setAnswers({}); }} className={`rounded-2xl border p-4 text-left transition ${category === id ? "border-cyan-300/25 bg-cyan-300/[0.07]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.045]"}`}><p className="text-sm font-black text-white">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></button>)}</div>{habits.length > 0 && <div className="mt-6 rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">Selected habits · AI context</p><div className="mt-3 flex flex-wrap gap-2">{habits.map((h) => <span key={h.id} className="rounded-full border border-white/[0.07] bg-black/10 px-2.5 py-1.5 text-xs font-bold text-slate-300">{h.emoji} {h.name}</span>)}</div></div>}</motion.div>}
        {step === "interview" && <motion.div key="interview" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">AI interview · {selected[1]}</p><h3 className="mt-2 text-2xl font-black text-white">Tell me what success looks like.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">The AI will ask follow-ups instead of assuming your schedule, ability or target. Answer the current questions and it will refine the next ones.</p>{questions.length === 0 ? <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /><span className="ml-3 text-sm text-slate-400">Preparing your questions…</span></div> : <div className="mt-7 space-y-4">{pending.slice(0, 3).map((q) => <QuestionField key={q.id} question={q} value={answers[q.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [q.id]: value }))} />)}</div>}{error && <p className="mt-4 rounded-xl border border-red-300/10 bg-red-300/[0.04] px-4 py-3 text-sm text-red-200">{error}</p>}</motion.div>}
        {step === "plan" && plan && <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.07] to-violet-300/[0.05] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Sparkles className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">AI-generated roadmap</p><h3 className="mt-1 text-2xl font-black text-white">{plan.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{plan.summary}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/[0.08] bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">{plan.durationDays} days</span><span className="rounded-full border border-white/[0.08] bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">{plan.difficulty}</span></div></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Milestones</p><div className="mt-4 space-y-3">{plan.milestones.map((m) => <div key={`${m.day}-${m.title}`} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><div className="flex items-center gap-2"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-1 text-[9px] font-black text-cyan-200">DAY {m.day}</span><h4 className="text-sm font-black text-white">{m.title}</h4></div><p className="mt-2 text-xs leading-5 text-slate-400">{m.outcome}</p><ul className="mt-3 space-y-1.5">{m.actions.map((a) => <li key={a} className="flex gap-2 text-xs leading-5 text-slate-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{a}</li>)}</ul></div>)}</div></section><div className="space-y-5"><section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Start today</p><ul className="mt-3 space-y-2">{plan.today.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300"><Target className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />{item}</li>)}</ul></section><section className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">Adaptive rule</p><p className="mt-2 text-sm leading-6 text-slate-400">{plan.adaptationRule}</p></section></div></div></motion.div>}
      </AnimatePresence></div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:px-7">{step === "category" && <><span className="text-xs text-slate-600">Your selected habits will be sent as context.</span><button type="button" onClick={start} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Start AI interview <ArrowRight className="h-4 w-4" /></button></>}{step === "interview" && <><button type="button" onClick={() => setStep("category")} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button>{pending.length === 0 ? <button type="button" onClick={build} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {loading ? "Building…" : "Build my roadmap"}</button> : <button type="button" onClick={continueInterview} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} {loading ? "Thinking…" : "Continue"}</button>}</>}{step === "plan" && <><span className="text-xs text-slate-600">Built from your answers and selected habits.</span><button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950"><Check className="h-4 w-4" /> Use this roadmap</button></>}</footer>
    </motion.div>
  </div>;
}

function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) {
  const common = "mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/25";
  return <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"><span className="text-sm font-black text-white">{question.question}{question.required && <span className="ml-1 text-cyan-300">*</span>}</span>{question.type === "choice" ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{(question.options ?? []).map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold ${value === option ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100" : "border-white/[0.07] text-slate-400 hover:text-white"}`}>{option}</button>)}</div> : question.type === "multiline" ? <textarea className={`${common} min-h-24 resize-y`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder} /> : <input className={common} type={question.type === "number" ? "number" : "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder} />}</label>;
}
