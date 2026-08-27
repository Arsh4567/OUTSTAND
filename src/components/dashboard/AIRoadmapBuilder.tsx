import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, Loader2, Sparkles, Target, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Habit } from "@/lib/habits";
import { roadmapCreationLimitMessage, useRoadmapCreationLimit } from "@/hooks/use-roadmap-creation-limit";

type Category = { id: string; label: string; description: string };
type Question = { id: string; question: string; type: "text" | "number" | "choice" | "multiline"; required: boolean; options?: string[]; placeholder?: string };
type Plan = {
  title: string;
  summary: string;
  durationDays: number;
  difficulty: string;
  assumptions: string[];
  milestones: { day: number; title: string; outcome: string; actions: string[] }[];
  today: string[];
  metrics: string[];
  adaptationRule: string;
};

const categories: Category[] = [
  { id: "academics", label: "Exams & academics", description: "Marks, boards, syllabus, subjects, exam preparation" }, { id: "fitness", label: "Fitness", description: "Strength, conditioning, sport readiness and healthy routines" },
  { id: "business", label: "Business", description: "Build, validate or grow a business idea" }, { id: "money", label: "Money & earning", description: "Build skills and a realistic path toward earning" },
  { id: "skill", label: "Learn a skill", description: "Programming, editing, design, language or another skill" }, { id: "content", label: "Content creation", description: "YouTube, social media, editing and creator workflows" },
  { id: "sports", label: "Sports & chess", description: "Improve performance, rating, technique or competition results" }, { id: "productivity", label: "Habits & productivity", description: "Focus, routines, consistency and behavior change" },
  { id: "custom", label: "Something else", description: "A goal that does not fit the categories above" },
];

export function AIRoadmapBuilder({ habits, name, level, xp, streak, onClose, onPlanCreated }: { habits: Habit[]; name: string; level: number; xp: number; streak: number; onClose: () => void; onPlanCreated: (plan: Plan) => void }) {
  const [category, setCategory] = useState("academics");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<"category" | "interview" | "plan">("category");
  const limit = useRoadmapCreationLimit();

  const selectedCategory = useMemo(() => categories.find((item) => item.id === category) ?? categories[0], [category]);
  const unansweredQuestions = questions.filter((question) => !answers[question.id]?.trim());
  const answeredCount = questions.length - unansweredQuestions.length;

  useEffect(() => { setQuestions([]); setAnswers({}); setPlan(null); setStep("category"); setError(null); }, [category]);

  async function callRoadmap(mode: "questions" | "plan") {
    if (mode === "plan") {
      const latest = await limit.refresh();
      if (!latest.allowed) { setError(roadmapCreationLimitMessage(latest)); return; }
    }
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode, category, answers, habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji })), context: { name, level, xp, streak } }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The AI roadmap service is unavailable.");
      if (mode === "questions") {
        const next = Array.isArray(data.questions) ? data.questions as Question[] : [];
        if (!next.length) throw new Error("The AI needs a little more information. Please try again.");
        setQuestions((current) => [...current, ...next.filter((question) => !current.some((item) => item.id === question.id))]); setStep("interview");
      } else { setPlan(data.plan as Plan); setStep("plan"); onPlanCreated(data.plan as Plan); await limit.refresh(); }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  function startInterview() { setStep("interview"); void callRoadmap("questions"); }
  function askNext() { const missingRequired = questions.find((question) => question.required && !answers[question.id]?.trim()); if (missingRequired) { setError(`Please answer: ${missingRequired.question}`); return; } void callRoadmap("questions"); }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
    <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#080b13] shadow-[0_30px_120px_-35px_rgba(34,211,238,.35)]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Brain className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">OUTSTAND Intelligence</p><h2 className="text-lg font-black text-white">Build your roadmap</h2></div></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] text-slate-500 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
        {step === "category" && <section><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">AI roadmap interview</p><h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">What kind of goal are we solving?</h3></div><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-right"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Roadmaps</p><p className="text-sm font-black text-white">{limit.count}/4</p></div></div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Choose a direction. The AI will ask for your exact goal, timeline, difficulty and the details that actually change your plan.</p>{!limit.allowed && <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-sm text-amber-100">{roadmapCreationLimitMessage(limit)}</p>}<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(([id, label, description]) => <button key={id} type="button" onClick={() => { setCategory(id); setQuestions([]); setAnswers({}); setError(""); }} className={`rounded-2xl border p-4 text-left transition ${category === id ? "border-cyan-300/25 bg-cyan-300/[0.07]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.045]"}`}><p className="text-sm font-black text-white">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></button>)}</div></section>}
        {step === "interview" && <section><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">AI interview · {selectedCategory[1]}</p><h3 className="mt-2 text-2xl font-black text-white">Tell me what success looks like.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your answers stay on screen while you type. Continue when the current questions are complete.</p>{questions.length === 0 ? <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /><span className="ml-3 text-sm text-slate-400">Preparing your questions…</span></div> : <div className="mt-7 space-y-4">{questions.map((q) => <QuestionField key={q.id} question={q} value={answers[q.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [q.id]: value }))} />)}</div>}{error && <p className="mt-4 rounded-xl border border-red-300/10 bg-red-300/[0.04] px-4 py-3 text-sm text-red-200">{error}</p>}</section>}
        {step === "plan" && plan && <section><div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.07] to-violet-300/[0.05] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Sparkles className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">AI-generated roadmap</p><h3 className="mt-1 text-2xl font-black text-white">{plan.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{plan.summary}</p></div></div></div></section>}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:px-7">{step === "category" && <><span className="text-xs text-slate-600">{limit.loading ? "Checking roadmap allowance…" : `${limit.count}/4 roadmaps available`}</span><button type="button" onClick={startInterview} disabled={loading || limit.loading || !limit.allowed} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Start AI interview <ArrowRight className="h-4 w-4" /></button></>}{step === "interview" && <><button type="button" onClick={() => setStep("category")} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" onClick={askNext} disabled={loading || !allAnswered} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {loading ? "Thinking…" : answeredCount === questions.length ? "Build roadmap" : "Continue"}</button></>}{step === "plan" && <><span className="text-xs text-slate-600">Saved securely to your account.</span><button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950"><Check className="h-4 w-4" /> Use this roadmap</button></>}</footer>
    </motion.div>
  </div>;
}

function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="text-xs font-bold text-slate-300">{question.question}</span>{question.type === "choice" ? <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07101f] px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/40"><option value="">Select…</option>{question.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07101f] px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/40" />}</label>; }
