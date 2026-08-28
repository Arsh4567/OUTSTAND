import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RoadmapQuestion = { id: string; question: string; type: "text" | "number" | "choice" | "multiline"; required?: boolean; options?: string[]; placeholder?: string };
export type RoadmapTask = { id: string; day_number: number; task_order: number; title: string; instructions: string; estimated_minutes: number | null; task_type: string; methodology_tags: string[]; resources: Array<{ title?: string; url?: string; note?: string }>; spaced_repetition_day: number | null; difficulty: string | null; success_criteria: string | null; is_required: boolean; start_time: string | null; end_time: string | null; guidance: Record<string, unknown>; progress?: "pending" | "in_progress" | "completed" | "skipped"; evidence_of_work?: string | null };
export type RoadmapMilestone = { id: string; milestone_order: number; day_start: number; day_end: number; title: string; outcome: string | null; description: string | null; methodology_tags: string[]; tasks: RoadmapTask[] };

function normalizeQuestions(value: unknown): RoadmapQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item, index) => ({
    id: String(item.id || `roadmap_question_${index + 1}`), question: String(item.question || "What additional detail would help us personalize your roadmap?"),
    type: (["text", "number", "choice", "multiline"].includes(String(item.type)) ? String(item.type) : "text") as RoadmapQuestion["type"],
    required: item.required !== false, options: Array.isArray(item.options) ? item.options.map(String) : undefined, placeholder: item.placeholder ? String(item.placeholder) : undefined,
  }));
}

const fallbackFollowUp: RoadmapQuestion = { id: "roadmap_missing_detail", question: "What is the single most important result you want to achieve by the end of this roadmap?", type: "multiline", required: true, placeholder: "For example: score 90%+ in my next exam, reach 1200 chess rating, or build my first working website." };

