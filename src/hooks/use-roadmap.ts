import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RoadmapQuestion = { id: string; question: string; type: "text" | "number" | "choice" | "multiline"; required?: boolean; options?: string[]; placeholder?: string };
export type RoadmapTask = { id: string; day_number: number; task_order: number; title: string; instructions: string; estimated_minutes: number | null; task_type: string; methodology_tags: string[]; resources: Array<{ title?: string; url?: string; note?: string }>; spaced_repetition_day: number | null; difficulty: string | null; success_criteria: string | null; is_required: boolean; start_time: string | null; end_time: string | null; guidance: Record<string, unknown>; progress?: "pending" | "in_progress" | "completed" | "skipped"; evidence_of_work?: string | null };
export type RoadmapMilestone = { id: string; milestone_order: number; day_start: number; day_end: number; title: string; outcome: string | null; description: string | null; methodology_tags: string[]; tasks: RoadmapTask[] };
export type RoadmapSummary = { id: string; title: string; goal: string; start_date: string; target_date: string | null; duration_days: number; status: string; category: string; created_at?: string | null; user_id?: string | null };
type ActionResponse<T = unknown> = { error?: string; [key: string]: T | string | boolean | null | undefined };

const ROADMAP_STATUSES = ["active", "paused"] as const;

function normalizeQuestions(value: unknown): RoadmapQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item, index) => ({ id: String(item.id || `roadmap_question_${index + 1}`), question: String(item.question || "What additional detail would help us personalize your roadmap?"), type: (["text", "number", "choice", "multiline"].includes(String(item.type)) ? String(item.type) : "text") as RoadmapQuestion["type"], required: item.required !== false, options: Array.isArray(item.options) ? item.options.map(String) : undefined, placeholder: item.placeholder ? String(item.placeholder) : undefined }));
}

const fallbackFollowUp: RoadmapQuestion = { id: "roadmap_missing_detail", question: "What is the single most important result you want to achieve by the end of this roadmap?", type: "multiline", required: true, placeholder: "Describe the concrete result you want from this roadmap." };

function dayIndexFromStart(startDate: string | null | undefined, now = new Date()) {
  if (!startDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.max(1, Math.floor((today.getTime() - startDay.getTime()) / 86400000) + 1);
}

async function getSessionOrThrow() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) throw new Error("Please sign in to use your roadmap.");
  return data.session;
}

async function readRoadmapData(roadmapData: RoadmapSummary) {
  const [milestoneResult, taskResult, progressResult] = await Promise.all([
    supabase.from("roadmap_milestones").select("*").eq("roadmap_id", roadmapData.id).eq("user_id", roadmapData.user_id || "").order("milestone_order"),
    supabase.from("roadmap_tasks").select("*").eq("roadmap_id", roadmapData.id).eq("user_id", roadmapData.user_id || "").order("day_number").order("start_time").order("task_order"),
    supabase.from("roadmap_task_progress").select("task_id,status,evidence_of_work").eq("roadmap_id", roadmapData.id).eq("user_id", roadmapData.user_id || ""),
  ]);
  if (milestoneResult.error) throw milestoneResult.error;
  if (taskResult.error) throw taskResult.error;
  if (progressResult.error) throw progressResult.error;
  const progress = new Map((progressResult.data || []).map((item) => [item.task_id, item]));
  const hydrated = (taskResult.data || []).map((task) => { const current = progress.get(task.id); return { ...task, progress: current?.status || "pending", evidence_of_work: current?.evidence_of_work ?? null } as RoadmapTask; });
  const hydratedMilestones = (milestoneResult.data || []).map((milestone) => ({ ...milestone, tasks: hydrated.filter((task) => task.day_number >= milestone.day_start && task.day_number <= milestone.day_end) })) as RoadmapMilestone[];
  return { milestones: hydratedMilestones, tasks: hydrated };
}

