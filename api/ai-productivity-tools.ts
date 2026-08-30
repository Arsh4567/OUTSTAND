import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createBasicRoadmap,
  getOwnedRoadmap,
  smartChangeRoadmap,
  deleteOwnedRoadmap,
  listOwnedRoadmaps,
} from "./roadmap-service.js";

type Db = SupabaseClient<any, "public", any>;
type ProductivityState = { habits: any[]; sessions: any[]; outstand: any[] };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dayNumber = (start: string, duration: number) =>
  Math.min(
    Math.max(1, Math.floor((Date.now() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1),
    Math.max(1, Number(duration) || 1),
  );

const timePattern = "^([01]\\\\d|2[0-3]):[0-5]\\\\d$";

async function resolveRoadmap(client: Db, userId: string, roadmapId?: string, title?: string) {
  if (roadmapId) return getOwnedRoadmap(client, userId, roadmapId);

  const roadmaps = await listOwnedRoadmaps(client, userId);
  if (title?.trim()) {
    const needle = title.trim().toLowerCase();
    const matches = roadmaps.filter(
      (r: any) =>
        String(r.title || "").toLowerCase() === needle ||
        String(r.title || "").toLowerCase().includes(needle),
    );
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      throw new Error(`Multiple roadmaps match “${title}”. Please specify the exact title.`);
    }
    throw new Error(`No roadmap matched “${title}”.`);
  }

  if (roadmaps.length === 1) return roadmaps[0];
  if (!roadmaps.length) throw new Error("You do not have an active roadmap yet.");
  throw new Error("You have multiple active roadmaps. Specify which roadmap you want to use by title.");
}

async function readState(client: Db, userId: string): Promise<ProductivityState> {
  const { data, error } = await client
    .from("user_productivity_state")
    .select("habits,sessions,outstand")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    habits: Array.isArray(data?.habits) ? data.habits : [],
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    outstand: Array.isArray(data?.outstand) ? data.outstand : [],
  };
}

async function writeState(client: Db, state: ProductivityState) {
  const { data, error } = await client.rpc("upsert_user_productivity_state", {
    p_habits: state.habits,
    p_sessions: state.sessions,
    p_outstand: state.outstand,
  });
  if (error) throw error;
  if (!data) throw new Error("Productivity state update could not be verified.");
  return data;
}

async function findHabit(client: Db, userId: string, id?: string, name?: string) {
  const state = await readState(client, userId);
  if (id) {
    const habit = state.habits.find((h: any) => h?.id === id);
    if (!habit) throw new Error("Habit not found.");
    return { state, habit };
  }

  const needle = String(name || "").trim().toLocaleLowerCase();
  if (!needle) throw new Error("Specify a habit by id or exact name.");
  const matches = state.habits.filter(
    (h: any) => String(h?.name || "").trim().toLocaleLowerCase() === needle,
  );
  if (matches.length === 1) return { state, habit: matches[0] };
  if (matches.length > 1) throw new Error(`Multiple habits match “${name}”. Please specify the exact name.`);
  throw new Error(`No habit matched “${name}”.`);
}

