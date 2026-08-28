import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, "public", any, any, any>;
const today = () => new Date().toISOString().slice(0, 10);
const hhmm = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const dayNumber = (startDate: string) => Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1);

async function activeRoadmap(client: Db, userId: string, roadmapId?: string) {
  const query = client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,user_id").eq("user_id", userId);
  if (roadmapId) query.eq("id", roadmapId);
  else query.in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

async function verifyHabit(client: Db, userId: string, habitId: string, completed: boolean) {
  const { data, error } = await client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  const habit = Array.isArray(data?.habits) ? data.habits.find((item: any) => item?.id === habitId) : null;
  const actual = Boolean(habit && Array.isArray(habit.history) && habit.history.includes(today()));
  return { ok: actual === completed, actual };
}

async function verifyTask(client: Db, userId: string, taskId: string, expected: string) {
  const { data, error } = await client.from("roadmap_task_progress").select("status,completed_at").eq("task_id", taskId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return { ok: (data?.status || "pending") === expected, actual: data?.status || "pending", completedAt: data?.completed_at || null };
}

export function createProductivityTools(client: Db, userId: string, accessToken: string): ToolSet {
  return {
    get_today: tool({
      description: "Read the user's authoritative current OUTSTAND state: active roadmap, today's tasks, task progress, habits, and completion counts. Use before current-state questions or mutations when fresh data matters.",
      inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }),
      execute: async () => {
        const [{ data: roadmaps, error: roadmapError }, { data: habits, error: habitsError }] = await Promise.all([
          client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1),
          client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle(),
        ]);
        if (roadmapError) throw roadmapError;
        if (habitsError && habitsError.code !== "PGRST116") throw habitsError;
        const roadmap = roadmaps?.[0] ?? null;
        let tasks: any[] = [];
        if (roadmap) {
          const day = dayNumber(roadmap.start_date);
          const [{ data, error }, { data: progressRows, error: progressError }] = await Promise.all([
            client.from("roadmap_tasks").select("id,title,instructions,estimated_minutes,start_time,end_time,is_required,success_criteria,task_type,day_number,task_order,roadmap_task_progress(status,completed_at)").eq("roadmap_id", roadmap.id).eq("user_id", userId).eq("day_number", day).order("start_time").order("task_order"),
            client.from("roadmap_task_progress").select("task_id,status,completed_at").eq("roadmap_id", roadmap.id).eq("user_id", userId),
          ]);
          if (error) throw error;
          if (progressError) throw progressError;
          const progressMap = new Map((progressRows || []).map((row: any) => [row.task_id, row]));
          tasks = (data || []).map((task: any) => ({ ...task, progress: progressMap.get(task.id)?.status || task.roadmap_task_progress?.[0]?.status || "pending", completedAt: progressMap.get(task.id)?.completed_at || task.roadmap_task_progress?.[0]?.completed_at || null }));
        }
        const habitList = Array.isArray(habits?.habits) ? habits.habits : [];
        return { date: today(), roadmap: roadmap ? { ...roadmap, currentDay: dayNumber(roadmap.start_date) } : null, todayTasks: tasks, taskProgressCount: `${tasks.filter((task: any) => task.progress === "completed").length}/${tasks.length}`, habits: habitList, habitProgressCount: `${habitList.filter((habit: any) => Array.isArray(habit?.history) && habit.history.includes(today())).length}/${habitList.length}` };
      },
    }),
    get_progress: tool({
      description: "Read authoritative roadmap and habit progress for progress, performance, setback, and adaptation questions.",
      inputSchema: jsonSchema<{ roadmapId?: string }>({ type: "object", properties: { roadmapId: { type: "string" } }, additionalProperties: false }),
      execute: async ({ roadmapId }) => {
        const roadmap = await activeRoadmap(client, userId, roadmapId);
        const [{ data: progressRows, error: progressError }, { data: logs, error: logsError }, { data: state, error: stateError }] = await Promise.all([
          roadmap ? client.from("roadmap_task_progress").select("task_id,status,completed_at").eq("roadmap_id", roadmap.id).eq("user_id", userId) : Promise.resolve({ data: [], error: null } as any),
          roadmap ? client.from("roadmap_daily_logs").select("log_date,planned_tasks,completed_tasks,completion_percent,reflection,energy_level,difficulty_rating").eq("roadmap_id", roadmap.id).eq("user_id", userId).order("log_date", { ascending: false }).limit(14) : Promise.resolve({ data: [], error: null } as any),
          client.from("user_productivity_state").select("habits,xp").eq("user_id", userId).maybeSingle(),
        ]);
        if (progressError) throw progressError;
        if (logsError) throw logsError;
        if (stateError && stateError.code !== "PGRST116") throw stateError;
        const progress = progressRows || [];
        return { roadmap: roadmap ? { id: roadmap.id, title: roadmap.title, currentDay: dayNumber(roadmap.start_date), durationDays: roadmap.duration_days, status: roadmap.status } : null, tasks: { total: progress.length, completed: progress.filter((row: any) => row.status === "completed").length, inProgress: progress.filter((row: any) => row.status === "in_progress").length, skipped: progress.filter((row: any) => row.status === "skipped").length }, recentDays: logs || [], habits: Array.isArray(state?.habits) ? state.habits.map((habit: any) => ({ id: habit.id, name: habit.name, completedToday: Array.isArray(habit.history) && habit.history.includes(today()), streak: Array.isArray(habit.history) ? habit.history.length : 0 })) : [], xp: typeof state?.xp === "number" ? state.xp : null };
      },
    }),
    mark_habit: tool({
      description: "Mark one of the user's existing habits done or undone for today. Never invent a habit.",
      inputSchema: jsonSchema<{ habitId: string; completed: boolean }>({ type: "object", properties: { habitId: { type: "string" }, completed: { type: "boolean" } }, required: ["habitId", "completed"], additionalProperties: false }),
      execute: async ({ habitId, completed }) => {
        const { data, error } = await client.from("user_productivity_state").select("habits").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        const current = Array.isArray(data?.habits) ? data.habits : [];
        const index = current.findIndex((habit: any) => habit?.id === habitId);
        if (index < 0) return { changed: false, verified: false, message: "That habit does not exist." };
        const history = Array.isArray(current[index]?.history) ? current[index].history : [];
        const nextHistory = completed ? Array.from(new Set([...history, today()])) : history.filter((day: string) => day !== today());
        const next = current.map((habit: any, i: number) => i === index ? { ...habit, history: nextHistory } : habit);
        const { error: updateError } = await client.from("user_productivity_state").update({ habits: next, updated_at: new Date().toISOString() }).eq("user_id", userId);
        if (updateError) throw updateError;
        const verification = await verifyHabit(client, userId, habitId, completed);
        if (!verification.ok) throw new Error(`Habit update could not be verified. Expected ${completed ? "completed" : "not completed"}, got ${verification.actual ? "completed" : "not completed"}.`);
        return { changed: true, verified: true, habitId, completed, date: today(), habitName: current[index].name };
      },
    }),
    set_task_progress: tool({
      description: "Update an existing roadmap task to pending, in_progress, completed, or skipped. Never invent a task. Never reopen a completed task unless the user explicitly asks.",
      inputSchema: jsonSchema<{ taskId: string; status: "pending" | "in_progress" | "completed" | "skipped" }>({ type: "object", properties: { taskId: { type: "string" }, status: { type: "string", enum: ["pending", "in_progress", "completed", "skipped"] } }, required: ["taskId", "status"], additionalProperties: false }),
      execute: async ({ taskId, status }) => {
        const { data: task, error: taskError } = await client.from("roadmap_tasks").select("id,roadmap_id,title").eq("id", taskId).eq("user_id", userId).maybeSingle();
        if (taskError) throw taskError;
        if (!task) return { changed: false, verified: false, message: "That task does not exist." };
        const { data: existing, error: existingError } = await client.from("roadmap_task_progress").select("status").eq("task_id", taskId).eq("user_id", userId).maybeSingle();
        if (existingError && existingError.code !== "PGRST116") throw existingError;
        if (existing?.status === "completed" && status !== "completed") return { changed: false, verified: true, message: "Completed tasks are protected. Explicitly ask to reopen this task if needed." };
        const { error } = await client.from("roadmap_task_progress").upsert({ task_id: taskId, roadmap_id: task.roadmap_id, user_id: userId, status, completed_at: status === "completed" ? new Date().toISOString() : null }, { onConflict: "task_id,user_id" });
        if (error) throw error;
        const verification = await verifyTask(client, userId, taskId, status);
        if (!verification.ok) throw new Error(`Task update could not be verified. Expected ${status}, got ${verification.actual}.`);
        return { changed: true, verified: true, taskId, title: task.title, status, completedAt: verification.completedAt };
      },
    }),
    create_roadmap: tool({
      description: "Create and persist a real OUTSTAND roadmap when the user explicitly asks for one and enough planning information is available.",
      inputSchema: jsonSchema<{ category: string; goal: string; durationDays?: number; answers?: Record<string, unknown> }>({ type: "object", properties: { category: { type: "string" }, goal: { type: "string" }, durationDays: { type: "integer", minimum: 7, maximum: 180 }, answers: { type: "object", additionalProperties: true } }, required: ["category", "goal"], additionalProperties: false }),
      execute: async ({ category, goal, durationDays, answers }) => {
        const normalizedAnswers = { ...(answers || {}), goal, durationDays: durationDays || (answers as any)?.durationDays || 30 };
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/roadmap`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ mode: "plan", category, answers: normalizedAnswers, context: { source: "ai_action" } }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not create the roadmap.");
        if (result.needsMoreInfo) return { created: false, verified: false, needsMoreInfo: true, questions: result.questions || [], message: "More information is required before safely creating the roadmap." };
        if (!result.roadmapId) throw new Error("The roadmap generator did not return a saved roadmap id.");
        const saved = await activeRoadmap(client, userId, result.roadmapId);
        if (!saved) throw new Error("The roadmap was generated but could not be verified in the database.");
        return { created: true, verified: true, roadmapId: saved.id, message: "Roadmap created successfully.", plan: result.plan ? { title: result.plan.title, durationDays: result.plan.durationDays, today: result.plan.today } : undefined };
      },
    }),
    change_roadmap: tool({
      description: "Apply a safe AI-directed change to an existing roadmap when the user explicitly asks to move, retime, rename, simplify, or otherwise change it.",
      inputSchema: jsonSchema<{ roadmapId: string; request: string }>({ type: "object", properties: { roadmapId: { type: "string" }, request: { type: "string" } }, required: ["roadmapId", "request"], additionalProperties: false }),
      execute: async ({ roadmapId, request }) => {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/roadmap-edit`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ roadmapId, request }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not change the roadmap.");
        return result;
      },
    }),
    set_reminder: tool({
      description: "Create a recurring OUTSTAND reminder when the user explicitly asks for a reminder.",
      inputSchema: jsonSchema<{ title: string; body: string; time: string; category: "habit" | "goal" | "motivation" | "update" | "system"; daysOfWeek?: number[] }>({ type: "object", properties: { title: { type: "string" }, body: { type: "string" }, time: { type: "string" }, category: { type: "string", enum: ["habit", "goal", "motivation", "update", "system"] }, daysOfWeek: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } } }, required: ["title", "body", "time", "category"], additionalProperties: false }),
      execute: async ({ title, body, time, category, daysOfWeek }) => {
        if (!hhmm(time)) throw new Error("Reminder time must use HH:MM format.");
        const { data: prefs } = await client.from("notification_preferences").select("timezone").eq("user_id", userId).maybeSingle();
        const timezone = prefs?.timezone || "UTC";
        const { data, error } = await client.from("notification_jobs").insert({ user_id: userId, category, title: title.trim().slice(0, 160), body: body.trim().slice(0, 500), local_time: time, timezone, days_of_week: Array.isArray(daysOfWeek) && daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6], enabled: true }).select("id,title,local_time,timezone,days_of_week").single();
        if (error) throw error;
        const { data: verified, error: verificationError } = await client.from("notification_jobs").select("id,title,local_time,timezone,days_of_week,enabled").eq("id", data.id).eq("user_id", userId).maybeSingle();
        if (verificationError) throw verificationError;
        if (!verified) throw new Error("Reminder was created but could not be verified.");
        return { created: true, verified: true, reminder: verified };
      },
    }),
  };
}
