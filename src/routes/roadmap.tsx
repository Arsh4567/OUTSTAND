import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Moon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RoadmapOnboarding } from "@/components/roadmap/RoadmapOnboarding";
import { RoadmapVisualizer } from "@/components/roadmap/RoadmapVisualizer";
import { DailyFocusCard } from "@/components/roadmap/DailyFocusCard";
import { NightlyReviewModal } from "@/components/roadmap/NightlyReviewModal";
import { useRoadmap } from "@/hooks/use-roadmap";

export const Route = createFileRoute("/roadmap")({ component: RoadmapPage });

function RoadmapPage() {
  const roadmap = useRoadmap();
  const [category, setCategory] = useState("skill_learning");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nightlyOpen, setNightlyOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (!roadmap.loading && !roadmap.roadmap) setShowOnboarding(true);
  }, [roadmap.loading, roadmap.roadmap]);

  const startOnboarding = async () => {
    try { await roadmap.askQuestions(category, {}); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not start roadmap intake."); }
  };

  const generate = async () => {
    try { await roadmap.generate(category, roadmap.answers); setShowOnboarding(false); toast.success("Your roadmap is ready."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); }
  };

  const handleReview = async (reflection: string, energy: number, difficulty: number) => {
    setReviewing(true);
    try { const result = await roadmap.saveNightlyReview(reflection, energy, difficulty); toast.success(result?.reason || "Nightly review complete."); setNightlyOpen(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save nightly review."); }
    finally { setReviewing(false); }
  };

  if (roadmap.loading) return <main className="min-h-screen bg-slate-950 px-4 py-16 text-center text-sm text-slate-500">Loading your roadmap…</main>;

  if (showOnboarding || !roadmap.roadmap) return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.08),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,.08),transparent_32%),#020617] px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl py-8 sm:py-16"><div className="mx-auto mb-7 max-w-2xl text-center"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/10 bg-cyan-300/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.2em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" />OUTSTAND ROADMAP ENGINE</div><h1 className="mt-4 text-4xl font-black tracking-[-.04em] text-white sm:text-5xl">Build a roadmap that adapts to you.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Start with the outcome. OUTSTAND will ask only the questions that materially change the plan.</p></div>{roadmap.questions.length === 0 ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"><label className="text-xs font-black uppercase tracking-[.16em] text-slate-500">What are you building toward?</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-slate-900 px-4 py-3 text-sm font-bold text-white"><option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option></select><button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Start personalized intake</button></section> : <RoadmapOnboarding questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}</div></main>;

  const completed = roadmap.todayTasks.filter((task) => task.progress === "completed").length;
  const percent = roadmap.todayTasks.length ? Math.round((completed / roadmap.todayTasks.length) * 100) : 0;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.07),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,.07),transparent_32%),#020617] px-4 py-5 pb-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-5"><header className="rounded-[2.2rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/80"><CalendarDays className="h-4 w-4" />Personal roadmap · Day {roadmap.todayIndex} / {roadmap.roadmap.duration_days}</div><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{roadmap.roadmap.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{roadmap.roadmap.goal}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-4 py-2.5 text-xs font-black text-violet-100"><Moon className="h-4 w-4" />Nightly review</button><button type="button" onClick={() => { roadmap.setAnswers({}); setShowOnboarding(true); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-300">New roadmap</button></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Today</p><p className="mt-1 text-xl font-black text-white">{percent}%</p><p className="mt-1 text-xs text-slate-600">{completed} of {roadmap.todayTasks.length} tasks complete</p></div><div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Milestones</p><p className="mt-1 text-xl font-black text-white">{roadmap.milestones.length}</p><p className="mt-1 text-xs text-slate-600">Across your full roadmap</p></div><div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Method</p><p className="mt-1 text-xl font-black text-white">Adaptive</p><p className="mt-1 text-xs text-slate-600">AI adjusts from nightly evidence</p></div></div></header><div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]"><DailyFocusCard tasks={roadmap.todayTasks} onToggle={roadmap.toggleTask} /><RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} /></div></div><NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} submitting={reviewing} /></main>;
}