export function createProductivityTools(client: Db, userId: string, _accessToken: string): ToolSet {
  const tools = {} as ToolSet;

  tools.list_roadmaps = tool({
    description: "List the user's active or paused canonical roadmaps.",
    inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }),
    execute: async () => ({ roadmaps: await listOwnedRoadmaps(client, userId), verified: true }),
  });

  tools.change_roadmap = tool({
    description: "Apply a real roadmap change. Use roadmapId or roadmapTitle. Supports roadmap and task/schedule changes.",
    inputSchema: jsonSchema({
      type: "object",
      properties: {
        roadmapId: { type: "string" },
        roadmapTitle: { type: "string" },
        request: { type: "string", minLength: 5, maxLength: 500 },
      },
      required: ["request"],
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const roadmap = await resolveRoadmap(client, userId, args.roadmapId, args.roadmapTitle);
      const result = await smartChangeRoadmap(client, userId, roadmap.id, args.request);
      const changed = "changed" in result ? result.changed : "updated" in result ? result.updated === true : false;
      return {
        ...result,
        changed,
        roadmapId: roadmap.id,
        message: changed ? "Roadmap changed successfully." : "No roadmap changes were made.",
      };
    },
  });

  tools.delete_roadmap = tool({
    description: "Permanently delete a roadmap only after an explicit user request.",
    inputSchema: jsonSchema({
      type: "object",
      properties: { roadmapId: { type: "string" }, roadmapTitle: { type: "string" } },
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const roadmap = await resolveRoadmap(client, userId, args.roadmapId, args.roadmapTitle);
      const result = await deleteOwnedRoadmap(client, userId, roadmap.id);
      return { ...result, deleted: true, message: `Roadmap “${result.title}” was deleted successfully.` };
    },
  });

  tools.create_roadmap = tool({
    description: "Create a real canonical roadmap. Convert the user's goal into a measurable outcome before creation. Provide goalSpec with a concrete outcome, metric, target, baseline (or unknown), deadline when known, and constraints. Optionally provide a structured milestone plan.",
    inputSchema: jsonSchema({
      type: "object",
      properties: {
        category: { type: "string", minLength: 2 },
        goal: { type: "string", minLength: 5 },
        title: { type: "string", maxLength: 120 },
        durationDays: { type: "integer", minimum: 7, maximum: 180 },
        answers: { type: "object", additionalProperties: true },
        goalSpec: {
          type: "object",
          properties: {
            outcome: { type: "string", minLength: 5, maxLength: 500 },
            metric: { type: "string", minLength: 2, maxLength: 160 },
            target: { type: "string", minLength: 1, maxLength: 160 },
            baseline: { type: "string", maxLength: 160 },
            deadline: { type: "string", maxLength: 40 },
            constraints: { type: "array", items: { type: "string", minLength: 1, maxLength: 200 }, maxItems: 10 },
          },
          required: ["outcome", "metric", "target"],
          additionalProperties: false,
        },
        plan: {
          type: "object",
          properties: {
            milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "integer", minimum: 1 },
                  title: { type: "string", minLength: 2 },
                  outcome: { type: "string" },
                  actions: { type: "array", items: { type: "string", minLength: 1 } },
                },
                required: ["title", "actions"],
                additionalProperties: false,
              },
            },
          },
          required: ["milestones"],
          additionalProperties: false,
        },
      },
      required: ["goal", "goalSpec"],
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const category = String(args.category || "custom").trim() || "custom";
      const goal = String(args.goal || "").trim();
      if (goal.length < 5) throw new Error("A roadmap goal is required.");

      const goalSpec = {
        outcome: String(args.goalSpec?.outcome || "").trim().slice(0, 500),
        metric: String(args.goalSpec?.metric || "").trim().slice(0, 160),
        target: String(args.goalSpec?.target || "").trim().slice(0, 160),
        baseline: String(args.goalSpec?.baseline || "unknown").trim().slice(0, 160) || "unknown",
        deadline: String(args.goalSpec?.deadline || "").trim().slice(0, 40) || null,
        constraints: Array.isArray(args.goalSpec?.constraints)
          ? args.goalSpec.constraints.map((value: unknown) => String(value).trim().slice(0, 200)).filter(Boolean).slice(0, 10)
          : [],
      };
      if (goalSpec.outcome.length < 5) throw new Error("A measurable outcome is required before creating the roadmap.");
      if (goalSpec.metric.length < 2) throw new Error("A measurable outcome needs a metric.");
      if (!goalSpec.target) throw new Error("A measurable outcome needs a target.");

      const duration = Math.max(
        7,
        Math.min(180, Number(args.durationDays) || Number(args.answers?.durationDays) || 30),
      );
      const questionnaire = { ...(args.answers || {}), goalSpec };
      const generationMetadata = { source: "assistant", phase: "goal-to-measurable-outcome", goalSpec };

      if (args.plan?.milestones?.length) {
        const { data, error } = await client.rpc("create_canonical_roadmap_from_plan", {
          p_category: category,
          p_title: String(args.title || goal.slice(0, 60) || "My roadmap").trim().slice(0, 120),
          p_goal: goal,
          p_questionnaire: questionnaire,
          p_generation_metadata: generationMetadata,
          p_duration_days: duration,
          p_start_date: typeof args.answers?.start_date === "string" ? args.answers.start_date : today(),
          p_plan: args.plan,
        });
        if (error) throw error;
        if (!data) throw new Error("Roadmap creation did not return an id.");
        return { created: true, roadmapId: data, verified: true, goalSpec, message: "Roadmap created successfully with a measurable outcome." };
      }

      const result = await createBasicRoadmap(client, userId, category, {
        ...(args.answers || {}),
        goal,
        title: args.title,
        durationDays: duration,
        goalSpec,
      });
      if (result.error) throw new Error(String(result.error));
      return {
        ...result,
        created: result.created === true,
        verified: result.verified === true,
        goalSpec,
        message: result.created
          ? "Roadmap created successfully with a measurable outcome."
          : "More information is required before creating the roadmap.",
      };
    },
  });

  tools.get_today = tool({
    description: "Read today's roadmap tasks. Never guess a roadmap when multiple roadmaps exist.",
    inputSchema: jsonSchema({
      type: "object",
      properties: { roadmapId: { type: "string" }, roadmapTitle: { type: "string" } },
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const roadmap = await resolveRoadmap(client, userId, args.roadmapId, args.roadmapTitle);
      const day = dayNumber(roadmap.start_date, roadmap.duration_days);
      const { data: tasks, error } = await client
        .from("roadmap_tasks")
        .select("id,title,day_number,task_order,start_time,end_time,estimated_minutes,is_required,task_type,instructions,success_criteria")
        .eq("roadmap_id", roadmap.id)
        .eq("user_id", userId)
        .eq("day_number", day)
        .order("task_order");
      if (error) throw error;
      return { roadmap, todayDay: day, tasks: tasks || [], verified: true };
    },
  });

  tools.list_habits = tool({
    description: "List the user's current habits and today's completion state.",
    inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }),
    execute: async () => {
      const state = await readState(client, userId);
      const date = today();
      return {
        habits: state.habits.map((habit: any) => ({
          ...habit,
          completedToday: Array.isArray(habit?.completedDates) && habit.completedDates.includes(date),
        })),
        verified: true,
      };
    },
  });

  tools.mark_habit = tool({
    description: "Mark or unmark a habit for today. Only use when the user explicitly asks.",
    inputSchema: jsonSchema({
      type: "object",
      properties: { habitId: { type: "string" }, habitName: { type: "string" }, completed: { type: "boolean" } },
      required: ["completed"],
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const { state, habit } = await findHabit(client, userId, args.habitId, args.habitName);
      const date = today();
      const completedDates = Array.isArray(habit.completedDates) ? [...habit.completedDates] : [];
      const index = completedDates.indexOf(date);
      if (args.completed && index < 0) completedDates.push(date);
      if (!args.completed && index >= 0) completedDates.splice(index, 1);
      const updatedHabit = { ...habit, completedDates };
      const nextHabits = state.habits.map((item: any) => item.id === habit.id ? updatedHabit : item);
      await writeState(client, { ...state, habits: nextHabits });
      const verified = await findHabit(client, userId, habit.id);
      const isComplete = Array.isArray(verified.habit.completedDates) && verified.habit.completedDates.includes(date);
      if (isComplete !== args.completed) throw new Error("Habit completion could not be verified.");
      return { changed: true, habit: verified.habit, completedToday: isComplete, verified: true };
    },
  });

  tools.update_habit = tool({
    description: "Update a habit's name, frequency, or reminder without losing its completion history.",
    inputSchema: jsonSchema({
      type: "object",
      properties: {
        habitId: { type: "string" },
        habitName: { type: "string" },
        name: { type: "string", minLength: 1, maxLength: 120 },
        frequency: { type: "string", maxLength: 40 },
        reminder: { type: "string", pattern: timePattern },
      },
      required: ["name"],
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const { state, habit } = await findHabit(client, userId, args.habitId, args.habitName);
      const name = String(args.name).trim();
      const duplicate = state.habits.some((item: any) => item.id !== habit.id && String(item.name || "").trim().toLowerCase() === name.toLowerCase());
      if (duplicate) throw new Error(`A habit named “${name}” already exists.`);
      const updated = { ...habit, name, ...(args.frequency !== undefined ? { frequency: String(args.frequency).trim() } : {}), ...(args.reminder !== undefined ? { reminder: args.reminder } : {}) };
      await writeState(client, { ...state, habits: state.habits.map((item: any) => item.id === habit.id ? updated : item) });
      const verified = await findHabit(client, userId, habit.id);
      if (verified.habit.name !== name) throw new Error("Habit update could not be verified.");
      return { changed: true, habit: verified.habit, verified: true };
    },
  });

  tools.delete_habit = tool({
    description: "Delete a habit only after an explicit user request.",
    inputSchema: jsonSchema({
      type: "object",
      properties: { habitId: { type: "string" }, habitName: { type: "string" } },
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const { state, habit } = await findHabit(client, userId, args.habitId, args.habitName);
      await writeState(client, { ...state, habits: state.habits.filter((item: any) => item.id !== habit.id) });
      const after = await readState(client, userId);
      if (after.habits.some((item: any) => item.id === habit.id)) throw new Error("Habit deletion could not be verified.");
      return { deleted: true, habitId: habit.id, name: habit.name, verified: true };
    },
  });

  tools.set_reminder = tool({
    description: "Set a daily reminder time for an existing habit. Only use when explicitly requested.",
    inputSchema: jsonSchema({
      type: "object",
      properties: { habitId: { type: "string" }, habitName: { type: "string" }, time: { type: "string", pattern: timePattern } },
      required: ["time"],
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const { state, habit } = await findHabit(client, userId, args.habitId, args.habitName);
      const updated = { ...habit, reminder: args.time };
      await writeState(client, { ...state, habits: state.habits.map((item: any) => item.id === habit.id ? updated : item) });
      const verified = await findHabit(client, userId, habit.id);
      if (verified.habit.reminder !== args.time) throw new Error("Reminder update could not be verified.");
      return { changed: true, habit: verified.habit, reminder: args.time, verified: true };
    },
  });

  tools.log_outstand = tool({
    description: "Add a short item to the user's OUTSTAND log. Use only when explicitly requested.",
    inputSchema: jsonSchema({
      type: "object",
      properties: { text: { type: "string", minLength: 1, maxLength: 500 }, category: { type: "string", maxLength: 60 } },
      required: ["text"],
      additionalProperties: false,
    }),
    execute: async (args: any) => {
      const state = await readState(client, userId);
      const item = { id: crypto.randomUUID(), text: String(args.text).trim(), category: String(args.category || "general").trim() || "general", createdAt: new Date().toISOString() };
      await writeState(client, { ...state, outstand: [item, ...state.outstand].slice(0, 500) });
      return { created: true, item, verified: true };
    },
  });

  return tools;
}
