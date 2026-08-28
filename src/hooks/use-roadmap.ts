import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RoadmapQuestion = { id: string; question: string; type: "text" | "number" | "choice" | "multiline"; required?: boolean; options?: string[]; placeholder?: string };
export type RoadmapTask = { id: string; day_number: number; task_order: number; title: string; instructions: string; estimated_minutes: number | null; task_type: string; methodology_tags: string[]; resources: Array<{ title?: string; url?: string; note?: string }>; spaced_repetition_day: number | null; difficulty: string | null; success_criteria: string | null; is_required: boolean; start_time: string | null; end_time: string | null; guidance: Record<string, unknown>; progress?: "pending" | "in_progress" | "completed" | "skipped"; evidence_of_work?: string | null };
export type RoadmapMilestone = { id: string; milestone_order: number; day_start: number; day_end: number; title: string; outcome: string | null; description: string | null; methodology_tags: string[]; tasks: RoadmapTask[] };
type RoadmapSummary = { id: string; title: string; goal: string; start_date: string; target_date: string | null; duration_days: number; status: string; category: string; created_at?: string | null; user_id?: string | null };

type ActionResponse<T = unknown> = { error?: string; [key: string]: T | string | boolean | null | undefined };

function normalizeQuestions(value: unknown): RoadmapQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item, index) => ({
    id: String(item.id || `roadmap_question_${index + 1}`),
    question: String(item.question || "What additional detail would help us personalize your roadmap?"),
    type: (["text", "number", "choice", "multiline"].includes(String(item.type)) ? String(item.type) : "text") as RoadmapQuestion["type"],
    required: item.required !== false,
    options: Array.isArray(item.options) ? item.options.map(String) : undefined,
    placeholder: item.placeholder ? String(item.placeholder) : undefined,
  }));
}

const fallbackFollowUp: RoadmapQuestion = { id: "roadmap_missing_detail", question: "What is the single most important result you want to achieve by the end of this roadmap?", type: "multiline", required: true, placeholder: "For example: score 90%+ in my next exam, reach 1200 chess rating, or build my first working website." };

