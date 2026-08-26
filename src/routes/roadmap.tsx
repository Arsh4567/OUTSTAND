import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Pencil, RotateCcw, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { RoadmapOnboarding } from "@/components/roadmap/RoadmapOnboarding";
import { RoadmapVisualizer } from "@/components/roadmap/RoadmapVisualizer";
import { DailyFocusCard } from "@/components/roadmap/DailyFocusCard";
import { NightlyReviewModal } from "@/components/roadmap/NightlyReviewModal";
import { RoadmapEditDialog, type RoadmapEditPatch } from "@/components/roadmap/RoadmapEditDialog";
import { useRoadmap } from "@/hooks/use-roadmap";

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
  return clean || goal.trim() || "Your roadmap";
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate roadmap.");
    }
  };

  const handleReview = async (reflection: string, energy: number, difficulty: number) => {
    setReviewing(true);
    try {
      const result = await roadmap.saveNightlyReview(reflection, energy, difficulty);
      toast.success(result?.reason || result?.analysis?.summary || "Tomorrow's priorities were adjusted.");
      setNightlyOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save nightly review.");
    } finally { setReviewing(false); }
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update roadmap.");
    } finally { setSavingEdit(false); }
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

  if (roadmap.loading) return (
    <main className="min-h-screen bg-[#080d1c] px-4 py-16 text-center text-slate-300">
      <div className="mx-auto max-w-sm rounded-[2rem] border border-white/10 bg-[#10182b]/90 p-8 shadow-2xl">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-cyan-300/60 via-violet-400/40 to-fuchsia-400/40" />
        <p className="mt-5 text-xs font-black uppercase tracking-[.18em]">Loading your route</p>
        <p className="mt-2 text-sm text-slate-500">Restoring your saved plan and progress.</p>
      </div>
    </main>
  );

  if (showOnboarding || !roadmap.roadmap) return (
    <main className="min-h-screen overflow-hidden bg-[#080d1c] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(217,70,239,.14),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-5xl py-8 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-100">OUTSTAND / ROADMAP</div>
          <h1 className="mt-6 text-4xl font-black tracking-[-.055em] sm:text-6xl">Choose the destination.<br /><span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">We build the route.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">A practical plan built from your goal, deadline, baseline, and real constraints.</p>
        </div>
        <section className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-white/10 bg-[#10182b]/90 p-6 shadow-[0_30px_120px_-70px_rgba(34,211,238,.6)] backdrop-blur-xl sm:p-8">
          {roadmap.questions.length === 0 ? <>
            <label className="text-xs font-black uppercase tracking-[.15em] text-slate-400">What are you trying to achieve?</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b1324] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10">
              <option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option>
            </select>
            <button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-5 py-3 text-sm font-black text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Start intake <ArrowRight className="h-4 w-4" /></button>
          </> : <RoadmapOnboarding category={category} questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}
        </section>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#080d1c] px-4 pb-24 pt-4 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_5%,rgba(34,211,238,.16),transparent_24%),radial-gradient(circle_at_90%_10%,rgba(217,70,239,.12),transparent_24%),radial-gradient(circle_at_50%_55%,rgba(59,130,246,.07),transparent_35%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-5 sm:space-y-7">
        <header className="relative isolate overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#10182b]/90 shadow-[0_45px_140px_-80px_rgba(34,211,238,.55)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,.08),transparent_35%,rgba(217,70,239,.08))]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative grid min-h-[390px] gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_.85fr] lg:p-10">
            <div className="relative z-20 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-300">
                <span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-cyan-100">Day {roadmap.todayIndex}</span>
                <span className="text-slate-500">of {roadmap.roadmap.duration_days}</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span className="text-slate-400">{daysLeft} days left</span>
              </div>

              <p className="mt-7 text-sm font-bold text-slate-400">Your destination</p>
              <h1 className="mt-1 max-w-3xl text-[clamp(3.4rem,10vw,7rem)] font-black leading-[.88] tracking-[-.07em] text-white">{currentTitle}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{roadmap.roadmap.goal}</p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Pencil className="h-4 w-4" /> Edit roadmap</button>
                <button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><RotateCcw className="h-4 w-4" /> Review</button>
              </div>
            </div>

            <div className="relative hidden min-h-[330px] lg:block" aria-hidden="true">
              <RoadScene />
              <div className="absolute bottom-5 right-5 z-20 w-52 rounded-2xl border border-white/10 bg-[#0a1120]/80 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Plan completion</p><p className="mt-1 text-3xl font-black tabular-nums">{overallProgress}%</p></div><span className="mb-1 rounded-full bg-cyan-300/10 px-2 py-1 text-[9px] font-black text-cyan-100">{completedCount}/{requiredTasks.length}</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: .75, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300" /></div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 border-t border-white/10 bg-black/10">
            <HeroMetric label="Today" value={`${todayCompleted}/${todayRequired.length}`} icon={<CheckCircle2 className="h-4 w-4" />} />
            <HeroMetric label="Days left" value={String(daysLeft)} icon={<CalendarDays className="h-4 w-4" />} />
            <HeroMetric label="Milestone" value={currentMilestone ? `${milestoneIndex + 1}/${roadmap.milestones.length}` : "—"} icon={<Target className="h-4 w-4" />} />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          {nextTask ? (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-gradient-to-br from-cyan-300/[0.11] via-[#111c32] to-fuchsia-400/[0.08] p-6 sm:p-8">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-cyan-100"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.9)]" /> Next up</div>
                <h2 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">{nextTask.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{nextTask.success_criteria || nextTask.instructions}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.12em]"><span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-slate-300">{nextTask.estimated_minutes || 30} min</span><span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-slate-300">{nextTask.start_time || "Flexible"}</span></div>
              </div>
            </motion.section>
          ) : (
            <section className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.1] to-cyan-300/[0.05] p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Today complete</p><h2 className="mt-3 text-3xl font-black">You finished today's required work.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Use review to shape tomorrow, or stop here and protect the streak.</p></section>
          )}

          <section className="rounded-[2rem] border border-white/10 bg-[#10182b]/90 p-6 sm:p-8">
            <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Today's progress</div><div className="mt-2 text-4xl font-black tabular-nums">{todayPercent}%</div></div><div className="text-right"><div className="text-sm font-black">{completionGap}</div><div className="text-[10px] font-black uppercase tracking-[.15em] text-slate-500">required left</div></div></div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-label="Today's required completion" aria-valuenow={todayPercent} aria-valuemin={0} aria-valuemax={100}><motion.div initial={{ width: 0 }} animate={{ width: `${todayPercent}%` }} transition={{ duration: .6 }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300" /></div>
            <button type="button" onClick={() => setNightlyOpen(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">End-of-day review <ArrowRight className="h-3.5 w-3.5" /></button>
          </section>
        </section>

        <DailyFocusCard tasks={roadmap.todayTasks} onToggle={roadmap.toggleTask} loading={roadmap.generating} />

        <section className="rounded-[2rem] border border-white/10 bg-[#10182b]/75 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">The route</p><h2 className="mt-1 text-2xl font-black tracking-tight">Milestones</h2></div><p className="text-xs text-slate-500">Day {roadmap.todayIndex} is your current position.</p></div>
          <RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <InfoTile icon={<Target className="h-4 w-4" />} title="Goal" text={roadmap.roadmap.goal || "Your saved roadmap objective."} />
          <InfoTile icon={<Clock3 className="h-4 w-4" />} title="Deadline" text={roadmap.roadmap.target_date ? `${new Date(`${roadmap.roadmap.target_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · ${daysLeft} days left` : "No target date set."} />
          <InfoTile icon={<Zap className="h-4 w-4" />} title="Adaptation" text="Nightly reviews can reshape the next day from real completion data." />
        </section>
      </div>

      <RoadmapEditDialog open={editOpen} initial={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} roadmapId={roadmap.roadmap.id} onClose={() => setEditOpen(false)} onSave={saveEdit} onAskAI={() => {}} onLocalEditApplied={() => {}} saving={savingEdit} askingAI={false} />
      <NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} loading={reviewing} />
    </main>
  );
}

function RoadScene() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
      <div className="absolute inset-x-0 top-8 h-40 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,.2),transparent_62%)]" />
      <div className="absolute left-1/2 top-4 h-24 w-24 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-2xl" />
      <div className="absolute bottom-0 left-1/2 h-[310px] w-[88%] -translate-x-1/2 [clip-path:polygon(43%_0,57%_0,100%_100%,0_100%)] bg-gradient-to-b from-slate-500/50 via-slate-700/80 to-slate-950/95" />
      <div className="absolute bottom-0 left-1/2 h-[310px] w-[4px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,.9)_0_22px,transparent_22px_46px)] [clip-path:polygon(35%_0,65%_0,100%_100%,0_100%)] opacity-80" />
      <div className="absolute bottom-0 left-1/2 h-[310px] w-[76%] -translate-x-1/2 [clip-path:polygon(46%_0,54%_0,100%_100%,0_100%)] bg-gradient-to-b from-cyan-300/15 via-violet-400/10 to-fuchsia-400/10" />
      <div className="absolute bottom-7 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_22px_8px_rgba(34,211,238,.65)]" />
      <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#0a1120] to-transparent" />
    </div>
  );
}

function HeroMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-2 border-r border-white/10 px-4 py-4 last:border-r-0 sm:px-6"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-cyan-200">{icon}</span><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">{label}</div><div className="mt-0.5 truncate text-sm font-black tabular-nums text-white">{value}</div></div></div>;
}

function InfoTile({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <section className="rounded-[1.5rem] border border-white/10 bg-[#10182b]/75 p-5 transition-transform duration-200 hover:-translate-y-0.5"><div className="flex items-center gap-2 text-cyan-100"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/15 to-violet-300/10">{icon}</span><span className="text-xs font-black">{title}</span></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{text}</p></section>;
}