export function useRoadmap() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [questions, setQuestions] = useState<RoadmapQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchRoadmaps = useCallback(async (preferredRoadmapId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in to view your roadmap.");
    const response = await fetch("/api/roadmaps", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load roadmaps.");
    const list = Array.isArray(result.roadmaps) ? result.roadmaps : [];
    setRoadmaps(list);
    return (preferredRoadmapId && list.find((item: any) => item.id === preferredRoadmapId)) || list[0] || null;
  }, []);

  const load = useCallback(async (preferredRoadmapId?: string) => {
    setLoading(true);
    try {
      const roadmapData = await fetchRoadmaps(preferredRoadmapId);
      if (!roadmapData) { setRoadmap(null); setMilestones([]); setTasks([]); return; }
      setRoadmap(roadmapData);
      const [{ data: milestoneRows, error: milestoneError }, { data: taskRows, error: taskError }, { data: progressRows, error: progressError }] = await Promise.all([
        supabase.from("roadmap_milestones").select("*").eq("roadmap_id", roadmapData.id).order("milestone_order"),
        supabase.from("roadmap_tasks").select("*").eq("roadmap_id", roadmapData.id).order("day_number").order("start_time").order("task_order"),
        supabase.from("roadmap_task_progress").select("task_id,status").eq("roadmap_id", roadmapData.id),
      ]);
      if (milestoneError) throw milestoneError; if (taskError) throw taskError; if (progressError) throw progressError;
      const progress = new Map((progressRows || []).map((item) => [item.task_id, item.status]));
      const hydratedTasks = (taskRows || []).map((task) => ({ ...task, progress: progress.get(task.id) || "pending" })) as RoadmapTask[];
      setTasks(hydratedTasks);
      setMilestones((milestoneRows || []).map((milestone) => ({ ...milestone, tasks: hydratedTasks.filter((task) => task.day_number >= milestone.day_start && task.day_number <= milestone.day_end) })) as RoadmapMilestone[]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load roadmap."); }
    finally { setLoading(false); }
  }, [fetchRoadmaps]);
  useEffect(() => { void load(); }, [load]);

  const updateRoadmap = useCallback(async (roadmapId: string, patch: { title: string; goal: string }) => {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in first.");
    const title = patch.title.trim().slice(0, 120); const goal = patch.goal.trim().slice(0, 2000);
    if (title.length < 2) throw new Error("Roadmap title is too short."); if (goal.length < 5) throw new Error("Roadmap goal is too short.");
    const { data, error } = await supabase.from("roadmaps").update({ title, goal }).eq("id", roadmapId).eq("user_id", session.user.id).select().single(); if (error) throw error;
    setRoadmap(data); setRoadmaps((items) => items.map((item) => item.id === data.id ? { ...item, ...data } : item)); return data;
  }, []);

  const smartChange = useCallback(async (roadmapId: string, request: string) => {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in first.");
    const response = await fetch("/api/roadmap-edit", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ roadmapId, request }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not apply smart roadmap change.");
    return { handled: true, message: result.message || "Smart roadmap change applied." };
  }, []);

  const archiveRoadmap = useCallback(async (roadmapId: string) => {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in first.");
    const response = await fetch("/api/roadmaps", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ roadmapId, status: "archived" }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not archive roadmap.");
    const nextList = roadmaps.filter((item) => item.id !== roadmapId); setRoadmaps(nextList); if (roadmap?.id === roadmapId) await load(nextList[0]?.id); return result.roadmap;
  }, [roadmap, roadmaps, load]);

  const askQuestions = useCallback(async (category: string, currentAnswers: Record<string, unknown> = answers) => {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in to build a roadmap.");
    const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "questions", category, answers: currentAnswers }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not generate intake questions.");
    const nextQuestions = normalizeQuestions(result.questions); if (!nextQuestions.length) throw new Error("The roadmap intake did not return any questions. Please try again."); setQuestions(nextQuestions); return nextQuestions;
  }, [answers]);

  const generate = useCallback(async (category: string, currentAnswers: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Please sign in to build a roadmap.");
    const { data: activeRoadmaps, error: countError } = await supabase.from("roadmaps").select("id").eq("user_id", session.user.id).in("status", ["active", "paused"]); if (countError) throw countError; if ((activeRoadmaps || []).length >= 4) throw new Error("You can have up to 4 active or paused roadmaps. Archive one before creating another.");
    setGenerating(true);
    try {
      const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "plan", category, answers: currentAnswers }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not generate roadmap.");
      if (result.needsMoreInfo) { const nextQuestions = await askQuestions(category, currentAnswers); const visibleQuestions = nextQuestions.length ? nextQuestions : [fallbackFollowUp]; setQuestions(visibleQuestions); return { ...result, questions: visibleQuestions }; }
      const plan = result.plan; if (!plan?.title || !Array.isArray(plan?.milestones) || !Array.isArray(plan?.dailySchedule) || !plan.dailySchedule.length) throw new Error("The AI returned an incomplete hourly roadmap.");
      const durationDays = Math.max(1, Math.min(730, Number(plan.durationDays) || Number(currentAnswers.durationDays) || 30)); const startDate = new Date(); const targetDate = new Date(startDate); targetDate.setDate(startDate.getDate() + durationDays - 1);
      const { data: createdRoadmap, error: roadmapError } = await supabase.from("roadmaps").insert({ user_id: session.user.id, title: plan.title, goal: String(currentAnswers.goal || currentAnswers.target || plan.summary || plan.title), category, questionnaire: currentAnswers, generation_metadata: { scientific: true, methodology: "evidence-informed", generated_plan: plan, execution_model: "rolling_hourly" }, duration_days: durationDays, start_date: startDate.toISOString().slice(0, 10), target_date: targetDate.toISOString().slice(0, 10), status: "active" }).select().single();
      if (roadmapError || !createdRoadmap) throw roadmapError || new Error("Roadmap could not be saved.");
      try {
        const milestoneRows: Array<{ id: string; dayStart: number; dayEnd: number }> = [];
        for (let index = 0; index < plan.milestones.length; index += 1) { const milestone = plan.milestones[index]; const dayStart = Math.max(1, Number(milestone.day) || 1); const nextDay = Number(plan.milestones[index + 1]?.day || durationDays + 1); const { data: milestoneRow, error: milestoneError } = await supabase.from("roadmap_milestones").insert({ roadmap_id: createdRoadmap.id, user_id: session.user.id, milestone_order: index + 1, day_start: dayStart, day_end: Math.max(dayStart, nextDay - 1), title: String(milestone.title), outcome: milestone.outcome || null, description: milestone.description || null, methodology_tags: Array.isArray(milestone.methodologyTags) ? milestone.methodologyTags : ["chunking", "deliberate_practice"] }).select().single(); if (milestoneError || !milestoneRow) throw milestoneError || new Error("Milestone could not be saved."); milestoneRows.push({ id: milestoneRow.id, dayStart, dayEnd: Math.max(dayStart, nextDay - 1) }); }
        const grouped = new Map<number, any[]>(); for (const block of plan.dailySchedule) { const day = Math.max(1, Number(block.day) || 1); const list = grouped.get(day) || []; list.push(block); grouped.set(day, list); }
        for (const [day, blocks] of grouped.entries()) { const milestone = milestoneRows.find((item) => day >= item.dayStart && day <= item.dayEnd) || milestoneRows[0]; if (!milestone) continue; for (let index = 0; index < blocks.length; index += 1) { const block = blocks[index]; const { error: taskError } = await supabase.from("roadmap_tasks").insert({ roadmap_id: createdRoadmap.id, milestone_id: milestone.id, user_id: session.user.id, day_number: day, task_order: index + 1, title: String(block.title), instructions: String(block.instructions || block.title), estimated_minutes: Number(block.estimatedMinutes) || 30, task_type: String(block.taskType || "practice"), methodology_tags: Array.isArray(block.methodologyTags) ? block.methodologyTags : ["deliberate_practice"], resources: Array.isArray(block.resources) ? block.resources : [], spaced_repetition_day: null, difficulty: null, success_criteria: String(block.successCriteria || "Complete this time block and record any blocker."), is_required: block.taskType !== "break", start_time: String(block.startTime), end_time: String(block.endTime), guidance: { structured: true, hourly: true }, evidence_of_work: typeof block.evidenceOfWork === "string" ? block.evidenceOfWork : null }); if (taskError) throw taskError; } }
      } catch (error) { await supabase.from("roadmaps").delete().eq("id", createdRoadmap.id).eq("user_id", session.user.id); throw error; }
      setAnswers(currentAnswers); await load(createdRoadmap.id); return { ...result, roadmapId: createdRoadmap.id };
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the generated roadmap."); throw error; } finally { setGenerating(false); }
  }, [askQuestions, load]);

  const insertNextDaySchedule = useCallback(async (roadmapId: string, userId: string, nextDay: number, schedule: any[]) => { if (!Array.isArray(schedule) || !schedule.length) return; const { data: existing } = await supabase.from("roadmap_tasks").select("id").eq("roadmap_id", roadmapId).eq("user_id", userId).eq("day_number", nextDay).limit(1); if (existing?.length) return; const { data: milestone } = await supabase.from("roadmap_milestones").select("id").eq("roadmap_id", roadmapId).eq("user_id", userId).lte("day_start", nextDay).gte("day_end", nextDay).order("milestone_order").limit(1).maybeSingle(); if (!milestone) return; for (let index = 0; index < schedule.length; index += 1) { const block = schedule[index]; await supabase.from("roadmap_tasks").insert({ roadmap_id: roadmapId, milestone_id: milestone.id, user_id: userId, day_number: nextDay, task_order: index + 1, title: String(block.title), instructions: String(block.instructions || block.title), estimated_minutes: Number(block.estimatedMinutes) || 30, task_type: String(block.taskType || "practice"), methodology_tags: Array.isArray(block.methodologyTags) ? block.methodologyTags : ["deliberate_practice"], spaced_repetition_day: null, difficulty: null, success_criteria: String(block.successCriteria || "Complete this time block and record any blocker."), is_required: block.taskType !== "break", start_time: String(block.startTime), end_time: String(block.endTime), guidance: { structured: true, hourly: true, generatedBy: "nightly_adaptation" }, evidence_of_work: typeof block.evidenceOfWork === "string" ? block.evidenceOfWork : null }); } }, []);

  const toggleTask = useCallback(async (task: RoadmapTask) => { if (!roadmap) return; const nextStatus = task.progress === "completed" ? "pending" : "completed"; const { error } = await supabase.from("roadmap_task_progress").upsert({ task_id: task.id, roadmap_id: roadmap.id, user_id: roadmap.user_id, status: nextStatus, completed_at: nextStatus === "completed" ? new Date().toISOString() : null }, { onConflict: "task_id,user_id" }); if (error) throw error; setTasks((items) => items.map((item) => item.id === task.id ? { ...item, progress: nextStatus } : item)); }, [roadmap]);

  const saveNightlyReview = useCallback(async (reflection: string, energy: number, difficulty: number) => { if (!roadmap) throw new Error("No active roadmap."); const today = new Date().toISOString().slice(0, 10); const completedDay = Math.max(1, Math.floor((Date.now() - new Date(roadmap.start_date).getTime()) / 86400000) + 1); const todayTasks = tasks.filter((task) => task.day_number === completedDay); const requiredTasks = todayTasks.filter((task) => task.is_required); const completed = requiredTasks.filter((task) => task.progress === "completed").length; const percent = requiredTasks.length ? Math.round((completed / requiredTasks.length) * 100) : 0; const { data: dailyLog, error: dailyError } = await supabase.from("roadmap_daily_logs").upsert({ roadmap_id: roadmap.id, user_id: roadmap.user_id, log_date: today, planned_tasks: requiredTasks.length, completed_tasks: completed, completion_percent: percent, reflection, energy_level: energy, difficulty_rating: difficulty }, { onConflict: "roadmap_id,log_date" }).select().single(); if (dailyError || !dailyLog) throw dailyError || new Error("Could not save nightly log."); const nextDay = completedDay + 1; const { data: { session } } = await supabase.auth.getSession(); if (session) { const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "adapt", roadmapId: roadmap.id, category: roadmap.category, answers, context: { startDate: roadmap.start_date, durationDays: roadmap.duration_days, completedToday: completed, plannedToday: requiredTasks.length, reflection, energy, difficulty, nextDay } }) }); const result = await response.json(); if (response.ok && result.plan?.dailySchedule) await insertNextDaySchedule(roadmap.id, session.user.id, nextDay, result.plan.dailySchedule.filter((block: any) => Number(block.day) === nextDay)); return { log: dailyLog, ...result }; } return { log: dailyLog }; }, [answers, insertNextDaySchedule, roadmap, tasks]);

  const todayIndex = roadmap ? Math.min(roadmap.duration_days, Math.max(1, Math.floor((Date.now() - new Date(roadmap.start_date).getTime()) / 86400000) + 1)) : 0;
  const todayTasks = useMemo(() => tasks.filter((task) => task.day_number === todayIndex), [tasks, todayIndex]);
  return { roadmap, roadmaps, milestones, tasks, questions, answers, loading, generating, todayIndex, todayTasks, setAnswers, load, generate, askQuestions, updateRoadmap, smartChange, archiveRoadmap, toggleTask, saveNightlyReview };
}