export function useRoadmap() {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapSummary | null>(null);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [questions, setQuestions] = useState<RoadmapQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const invoke = useCallback(async <T = ActionResponse>(action: string, body: Record<string, unknown> = {}): Promise<T> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.access_token) throw new Error("Please sign in to use your roadmap.");
    const { data, error } = await supabase.functions.invoke("outstand-ai", { body: { action, ...body }, headers: { Authorization: `Bearer ${session.access_token}` } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    return data as T;
  }, []);

  const fetchRoadmaps = useCallback(async (preferredRoadmapId?: string) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error("Please sign in to view your roadmap.");
    const { data, error } = await supabase.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("user_id", session.user.id).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(4);
    if (error) throw error;
    const list = (data ?? []) as RoadmapSummary[];
    setRoadmaps(list);
    return (preferredRoadmapId && list.find((item) => item.id === preferredRoadmapId)) || list[0] || null;
  }, []);

  const load = useCallback(async (preferredRoadmapId?: string) => {
    setLoading(true);
    try {
      const roadmapData = await fetchRoadmaps(preferredRoadmapId);
      if (!roadmapData) { setRoadmap(null); setMilestones([]); setTasks([]); return; }
      setRoadmap(roadmapData);
      const [milestoneResult, taskResult, progressResult] = await Promise.all([
        supabase.from("roadmap_milestones").select("*").eq("roadmap_id", roadmapData.id).order("milestone_order"),
        supabase.from("roadmap_tasks").select("*").eq("roadmap_id", roadmapData.id).order("day_number").order("start_time").order("task_order"),
        supabase.from("roadmap_task_progress").select("task_id,status,evidence_of_work").eq("roadmap_id", roadmapData.id).eq("user_id", roadmapData.user_id || ""),
      ]);
      if (milestoneResult.error) throw milestoneResult.error;
      if (taskResult.error) throw taskResult.error;
      if (progressResult.error) throw progressResult.error;
      const progress = new Map((progressResult.data || []).map((item) => [item.task_id, item]));
      const hydrated = (taskResult.data || []).map((task) => {
        const current = progress.get(task.id);
        return { ...task, progress: current?.status || "pending", evidence_of_work: current?.evidence_of_work ?? null } as RoadmapTask;
      });
      setTasks(hydrated);
      setMilestones((milestoneResult.data || []).map((milestone) => ({ ...milestone, tasks: hydrated.filter((task) => task.day_number >= milestone.day_start && task.day_number <= milestone.day_end) })) as RoadmapMilestone[]);
    } catch (error) {
      console.error("Failed to load roadmap:", error);
      toast.error(error instanceof Error ? error.message : "Could not load roadmap.");
      setRoadmap(null); setMilestones([]); setTasks([]);
    } finally { setLoading(false); }
  }, [fetchRoadmaps]);

  useEffect(() => { void load(); }, [load]);

  const updateRoadmap = useCallback(async (roadmapId: string, patch: { title: string; goal: string }) => {
    const title = patch.title.trim().slice(0, 120), goal = patch.goal.trim().slice(0, 2000);
    if (title.length < 2) throw new Error("Roadmap title is too short.");
    if (goal.length < 5) throw new Error("Roadmap goal is too short.");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Please sign in again.");
    const { data, error } = await supabase.from("roadmaps").update({ title, goal }).eq("id", roadmapId).eq("user_id", user.id).select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").single();
    if (error) throw error;
    setRoadmap(data as RoadmapSummary);
    setRoadmaps((items) => items.map((item) => item.id === roadmapId ? { ...item, ...(data as RoadmapSummary) } : item));
    return data as RoadmapSummary;
  }, []);

  const smartChange = useCallback(async (roadmapId: string, request: string) => {
    if (request.trim().length < 5) throw new Error("Describe the change you want to make.");
    return await invoke("smart_change", { roadmapId, request });
  }, [invoke]);

  const deleteRoadmap = useCallback(async (roadmapId: string) => {
    const data = await invoke("delete_roadmap", { roadmapId });
    const next = roadmaps.filter((item) => item.id !== roadmapId);
    setRoadmaps(next);
    if (roadmap?.id === roadmapId) { setRoadmap(next[0] || null); setMilestones([]); setTasks([]); if (next[0]) await load(next[0].id); }
    return data;
  }, [invoke, load, roadmap, roadmaps]);

  const askQuestions = useCallback(async (category: string, currentAnswers: Record<string, unknown> = answers) => {
    const data = await invoke("roadmap_questions", { category, answers: currentAnswers });
    const next = normalizeQuestions(data?.questions);
    if (!next.length) throw new Error("The roadmap intake did not return any questions. Please try again.");
    setQuestions(next); return next;
  }, [answers, invoke]);

  const generate = useCallback(async (category: string, currentAnswers: Record<string, unknown>) => {
    setGenerating(true);
    try {
      const data = await invoke("generate_roadmap", { category, answers: currentAnswers });
      if (data?.needsMoreInfo) { const next = normalizeQuestions(data.questions); const visible = next.length ? next : [fallbackFollowUp]; setQuestions(visible); return { ...data, questions: visible }; }
      if (!data?.roadmapId) throw new Error("Roadmap was generated but no saved roadmap ID was returned.");
      setAnswers(currentAnswers); await load(data.roadmapId); return data;
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); throw error; }
    finally { setGenerating(false); }
  }, [invoke, load]);

  const insertNextDaySchedule = useCallback(async (roadmapId: string, userId: string, nextDay: number, schedule: unknown[]) => invoke("insert_next_day_schedule", { roadmapId, userId, nextDay, schedule }), [invoke]);

  const toggleTask = useCallback(async (task: RoadmapTask) => {
    if (!roadmap) return;
    const status = task.progress === "completed" ? "pending" : "completed";
    const data = await invoke("set_task_progress", { taskId: task.id, roadmapId: roadmap.id, status });
    if (data?.verified === false) throw new Error("Task progress could not be verified.");
    await load(roadmap.id); return data;
  }, [invoke, load, roadmap]);

  const saveNightlyReview = useCallback(async (reflection: string, energy: number, difficulty: number) => {
    if (!roadmap) throw new Error("No roadmap selected.");
    const data = await invoke("save_nightly_review", { roadmapId: roadmap.id, reflection, energy, difficulty });
    await load(roadmap.id); return data;
  }, [invoke, load, roadmap]);

  const todayIndex = useMemo(() => {
    if (!roadmap?.start_date) return 1;
    const start = new Date(`${roadmap.start_date}T00:00:00`), now = new Date();
    return Math.max(1, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - start.getTime()) / 86400000) + 1);
  }, [roadmap?.start_date]);
  const todayTasks = useMemo(() => tasks.filter((task) => task.day_number === Math.min(todayIndex, Number(roadmap?.duration_days || todayIndex))), [tasks, todayIndex, roadmap?.duration_days]);

  return { roadmaps, roadmap, milestones, tasks, todayTasks, todayIndex, questions, answers, setAnswers, loading, generating, load, generate, askQuestions, updateRoadmap, smartChange, deleteRoadmap, toggleTask, saveNightlyReview, insertNextDaySchedule };
}
