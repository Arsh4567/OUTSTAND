import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { RoadmapQuestion } from "@/hooks/use-roadmap";

type Props = {
  questions: RoadmapQuestion[];
  answers: Record<string, unknown>;
  onChange: (answers: Record<string, unknown>) => void;
  onNext: () => Promise<unknown>;
  generating: boolean;
};

export function RoadmapOnboarding({ questions, answers, onChange, onNext, generating }: Props) {
  const [index, setIndex] = useState(0);
  const current = questions[index];

  useEffect(() => setIndex(0), [questions.length]);

  const value = current ? String(answers[current.id] ?? "") : "";
  const canContinue = !current?.required || value.trim().length > 0;
  const progress = useMemo(() => questions.length ? ((index + 1) / questions.length) * 100 : 0, [index, questions.length]);

  if (!current) return null;

  const setValue = (next: string) => onChange({ ...answers, [current.id]: next });

  const next = async () => {
    if (!canContinue) return;
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    await onNext();
  };

  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/80"><Sparkles className="h-4 w-4" />Personalized intake</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Let’s build around your actual life.</h2>
        </div>
        <span className="text-xs font-bold text-slate-500">{index + 1}/{questions.length}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-8">
        <label className="text-lg font-bold leading-7 text-white">{current.question}</label>
        {current.type === "choice" ? (
          <div className="mt-5 grid gap-2">
            {(current.options || []).map((option) => (
              <button key={option} type="button" onClick={() => setValue(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${value === option ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/[0.08] bg-black/10 text-slate-300 hover:border-white/20"}`}>{option}</button>
            ))}
          </div>
        ) : current.type === "multiline" ? (
          <textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={current.placeholder} rows={5} className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/30" />
        ) : (
          <input type={current.type === "number" ? "number" : "text"} value={value} onChange={(event) => setValue(event.target.value)} placeholder={current.placeholder} className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/30" />
        )}
      </div>
      <button type="button" disabled={!canContinue || generating} onClick={() => void next()} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
        {generating ? "Building your roadmap…" : index === questions.length - 1 ? "Generate roadmap" : "Continue"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
