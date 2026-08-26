import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Pencil, RotateCcw, Sparkles, Target, Zap } from "lucide-react";
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
  if (/\b30[- ]?day\b/i.test(clean) && /\bto\s+\d{3,4}\b/i.test(clean)) {
    const target = clean.match(/\bto\s+(\d{3,4})\b/i)?.[1];
    if (target) return `Road to ${target}`;
  }
  if (/\broad\s+to\s+\d{3,4}\b/i.test(clean)) return clean;
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

  if (roadmap.loading) return (
    <main className="min-h-screen bg-[#070b16] px-4 py-16 text-center text-slate-400">
      <div className="mx-auto max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-cyan-300/40 to-violet-400/20" />
        <p className="mt-5 text-xs font-black uppercase tracking-[.22em]">Loading roadmap</p>
        <p className="mt-2 text-sm text-slate-500">Restoring your saved plan and progress.</p>
      </div>
    </main>
  );

  if (showOnboarding || !roadmap.roadmap) return (
    <main className="min-h-screen bg-[#070b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl py-8 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">OUTSTAND / ROADMAP</div>
          <h1 className="mt-6 text-4xl font-black tracking-[-.05em] sm:text-6xl">Build the route.<br /><span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">Then walk it.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">A focused plan built from your goal, deadline, baseline, and real constraints.</p>
        </div>
        <section className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_120px_-80px_rgba(56,189,248,.5)] backdrop-blur-xl sm:p-8">
          {roadmap.questions.length === 0 ? <>
            <label className="text-xs font-black uppercase tracking-[.16em] text-slate-500">What are you trying to achieve?</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40">
              <option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option>
            </select>
            <button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Start intake <ArrowRight className="h-4 w-4" /></button>
          </> : <RoadmapOnboarding category={category} questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}
        </section>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b16] px-4 pb-24 pt-5 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_22%_12%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_78%_4%,rgba(167,139,250,.18),transparent_28%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.045] shadow-[0_40px_140px_-90px_rgba(56,189,248,.55)] backdrop-blur-xl">
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(7,11,22,.75))]" />
          <div className="absolute -right-20 top-10 h-64 w-64 rotate-12 rounded-[3rem] bg-gradient-to-br from-cyan-300/20 via-sky-300/10 to-violet-400/20 blur-2xl" />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_.65fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/80"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1">Roadmap</span><span>Day {roadmap.todayIndex} / {roadmap.roadmap.duration_days}</span><span className="text-slate-500">{daysLeft} days left</span></div>
              <div className="mt-6 max-w-3xl">
                <p className="text-sm font-bold text-slate-400">Your current objective</p>
                <h1 className="mt-2 text-5xl font-black tracking-[-.06em] sm:text-7xl">{currentTitle}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{roadmap.roadmap.goal}</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Pencil className="h-4 w-4" /> Edit</button>
                <button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><RotateCcw className="h-4 w-4" /> Review</button>
                <button type="button" onClick={() => { roadmap.setAnswers({}); setShowOnboarding(true); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">New roadmap</button>
              </div>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Plan completion</span><span className="text-xl font-black tabular-nums">{overallProgress}%</span></div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label="Overall roadmap completion" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}><motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: .7, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400" /></div>
                <div className="mt-4 grid grid-cols-2 gap-3"><MiniStat label="Completed" value={`${completedCount}/${requiredTasks.length}`} /><MiniStat label="Today" value={`${todayCompleted}/${todayRequired.length}`} /></div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          {nextTask ? <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.09] via-sky-300/[0.04] to-violet-400/[0.07] p-6 sm:p-8"><div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.9)]" /> Next up</div><h2 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">{nextTask.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{nextTask.success_criteria || nextTask.instructions}</p><div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.12em]"><span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-slate-300">{nextTask.estimated_minutes || 30} min</span><span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-slate-300">{nextTask.start_time || "Flexible"}</span></div></div></motion.section> : <section className="rounded-[2rem] border border-emerald-300/15 bg-emerald-300/[0.06] p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-200">Today complete</p><h2 className="mt-3 text-3xl font-black">You finished today's required work.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Use review to shape tomorrow, or stop here and protect the streak.</p></section>}
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8"><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Today</div><div className="mt-2 text-4xl font-black tabular-nums">{todayPercent}%</div></div><div className="text-right"><div className="text-sm font-black">{completionGap}</div><div className="text-[10px] font-black uppercase tracking-[.15em] text-slate-600">remaining</div></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label="Today's required completion" aria-valuenow={todayPercent} aria-valuemin={0} aria-valuemax={100}><motion.div initial={{ width: 0 }} animate={{ width: `${todayPercent}%` }} transition={{ duration: .6 }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-300" /></div><button type="button" onClick={() => setNightlyOpen(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">End-of-day review <ArrowRight className="h-3.5 w-3.5" /></button></section>
        </section>

        <DailyFocusCard tasks={roadmap.todayTasks} onToggle={roadmap.toggleTask} loading={roadmap.generating} />
        <RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} />

        <section className="grid gap-4 sm:grid-cols-3">
          <InfoTile icon={<Target className="h-4 w-4" />} title="Goal" text="Pulled from your saved roadmap intake." />
          <InfoTile icon={<Clock3 className="h-4 w-4" />} title="Deadline" text={roadmap.roadmap.target_date ? `${new Date(`${roadmap.roadmap.target_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · ${daysLeft} days left` : "No target date set."} />
          <InfoTile icon={<Zap className="h-4 w-4" />} title="Adaptation" text="Nightly reviews can reshape the next day from real completion data." />
        </section>
      </div>

      <RoadmapEditDialog open={editOpen} initial={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} roadmapId={roadmap.roadmap.id} onClose={() => setEditOpen(false)} onSave={saveEdit} onAskAI={() => {}} onLocalEditApplied={() => {}} saving={savingEdit} askingAI={false} />
      <NightlyReviewModal open={nightlyOpen} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} loading={reviewing} />
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">{label}</div><div className="mt-1 text-lg font-black tabular-nums">{value}</div></div>;
}

function InfoTile({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center gap-2 text-cyan-200"><span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-300/10">{icon}</span><span className="text-xs font-black">{title}</span></div><p className="mt-3 text-xs leading-5 text-slate-400">{text}</p></section>;
}