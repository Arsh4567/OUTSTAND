import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBasicRoadmap, getOwnedRoadmap, smartChangeRoadmap, deleteOwnedRoadmap, listOwnedRoadmaps } from "./roadmap-service.js";

type Db = SupabaseClient<any, "public", any>;
const today = () => new Date().toISOString().slice(0, 10);
const dayNumber = (startDate: string) => Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1);

async function resolveRoadmap(client: Db, userId: string, roadmapId?: string, title?: string) {
  if (roadmapId) return getOwnedRoadmap(client, userId, roadmapId);
  const roadmaps = await listOwnedRoadmaps(client, userId);
  if (title?.trim()) {
    const needle = title.trim().toLowerCase();
    const matches = roadmaps.filter((roadmap: any) => String(roadmap.title || "").toLowerCase() === needle || String(roadmap.title || "").toLowerCase().includes(needle));
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) throw new Error(`Multiple roadmaps match “${title}”. Please specify the exact roadmap title.`);
    throw new Error(`No roadmap matched “${title}”.`);
  }
  if (roadmaps.length === 1) return roadmaps[0];
  if (roadmaps.length === 0) throw new Error("You do not have an active roadmap yet.");
  throw new Error("You have multiple active roadmaps. Specify which roadmap you want to change by title.");
}

const taskSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 5, maxLength: 200 },
    instructions: { type: "string", minLength: 10, maxLength: 2000 },
    estimatedMinutes: { type: "integer", minimum: 5, maximum: 180 },
    taskType: { type: "string", enum: ["learn", "practice", "test", "apply", "review", "reflection"] },
    difficulty: { type: "string", enum: ["foundation", "developing", "targeted", "challenging", "advanced"] },
    skill: { type: "string", maxLength: 120 },
    why: { type: "string", minLength: 10, maxLength: 500 },
    successCriteria: { type: "string", minLength: 5, maxLength: 800 },
    resourceName: { type: "string", maxLength: 120 },
    resourceUrl: { type: "string", maxLength: 500 },
    resourceInstructions: { type: "string", maxLength: 500 },
    methodology: { type: "array", items: { type: "string", maxLength: 80 }, maxItems: 6 },
    required: { type: "boolean" }
  },
  required: ["title", "instructions", "estimatedMinutes", "taskType", "difficulty", "why", "successCriteria"],
  additionalProperties: false
};

const milestoneSchema = {
  type: "object",
  properties: {
    day: { type: "integer", minimum: 1 },
    title: { type: "string", minLength: 3, maxLength: 160 },
    outcome: { type: "string", minLength: 5, maxLength: 500 },
    actions: { type: "array", items: taskSchema, minItems: 1, maxItems: 4 }
  },
  required: ["day", "title", "outcome", "actions"],
  additionalProperties: false
};

async function persistTaskDetails(client: Db, userId: string, roadmapId: string, plan: any) {
  const { data: rows, error } = await client.from("roadmap_tasks").select("id,day_number,task_order").eq("roadmap_id", roadmapId).eq("user_id", userId).order("day_number").order("task_order");
  if (error) throw error;
  const byKey = new Map((rows || []).map((row: any) => [`${row.day_number}:${row.task_order}`, row]));
  let updated = 0;
  for (const milestone of plan.milestones || []) {
    const day = Math.max(1, Number(milestone.day) || 1);
    for (let index = 0; index < (milestone.actions || []).length; index += 1) {
      const task = milestone.actions[index];
      const row = byKey.get(`${day}:${index + 1}`);
      if (!row) continue;
      const metadata = {
        difficulty: task.difficulty || "targeted",
        skill: task.skill || null,
        why: task.why || null,
        resourceInstructions: task.resourceInstructions || null
      };
      const resources = task.resourceUrl || task.resourceName ? [{ name: task.resourceName || "Resource", url: task.resourceUrl || null }] : [];
      const { error: updateError } = await client.from("roadmap_tasks").update({
        title: String(task.title).trim().slice(0, 200),
        instructions: String(task.instructions).trim().slice(0, 2000),
        estimated_minutes: Math.max(5, Math.min(180, Number(task.estimatedMinutes) || 15)),
        task_type: task.taskType || "practice",
        methodology_tags: Array.isArray(task.methodology) ? task.methodology.slice(0, 6) : [],
        resources,
        is_required: task.required !== false,
        guidance: metadata,
        success_criteria: String(task.successCriteria).trim().slice(0, 800)
      }).eq("id", row.id).eq("roadmap_id", roadmapId).eq("user_id", userId);
      if (updateError) throw updateError;
      updated += 1;
    }
  }
  const { data: verify, error: verifyError } = await client.from("roadmap_tasks").select("id,title,instructions,estimated_minutes,task_type,success_criteria,guidance,resources").eq("roadmap_id", roadmapId).eq("user_id", userId);
  if (verifyError) throw verifyError;
  if ((verify || []).length !== (rows || []).length) throw new Error("Generated task set could not be verified.");
  return updated;
}

