import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Pencil, RotateCcw, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { RoadmapOnboarding } from "@/components/roadmap/RoadmapOnboarding";
import { RoadmapVisualizer } from "@/components/roadmap/RoadmapVisualizer";
import { DailyFocusCard } from "@/components/roadmap/DailyFocusCard";
import { NightlyReviewModal } from "@/components/roadmap/NightlyReviewModal";
import { RoadmapEditDialog, type RoadmapEditPatch } from "@/components/roadmap/RoadmapEditDialog";
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
      const username = typeof saved.chess_com_username === "string" ? saved.chess_com_username.trim() : "";
      if (username) setChessUsername(username);
      roadmap.setAnswers((current) => ({
        ...current,
        ...(username ? { chesscom: { profile: { username, avatar: saved.profile?.avatar ?? null, title: saved.profile?.title ?? null }, ratings: saved.ratings || { rapid: null, blitz: null, bullet: null, tactics: null } } } : {}),
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
  const targetDate = roadmap.roadmap?.target_date ? new Date(`${roadmap.roadmap.target_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
  const daysLeft = roadmap.roadmap?.target_date && roadmap.roadmap?.start_date ? daysBetween(new Date().toISOString().slice(0, 10), roadmap.roadmap.target_date) : roadmap.roadmap?.duration_days || 0;
  const plannedProgress = roadmap.roadmap?.duration_days ? Math.round((Math.max(0, roadmap.todayIndex - 1) / roadmap.roadmap.duration_days) * 100) : 0;
  const progressDelta = overallProgress - plannedProgress;
  const deadlineHealth = progressDelta >= 10 ? "Ahead" : progressDelta >= -10 ? "On pace" : "Behind";
  const isChessRoadmap = roadmap.roadmap?.category === "chess";
  const completionGap = Math.max(0, todayRequired.length - todayCompleted);

  if (roadmap.loading) return <main className="min-h-screen bg-[#020617] px-4 py-16 text-center text-sm text-slate-500"><div className="mx-auto max-w-md"><div className="mx-auto h-10 w-10 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" /><p className="mt-4 text-[10px] font-black uppercase tracking-[.22em] text-slate-600">Loading roadmap</p><p className="mt-2 text-xs text-slate-500">Restoring your plan and real progress.</p></div></main>;

  if (showOnboarding || !roadmap.roadmap) return <main className="min-h-screen bg-[#020617] px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl py-8 sm:py-16"><div className="mx-auto mb-8 max-w-2xl text-center"><div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/80">OUTSTAND / ROADMAP</div><h1 className="mt-4 text-4xl font-black tracking-[-.045em] text-white sm:text-6xl">Define the outcome.<br /><span className="text-cyan-200">Then execute it.</span></h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">Set the goal, baseline, deadline and real constraints. OUTSTAND turns that information into a concrete daily plan.</p></div>{roadmap.questions.length === 0 ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"><label className="text-xs font-black uppercase tracking-[.16em] text-slate-500">What are you trying to achieve?</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-slate-900 px-4 py-3 text-sm font-bold text-white"><option value="skill_learning">Learn a skill</option><option value="academics">Academic goal</option><option value="exam_preparation">Exam preparation</option><option value="chess">Chess improvement</option><option value="fitness">Fitness goal</option><option value="content_creation">Content creation</option><option value="business">Business goal</option><option value="productivity">Productivity system</option></select><button type="button" onClick={() => void startOnboarding()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Start intake <ChevronRightIcon /></button></section> : <RoadmapOnboarding category={category} questions={roadmap.questions} answers={roadmap.answers} onChange={roadmap.setAnswers} onNext={generate} generating={roadmap.generating} />}</div></main>;

  return <main className="min-h-screen overflow-hidden bg-[#020617] px-4 pb-24 pt-5 text-white sm:px-6 lg:px-8"><div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.09),transparent_58%)]" /><div className="relative z-10 mx-auto max-w-7xl space-y-6 sm:space-y-8">
    <header className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-white/[0.025] shadow-[0_50px_140px_-90px_rgba(34,211,238,.45)]"><div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-cyan-300/[0.06] blur-3xl" /><div className="relative p-5 sm:p-8 lg:p-10"><div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/75"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-2.5 py-1">Roadmap</span><span className="text-slate-700">/</span><span>Day {roadmap.todayIndex} of {roadmap.roadmap.duration_days}</span><span className="text-slate-700">/</span><span>{daysLeft} days remaining</span></div><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.055em] text-white sm:text-5xl lg:text-6xl">{roadmap.roadmap.title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">{roadmap.roadmap.goal}</p></div><div className="flex flex-wrap gap-2 xl:justify-end"><button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><Pencil className="h-4 w-4" />Edit</button><button type="button" onClick={() => setNightlyOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><RotateCcw className="h-4 w-4" />Review</button><button type="button" onClick={() => { roadmap.setAnswers({}); setShowOnboarding(true); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-500 transition hover:border-white/15 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">New roadmap</button></div></div><div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SignalCard icon={<Target className="h-4 w-4" />} label="Goal" value="Defined" detail="Built from your saved intake." /><SignalCard icon={<Clock3 className="h-4 w-4" />} label="Deadline" value={targetDate || "Not set"} detail={daysLeft > 0 ? `${daysLeft} days remain.` : "No target date is set."} /><SignalCard icon={<Zap className="h-4 w-4" />} label="Today" value={`${todayCompleted}/${todayRequired.length}`} detail={`${todayPercent}% required tasks complete.`} accent="cyan" /><SignalCard icon={<ShieldCheck className="h-4 w-4" />} label="Deadline health" value={deadlineHealth} detail={`${progressDelta >= 0 ? "+" : ""}${progressDelta} pts vs planned progress.`} accent={deadlineHealth === "Ahead" ? "emerald" : deadlineHealth === "Behind" ? "amber" : "default"} /></div></div><div className="border-t border-white/[0.06] px-5 py-4 sm:px-8 lg:px-10"><div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[.18em] text-slate-500"><span>Plan completion</span><span className="tabular-nums text-slate-300">{overallProgress}% · {completedCount}/{requiredTasks.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.055]" role="progressbar" aria-label="Overall roadmap completion" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}><motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: .65, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" /></div></div></header>

    <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">{nextTask ? <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-5 shadow-[0_30px_90px_-70px_rgba(34,211,238,.65)] sm:p-7"><div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/[0.06] blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,.8)]" />Next task</div><h2 className="mt-3 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl">{nextTask.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{nextTask.success_criteria || nextTask.instructions}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/[0.07] bg-black/10 px-3 py-1.5 text-[9px] font-bold text-slate-400">{nextTask.estimated_minutes || 30} min</span><span className="rounded-full border border-white/[0.07] bg-black/10 px-3 py-1.5 text-[9px] font-bold text-slate-400">{nextTask.start_time || "Flexible"}</span><span className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-1.5 text-[9px] font-bold text-cyan-200">Required</span></div></div></motion.section> : <section className="rounded-[2rem] border border-emerald-300/10 bg-emerald-300/[0.025] p-5 sm:p-7"><p className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-200/70">Today complete</p><h2 className="mt-3 text-2xl font-black text-white">Required work is complete.</h2><p className="mt-2 text-sm leading-6 text-slate-500">You have no required task left in today's queue.</p></section>}<section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-slate-500"><CalendarDays className="h-4 w-4" />Today</div><div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-4xl font-black tabular-nums text-white">{todayPercent}%</div><div className="mt-1 text-xs text-slate-500">required work complete</div></div><div className="text-right"><div className="text-sm font-black text-white">{completionGap}</div><div className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">remaining</div></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label="Today completion" aria-valuenow={todayPercent} aria-valuemin={0} aria-valuemax={100}><motion.div initial={{ width: 0 }} animate={{ width: `${todayPercent}%` }} transition={{ duration: .6 }} className="h-full rounded-full bg-cyan-300" /></div><button type="button" onClick={() => setNightlyOpen(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-slate-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">End-of-day review <ArrowRight className="h-3.5 w-3.5" /></button></section></section>

    <DailyFocusCard tasks={roadmap.todayTasks} onToggle={roadmap.toggleTask} loading={roadmap.generating} />
    {isChessRoadmap && <ChessAnalysisSection username={chessUsername} />}
    <RoadmapVisualizer milestones={roadmap.milestones} todayIndex={roadmap.todayIndex} />

    <section className="grid gap-4 lg:grid-cols-3"><TrustCard eyebrow="WHY THIS TASK" title="Work is tied to the goal.">Each task comes from the saved roadmap plan and has instructions, a duration, and a completion state.</TrustCard><TrustCard eyebrow="ADAPTATION" title="Review changes tomorrow.">Nightly review records completion, reflection, energy, and difficulty so the next schedule can respond to what actually happened.</TrustCard><TrustCard eyebrow="EVIDENCE" title="Completion is not mastery.">Task completion shows execution. Use task success criteria and goal-specific results to judge whether the work actually moved you forward.</TrustCard></section>

    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Execution evidence</div><h2 className="mt-2 text-2xl font-black text-white">{overallProgress}% of required plan work complete.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This is a completion measure, not a claim of mastery. Your evidence lives in the success criteria and outcomes you record during the plan.</p></div><div className="shrink-0 rounded-2xl border border-white/[0.06] bg-black/10 px-5 py-4 text-center"><div className="text-3xl font-black tabular-nums text-white">{completedCount}/{requiredTasks.length}</div><div className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">required tasks</div></div></div></section>

    {editOpen && <RoadmapEditDialog open={editOpen} roadmap={{ title: roadmap.roadmap.title, goal: roadmap.roadmap.goal }} saving={savingEdit} askingAI={askingAI} onClose={() => setEditOpen(false)} onSave={saveEdit} onAskAI={askAIToEdit} />}
    <NightlyReviewModal open={nightlyOpen} saving={reviewing} onClose={() => setNightlyOpen(false)} onSubmit={handleReview} />
  </div></main>;
}

function ChevronRightIcon() { return <ArrowRight className="h-4 w-4" />; }

function SignalCard({ icon, label, value, detail, accent = "default" }: { icon: ReactNode; label: string; value: string; detail: string; accent?: "default" | "cyan" | "emerald" | "amber" }) {
  const tone = accent === "cyan" ? "border-cyan-300/10 bg-cyan-300/[0.025] text-cyan-200" : accent === "emerald" ? "border-emerald-300/10 bg-emerald-300/[0.02] text-emerald-200" : accent === "amber" ? "border-amber-300/10 bg-amber-300/[0.02] text-amber-200" : "border-white/[0.06] bg-white/[0.02] text-slate-400";
  return <motion.div whileHover={{ y: -2 }} className={`rounded-2xl border p-4 transition ${tone}`}><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.17em] text-slate-500">{icon}{label}</div><div className="mt-2 text-sm font-black text-white">{value}</div><div className="mt-1 text-[10px] leading-5 text-slate-500">{detail}</div></motion.div>;
}

function TrustCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <motion.section whileHover={{ y: -2 }} className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.02] p-5 transition sm:p-6"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.19em] text-slate-500"><Sparkles className="h-3.5 w-3.5" />{eyebrow}</div><h3 className="mt-3 text-lg font-black tracking-tight text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{children}</p></motion.section>;
}
