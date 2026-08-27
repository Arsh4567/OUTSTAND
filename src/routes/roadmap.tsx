import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Pencil, RotateCcw, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { RoadmapOnboarding } from "@/components/roadmap/RoadmapOnboarding";
import { RoadmapVisualizer } from "@/components/roadmap/RoadmapVisualizer";
import { DailyFocusCard } from "@/components/roadmap/DailyFocusCard";
import { NightlyReviewModal } from "@/components/roadmap/NightlyReviewModal";
import { RoadmapEditDialog, type RoadmapEditPatch } from "@/components/roadmap/RoadmapEditDialog";
import { Roadmap3DHero } from "@/components/roadmap/Roadmap3DHero";
import { AdaptivePlanCard } from "@/components/roadmap/AdaptivePlanCard";
import { useRoadmap } from "@/hooks/use-roadmap";
import { useAdaptivePlanning } from "@/hooks/use-adaptive-planning";

export const Route = createFileRoute("/roadmap")({ component: RoadmapPage });

function daysBetween(start: string, target: string) {
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${target}T00:00:00`);
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

function displayTitle(title: string, goal: string) {
  const clean = title.trim();
  const target = clean.match(/\bto\s+(\d{3,4})\b/i)?.[1];
  if (target) return `Road to ${target}`;
  const goalTarget = goal.match(/\b(?:to|reach|target)\s+(\d{3,4})\b/i)?.[1];
  if (goalTarget) return `Road to ${goalTarget}`;
  return clean || "Your roadmap";
}

function RoadmapPage() {
  const roadmap = useRoadmap();
  const [category, setCategory] = useState("skill_learning");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nightlyOpen, setNightlyOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const startOnboarding = async () => {
    try { await roadmap.askQuestions(category, {}); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not start roadmap intake."); }
  };

  const generate = async () => {
    try {
      const result = await roadmap.generate(category, roadmap.answers);
      if (result?.needsMoreInfo) { setShowOnboarding(true); return; }
      if (!result?.roadmapId) throw new Error("Roadmap was generated but no saved roadmap ID was returned.");
      setShowOnboarding(false);
      toast.success("Your roadmap is ready.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); }
  };

  const handleReview = async (reflection: string, energy: number, difficulty: number) => {
    setReviewing(true);
    try {
      const result = await roadmap.saveNightlyReview(reflection, energy, difficulty);
      toast.success(result?.reason || result?.analysis?.summary || "Tomorrow's priorities were adjusted.");
      setNightlyOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save nightly review."); }
    finally { setReviewing(false); }
  };

  const saveEdit = async (patch: RoadmapEditPatch) => {
    const current = roadmap.roadmap;
    if (!current) return;
    setSavingEdit(true);
    try {
      const result = await roadmap.updateRoadmap(current.id, patch);
      if (!result) throw new Error("The roadmap could not be updated.");
      await roadmap.load(current.id);
      setEditOpen(false);
      toast.success("Roadmap updated.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update roadmap."); }
    finally { setSavingEdit(false); }
  };

  const requiredTasks = useMemo(() => roadmap.tasks.filter((task) => task.is_required), [roadmap.tasks]);
  const completedCount = useMemo(() => requiredTasks.filter((task) => task.progress === "completed").length, [requiredTasks]);
  const overallProgress = requiredTasks.length ? Math.round((completedCount / requiredTasks.length) * 100) : 0;
  const todayRequired = roadmap.todayTasks.filter((task) => task.is_required);
  const todayCompleted = todayRequired.filter((task) => task.progress === "completed").length;
  const todayPercent = todayRequired.length ? Math.round((todayCompleted / todayRequired.length) * 100) : 0;
  const nextTask = roadmap.todayTasks.find((task) => task.progress !== "completed");
  const currentTitle = roadmap.roadmap ? displayTitle(roadmap.roadmap.title, roadmap.roadmap.goal) : "Your roadmap";
  const daysLeft = roadmap.roadmap?.target_date && roadmap.roadmap?.start_date ? daysBetween(new Date().toISOString().slice(0, 10), roadmap.roadmap.target_date) : roadmap.roadmap?.duration_days || 0;
  const completionGap = Math.max(0, todayRequired.length - todayCompleted);
  const milestoneIndex = Math.max(0, roadmap.milestones.findIndex((item) => roadmap.todayIndex >= item.day_start && roadmap.todayIndex <= item.day_end));
  const currentMilestone = roadmap.milestones[milestoneIndex];
  const milestoneLabel = currentMilestone ? `${milestoneIndex + 1}/${roadmap.milestones.length}` : "—";
  const plannedMinutesToday = todayRequired.reduce((sum, task) => sum + (Number(task.estimated_minutes) || 30), 0);
  const completedMinutesToday = todayRequired.filter((task) => task.progress === "completed").reduce((sum, task) => sum + (Number(task.estimated_minutes) || 30), 0);
  const adaptive = useAdaptivePlanning(roadmap.roadmap?.id, roadmap.roadmap ? {
    todayRequired: todayRequired.length,
    todayCompleted,
    totalRequired: requiredTasks.length,
    totalCompleted: completedCount,
    remainingDays: daysLeft,
    plannedMinutesToday,
    completedMinutesToday,
  } : null);

  if (roadmap.loading) return <main className="min-h-screen bg-[#14120f] px-4 py-16 text-center text-stone-300"><div className="mx-auto max-w-sm rounded-[2rem] border border-stone-500/20 bg-[#1c1711]/90 p-8 shadow-2xl"><div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-amber-300/60 via-orange-400/40 to-rose-400/40" /><p className="mt-5 text-xs font-black uppercase tracking-[.18em]">Loading your route</p><p className="mt-2 text-sm text-stone-500">Restoring your saved plan and progress.</p></div></main>;

  if (showOnboarding || !roadmap.roadmap) return <main className="min-h-screen overflow-hidden bg-[#14120f] px-4 py-8 text-stone-100 sm:px-6 lg:px-8"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(234,179,8,.14),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(239,68,68,.10),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(245,158,11,.08),transparent_30%)]" /><div className="relative mx-auto max-w-5xl py-8 sm:py-16"><div className="mx-auto max-w-3xl text-center"><div className="inline-flex rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-amber-100">OUTSTAND / ROADMAP</div><h1 className="mt-6 text-4xl font-black tracking-[-.055em] sm:text-6xl">Choose the destination.<br /><span className="bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent">We build the route.</span></h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-stone-400 sm:text-base">A practical plan built from your goal, deadline, baseline, and real constraints.</p></div><section className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-stone-500/20 bg-[#1c1711]/90 p-6 shadow-[0_30px_120px_-70px_rgba(234,179,8,.4)] backdrop-blur-xl sm:p-8">{roadmap.questions.length === 0 ? <><label className="text-xs font-black uppercase tracking-[.15em] text-stone-400">What are you trying to achieve?</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-stone-500/20 bg-[#110e0b] px-4 py-3 text-sm font-bold text-stone-100 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/10"><option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option></select><button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 px-5 py-3 text-sm font-black text-stone-950 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">Start intake <ArrowRight className="h-4 w-4" /></button></> : <RoadmapOnboarding category={category} questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}</section></div></main>;

  return <main className="min-h-screen overflow-hidden bg-[#14120f] px-4 pb-24 pt-4 text-stone-100 sm:px-6 lg:px-8"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_5%,rgba(234,179,8,.12),transparent_24%),radial-gradient(circle_at_90%_10%,rgba(239,68,68,.09),transparent_24%),radial-gradient(circle_at_50%_55%,rgba(245,158,11,.06),transparent_35%)]" /><div className="relative z-10 mx-auto max-w-7xl space-y-5 sm:space-y-7">
    <Roadmap3DHero title={currentTitle} day={roadmap.todayIndex} durationDays={roadmap.roadmap.duration_days} daysLeft={daysLeft} overallProgress={overallProgress} completedCount={completedCount} requiredCount={requiredTasks.length} todayCompleted={todayCompleted} todayRequired={todayRequired.length} milestoneLabel={milestoneLabel} onEdit={() => setEditOpen(true)} onReview={() => setNightlyOpen(true)} />
    {adaptive.recommendation && <AdaptivePlanCard recommendation={adaptive.recommendation} saving={adaptive.saving} onSave={() => void adaptive.saveInsight()} />}
    <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">{nextTask ? <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-amber-200/15 bg-gradient-to-br from-amber-200/[0.09] via-[#1c1711] to-rose-400/[0.07] p-6 sm:p-8"><div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-100"><span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(234,179,8,.7)]" /> Next up</div><h2 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">{nextTask.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300">{nextTask.success_criteria || nextTask.instructions}</p><div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.12em]"><span className="rounded-full border border-stone-500/20 bg-black/15 px-3 py-1.5 text-stone-300">{nextTask.estimated_minutes || 30} min</span><span className="rounded-full border border-stone-500/20 bg-black/15 px-3 py-1.5 text-stone-300">{nextTask.start_time || "Flexible"}</span></div></div></motion.section> : <section className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.08] to-amber-200/[0.04] p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Today complete</p><h2 className="mt-3 text-3xl font-black">You finished today's required work.</h2><p className="mt-2 text-sm leading-6 text-stone-400">Use review to shape tomorrow, or stop here and protect the streak.</p></section>}<section className="rounded-[2rem] border border-stone-500/20 bg-[#1c1711]/90 p-6 sm:p-8"><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Today's progress</div><div className="mt-2 text-4xl font-black tabular-nums">{todayPercent}%</div></div><div className="text-right"><div className="text-sm font-black">{completionGap}</div><div className="text-[10px] font-black uppercase tracking-[.15em] text-stone-500">required left</div></div></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-500/15" role="progressbar" aria-label="Today's required completion" aria-valuenow={todayPercent} aria-valuemin={0} aria-valuemax={100}><motion.div initial={{ width: 0 }} animate={{ width: `${todayPercent}%` }} transition={{ duration: .6 }} className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300" /></div><button type="button" onClick={() => setNightlyOpen(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-stone-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">End-of-day review <ArrowRight className="h-3.5 w-3.5" /></button></section></section>
    <DailyFocusCard tasks={roadmap.todayTasks} onToggle={roadmap.toggleTask} loading={roadmap.generating} />
    <section className="rounded-[2rem] border border-stone-500/20 bg-[#1c1711]/75 p-4 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">The route</p><h2 className="mt-1 text-2xl font-black tracking-tight">Milestones</h2></div><p className="text-xs text-stone-500">Day {roadmap.todayIndex} is your current position.</p></div><RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} /></section>
    <section className="grid gap-3 sm:grid-cols-3"><InfoTile icon={<Target className="h-4 w-4" />} title="Goal" text="Open Edit roadmap to view or change your full goal." /><InfoTile icon={<Clock3 className="h-4 w-4" />} title="Deadline" text={roadmap.roadmap.target_date ? `${new Date(`${roadmap.roadmap.target_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · ${daysLeft} days left` : "No target date set."} /><InfoTile icon={<Zap className="h-4 w-4" />} title="Adaptation" text="Your execution pace now informs the next planning decision." /></section>
  </div>
  <RoadmapEditDialog open={editOpen} initial={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} roadmapId={roadmap.roadmap.id} onClose={() => setEditOpen(false)} onSave={saveEdit} saving={savingEdit} />
  <NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} loading={reviewing} />
</main>;
}

function InfoTile({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <section className="rounded-[1.5rem] border border-stone-500/20 bg-[#1c1711]/75 p-5 transition-transform duration-200 hover:-translate-y-0.5"><div className="flex items-center gap-2 text-amber-100"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-amber-300/15 to-rose-300/10">{icon}</span><span className="text-xs font-black">{title}</span></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-stone-400">{text}</p></section>;
}