export function createProductivityTools(client: Db, userId: string, accessToken: string): ToolSet {
  const tools = {} as ToolSet;
  tools.list_roadmaps = tool({ description: "List the user's active or paused canonical roadmaps. Use this before changing or deleting a roadmap when more than one may exist.", inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }), execute: async () => ({ roadmaps: await listOwnedRoadmaps(client, userId) }) });
  tools.change_roadmap = tool({ description: "Apply a real AI-directed roadmap change. Use roadmapId when known; otherwise provide roadmapTitle or let the tool resolve the only active roadmap. Supports rename/goal changes and safe task/schedule restructuring.", inputSchema: jsonSchema<{ roadmapId?: string; roadmapTitle?: string; request: string }>({ type: "object", properties: { roadmapId: { type: "string" }, roadmapTitle: { type: "string" }, request: { type: "string", minLength: 5, maxLength: 500 } }, required: ["request"], additionalProperties: false }), execute: async ({ roadmapId, roadmapTitle, request }) => { const roadmap = await resolveRoadmap(client, userId, roadmapId, roadmapTitle); const result = await smartChangeRoadmap(client, userId, roadmap.id, request); const changed = "changed" in result ? result.changed : "updated" in result ? result.updated === true : false; const affectedTasks = "affectedTasks" in result ? result.affectedTasks : undefined; return { ...result, changed, roadmapId: roadmap.id, message: changed ? `Roadmap changed successfully.${typeof affectedTasks === "number" ? ` ${affectedTasks} task(s) updated.` : ""}` : "No roadmap changes were made." }; } });
  tools.delete_roadmap = tool({ description: "Permanently delete one of the user's roadmaps. Use only when the user explicitly asks. Provide roadmapId when known, otherwise roadmapTitle or use the only active roadmap.", inputSchema: jsonSchema<{ roadmapId?: string; roadmapTitle?: string }>({ type: "object", properties: { roadmapId: { type: "string" }, roadmapTitle: { type: "string" } }, additionalProperties: false }), execute: async ({ roadmapId, roadmapTitle }) => { const roadmap = await resolveRoadmap(client, userId, roadmapId, roadmapTitle); const result = await deleteOwnedRoadmap(client, userId, roadmap.id); return { ...result, deleted: true, message: `Roadmap “${result.title}” was deleted successfully.` }; } });
  tools.create_roadmap = tool({ description: "Create a high-quality canonical roadmap. ALWAYS provide a plan with milestones. Each milestone must contain 1-4 concrete, high-value actions. Every action must be specific, measurable, appropriately difficult for the user's stated level, explain why it matters, define success criteria, estimate time, name a task type, and provide a real resource name/URL when the task requires an external site. Prefer a small number of high-impact tasks over filler. Use progressive learning: learn, practice, test, apply, review. Never invent a resource URL; omit it when you cannot provide a trustworthy destination. The server will persist and verify the structured task metadata. Respect the maximum of 4 active roadmaps.", inputSchema: jsonSchema<{ category?: string; goal?: string; title?: string; durationDays?: number; answers?: Record<string, unknown>; plan: { milestones: Array<{ day: number; title: string; outcome: string; actions: Array<{ title: string; instructions: string; estimatedMinutes: number; taskType: string; difficulty: string; skill?: string; why: string; successCriteria: string; resourceName?: string; resourceUrl?: string; resourceInstructions?: string; methodology?: string[]; required?: boolean }> }> } }>({ type: "object", properties: { category: { type: "string", minLength: 2 }, goal: { type: "string", minLength: 5 }, title: { type: "string", maxLength: 120 }, durationDays: { type: "integer", minimum: 7, maximum: 180 }, answers: { type: "object", additionalProperties: true }, plan: { type: "object", properties: { milestones: { type: "array", minItems: 1, maxItems: 180, items: milestoneSchema } }, required: ["milestones"], additionalProperties: false } }, required: ["plan"], additionalProperties: false }), execute: async ({ category, goal, title, durationDays, answers, plan }) => { const cleanCategory = (category || "custom").trim(); const cleanGoal = (goal || "").trim(); if (!cleanGoal) return { created: false, needsMoreInfo: true, questions: [{ id: "goal", question: "What result are you aiming for?", type: "multiline", required: true }], message: "More information is required before creating the roadmap." }; const duration = Math.max(7, Math.min(180, Number(durationDays) || Number((answers as any)?.durationDays) || 30)); const milestones = (plan.milestones || []).filter((item: any) => Number(item.day) >= 1 && Number(item.day) <= duration).slice(0, duration); if (!milestones.length) throw new Error("The roadmap needs at least one valid milestone."); const normalizedPlan = { milestones: milestones.map((milestone: any) => ({ ...milestone, actions: (milestone.actions || []).slice(0, 4).map((task: any) => ({ ...task, estimatedMinutes: Math.max(5, Math.min(180, Number(task.estimatedMinutes) || 15)), required: task.required !== false })) })) }; const legacyPlan = { milestones: normalizedPlan.milestones.map((milestone: any) => ({ day: milestone.day, title: milestone.title, outcome: milestone.outcome, actions: milestone.actions.map((task: any) => String(task.title).trim()) })) }; const { data, error } = await client.rpc("create_canonical_roadmap_from_plan", { p_category: cleanCategory, p_title: (title || cleanGoal.slice(0, 60) || "My roadmap").trim().slice(0, 120), p_goal: cleanGoal, p_questionnaire: answers || {}, p_generation_metadata: { source: "assistant", engine: "structured-task-v1", task_count: normalizedPlan.milestones.reduce((sum: number, milestone: any) => sum + milestone.actions.length, 0) }, p_duration_days: duration, p_start_date: typeof (answers as any)?.start_date === "string" ? (answers as any).start_date : today(), p_plan: legacyPlan }); if (error) throw error; if (!data) throw new Error("Roadmap creation did not return an id."); const enrichedTasks = await persistTaskDetails(client, userId, data, normalizedPlan); return { created: true, roadmapId: data, verified: true, taskCount: enrichedTasks, message: `Roadmap created with ${enrichedTasks} structured, high-value task${enrichedTasks === 1 ? "" : "s"}.` }; });
  tools.get_today = tool({ description: "Read the user's current active roadmap and today's canonical roadmap tasks.", inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }), execute: async () => { const roadmaps = await listOwnedRoadmaps(client, userId); if (!roadmaps.length) return { date: today(), roadmap: null, todayTasks: [] }; const roadmap = roadmaps[0]; const day = dayNumber(roadmap.start_date); const { data, error } = await client.from("roadmap_tasks").select("id,title,instructions,estimated_minutes,start_time,end_time,is_required,success_criteria,task_type,day_number,task_order,guidance,resources,methodology_tags").eq("roadmap_id", roadmap.id).eq("user_id", userId).eq("day_number", day).order("start_time").order("task_order"); if (error) throw error; return { date: today(), roadmap: { ...roadmap, currentDay: day }, todayTasks: data || [], availableRoadmaps: roadmaps.map((item: any) => ({ id: item.id, title: item.title, status: item.status })) }; } });
  return tools;
}
