import type { SupabaseClient } from "@supabase/supabase-js";

/** Read-only, user-scoped roadmap context for OUTSTAND Intelligence. */
export async function getRoadmapAssistantContext(client: SupabaseClient, userId: string) {
  const { data: roadmap, error } = await client
    .from("roadmaps")
    .select("id,title,goal,category,duration_days,start_date,target_date,status,questionnaire")
    .eq("user_id", userId)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !roadmap) return { hasRoadmap: false };

  const today = Math.max(
    1,
    Math.floor((Date.now() - new Date(`${roadmap.start_date}T00:00:00Z`).getTime()) / 86400000) + 1,
  );

  const [{ data: tasks }, { data: progress }, { data: milestones }, { data: reviews }] = await Promise.all([
    client
      .from("roadmap_tasks")
      .select("id,day_number,task_order,title,instructions,estimated_minutes,task_type,methodology_tags,start_time,end_time,guidance,success_criteria")
      .eq("roadmap_id", roadmap.id)
      .eq("user_id", userId)
      .gte("day_number", today)
      .lte("day_number", today + 2)
      .order("day_number")
      .order("start_time")
      .order("task_order")
      .limit(30),
    client
      .from("roadmap_task_progress")
      .select("task_id,status,completed_at,notes")
      .eq("roadmap_id", roadmap.id)
      .eq("user_id", userId)
      .limit(100),
    client
      .from("roadmap_milestones")
      .select("day_start,day_end,title,outcome")
      .eq("roadmap_id", roadmap.id)
      .eq("user_id", userId)
      .order("milestone_order")
      .limit(12),
    client
      .from("nightly_reviews")
      .select("review_date,ai_summary,ai_feedback,strengths,blockers")
      .eq("roadmap_id", roadmap.id)
      .eq("user_id", userId)
      .order("review_date", { ascending: false })
      .limit(3),
  ]);

  const statusByTask = new Map((progress || []).map((item: any) => [item.task_id, item.status]));
  const schedule = (tasks || []).map((task: any) => ({
    ...task,
    status: statusByTask.get(task.id) || "pending",
  }));

  return {
    hasRoadmap: true,
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      goal: roadmap.goal,
      category: roadmap.category,
      durationDays: roadmap.duration_days,
      startDate: roadmap.start_date,
      targetDate: roadmap.target_date,
      status: roadmap.status,
      todayDay: today,
    },
    milestones: milestones || [],
    upcomingSchedule: schedule,
    recentReviews: reviews || [],
  };
}
