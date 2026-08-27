import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, "public", any, any, any>;
const today = () => new Date().toISOString().slice(0, 10);
const hhmm = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function createProductivityTools(client: Db, userId: string, accessToken: string): ToolSet {
  return {
    get_today: tool({
      description: "Read the user's current OUTSTAND state: today's roadmap tasks, their completion status, and habits. Use this before answering what should I do today/now, what is pending, or progress questions when fresh data is needed.",
      inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }),
      execute: async () => {
        const [{ data: roadmaps, error: roadmapError }, { data: habits, error: habitsError }] = await Promise.all([
          client.from("roadmaps").select("id,title,goal,start_date,duration_days,status").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1),
          client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle(),
        ]);
        if (roadmapError) throw roadmapError;
        if (habitsError && habitsError.code !== "PGRST116") throw habitsError;
        const roadmap = roadmaps?.[0] ?? null;
        let tasks: any[] = [];
        if (roadmap) {
          const day = Math.max(1, Math.floor((Date.now() - new Date(roadmap.start_date).getTime()) / 86400000) + 1);
          const { data, error } = await client.from("roadmap_tasks").select("id,title,instructions,estimated_minutes,start_time,end_time,is_required,success_criteria,roadmap_task_progress(status)").eq("roadmap_id", roadmap.id).eq("user_id", userId).eq("day_number", day).order("start_time").order("task_order");
          if (error) throw error;
          tasks = (data || []).map((task: any) => ({ ...task, progress: task.roadmap_task_progress?.[0]?.status || "pending" }));
        }
        return { date: today(), roadmap: roadmap ? { id: roadmap.id, title: roadmap.title, goal: roadmap.goal } : null, todayTasks: tasks, habits: Array.isArray(habits?.habits) ? habits.habits : [] };
      },
    }),
    mark_habit: tool({
      description: "Mark one of the user's existing habits done or undone for today. Never invent a habit.",
      inputSchema: jsonSchema<{ habitId: string; completed: boolean }>({ type: "object", properties: { habitId: { type: "string", description: "Existing habit id" }, completed: { type: "boolean", description: "Whether the habit should be marked complete today" } }, required: ["habitId", "completed"], additionalProperties: false }),
      execute: async ({ habitId, completed }) => {
        const { data, error } = await client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        const current = Array.isArray(data?.habits) ? data.habits : [];
        const index = current.findIndex((habit: any) => habit?.id === habitId);
        if (index < 0) return { changed: false, message: "That habit does not exist." };
        const history = Array.isArray(current[index]?.history) ? current[index].history : [];
        const nextHistory = completed ? Array.from(new Set([...history, today()])) : history.filter((day: string) => day !== today());
        const next = current.map((habit: any, i: number) => i === index ? { ...habit, history: nextHistory } : habit);
        const { error: updateError } = await client.from("user_productivity_state").update({ habits: next, updated_at: new Date().toISOString() }).eq("user_id", userId);
        if (updateError) throw updateError;
        return { changed: true, habitId, completed, date: today(), habitName: current[index].name };
      },
    }),
    change_roadmap: tool({
      description: "Apply a small safe change to the user's existing roadmap. Use only when the user explicitly asks to move, retime, rename, simplify, or otherwise change the roadmap. Never create or delete tasks. Completed tasks remain immutable.",
      inputSchema: jsonSchema<{ roadmapId: string; request: string }>({ type: "object", properties: { roadmapId: { type: "string", description: "Existing roadmap id from current context" }, request: { type: "string", description: "The user's requested roadmap change" } }, required: ["roadmapId", "request"], additionalProperties: false }),
      execute: async ({ roadmapId, request }) => {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/roadmap-edit`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ roadmapId, request }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not change the roadmap.");
        return result;
      },
    }),
    set_reminder: tool({
      description: "Create a recurring OUTSTAND reminder when the user explicitly asks for a reminder. Store it in the existing Supabase notification scheduler.",
      inputSchema: jsonSchema<{ title: string; body: string; time: string; category: "habit" | "goal" | "motivation" | "update" | "system"; daysOfWeek?: number[] }>({ type: "object", properties: { title: { type: "string" }, body: { type: "string" }, time: { type: "string", description: "Local 24-hour time HH:MM" }, category: { type: "string", enum: ["habit", "goal", "motivation", "update", "system"] }, daysOfWeek: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } } }, required: ["title", "body", "time", "category"], additionalProperties: false }),
      execute: async ({ title, body, time, category, daysOfWeek }) => {
        if (!hhmm(time)) throw new Error("Reminder time must use HH:MM format.");
        const { data: prefs } = await client.from("notification_preferences").select("timezone").eq("user_id", userId).maybeSingle();
        const timezone = prefs?.timezone || "UTC";
        const { data, error } = await client.from("notification_jobs").insert({ user_id: userId, category, title: title.trim().slice(0, 160), body: body.trim().slice(0, 500), local_time: time, timezone, days_of_week: Array.isArray(daysOfWeek) && daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6], enabled: true }).select("id,title,local_time,timezone,days_of_week").single();
        if (error) throw error;
        return { created: true, reminder: data };
      },
    }),
  };
}
