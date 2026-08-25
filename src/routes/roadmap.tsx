import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock3, Pencil, RotateCcw, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { RoadmapOnboarding } from "@/components/roadmap/RoadmapOnboarding";
import { RoadmapVisualizer } from "@/components/roadmap/RoadmapVisualizer";
import { DailyFocusCard } from "@/components/roadmap/DailyFocusCard";
import { NightlyReviewModal } from "@/components/roadmap/NightlyReviewModal";
import { RoadmapEditDialog, type RoadmapEditPatch } from "@/components/roadmap/RoadmapEditDialog";
import { InteractiveLearningRoadmap, type LearningMilestone } from "@/components/roadmap/InteractiveLearningRoadmap";
import { ChessAnalysisSection } from "@/components/roadmap/ChessAnalysisSection";
import { supabase } from "@/integrations/supabase/client";
import { useRoadmap } from "@/hooks/use-roadmap";
import { loadSavedChessRoadmap } from "@/lib/chess-roadmap-persistence";

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
  const [chessUsername, setChessUsername] = useState<string | null>(null);

  useEffect(() => { if (!roadmap.loading && !roadmap.roadmap) setShowOnboarding(true); }, [roadmap.loading, roadmap.roadmap]);

  useEffect(() => {
    let cancelled = false;
    void loadSavedChessRoadmap().then((saved) => {
      if (cancelled || !saved) return;
      const username = saved.profile.username.trim();
      if (username) setChessUsername(username);
      roadmap.setAnswers((current) => ({
        ...current,
        chesscom: { profile: saved.profile, ratings: saved.ratings },
        ...(saved.generatedRoadmap && typeof saved.generatedRoadmap === "object" ? { chessRoadmapSaved: saved.generatedRoadmap } : {}),
      }));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [roadmap]);

  const startOnboarding = async () => { try { await roadmap.askQuestions(category, {}); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not start roadmap intake."); } };
  const generate = async () => {
    try {
      const result = await roadmap.generate(category, roadmap.answers);
      if (result?.needsMoreInfo) { setShowOnboarding(true); return; }
      if (!result?.roadmapId) throw new Error("Roadmap was generated but no saved roadmap ID was returned.");
      if (result?.structuredContent) { const { error } = await (supabase.from("roadmaps") as any).update({ structured_content: result.structuredContent }).eq("id", result.roadmapId); if (error) throw error; }
      setShowOnboarding(false); toast.success("Your roadmap is ready.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); }
  };
  const handleReview = async (reflection: string, energy: number, difficulty: number) => { setReviewing(true); try { const result = await roadmap.saveNightlyReview(reflection, energy, difficulty); toast.success(result?.reason || result?.analysis?.summary || "Tomorrow's priorities were adjusted."); setNightlyOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save nightly review."); } finally { setReviewing(false); } };
  const saveEdit = async (patch: RoadmapEditPatch) => { const current = roadmap.roadmap; if (!current) return; setSavingEdit(true); try { const { error } = await supabase.from("roadmaps").update({ title: patch.title, goal: patch.goal }).eq("id", current.id).eq("user_id", current.user_id); if (error) throw error; await roadmap.load(current.id); setEditOpen(false); toast.success("Roadmap updated."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update roadmap."); } finally { setSavingEdit(false); } };
  const askAIToEdit = async (request: string) => { const current = roadmap.roadmap; if (!current) return; setAskingAI(true); try { const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in first."); const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "edit", roadmapId: current.id, request }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not apply suggested changes."); if (result.changed === false) { toast.success("No roadmap changes were needed."); return; } await roadmap.load(current.id); setEditOpen(false); toast.success(result.message || "Roadmap updated."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not apply suggested changes."); } finally { setAskingAI(false); } };

  const requiredTasks = useMemo(() => roadmap.tasks.filter((task) => task.is_required), [roadmap.tasks]);
  const completedCount = useMemo(() => requiredTasks.filter((task) => task.progress === "completed").length, [requiredTasks]);
  const overallProgress = requiredTasks.length ? Math.round((completedCount / requiredTasks.length) * 100) : 0;
  const todayRequired = roadmap.todayTasks.filter((task) => task.is_required);
  const todayCompleted = todayRequired.filter((task) => task.progress === "completed").length;
  const todayPercent = todayRequired.length ? Math.round((todayCompleted / todayRequired.length) * 100) : 0;
  const nextTask = roadmap.todayTasks.find((task) => task.progress !== "completed");
  const learningMilestones = useMemo<LearningMilestone[]>(() => { const value = roadmap.roadmap?.structured_content?.milestones; if (!Array.isArray(value)) return []; return value.filter((item: any) => item && typeof item === "object" && typeof item.milestone_title === "string" && Array.isArray(item.quiz)) as LearningMilestone[]; }, [roadmap.roadmap]);
  const targetDate = roadmap.roadmap?.target_date ? new Date(`${roadmap.roadmap.target_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
  const daysLeft = roadmap.roadmap?.target_date && roadmap.roadmap?.start_date ? daysBetween(new Date().toISOString().slice(0, 10), roadmap.roadmap.target_date) : roadmap.roadmap?.duration_days || 0;
  const plannedProgress = roadmap.roadmap?.duration_days ? Math.round((Math.max(0, roadmap.todayIndex - 1) / roadmap.roadmap.duration_days) * 100) : 0;
  const onTrack = overallProgress >= plannedProgress - 10;
  const isChessRoadmap = roadmap.roadmap?.category === "chess";
  const completionGap = Math.max(0, todayRequired.length - todayCompleted);

  if (roadmap.loading) return (
    <main className="min-h-screen bg-[#020617] px-4 py-16 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-md"><div className="mx-auto h-10 w-10 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" /><p className="mt-4 text-[10px] font-black uppercase tracking-[.22em] text-slate-600">Building your roadmap</p><p className="mt-2 text-xs text-slate-700">Aligning the plan with your latest progress.</p></div>
    </main>
  );

  if (showOnboarding || !roadmap.roadmap) return <main className="min-h-screen bg-[#020617] px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl py-8 sm:py-16"><div className="mx-auto mb-8 max-w-2xl text-center"><div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/80">OUTSTAND / ROADMAP</div><h1 className="mt-4 text-4xl font-black tracking-[-.045em] text-white sm:text-6xl">Understand the goal.<br /><span className="text-cyan-200">Then make every day count.</span></h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Tell OUTSTAND what success means, where you are starting, how much time you really have, and what cannot move. The planner turns that into measurable outcomes and a practical daily path.</p></div>{roadmap.questions.length === 0 ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"><label className="text-xs font-black uppercase tracking-[.16em] text-slate-500">What are you trying to achieve?</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-slate-900 px-4 py-3 text-sm font-bold text-white"><option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option></select><button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200">Start with the important questions <ChevronRightIcon /></button></section> : <RoadmapOnboarding category={category} questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}</div></main>;

  return <main className="min-h-screen overflow-hidden bg-[#020617] px-4 pb-24 pt-5 text-white sm:px-6 lg:px-8">
    <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.09),transparent_58%)]" />
    <div className="relative z-10 mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-white/[0.025] shadow-[0_50px_140px_-90px_rgba(34,211,238,.45)]">
        <div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-cyan-300/[0.06] blur-3xl" />
        <div className="relative p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/75"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-2.5 py-1">Roadmap</span><span className="text-slate-700">/</span><span>Day {roadmap.todayIndex} of {roadmap.roadmap.duration_days}</span><span className="text-slate-700">/</span><span>{daysLeft} days remaining</span></div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.055em] text-white sm:text-5xl lg:text-6xl">{roadmap.roadmap.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">{roadmap.roadmap.goal}</p>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-white/15"><Pencil className="h-4 w-4" />Edit</button>
              <button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-white/15"><RotateCcw className="h-4 w-4" />Review</button>
              <button type="button" onClick={() => { roadmap.setAnswers({}); setShowOnboarding(true); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-500 transition hover:border-white/15 hover:text-slate-300">New roadmap</button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SignalCard icon={<Target className="h-4 w-4" />} label="Outcome" value="Measurable" detail="Every stage ends with proof." />
            <SignalCard icon={<Clock3 className="h-4 w-4" />} label="Deadline" value={targetDate || "Not set"} detail="The target date protects focus." />
            <SignalCard icon={<Zap className="h-4 w-4" />} label="Velocity" value={`${todayPercent}% today`} detail={`${todayCompleted}/${todayRequired.length} required actions complete.`} accent="cyan" />
            <SignalCard icon={onTrack ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} label="Trajectory" value={onTrack ? "On track" : "Recovery needed"} detail={onTrack ? "Execution is ahead of or near plan." : "Trim low-value work before the deadline moves."} accent={onTrack ? "emerald" : "amber"} />
          </div>
        </div>
        <div className="border-t border-white/[0.06] px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[.18em] text-slate-600"><span>Total completion</span><span className="tabular-nums text-slate-400">{overallProgress}% proven · {completedCount}/{requiredTasks.length}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.055]"><motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: .9, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" /></div>
        </div>
      </header>

      {isChessRoadmap && <ChessAnalysisSection chessUsername={chessUsername} />}
      <DailyFocusCard task={nextTask} completed={todayCompleted} total={todayRequired.length} gap={completionGap} onComplete={roadmap.completeTask} />
      <RoadmapVisualizer roadmap={roadmap.roadmap} tasks={roadmap.tasks} />
      {learningMilestones.length > 0 && <InteractiveLearningRoadmap milestones={learningMilestones} />}
      <RoadmapEditDialog open={editOpen} initial={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} roadmapId={roadmap.roadmap.id} onClose={() => setEditOpen(false)} onSave={saveEdit} onAskAI={askAIToEdit} onLocalEditApplied={() => roadmap.load(roadmap.roadmap!.id)} saving={savingEdit} askingAI={askingAI} />
      <NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSave={handleReview} saving={reviewing} />
    </div>
  </main>;
}

function SignalCard({ icon, label, value, detail, accent = "default" }: { icon: ReactNode; label: string; value: string; detail: string; accent?: "default" | "cyan" | "emerald" | "amber" }) {
  const accentClass = accent === "cyan" ? "text-cyan-200" : accent === "emerald" ? "text-emerald-200" : accent === "amber" ? "text-amber-200" : "text-white";
  return <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-600">{icon}{label}</div><div className={`mt-2 text-lg font-black ${accentClass}`}>{value}</div><p className="mt-1 text-[10px] leading-4 text-slate-600">{detail}</p></div>;
}

function ChevronRightIcon() {
  return <ArrowRight className="h-4 w-4" />;
}
