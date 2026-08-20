import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, LockKeyhole, Play, RotateCcw, Sparkles, X } from "lucide-react";

type QuizQuestion = { question: string; options: string[]; correct_answer: string };
export type LearningMilestone = { milestone_title: string; video_url: string; mind_map_url: string; revision_notes: string; quiz: QuizQuestion[] };

function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
      if (parsed.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${parsed.pathname.split("/")[2]}`;
    }
  } catch { /* fall through to the original URL */ }
  return url;
}

function QuizModal({ milestone, onClose, onPass }: { milestone: LearningMilestone; onClose: () => void; onPass: () => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(() => milestone.quiz.reduce((total, question, index) => total + (answers[index] === question.correct_answer ? 1 : 0), 0), [answers, milestone.quiz]);
  const passed = submitted && score >= Math.ceil(milestone.quiz.length * 0.7);

  const submit = () => { if (milestone.quiz.every((_, index) => Boolean(answers[index]))) setSubmitted(true); };
  const retry = () => { setAnswers({}); setSubmitted(false); };

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`${milestone.milestone_title} checkpoint quiz`}>
    <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-slate-950 shadow-2xl sm:rounded-[2rem]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-slate-950/95 px-5 py-4 backdrop-blur-xl sm:px-7"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300/70">Checkpoint quiz</p><h2 className="mt-1 text-lg font-black text-white">{milestone.milestone_title}</h2></div><button type="button" onClick={onClose} aria-label="Close quiz" className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button></header>
      <div className="space-y-5 p-5 sm:p-7">
        {milestone.quiz.map((question, index) => <fieldset key={`${question.question}-${index}`} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5"><legend className="max-w-full px-1 text-sm font-bold leading-6 text-white">{index + 1}. {question.question}</legend><div className="mt-3 space-y-2">{question.options.map((option) => <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${answers[index] === option ? "border-cyan-300/35 bg-cyan-300/[0.08] text-cyan-50" : "border-white/[0.06] text-slate-400 hover:border-white/15"}`}><input type="radio" name={`quiz-${index}`} value={option} checked={answers[index] === option} onChange={() => { if (!submitted) setAnswers((current) => ({ ...current, [index]: option })); }} className="mt-0.5 accent-cyan-300" disabled={submitted} />{option}</label>)}</div>{submitted && <p className={`mt-3 text-xs font-bold ${answers[index] === question.correct_answer ? "text-emerald-300" : "text-rose-300"}`}>{answers[index] === question.correct_answer ? "Correct" : `Correct answer: ${question.correct_answer}`}</p>}</fieldset>)}
        {submitted && <div className={`rounded-2xl border p-4 ${passed ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}><div className="flex items-center gap-2 font-black text-white">{passed ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <RotateCcw className="h-5 w-5 text-amber-300" />}{passed ? "Checkpoint passed" : "Almost there"}</div><p className="mt-1 text-xs text-slate-400">You scored {score}/{milestone.quiz.length}. {passed ? "Your revision materials are now unlocked." : "You need at least 70% to unlock the revision materials."}</p></div>}
        <div className="flex gap-2">{submitted && !passed && <button type="button" onClick={retry} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-black text-white"><RotateCcw className="h-4 w-4" />Try again</button>}{!submitted && <button type="button" disabled={Object.keys(answers).length !== milestone.quiz.length} onClick={submit} className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">Submit checkpoint</button>}{passed && <button type="button" onClick={() => { onPass(); onClose(); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-black text-slate-950"><CheckCircle2 className="h-4 w-4" />Unlock materials</button>}</div>
      </div>
    </section>
  </div>;
}

export function InteractiveLearningRoadmap({ milestones }: { milestones: LearningMilestone[] }) {
  const [activeQuiz, setActiveQuiz] = useState<LearningMilestone | null>(null);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  if (!milestones.length) return null;

  return <section className="space-y-5">
    <div className="flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-300/80"><Sparkles className="h-4 w-4" />Interactive learning path</div><h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Learn → check → unlock.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">Study the curated lesson first. Pass the checkpoint to unlock the mind map and quick revision material.</p></div><span className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 sm:block">{milestones.length} checkpoints</span></div>
    <div className="space-y-5">{milestones.map((milestone, index) => { const isUnlocked = Boolean(unlocked[milestone.milestone_title]); return <article key={`${milestone.milestone_title}-${index}`} className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.025] shadow-2xl">
      <div className="p-5 sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300/60">Milestone {index + 1}</p><h3 className="mt-1 text-xl font-black text-white sm:text-2xl">{milestone.milestone_title}</h3></div>{isUnlocked ? <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-black text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5" />Passed</span> : <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black text-slate-500"><LockKeyhole className="h-3.5 w-3.5" />Locked materials</span>}</div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30"><div className="aspect-video w-full">{milestone.video_url ? <iframe className="h-full w-full" src={youtubeEmbed(milestone.video_url)} title={milestone.milestone_title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <div className="flex h-full items-center justify-center text-sm text-slate-600">No curated video is available for this milestone.</div>}</div></div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">{isUnlocked ? "Checkpoint passed. Your revision materials are available below." : "Watch the lesson, then prove your understanding with the checkpoint."}</p><button type="button" onClick={() => setActiveQuiz(milestone)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200"><Play className="h-3.5 w-3.5" />Take Checkpoint Quiz</button></div>
      {isUnlocked && <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200/60">Mind map</p><h4 className="mt-1 text-sm font-black text-white">Unlocked study map</h4></div><ExternalLink className="h-4 w-4 text-emerald-200/60" /></div>{milestone.mind_map_url ? <a href={milestone.mind_map_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-bold text-emerald-200 hover:underline">Open mind map ↗</a> : <p className="mt-3 text-xs text-slate-600">No mind map is available yet.</p>}</div><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5"><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200/60">Quick revision</p><h4 className="mt-1 text-sm font-black text-white">Unlocked revision notes</h4><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-400">{milestone.revision_notes || "No quick revision notes are available yet."}</p></div></div>}
    </div></article>; })}</div>
    {activeQuiz && <QuizModal milestone={activeQuiz} onClose={() => setActiveQuiz(null)} onPass={() => setUnlocked((current) => ({ ...current, [activeQuiz.milestone_title]: true }))} />}
  </section>;
}
