import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, Loader2, Sparkles, Target, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Habit } from "@/lib/habits";

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
  { id: "academics", label: "Exams & academics", description: "Marks, boards, syllabus, subjects, exam preparation" },
  { id: "fitness", label: "Fitness", description: "Strength, conditioning, sport readiness and healthy routines" },
  { id: "business", label: "Business", description: "Build, validate or grow a business idea" },
  { id: "money", label: "Money & earning", description: "Build skills and a realistic path toward earning" },
  { id: "skill", label: "Learn a skill", description: "Programming, editing, design, language or another skill" },
  { id: "content", label: "Content creation", description: "YouTube, social media, editing and creator workflows" },
  { id: "sports", label: "Sports & chess", description: "Improve performance, rating, technique or competition results" },
  { id: "productivity", label: "Habits & productivity", description: "Focus, routines, consistency and behavior change" },
  { id: "custom", label: "Something else", description: "A goal that does not fit the categories above" },
];

const difficultyOptions = ["Gentle", "Balanced", "Challenging"];

export function AIRoadmapBuilder({ habits, name, level, xp, streak, onClose, onPlanCreated }: { habits: Habit[]; name: string; level: number; xp: number; streak: number; onClose: () => void; onPlanCreated: (plan: Plan) => void }) {
  const [category, setCategory] = useState("academics");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<"category" | "interview" | "plan">("category");

  const selectedCategory = useMemo(() => categories.find((item) => item.id === category) ?? categories[0], [category]);
  const visibleQuestions = questions.filter((question) => !answers[question.id]?.trim());
  const answeredCount = questions.length - visibleQuestions.length;

  useEffect(() => {
    setQuestions([]);
    setAnswers({});
    setPlan(null);
    setStep("category");
    setError(null);
  }, [category]);

  async function callRoadmap(mode: "questions" | "plan") {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode, category, answers, habits: habits.map((habit) => ({ id: habit.id, name: habit.name, emoji: habit.emoji })), context: { name, level, xp, streak } }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The AI roadmap service is unavailable.");
      if (mode === "questions") {
        const next = Array.isArray(data.questions) ? data.questions as Question[] : [];
        if (!next.length) throw new Error("The AI needs a little more information. Please try again.");
        setQuestions((current) => [...current, ...next.filter((question) => !current.some((item) => item.id === question.id))]);
        setStep("interview");
      } else {
        setPlan(data.plan as Plan);
        setStep("plan");
        onPlanCreated(data.plan as Plan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    setStep("interview");
    void callRoadmap("questions");
  }

  function askNext() {
    const missingRequired = questions.find((question) => question.required && !answers[question.id]?.trim());
    if (missingRequired) {
      setError(`Please answer: ${missingRequired.question}`);
      return;
    }
    void callRoadmap("questions");
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
    <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#080b13] shadow-[0_30px_120px_-35px_rgba(34,211,238,.35)]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Brain className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">OUTSTAND Intelligence</p><h2 className="text-lg font-black text-white">Build your roadmap</h2></div></div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] text-slate-500 transition hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {step === "category" && <motion.div key="category" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">First, give the AI a direction</p><h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">What kind of goal are we building around?</h3><p className="mt-3 text-sm leading-6 text-slate-400">This only tells the interviewer which questions matter. The AI will ask for your exact goal next.</p></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`rounded-2xl border p-4 text-left transition ${category === item.id ? "border-cyan-300/25 bg-cyan-300/[0.07]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]"}`}><p className="text-sm font-black text-white">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></button>)}</div>
            {habits.length > 0 && <div className="mt-6 rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">Your selected habits will be used as signals</p><div className="mt-3 flex flex-wrap gap-2">{habits.map((habit) => <span key={habit.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-black/10 px-2.5 py-1.5 text-xs font-bold text-slate-300">{habit.emoji} {habit.name}</span>)}</div></div>}
          </motion.div>}

          {step === "interview" && <motion.div key="interview" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">AI interview · {selectedCategory.label}</p><h3 className="mt-2 text-2xl font-black tracking-tight text-white">Let's make this specific to you.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Answer honestly. The AI will ask follow-up questions when your answer changes what the roadmap should look like.</p></div><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] font-bold text-slate-500">{answeredCount} answered</div></div>
            {questions.length === 0 ? <div className="mt-10 flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /><span className="ml-3 text-sm text-slate-400">AI is preparing the right questions…</span></div> : <div className="mt-7 space-y-4">{visibleQuestions.slice(0, 3).map((question) => <QuestionField key={question.id} question={question} value={answers[question.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />)}</div>}
            {error && <p className="mt-4 rounded-xl border border-red-300/10 bg-red-300/[0.04] px-4 py-3 text-sm text-red-200">{error}</p>}
          </motion.div>}

          {step === "plan" && plan && <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.07] to-violet-300/[0.05] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Sparkles className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Personalized roadmap</p><h3 className="mt-1 text-2xl font-black text-white">{plan.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{plan.summary}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/[0.08] bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">{plan.durationDays} days</span><span className="rounded-full border border-white/[0.08] bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">{plan.difficulty}</span></div></div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Milestones</p><div className="mt-4 space-y-3">{plan.milestones.map((milestone) => <div key={`${milestone.day}-${milestone.title}`} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><div className="flex items-center gap-2"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-1 text-[9px] font-black text-cyan-200">DAY {milestone.day}</span><h4 className="text-sm font-black text-white">{milestone.title}</h4></div><p className="mt-2 text-xs leading-5 text-slate-400">{milestone.outcome}</p><ul className="mt-3 space-y-1.5">{milestone.actions.map((action) => <li key={action} className="flex gap-2 text-xs leading-5 text-slate-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{action}</li>)}</ul></div>)}</div></section>
              <div className="space-y-5"><section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Start today</p><ul className="mt-3 space-y-2">{plan.today.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300"><Target className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />{item}</li>)}</ul></section><section className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">How the AI will adapt it</p><p className="mt-2 text-sm leading-6 text-slate-400">{plan.adaptationRule}</p></section></div>
            </div>
            {plan.assumptions.length > 0 && <p className="mt-5 text-xs leading-5 text-slate-600">Planning assumptions: {plan.assumptions.join(" · ")}</p>}
          </motion.div>}
        </AnimatePresence>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:px-7">
        {step === "category" && <><span className="text-xs text-slate-600">The AI will interview you before planning.</span><button type="button" onClick={startInterview} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-50 disabled:opacity-50">Start AI interview <ArrowRight className="h-4 w-4" /></button></>}
        {step === "interview" && <><button type="button" onClick={() => setStep("category")} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/[0.04] hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" onClick={askNext} disabled={loading || visibleQuestions.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-50 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} {loading ? "Thinking…" : "Continue"}</button></>}
        {step === "plan" && <><span className="text-xs text-slate-600">Built from your answers and selected habits.</span><button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950"><Check className="h-4 w-4" /> Use this roadmap</button></>}
      </footer>
    </motion.div>
  </div>;
}

function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) {
  const common = "mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/25 focus:bg-white/[0.035]";
  return <label className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"><span className="flex items-center gap-2 text-sm font-black text-white">{question.question}{question.required && <span className="text-cyan-300">*</span>}</span>{question.type === "choice" ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{(question.options ?? []).map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${value === option ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100" : "border-white/[0.07] text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}>{option}</button>)}</div> : question.type === "multiline" ? <textarea className={`${common} min-h-24 resize-y`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={question.placeholder} /> : <input className={common} type={question.type === "number" ? "number" : "text"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={question.placeholder} />}</label>;
}
