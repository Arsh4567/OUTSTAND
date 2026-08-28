import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBasicRoadmap, getOwnedRoadmap, smartChangeRoadmap, deleteOwnedRoadmap } from "./roadmap-service";

type Db = SupabaseClient<any, "public", any>;
const today = () => new Date().toISOString().slice(0, 10);
const hhmm = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const dayNumber = (startDate: string) => Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1);

async function activeRoadmap(client: Db, userId: string, roadmapId?: string) {
  let query = client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,user_id").eq("user_id", userId);
  if (roadmapId) query = query.eq("id", roadmapId);
  else query = query.in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

export function createProductivityTools(client: Db, userId: string, accessToken: string): ToolSet {
  const tools = {} as ToolSet;

  tools.change_roadmap = tool({ description: "Apply a real AI-directed roadmap change through the authoritative roadmap mutation service. Supports rename/goal changes and safe schedule restructuring. Use get_today first when the request depends on current task state.", inputSchema: jsonSchema<{ roadmapId: string; request: string }>({ type: "object", properties: { roadmapId: { type: "string" }, request: { type: "string", minLength: 5, maxLength: 500 } }, required: ["roadmapId", "request"], additionalProperties: false }), execute: async ({ roadmapId, request }) => { const result = await smartChangeRoadmap(client, userId, roadmapId, request); const changed = "changed" in result ? result.changed : "updated" in result ? result.updated === true : false; const affectedTasks = "affectedTasks" in result ? result.affectedTasks : undefined; return { ...result, changed, message: changed ? `Roadmap changed successfully.${typeof affectedTasks === "number" ? ` ${affectedTasks} task(s) updated.` : ""}` : "No roadmap changes were made." }; } });

  tools.delete_roadmap = tool({ description: "Permanently delete one of the user's roadmaps. Use only when the user explicitly asks to delete/remove a roadmap. Always use the exact roadmapId selected by the user or confirmed from current roadmap state.", inputSchema: jsonSchema<{ roadmapId: string }>({ type: "object", properties: { roadmapId: { type: "string" } }, required: ["roadmapId"], additionalProperties: false }), execute: async ({ roadmapId }) => { const result = await deleteOwnedRoadmap(client, userId, roadmapId); return { ...result, deleted: true, message: `Roadmap “${result.title}” was deleted successfully.` }; } });

  tools.get_memory = tool({ description: "Read saved OUTSTAND AI memories relevant to the request.", inputSchema: jsonSchema<{ query?: string }>({ type: "object", properties: { query: { type: "string" } }, additionalProperties: false }), execute: async ({ query }) => { const { data, error } = await client.from("ai_memory").select("memory_type,memory_key,memory_value,confidence,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(12); if (error) throw error; const rows = data || []; if (!query?.trim()) return { memories: rows }; const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token: string) => token.length >= 3); return { memories: rows.filter((row: any) => tokens.some((token: string) => `${row.memory_key} ${row.memory_value}`.toLowerCase().includes(token))).slice(0, 8) }; } });

  tools.create_roadmap = tool({ description: "Create a real roadmap through the authoritative roadmap service. Required arguments: category and goal. Respect the server-side maximum of 4 active roadmaps.", inputSchema: jsonSchema<{ category: string; goal: string; durationDays?: number; answers?: Record<string, unknown> }>({ type: "object", properties: { category: { type: "string", minLength: 2 }, goal: { type: "string", minLength: 5 }, durationDays: { type: "integer", minimum: 7, maximum: 180 }, answers: { type: "object", additionalProperties: true } }, required: ["category", "goal"], additionalProperties: false }), execute: async ({ category, goal, durationDays, answers }) => { const cleanCategory = category.trim(); const cleanGoal = goal.trim(); if (cleanCategory.length < 2) throw new Error("Roadmap category is required."); if (cleanGoal.length < 5) throw new Error("Roadmap goal is required."); const normalizedAnswers = { ...(answers || {}), goal: cleanGoal, durationDays: Math.max(7, Math.min(180, Number(durationDays) || Number((answers as any)?.durationDays) || 30)) }; const result = await createBasicRoadmap(client, userId, cleanCategory, normalizedAnswers); if (result.error) throw new Error(String(result.error)); if (result.needsMoreInfo) return { created: false, needsMoreInfo: true, questions: result.questions || [], message: "More information is required before creating the roadmap." }; return { created: true, roadmapId: result.roadmapId, roadmap: result.roadmap, verified: result.verified === true, message: "Roadmap created successfully." }; } });

  tools.get_today = tool({ description: "Read the user's current active roadmap and today's canonical roadmap tasks.", inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }), execute: async () => { const roadmap = await activeRoadmap(client, userId); if (!roadmap) return { date: today(), roadmap: null, todayTasks: [] }; const day = dayNumber(roadmap.start_date); const { data, error } = await client.from("roadmap_tasks").select("id,title,instructions,estimated_minutes,start_time,end_time,is_required,success_criteria,task_type,day_number,task_order").eq("roadmap_id", roadmap.id).eq("user_id", userId).eq("day_number", day).order("start_time").order("task_order"); if (error) throw error; return { date: today(), roadmap: { ...roadmap, currentDay: day }, todayTasks: data || [] }; } });

  return tools;
}
