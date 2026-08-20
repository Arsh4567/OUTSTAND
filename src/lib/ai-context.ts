import type { SupabaseClient } from "@supabase/supabase-js";

type ContextClient = SupabaseClient<any, any, any>;

export async function buildAiContext(client: ContextClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const [profileResult, roadmapResult, taskResult, focusResult, xpResult] = await Promise.all([
    client.from("profiles").select("display_name,username,total_xp,current_level,current_streak,best_streak").eq("id", userId).maybeSingle(),
    client.from("roadmaps").select("id,title,goal,status,duration_days,start_date,target_date,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("roadmap_tasks").select("id,roadmap_id,day_number,task_order,title,instructions,estimated_minutes,task_type,methodology_tags,success_criteria,is_required,start_time,end_time,guidance").eq("user_id", userId).eq("day_number", 1).order("task_order", { ascending: true }).limit(12),
    client.from("focus_sessions").select("duration_minutes,completed_at,created_at,task").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    client.from("xp_transactions").select("source,amount,description,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  const roadmap = roadmapResult.data ?? null;
  const tasks = taskResult.data ?? [];
  const focus = focusResult.data ?? [];
  const xpTransactions = xpResult.data ?? [];

  return {
    profile: profileResult.data ?? null,
    roadmap,
    today,
    todayTasks: tasks.filter((task: any) => !roadmap || task.roadmap_id === roadmap.id),
    recentFocus: focus,
    recentXp: xpTransactions,
    errors: {
      profile: profileResult.error?.message ?? null,
      roadmap: roadmapResult.error?.message ?? null,
      tasks: taskResult.error?.message ?? null,
      focus: focusResult.error?.message ?? null,
      xp: xpResult.error?.message ?? null,
    },
  };
}
