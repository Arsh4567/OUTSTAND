import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, "public", any>;
const today = () => new Date().toISOString().slice(0, 10);
const hhmm = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

async function resolveRoadmapId(client: Db, userId: string, roadmapId: string | undefined) {
  if (roadmapId) {
    const { data, error } = await client.from("roadmaps").select("id").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (data?.id) return data.id;
  }
  const { data, error } = await client.from("roadmaps").select("id").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function resolveHabit(client: Db, userId: string, habitId: string, habitName?: string) {
  const { data, error } = await client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  const habits = Array.isArray(data?.habits) ? data.habits : [];
  const needle = habitName?.trim().toLowerCase();
  const index = habits.findIndex((habit: any) => habit?.id === habitId || (needle && typeof habit?.name === "string" && habit.name.trim().toLowerCase() === needle));
  return { habits, index };
}

export function createProductivityTools(client: Db, userId: string, accessToken: string): ToolSet {
  return {
    get_today: tool({
      description: "Read fresh OUTSTAND state for today. Always use this before answering current roadmap, task, habit, or progress questions. The result includes actual ids needed for actions.",
      inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }),
      execute: async () => {
        const [{ data: roadmaps, error: roadmapError }, { data: productivity, error: productivityError }] = await Promise.all([
          client.from("roadmaps").select("id,title,goal,start_date,duration_days,target_date,status").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1),
          client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle(),
        ]);
        if (roadmapError) throw roadmapError;
        if (productivityError && productivityError.code !== "PGRST116") throw productivityError;
        const roadmap = roadmaps?.[0] ?? null;
        let todayTasks: any[] = [];
        if (roadmap) {
          const day = Math.max(1, Math.floor((Date.now() - new Date(`${roadmap.start_date}T00:00:00`).getTime()) / 86400000) + 1);
          const { data, error } = await client.from("roadmap_tasks").select("id,title,instructions,success_criteria,estimated_minutes,start_time,end_time,is_required,day_number,task_order,roadmap_task_progress(status)").eq("roadmap_id", roadmap.id).eq("user_id", userId).eq("day_number", day).order("start_time").order("task_order");
          if (error) throw error;
          todayTasks = (data ?? []).map((task: any) => ({ id: task.id, title: task.title, instructions: task.instructions, success_criteria: task.success_criteria, estimated_minutes: task.estimated_minutes, start_time: task.start_time, end_time: task.end_time, is_required: task.is_required, day_number: task.day_number, progress: task.roadmap_task_progress?.[0]?.status || "pending" }));
        }
        return { date: today(), roadmap: roadmap ? { id: roadmap.id, title: roadmap.title, goal: roadmap.goal, start_date: roadmap.start_date, target_date: roadmap.target_date, duration_days: roadmap.duration_days } : null, todayTasks, habits: Array.isArray(productivity?.habits) ? productivity.habits : [] };
      },
    }),

    mark_habit: tool({
      description: "Mark an existing habit done or undone for today. Resolve the habit by id or exact name and never invent a habit.",
      inputSchema: jsonSchema<{ habitId: string; completed: boolean; habitName?: string }>({ type: "object", properties: { habitId: { type: "string", description: "Existing habit id. Use get_today first if unknown." }, completed: { type: "boolean" }, habitName: { type: "string", description: "Optional exact existing habit name for fallback matching." } }, required: ["habitId", "completed"], additionalProperties: false }),
      execute: async ({ habitId, completed, habitName }) => {
        const { habits, index } = await resolveHabit(client, userId, habitId, habitName);
        if (index < 0) return { changed: false, message: "That habit does not exist." };
        const history = Array.isArray(habits[index]?.history) ? habits[index].history : [];
        const nextHistory = completed ? Array.from(new Set([...history, today()])) : history.filter((day: string) => day !== today());
        const next = habits.map((habit: any, i: number) => i === index ? { ...habit, history: nextHistory } : habit);
        const { error } = await client.from("user_productivity_state").update({ habits: next, updated_at: new Date().toISOString() }).eq("user_id", userId);
        if (error) throw error;
        return { changed: true, habitId: habits[index]?.id, completed, date: today(), habitName: habits[index]?.name };
      },
    }),

    change_roadmap: tool({
      description: "Execute a requested change to the user's existing roadmap. Use this when the user asks to edit, change, move, retime, simplify, or rebalance the roadmap. Call get_today first when the target roadmap or task ids are unknown. Never create or delete tasks; completed tasks are immutable.",
      inputSchema: jsonSchema<{ request: string; roadmapId?: string }>({ type: "object", properties: { request: { type: "string", description: "Concrete roadmap change requested by the user" }, roadmapId: { type: "string", description: "Existing roadmap id, optional when there is only one active roadmap" } }, required: ["request"], additionalProperties: false }),
      execute: async ({ request, roadmapId }) => {
        const resolvedId = await resolveRoadmapId(client, userId, roadmapId);
        if (!resolvedId) return { changed: false, message: "No active roadmap is available." };
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/roadmap-edit`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ roadmapId: resolvedId, request: request.trim().slice(0, 500) }) });
        const raw = await response.text();
        let result: any = null; try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }
        if (!response.ok) throw new Error(result?.error || "Could not change the roadmap.");
        return { roadmapId: resolvedId, ...result };
      },
    }),

    set_reminder: tool({
      description: "Create a recurring OUTSTAND reminder when the user explicitly asks for one. Store it in the Supabase notification scheduler.",
      inputSchema: jsonSchema<{ title: string; body: string; time: string; category: "habit" | "goal" | "motivation" | "update" | "system"; daysOfWeek?: number[] }>({ type: "object", properties: { title: { type: "string" }, body: { type: "string" }, time: { type: "string", description: "Local 24-hour HH:MM" }, category: { type: "string", enum: ["habit", "goal", "motivation", "update", "system"] }, daysOfWeek: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } } }, required: ["title", "body", "time", "category"], additionalProperties: false }),
      execute: async ({ title, body, time, category, daysOfWeek }) => {
        if (!hhmm(time)) throw new Error("Reminder time must use HH:MM format.");
        const { data: prefs, error: prefsError } = await client.from("notification_preferences").select("timezone").eq("user_id", userId).maybeSingle();
        if (prefsError && prefsError.code !== "PGRST116") throw prefsError;
        const timezone = prefs?.timezone || "UTC";
        const { data, error } = await client.from("notification_jobs").insert({ user_id: userId, category, title: title.trim().slice(0, 160), body: body.trim().slice(0, 500), local_time: time, timezone, days_of_week: Array.isArray(daysOfWeek) && daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6], enabled: true }).select("id,title,local_time,timezone,days_of_week").single();
        if (error) throw error;
        return { created: true, reminder: data };
      },
    }),
  };
}
