import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Moon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { RoadmapOnboarding } from "@/components/roadmap/RoadmapOnboarding";
import { RoadmapVisualizer } from "@/components/roadmap/RoadmapVisualizer";
import { DailyFocusCard } from "@/components/roadmap/DailyFocusCard";
import { NightlyReviewModal } from "@/components/roadmap/NightlyReviewModal";
import { RoadmapEditDialog, type RoadmapEditPatch } from "@/components/roadmap/RoadmapEditDialog";
import { InteractiveLearningRoadmap, type LearningMilestone } from "@/components/roadmap/InteractiveLearningRoadmap";
import { supabase } from "@/integrations/supabase/client";
import { useRoadmap } from "@/hooks/use-roadmap";

export const Route = createFileRoute("/roadmap")({ component: RoadmapPage });

function RoadmapPage() {
  const roadmap = useRoadmap();
  const [category, setCategory] = useState("skill_learning");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nightlyOpen, setNightlyOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [askingAI, setAskingAI] = useState(false);

  useEffect(() => { if (!roadmap.loading && !roadmap.roadmap) setShowOnboarding(true); }, [roadmap.loading, roadmap.roadmap]);
  const startOnboarding = async () => { try { await roadmap.askQuestions(category, {}); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not start roadmap intake."); } };
  const generate = async () => { try { const result = await roadmap.generate(category, roadmap.answers); if (result?.needsMoreInfo) { setShowOnboarding(true); return; } if (!result?.roadmapId) throw new Error("Roadmap was generated but no saved roadmap ID was returned."); if (result?.structuredContent) { const { error } = await (supabase.from("roadmaps") as any).update({ structured_content: result.structuredContent }).eq("id", result.roadmapId); if (error) throw error; } setShowOnboarding(false); toast.success("Your learning roadmap is ready."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); } };
  const handleReview = async (reflection: string, energy: number, difficulty: number) => { setReviewing(true); try { const result = await roadmap.saveNightlyReview(reflection, energy, difficulty); toast.success(result?.reason || result?.analysis?.summary || "Tomorrow's schedule has been adapted."); setNightlyOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save nightly review."); } finally { setReviewing(false); } };
  const saveEdit = async (patch: RoadmapEditPatch) => {
    const current = roadmap.roadmap;
    if (!current) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.from("roadmaps").update({ title: patch.title, goal: patch.goal }).eq("id", current.id).eq("user_id", current.user_id);
      if (error) throw error;
      await roadmap.load(current.id);
      setEditOpen(false);
      toast.success("Roadmap updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update roadmap.");
    } finally {
      setSavingEdit(false);
    }
  };
  const askAIToEdit = async (request: string) => {
    const current = roadmap.roadmap;
    if (!current) return;
    setAskingAI(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in first.");
      const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "edit", roadmapId: current.id, request }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not apply suggested changes.");
      if (result.changed === false) { toast.success("No roadmap changes were needed."); return; }
      await roadmap.load(current.id);
      setEditOpen(false);
      toast.success(result.message || "Suggested roadmap changes applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply suggested changes.");
    } finally {
      setAskingAI(false);
    }
  };

  const completedCount = useMemo(() => roadmap.tasks.filter((task) => task.progress === "completed").length, [roadmap.tasks]);
  const totalRequired = useMemo(() => roadmap.tasks.filter((task) => task.is_required).length, [roadmap.tasks]);
  const overallProgress = totalRequired ? Math.round((completedCount / totalRequired) * 100) : 0;
  const nextTask = roadmap.todayTasks.find((task) => task.progress !== "completed");
  const learningMilestones = useMemo<LearningMilestone[]>(() => { const value = roadmap.roadmap?.structured_content?.milestones; if (!Array.isArray(value)) return []; return value.filter((item: any) => item && typeof item === "object" && typeof item.milestone_title === "string" && Array.isArray(item.quiz)) as LearningMilestone[]; }, [roadmap.roadmap]);

  if (roadmap.loading) return <main className="min-h-screen bg-slate-950 px-4 py-16 text-center text-sm text-slate-500">Preparing your roadmap…</main>;
  if (showOnboarding || !roadmap.roadmap) return <main className="min-h-screen bg-[#020617] px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl py-8 sm:py-16"><div className="mx-auto mb-8 max-w-2xl text-center"><div className="text-[9px] font-black uppercase tracking-[.2em] text-blue-300">OUTSTAND / ROADMAP</div><h1 className="mt-4 text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">A plan for your goal.<br /><span className="text-blue-200">A schedule you can follow.</span></h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Set the outcome, your available time and your starting point. OUTSTAND turns that information into specific blocks and adapts the plan as your days change.</p></div>{roadmap.questions.length === 0 ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"><label className="text-xs font-black uppercase tracking-[.16em] text-slate-500">What are you building toward?</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-slate-900 px-4 py-3 text-sm font-bold text-white"><option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option></select><button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-200">Build my schedule <ChevronRight className="h-4 w-4" /></button></section> : <RoadmapOnboarding questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}</div></main>;

  return <main className="min-h-screen bg-[#020617] px-4 py-5 pb-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl space-y-7"><header className="overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_40px_120px_-80px_rgba(34,211,238,.45)] sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-blue-300/80"><CalendarDays className="h-4 w-4" />Day {roadmap.todayIndex} of {roadmap.roadmap.duration_days} · Execution plan</div><h1 className="mt-3 text-3xl font-black tracking-[-.035em] text-white sm:text-5xl">{roadmap.roadmap.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{roadmap.roadmap.goal}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-blue-300/15 bg-blue-300/[0.06] px-4 py-2.5 text-xs font-black text-blue-100"><Pencil className="h-4 w-4" />Edit roadmap</button><button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200"><Moon className="h-4 w-4" />Nightly review</button><button type="button" onClick={() => { roadmap.setAnswers({}); setShowOnboarding(true); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-300">New roadmap</button></div></div>{nextTask && <div className="mt-7 rounded-2xl border border-blue-300/15 bg-blue-300/[0.055] p-4 sm:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-200/70">Next up</p><h2 className="mt-1 text-lg font-black text-white">{nextTask.title}</h2><p className="mt-1 text-xs text-blue-100/50">{nextTask.start_time || "Flexible"} — {nextTask.end_time || ""} · {nextTask.estimated_minutes || 30} min</p></div><ChevronRight className="hidden h-5 w-5 text-blue-300/50 sm:block" /></div></div>}{completedCount > 0 && <div className="mt-6"><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.15em] text-slate-600"><span>Execution progress</span><span className="tabular-nums">{overallProgress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full origin-left rounded-full bg-blue-300 transition-transform duration-700 ease-out will-change-transform" style={{ transform: `scaleX(${overallProgress / 100})` }} /></div></div>}</header>{learningMilestones.length > 0 && <InteractiveLearningRoadmap milestones={learningMilestones} />}<DailyFocusCard tasks={roadmap.todayTasks} onToggle={roadmap.toggleTask} loading={roadmap.generating} /><div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]"><RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} /><section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-blue-300/80">How the plan works</div><h2 className="mt-2 text-2xl font-black text-white">One day at a time.</h2><div className="mt-6 space-y-4"><div className="rounded-2xl border border-white/[0.06] p-4"><p className="text-sm font-black text-white">01 · Follow the clock</p><p className="mt-1 text-xs leading-5 text-slate-500">Each block has a start time, end time, instructions, and a clear definition of done.</p></div><div className="rounded-2xl border border-white/[0.06] p-4"><p className="text-sm font-black text-white">02 · Finish the block</p><p className="mt-1 text-xs leading-5 text-slate-500">Mark it complete only when the success criteria are actually met.</p></div><div className="rounded-2xl border border-white/[0.06] p-4"><p className="text-sm font-black text-white">03 · Reflect tonight</p><p className="mt-1 text-xs leading-5 text-slate-500">Your completion, difficulty, energy and reflection shape tomorrow's schedule.</p></div></div></section></div></div><NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} submitting={reviewing} /><RoadmapEditDialog open={editOpen} initial={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} onClose={() => setEditOpen(false)} onSave={saveEdit} onAskAI={askAIToEdit} saving={savingEdit} askingAI={askingAI} /></main>;
}
