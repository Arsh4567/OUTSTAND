import { jsonSchema, tool, type ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBasicRoadmap, getOwnedRoadmap, updateOwnedRoadmap, smartChangeRoadmap } from "./roadmap-service";

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
  const roadmapEdit = tool({ description: "Apply a real AI-directed roadmap change through the authoritative roadmap mutation service. Supports rename/goal changes and safe schedule restructuring such as moving tasks by hours, moving scheduled tasks to a target time, or shifting task days. Use get_today first when the request depends on current task state.", inputSchema: jsonSchema<{ roadmapId: string; request: string }>({ type: "object", properties: { roadmapId: { type: "string" }, request: { type: "string", minLength: 5, maxLength: 500 } }, required: ["roadmapId", "request"], additionalProperties: false }), execute: async ({ roadmapId, request }) => { const result = await smartChangeRoadmap(client, userId, roadmapId, request); const changed = "changed" in result ? result.changed : "updated" in result ? result.updated === true : false; const affectedTasks = "affectedTasks" in result ? result.affectedTasks : undefined; return { ...result, changed, message: changed ? `Roadmap changed successfully. ${typeof affectedTasks === "number" ? `${affectedTasks} task(s) updated.` : ""}`.trim() : "No roadmap changes were made." }; } });

  tools.change_roadmap = roadmapEdit;
  tools.get_memory = tool({ description: "Read saved OUTSTAND AI memories relevant to the request.", inputSchema: jsonSchema<{ query?: string }>({ type: "object", properties: { query: { type: "string" } }, additionalProperties: false }), execute: async ({ query }) => { const { data, error } = await client.from("ai_memory").select("memory_type,memory_key,memory_value,confidence,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(12); if (error) throw error; const rows = data || []; if (!query?.trim()) return { memories: rows }; const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token: string) => token.length >= 3); return { memories: rows.filter((row: any) => tokens.some((token: string) => `${row.memory_key} ${row.memory_value}`.toLowerCase().includes(token))).slice(0, 8) }; } });
  tools.create_roadmap = tool({ description: "Create a real roadmap through the authoritative roadmap service.", inputSchema: jsonSchema<{ category: string; goal: string; durationDays?: number; answers?: Record<string, unknown> }>({ type: "object", properties: { category: { type: "string", minLength: 2 }, goal: { type: "string", minLength: 5 }, durationDays: { type: "integer", minimum: 7, maximum: 180 }, answers: { type: "object", additionalProperties: true } }, required: ["category", "goal"], additionalProperties: false }), execute: async ({ category, goal, durationDays, answers }) => { const cleanCategory = category.trim(); const cleanGoal = goal.trim(); const normalizedAnswers = { ...(answers || {}), goal: cleanGoal, durationDays: Math.max(7, Math.min(180, Number(durationDays) || Number((answers as any)?.durationDays) || 30)) }; const result = await createBasicRoadmap(client, userId, cleanCategory, normalizedAnswers); if (result.error) throw new Error(String(result.error)); if (result.needsMoreInfo) return { created: false, needsMoreInfo: true, questions: result.questions || [] }; return { created: true, roadmapId: result.roadmapId, verified: result.verified === true }; } });

  return tools;
}
