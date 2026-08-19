import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RoadmapQuestion = {
  id: string;
  question: string;
  type: "text" | "number" | "choice" | "multiline";
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type RoadmapTask = {
  id: string;
  day_number: number;
  task_order: number;
  title: string;
  instructions: string;
  estimated_minutes: number | null;
  task_type: string;
  methodology_tags: string[];
  resources: Array<{ title?: string; url?: string; note?: string }>;
  spaced_repetition_day: number | null;
  difficulty: string | null;
  success_criteria: string | null;
  is_required: boolean;
  progress?: "pending" | "in_progress" | "completed" | "skipped";
};

export type RoadmapMilestone = {
  id: string;
  milestone_order: number;
  day_start: number;
  day_end: number;
  title: string;
  outcome: string | null;
  description: string | null;
  methodology_tags: string[];
  tasks: RoadmapTask[];
};

export function useRoadmap() {
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [questions, setQuestions] = useState<RoadmapQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: roadmapData, error } = await supabase.from("roadmaps").select("*").in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!roadmapData) {
        setRoadmap(null); setMilestones([]); setTasks([]); return;
      }
      setRoadmap(roadmapData);
      const [{ data: milestoneRows, error: milestoneError }, { data: taskRows, error: taskError }, { data: progressRows, error: progressError }] = await Promise.all([
        supabase.from("roadmap_milestones").select("*").eq("roadmap_id", roadmapData.id).order("milestone_order"),
        supabase.from("roadmap_tasks").select("*").eq("roadmap_id", roadmapData.id).order("day_number").order("task_order"),
        supabase.from("roadmap_task_progress").select("task_id,status").eq("roadmap_id", roadmapData.id),
      ]);
      if (milestoneError) throw milestoneError;
      if (taskError) throw taskError;
      if (progressError) throw progressError;
      const progress = new Map((progressRows || []).map((item) => [item.task_id, item.status]));
      const hydratedTasks = (taskRows || []).map((task) => ({ ...task, progress: progress.get(task.id) || "pending" })) as RoadmapTask[];
      setTasks(hydratedTasks);
      setMilestones((milestoneRows || []).map((milestone) => ({ ...milestone, tasks: hydratedTasks.filter((task) => task.day_number >= milestone.day_start && task.day_number <= milestone.day_end) })) as RoadmapMilestone[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load roadmap.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const askQuestions = useCallback(async (category: string, currentAnswers: Record<string, unknown> = answers) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in to build a roadmap.");
    const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "questions", category, answers: currentAnswers }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not generate intake questions.");
    setQuestions(Array.isArray(result.questions) ? result.questions : []);
    return result.questions || [];
  }, [answers]);

  const generate = useCallback(async (category: string, currentAnswers: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in to build a roadmap.");
    setGenerating(true);
    try {
      const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "plan", category, answers: currentAnswers }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not generate roadmap.");
      if (result.needsMoreInfo) {
        setQuestions(Array.isArray(result.questions) ? result.questions : []);
        return result;
      }
      const plan = result.plan;
      if (!plan?.title || !Array.isArray(plan?.milestones) || plan.milestones.length === 0) throw new Error("The AI returned an incomplete roadmap.");
      const durationDays = Math.max(1, Math.min(730, Number(plan.durationDays) || Number(currentAnswers.durationDays) || 30));
      const startDate = new Date();
      const targetDate = new Date(startDate); targetDate.setDate(startDate.getDate() + durationDays - 1);

      const { data: createdRoadmap, error: roadmapError } = await supabase.from("roadmaps").insert({
        title: plan.title,
        goal: String(currentAnswers.goal || plan.summary || plan.title),
        category,
        questionnaire: currentAnswers,
        generation_metadata: { scientific: true, methodology: "evidence-informed", generated_plan: plan },
        duration_days: durationDays,
        start_date: startDate.toISOString().slice(0, 10),
        target_date: targetDate.toISOString().slice(0, 10),
        status: "active",
      }).select().single();
      if (roadmapError || !createdRoadmap) throw roadmapError || new Error("Roadmap could not be saved.");

      for (let index = 0; index < plan.milestones.length; index += 1) {
        const milestone = plan.milestones[index];
        const dayStart = Math.max(1, Number(milestone.day) || 1);
        const nextDay = Number(plan.milestones[index + 1]?.day || durationDays + 1);
        const { data: milestoneRow, error: milestoneError } = await supabase.from("roadmap_milestones").insert({
          roadmap_id: createdRoadmap.id, user_id: session.user.id, milestone_order: index + 1,
          day_start: dayStart, day_end: Math.max(dayStart, nextDay - 1), title: String(milestone.title),
          outcome: milestone.outcome || null, description: milestone.description || null,
          methodology_tags: Array.isArray(milestone.methodologyTags) ? milestone.methodologyTags : ["chunking", "deliberate_practice"],
        }).select().single();
        if (milestoneError || !milestoneRow) throw milestoneError || new Error("Milestone could not be saved.");

        const actions = Array.isArray(milestone.actions) ? milestone.actions : [];
        for (let actionIndex = 0; actionIndex < actions.length; actionIndex += 1) {
          const source = actions[actionIndex];
          const task = typeof source === "string" ? { title: source, instructions: source } : source;
          const { error: taskError } = await supabase.from("roadmap_tasks").insert({
            roadmap_id: createdRoadmap.id, milestone_id: milestoneRow.id, user_id: session.user.id,
            day_number: dayStart, task_order: actionIndex + 1, title: String(task.title),
            instructions: String(task.instructions || task.title), estimated_minutes: Number(task.estimatedMinutes) || 25,
            task_type: String(task.taskType || "practice"), methodology_tags: Array.isArray(task.methodologyTags) ? task.methodologyTags : ["active_recall", "deliberate_practice", "chunking"],
            resources: Array.isArray(task.resources) ? task.resources : [],
            spaced_repetition_day: task.spacedRepetitionDay == null ? null : Number(task.spacedRepetitionDay),
            difficulty: task.difficulty ? String(task.difficulty) : null,
            success_criteria: String(task.successCriteria || "Complete the task and record errors or blockers."),
            is_required: true,
          });
          if (taskError) throw taskError;
        }
      }
      setAnswers(currentAnswers);
      await load();
      return result;
    } catch (error) {
      // Avoid leaving a half-created roadmap visible when a milestone/task insert fails.
      toast.error(error instanceof Error ? error.message : "Could not save the generated roadmap.");
      throw error;
    } finally { setGenerating(false); }
  }, [load]);

  const toggleTask = useCallback(async (task: RoadmapTask) => {
    if (!roadmap) return;
    const nextStatus = task.progress === "completed" ? "pending" : "completed";
    const payload = { task_id: task.id, roadmap_id: roadmap.id, user_id: roadmap.user_id, status: nextStatus, completed_at: nextStatus === "completed" ? new Date().toISOString() : null };
    const { error } = await supabase.from("roadmap_task_progress").upsert(payload, { onConflict: "task_id,user_id" });
    if (error) throw error;
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, progress: nextStatus } : item));
  }, [roadmap]);

  const saveNightlyReview = useCallback(async (reflection: string, energy: number, difficulty: number) => {
    if (!roadmap) throw new Error("No active roadmap.");
    const today = new Date().toISOString().slice(0, 10);
    const todayTasks = tasks.filter((task) => task.day_number === Math.max(1, Math.floor((Date.now() - new Date(roadmap.start_date).getTime()) / 86400000) + 1));
    const completed = todayTasks.filter((task) => task.progress === "completed").length;
    const percent = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
    const { data: dailyLog, error: dailyError } = await supabase.from("roadmap_daily_logs").upsert({ roadmap_id: roadmap.id, user_id: roadmap.user_id, log_date: today, planned_tasks: todayTasks.length, completed_tasks: completed, completion_percent: percent, reflection, energy_level: energy, difficulty_rating: difficulty }, { onConflict: "roadmap_id,log_date" }).select().single();
    if (dailyError || !dailyLog) throw dailyError || new Error("Could not save nightly log.");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ mode: "adapt", context: { roadmapId: roadmap.id, reflection, energy, difficulty, completion: percent } }) });
      if (response.ok) {
        const result = await response.json();
        await supabase.from("nightly_reviews").upsert({ roadmap_id: roadmap.id, daily_log_id: dailyLog.id, user_id: roadmap.user_id, review_date: today, ai_summary: result.analysis?.summary || result.reason || null, ai_feedback: result.analysis?.recommendation || null, adaptation: result, strengths: result.analysis?.strengths || [], blockers: result.analysis?.blockers || [] }, { onConflict: "roadmap_id,review_date" });
        return result;
      }
    }
    return { completion: percent, reason: "Your day has been logged. Keep the next session focused and concrete." };
  }, [roadmap, tasks]);

  const todayIndex = useMemo(() => roadmap ? Math.max(1, Math.floor((Date.now() - new Date(roadmap.start_date).getTime()) / 86400000) + 1) : 1, [roadmap]);
  const todayTasks = useMemo(() => tasks.filter((task) => task.day_number === todayIndex), [tasks, todayIndex]);

  return { roadmap, milestones, tasks, todayTasks, todayIndex, questions, answers, setAnswers, loading, generating, askQuestions, generate, toggleTask, saveNightlyReview, reload: load };
}
