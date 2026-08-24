import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, Clock3, Pencil, RotateCcw, ShieldCheck, Target } from "lucide-react";
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

function daysBetween(start: string, target: string) {
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${target}T00:00:00`);
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

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
  const generate = async () => { try { const result = await roadmap.generate(category, roadmap.answers); if (result?.needsMoreInfo) { setShowOnboarding(true); return; } if (!result?.roadmapId) throw new Error("Roadmap was generated but no saved roadmap ID was returned."); if (result?.structuredContent) { const { error } = await (supabase.from("roadmaps") as any).update({ structured_content: result.structuredContent }).eq("id", result.roadmapId); if (error) throw error; } setShowOnboarding(false); toast.success("Your roadmap is ready."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); } };
  const handleReview = async (reflection: string, energy: number, difficulty: number) => { setReviewing(true); try { const result = await roadmap.saveNightlyReview(reflection, energy, difficulty); toast.success(result?.reason || result?.analysis?.summary || "Tomorrow's priorities were adjusted."); setNightlyOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save nightly review."); } finally { setReviewing(false); } };
  const saveEdit = async (patch: RoadmapEditPatch) => {
    const current = roadmap.roadmap; if (!current) return; setSavingEdit(true);
    try { const { error } = await supabase.from("roadmaps").update({ title: patch.title, goal: patch.goal }).eq("id", current.id).eq("user_id", current.user_id); if (error) throw error; await roadmap.load(current.id); setEditOpen(false); toast.success("Roadmap updated."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update roadmap."); }
    finally { setSavingEdit(false); }
  };
  const askAIToEdit = async (request: string) => {
    const current = roadmap.roadmap; if (!current) return; setAskingAI(true);
    try { const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in first."); const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "edit", roadmapId: current.id, request }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not apply suggested changes."); if (result.changed === false) { toast.success("No roadmap changes were needed."); return; } await roadmap.load(current.id); setEditOpen(false); toast.success(result.message || "Roadmap updated."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not apply suggested changes."); }
    finally { setAskingAI(false); }
  };

  const requiredTasks = useMemo(() => roadmap.tasks.filter((task) => task.is_required), [roadmap.tasks]);
  const completedCount = useMemo(() => requiredTasks.filter((task) => task.progress === "completed").length, [requiredTasks]);
  const overallProgress = requiredTasks.length ? Math.round((completedCount / requiredTasks.length) * 100) : 0;
  const todayTasks = roadmap.todayTasks;
  const todayRequired = todayTasks.filter((task) => task.is_required);
  const todayCompleted = todayRequired.filter((task) => task.progress === "completed").length;
  const todayPercent = todayRequired.length ? Math.round((todayCompleted / todayRequired.length) * 100) : 0;
  const nextTask = todayTasks.find((task) => task.progress !== "completed");
  const learningMilestones = useMemo<LearningMilestone[]>(() => { const value = roadmap.roadmap?.structured_content?.milestones; if (!Array.isArray(value)) return []; return value.filter((item: any) => item && typeof item === "object" && typeof item.milestone_title === "string" && Array.isArray(item.quiz)) as LearningMilestone[]; }, [roadmap.roadmap]);
  const targetDate = roadmap.roadmap?.target_date ? new Date(`${roadmap.roadmap.target_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
  const daysLeft = roadmap.roadmap?.target_date && roadmap.roadmap?.start_date ? daysBetween(new Date().toISOString().slice(0, 10), roadmap.roadmap.target_date) : roadmap.roadmap?.duration_days || 0;
  const onTrack = roadmap.todayIndex <= roadmap.roadmap?.duration_days && overallProgress >= Math.max(0, Math.round(((roadmap.todayIndex - 1) / Math.max(1, roadmap.roadmap?.duration_days || 1)) * 100)) - 10;

  if (roadmap.loading) return <main className="min-h-screen bg-slate-950 px-4 py-16 text-center text-sm text-slate-500">Preparing your roadmap…</main>;
  if (showOnboarding || !roadmap.roadmap) return <main className="min-h-screen bg-[#020617] px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl py-8 sm:py-16"><div className="mx-auto mb-8 max-w-2xl text-center"><div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/80">OUTSTAND / ROADMAP</div><h1 className="mt-4 text-4xl font-black tracking-[-.045em] text-white sm:text-6xl">Understand the goal.<br /><span className="text-cyan-200">Then make every day count.</span></h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Tell OUTSTAND what success means, where you are starting, how much time you really have, and what cannot move. The planner turns that into measurable outcomes and a practical daily path.</p></div>{roadmap.questions.length === 0 ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"><label className="text-xs font-black uppercase tracking-[.16em] text-slate-500">What are you trying to achieve?</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-slate-900 px-4 py-3 text-sm font-bold text-white"><option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option></select><button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Start with the important questions <ChevronRight className="h-4 w-4" /></button></section> : <RoadmapOnboarding questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}</div></main>;

  return <main className="min-h-screen bg-[#020617] px-4 py-5 pb-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl space-y-5 sm:space-y-7">
    <header className="overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-white/[0.025] shadow-[0_40px_120px_-80px_rgba(34,211,238,.35)]">
      <div className="p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/75"><CalendarDays className="h-4 w-4" />Day {roadmap.todayIndex} of {roadmap.roadmap.duration_days}<span className="text-slate-700">·</span><span>{daysLeft} days left</span></div><h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">{roadmap.roadmap.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{roadmap.roadmap.goal}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200"><Pencil className="h-4 w-4" />Edit</button><button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200"><RotateCcw className="h-4 w-4" />Review</button><button type="button" onClick={() => { roadmap.setAnswers({}); setShowOnboarding(true); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-400">New roadmap</button></div></div>

        <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><Target className="h-4 w-4 text-cyan-300/70" /><p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Outcome</p><p className="mt-1 text-sm font-black text-white">Measurable target</p><p className="mt-1 text-[11px] text-slate-600">Every phase has a proof point.</p></div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><Clock3 className="h-4 w-4 text-cyan-300/70" /><p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Deadline</p><p className="mt-1 text-sm font-black text-white">{targetDate || "Set in your intake"}</p><p className="mt-1 text-[11px] text-slate-600">The planner protects the date first.</p></div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><CheckCircle2 className="h-4 w-4 text-cyan-300/70" /><p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Progress</p><p className="mt-1 text-sm font-black text-white">{overallProgress}% proven</p><p className="mt-1 text-[11px] text-slate-600">{completedCount} of {requiredTasks.length} required actions complete.</p></div>
          <div className={`rounded-2xl border p-4 ${onTrack ? "border-emerald-300/10 bg-emerald-300/[0.025]" : "border-amber-300/15 bg-amber-300/[0.025]"}`}>{onTrack ? <ShieldCheck className="h-4 w-4 text-emerald-300/75" /> : <AlertTriangle className="h-4 w-4 text-amber-300/75" />}<p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Trajectory</p><p className="mt-1 text-sm font-black text-white">{onTrack ? "On track" : "Recovery needed"}</p><p className="mt-1 text-[11px] text-slate-600">{onTrack ? "Keep the next action small and precise." : "Low-value work should be cut before the deadline moves."}</p></div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-5 py-4 sm:px-8"><div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-600"><span>Roadmap progress</span><span className="tabular-nums">Phase {Math.min(roadmap.milestones.length || 1, roadmap.todayIndex)} · {todayPercent}% today</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-300 transition-all duration-700" style={{ width: `${overallProgress}%` }} /></div></div>
    </header>

    {nextTask && <section className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-5 sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70"><CrosshairIcon />Next</div><h2 className="mt-2 text-2xl font-black tracking-tight text-white">{nextTask.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">This is the next action with the highest leverage in today's schedule.</p></div><div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3 lg:min-w-[290px]"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Do it now</p><p className="mt-1 text-sm font-black text-white">{nextTask.estimated_minutes || 30} min · {nextTask.start_time || "Flexible"}–{nextTask.end_time || ""}</p><p className="mt-1 text-[11px] text-slate-600">{nextTask.success_criteria || "Finish the block and record the result."}</p></div></div></section>}

    <DailyFocusCard tasks={todayTasks} onToggle={roadmap.toggleTask} loading={roadmap.generating} />

    <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} />
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/75">Why</div><h2 className="mt-2 text-2xl font-black text-white">Every action has a reason.</h2><p className="mt-2 text-sm leading-6 text-slate-500">The planner should connect today's work to the weakness, outcome, or checkpoint it is meant to move.</p><div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Mastery loop</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-300"><span className="rounded-full bg-white/[0.04] px-3 py-1.5">Learn</span><ChevronRight className="my-1 h-3 w-3 text-slate-700" /><span className="rounded-full bg-white/[0.04] px-3 py-1.5">Practice</span><ChevronRight className="my-1 h-3 w-3 text-slate-700" /><span className="rounded-full bg-white/[0.04] px-3 py-1.5">Test</span><ChevronRight className="my-1 h-3 w-3 text-slate-700" /><span className="rounded-full bg-white/[0.04] px-3 py-1.5">Repair</span><ChevronRight className="my-1 h-3 w-3 text-slate-700" /><span className="rounded-full bg-white/[0.04] px-3 py-1.5">Retest</span></div></div></section>
        <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/75">If you fall behind</div><h2 className="mt-2 text-2xl font-black text-white">Protect the deadline, not the checklist.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Missed work should trigger priority recalculation. OUTSTAND can preserve the important outcome while dropping or compressing lower-value tasks.</p><div className="mt-5 grid gap-2 sm:grid-cols-3"><div className="rounded-2xl border border-white/[0.06] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">1</p><p className="mt-1 text-xs font-bold text-white">Re-rank</p><p className="mt-1 text-[10px] leading-4 text-slate-600">Prioritize outcome-critical work.</p></div><div className="rounded-2xl border border-white/[0.06] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">2</p><p className="mt-1 text-xs font-bold text-white">Compress</p><p className="mt-1 text-[10px] leading-4 text-slate-600">Reduce volume before quality.</p></div><div className="rounded-2xl border border-white/[0.06] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">3</p><p className="mt-1 text-xs font-bold text-white">Retest</p><p className="mt-1 text-[10px] leading-4 text-slate-600">Verify the repair before advancing.</p></div></div></section>
      </div>
    </section>

    {learningMilestones.length > 0 && <InteractiveLearningRoadmap milestones={learningMilestones} />}

    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">Evidence</div><h2 className="mt-2 text-2xl font-black text-white">Completion is not the whole story.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A useful roadmap should eventually explain progress through results: accuracy, attempts, consistency, confidence, time spent, and checkpoint performance.</p></div><button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-200"><Clock3 className="h-4 w-4" />Log today's evidence</button></div><div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><EvidenceStat label="Accuracy" value="—" /><EvidenceStat label="Attempts" value="—" /><EvidenceStat label="Consistency" value={`${todayPercent}%`} /><EvidenceStat label="Confidence" value="—" /><EvidenceStat label="Time" value={`${todayTasks.reduce((sum, task) => sum + (task.progress === "completed" ? task.estimated_minutes || 0 : 0), 0)}m`} /></div></section>
  </div>

  <NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} submitting={reviewing} /><RoadmapEditDialog open={editOpen} initial={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} onClose={() => setEditOpen(false)} onSave={saveEdit} onAskAI={askAIToEdit} saving={savingEdit} askingAI={askingAI} />
  </main>;
}

function EvidenceStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{label}</p><p className="mt-2 text-xl font-black text-white tabular-nums">{value}</p></div>; }
function CrosshairIcon() { return <span className="grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" /></span>; }