export function useRoadmap() {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapSummary | null>(null);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [questions, setQuestions] = useState<RoadmapQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const resetRoadmapState = useCallback(() => { setRoadmap(null); setMilestones([]); setTasks([]); }, []);
  const resetIntake = useCallback(() => { setQuestions([]); setAnswers({}); }, []);

  const invoke = useCallback(async <T = ActionResponse>(action: string, body: Record<string, unknown> = {}): Promise<T> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase.functions.invoke("outstand-ai", { body: { action, ...body }, headers: { Authorization: `Bearer ${session.access_token}` } });
    if (error) {
      let message = "Roadmap service request failed.";
      const response = (error as any)?.context;
      try { if (response && typeof response.json === "function") { const payload = await response.json(); if (payload?.error) message = String(payload.error); } } catch { /* stable fallback */ }
      throw new Error(message);
    }
    if (data?.error) throw new Error(String(data.error));
    return data as T;
  }, []);

  const fetchRoadmaps = useCallback(async (preferredRoadmapId?: string) => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("user_id", session.user.id).in("status", [...ROADMAP_STATUSES]).order("created_at", { ascending: false }).limit(4);
    if (error) throw error;
    const list = (data ?? []) as RoadmapSummary[];
    setRoadmaps(list);
    if (!list.length) { resetRoadmapState(); return null; }
    return (preferredRoadmapId && list.find((item) => item.id === preferredRoadmapId)) || list[0];
  }, [resetRoadmapState]);

  const load = useCallback(async (preferredRoadmapId?: string) => {
    setLoading(true);
    try { const selected = await fetchRoadmaps(preferredRoadmapId); if (!selected) return null; setRoadmap(selected); const nextData = await readRoadmapData(selected); setTasks(nextData.tasks); setMilestones(nextData.milestones); return selected; }
    catch (error) { console.error("Failed to load roadmap:", error); toast.error(error instanceof Error ? error.message : "Could not load roadmap."); resetRoadmapState(); return null; }
    finally { setLoading(false); }
  }, [fetchRoadmaps, resetRoadmapState]);

  useEffect(() => { void load(); }, [load]);

  const selectRoadmap = useCallback(async (roadmapId: string) => {
    if (!roadmapId) return false;
    const selected = await fetchRoadmaps(roadmapId); if (!selected || selected.id !== roadmapId) return false;
    setLoading(true);
    try { setRoadmap(selected); const nextData = await readRoadmapData(selected); setTasks(nextData.tasks); setMilestones(nextData.milestones); return true; }
    catch (error) { console.error("Failed to switch roadmap:", error); toast.error(error instanceof Error ? error.message : "Could not switch roadmap."); return false; }
    finally { setLoading(false); }
  }, [fetchRoadmaps]);

  const updateRoadmap = useCallback(async (roadmapId: string, patch: { title: string; goal: string }) => {
    const data = await invoke<{ roadmapId: string; roadmap: RoadmapSummary; updated: boolean; verified: boolean }>("update_roadmap", { roadmapId, title: patch.title, goal: patch.goal });
    if (data.verified !== true || data.updated !== true) throw new Error("Roadmap update could not be verified.");
    await load(roadmapId);
    return roadmapId;
  }, [invoke, load]);

  const smartChange = useCallback(async (roadmapId: string, request: string) => {
    if (request.trim().length < 5) throw new Error("Describe the change you want to make.");
    return await invoke("smart_change", { roadmapId, request });
  }, [invoke]);

  const deleteRoadmap = useCallback(async (roadmapId: string) => {
    const data = await invoke<{ deleted: boolean; verified: boolean }>("delete_roadmap", { roadmapId });
    if (data.verified !== true || data.deleted !== true) throw new Error("Roadmap deletion could not be verified.");
    await load();
  }, [invoke, load]);

  const askQuestions = useCallback(async (category: string, currentAnswers: Record<string, unknown> = answers) => { const data = await invoke("roadmap_questions", { category, answers: currentAnswers }); const next = normalizeQuestions(data?.questions); if (!next.length) throw new Error("The roadmap intake did not return any questions. Please try again."); setQuestions(next); return next; }, [answers, invoke]);

  const generate = useCallback(async (category: string, currentAnswers: Record<string, unknown>) => {
    setGenerating(true);
    try { const data = await invoke("generate_roadmap", { category, answers: currentAnswers }); if (data?.needsMoreInfo) { const next = normalizeQuestions(data.questions); const visible = next.length ? next : [fallbackFollowUp]; setQuestions(visible); return { ...data, questions: visible }; } if (!data?.roadmapId) throw new Error("Roadmap was generated but no saved roadmap ID was returned."); setAnswers(currentAnswers); await load(data.roadmapId); return data; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate roadmap."); throw error; }
    finally { setGenerating(false); }
  }, [invoke, load]);

  const insertNextDaySchedule = useCallback((roadmapId: string, userId: string, nextDay: number, schedule: unknown[]) => invoke("insert_next_day_schedule", { roadmapId, userId, nextDay, schedule }), [invoke]);
  const toggleTask = useCallback(async (task: RoadmapTask) => { if (!roadmap) return; const status = task.progress === "completed" ? "pending" : "completed"; const data = await invoke("set_task_progress", { taskId: task.id, roadmapId: roadmap.id, status }); if (data?.verified === false) throw new Error("Task progress could not be verified."); await load(roadmap.id); return data; }, [invoke, load, roadmap]);
  const saveNightlyReview = useCallback(async (reflection: string, energy: number, difficulty: number) => { if (!roadmap) throw new Error("No roadmap selected."); const data = await invoke("save_nightly_review", { roadmapId: roadmap.id, reflection, energy, difficulty }); await load(roadmap.id); return data; }, [invoke, load, roadmap]);

  const todayIndex = useMemo(() => dayIndexFromStart(roadmap?.start_date), [roadmap?.start_date]);
  const boundedTodayIndex = useMemo(() => Math.min(todayIndex, Math.max(1, Number(roadmap?.duration_days || todayIndex))), [todayIndex, roadmap?.duration_days]);
  const todayTasks = useMemo(() => tasks.filter((task) => task.day_number === boundedTodayIndex), [tasks, boundedTodayIndex]);

  return { roadmaps, roadmap, milestones, tasks, todayTasks, todayIndex: boundedTodayIndex, questions, answers, setAnswers, loading, generating, load, selectRoadmap, generate, askQuestions, resetIntake, updateRoadmap, smartChange, deleteRoadmap, toggleTask, saveNightlyReview, insertNextDaySchedule };
}
