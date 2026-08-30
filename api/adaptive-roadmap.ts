import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, "public", any>;
export type Adaptation = {
  day: number;
  completionRate: number;
  completedMinutes: number;
  plannedMinutes: number;
  remainingMinutes: number;
  action: "maintain" | "recover" | "lighten" | "progress";
  reason: string;
  carryForwardTaskIds: string[];
};

function currentDay(startDate: string, duration: number, now = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  const day = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(Math.max(1, Number(duration) || 1), day));
}

export async function getAdaptiveSnapshot(client: Db, userId: string, roadmapId: string, now = new Date()) {
  const { data: roadmap, error: roadmapError } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
  if (roadmapError) throw roadmapError;
  if (!roadmap) throw new Error("Roadmap not found.");

  const day = currentDay(roadmap.start_date, roadmap.duration_days, now);
  const { data: tasks, error: taskError } = await client.from("roadmap_tasks").select("id,day_number,task_order,title,estimated_minutes,is_required,task_type").eq("roadmap_id", roadmapId).eq("user_id", userId).order("day_number").order("task_order");
  if (taskError) throw taskError;
  const { data: progress, error: progressError } = await client.from("roadmap_task_progress").select("task_id,status,completed_at").eq("roadmap_id", roadmapId).eq("user_id", userId);
  if (progressError) throw progressError;

  const progressMap = new Map((progress || []).map((p: any) => [p.task_id, p]));
  const todayTasks = (tasks || []).filter((task: any) => Number(task.day_number) === day);
  const plannedMinutes = todayTasks.reduce((sum: number, task: any) => sum + Number(task.estimated_minutes || 0), 0);
  const completedTasks = todayTasks.filter((task: any) => progressMap.get(task.id)?.status === "completed");
  const completedMinutes = completedTasks.reduce((sum: number, task: any) => sum + Number(task.estimated_minutes || 0), 0);
  const completionRate = todayTasks.length ? completedTasks.length / todayTasks.length : 0;
  const incompleteRequired = todayTasks.filter((task: any) => task.is_required !== false && progressMap.get(task.id)?.status !== "completed").map((task: any) => task.id);

  let action: Adaptation = { day, completionRate, completedMinutes, plannedMinutes, remainingMinutes: Math.max(0, plannedMinutes - completedMinutes), action: "maintain", reason: "Today's workload is progressing normally.", carryForwardTaskIds: [] };
  if (todayTasks.length === 0) {
    action = { ...action, action: "recover", reason: "No executable tasks exist for the current roadmap day; the plan needs recovery scheduling rather than silently skipping the day.", carryForwardTaskIds: [] };
  } else if (completionRate < 0.5) {
    action = { ...action, action: "recover", reason: "Less than half of today's tasks are complete; preserve prerequisites and recover only the highest-value unfinished required work instead of duplicating the whole day.", carryForwardTaskIds: incompleteRequired };
  } else if (completionRate < 0.8) {
    action = { ...action, action: "lighten", reason: "Today's completion is below 80%; keep the next day's prerequisite work but avoid adding extra progression until consistency recovers.", carryForwardTaskIds: incompleteRequired.slice(0, 2) };
  } else if (completionRate === 1 && todayTasks.length >= 2) {
    action = { ...action, action: "progress", reason: "Today's required work is complete; preserve the planned progression rather than adding filler work.", carryForwardTaskIds: [] };
  }
  return { roadmap, todayDay: day, todayTasks, progress: progress || [], adaptation: action, verified: true };
}

export async function setTaskProgress(client: Db, userId: string, roadmapId: string, taskId: string, status: string) {
  if (!["pending", "in_progress", "completed", "skipped"].includes(status)) throw new Error("Invalid task status.");
  const { data: task, error: taskError } = await client.from("roadmap_tasks").select("id,roadmap_id,user_id").eq("id", taskId).eq("roadmap_id", roadmapId).eq("user_id", userId).maybeSingle();
  if (taskError) throw taskError;
  if (!task) throw new Error("Task not found.");
  const completedAt = status === "completed" ? new Date().toISOString() : null;
  const { error } = await client.from("roadmap_task_progress").upsert({ task_id: taskId, roadmap_id: roadmapId, user_id: userId, status, completed_at: completedAt }, { onConflict: "task_id,roadmap_id,user_id" });
  if (error) throw error;
  const { data: verified, error: verifyError } = await client.from("roadmap_task_progress").select("task_id,status,completed_at").eq("task_id", taskId).eq("roadmap_id", roadmapId).eq("user_id", userId).maybeSingle();
  if (verifyError) throw verifyError;
  if (!verified || verified.status !== status) throw new Error("Task progress could not be verified.");
  return { task, progress: verified, verified: true };
}
