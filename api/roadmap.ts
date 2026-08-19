import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());
const json = (res: VercelResponse, status: number, data: unknown) => res.status(status).setHeader("Cache-Control", "no-store").json(data);
const bearer = (req: VercelRequest) => req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";

async function authenticate(req: VercelRequest) {
  const token = bearer(req);
  if (!token) return { error: { status: 401, message: "Authentication required." } } as const;
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return { error: { status: 500, message: "Supabase server configuration is missing." } } as const;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: { status: 401, message: "Authentication failed." } } as const;
  return { client, userId: data.user.id } as const;
}

function extractJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The AI returned invalid structured data.");
  }
}

const baseRules = `You are OUTSTAND Intelligence, an adaptive personal planning AI. Never invent user facts. Ask for missing information before planning. Plans must be realistic, specific and measurable. Use evidence-informed learning methods when relevant: active recall, retrieval practice, spaced repetition, deliberate practice, interleaving, chunking, worked examples, error correction, reflection, and progressive difficulty. These are methodology tags, not guarantees. Every time block must fit the user's stated availability. Never schedule over school, work, sleep, meals, or fixed commitments. Return JSON only.`;

async function askGroq(prompt: string) {
  const apiKey = env("GROQ_API_KEY");
  if (!apiKey) throw Object.assign(new Error("Groq API configuration is missing."), { status: 503, code: "GROQ_CONFIG_MISSING" });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0.2, max_tokens: 6000, response_format: { type: "json_object" }, messages: [{ role: "system", content: baseRules }, { role: "user", content: prompt }] }) });
  const raw = await response.text();
  if (!response.ok) throw Object.assign(new Error(`Groq request failed (${response.status}).`), { status: response.status, code: response.status === 429 ? "AI_QUOTA_EXCEEDED" : "GROQ_REQUEST_FAILED" });
  const parsed = JSON.parse(raw); const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Groq returned an empty response.");
  return extractJson(content);
}

async function askGemini(prompt: string) {
  const apiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!apiKey) throw Object.assign(new Error("Gemini API configuration is missing."), { status: 503, code: "GEMINI_CONFIG_MISSING" });
  const model = "gemini-3.1-flash-lite";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${baseRules}\n\n${prompt}` }] }], generationConfig: { responseMimeType: "application/json" } }) });
  const raw = await response.text();
  if (!response.ok) throw Object.assign(new Error(`Gemini request failed (${response.status}).`), { status: response.status, code: response.status === 429 ? "AI_QUOTA_EXCEEDED" : "GEMINI_REQUEST_FAILED" });
  const parsed = JSON.parse(raw); const content = parsed?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join("");
  if (typeof content !== "string" || !content.trim()) throw new Error("Gemini returned an empty response.");
  return extractJson(content);
}

async function ask(prompt: string) {
  try { return await askGroq(prompt); } catch (error: any) {
    if ((error?.status === 429 || error?.code === "GROQ_REQUEST_FAILED") && env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) return askGemini(prompt);
    throw error;
  }
}

async function requestBody(req: VercelRequest) {
  if (req.body && typeof req.body === "object") return req.body as any;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return {};
}

function validateTime(value: unknown) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validatePlan(plan: any) {
  if (!plan || typeof plan !== "object" || typeof plan.title !== "string" || !Number.isInteger(plan.durationDays) || !Array.isArray(plan.milestones) || plan.milestones.length === 0 || !Array.isArray(plan.dailySchedule)) throw new Error("The AI returned an invalid roadmap structure.");
  if (!plan.dailySchedule.length) throw new Error("The AI returned no hourly guidance for the first day.");
  for (const block of plan.dailySchedule) {
    if (!Number.isInteger(block.day) || block.day < 1 || typeof block.title !== "string" || !validateTime(block.startTime) || !validateTime(block.endTime) || typeof block.instructions !== "string") throw new Error("The AI returned an invalid hourly schedule block.");
  }
  for (const milestone of plan.milestones) {
    if (!Number.isInteger(milestone.day) || typeof milestone.title !== "string" || !Array.isArray(milestone.actions)) throw new Error("The AI returned an invalid milestone.");
    for (const action of milestone.actions) if (typeof action !== "string" && (!action || typeof action.title !== "string")) throw new Error("The AI returned an invalid roadmap task.");
  }
  return plan;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  const auth = await authenticate(req);
  if ("error" in auth) return json(res, auth.error.status, { error: auth.error.message });
  try {
    const input = await requestBody(req);
    const mode = ["questions", "plan", "adapt"].includes(input?.mode) ? input.mode : "questions";
    const category = typeof input?.category === "string" ? input.category : "custom";
    const answers = input?.answers && typeof input.answers === "object" ? input.answers : {};
    const context = input?.context && typeof input.context === "object" ? input.context : {};

    if (mode === "questions") {
      const answered = Object.entries(answers).map(([key, value]) => `${key}: ${String(value)}`).join("\n") || "No answers yet.";
      return json(res, 200, await ask(`Create the next 4 to 6 highest-value adaptive questions for a ${category} goal. Do not repeat answered information. The interview MUST collect: exact outcome and measurable target; current baseline; deadline; wake and sleep times; fixed commitments such as school/work; realistic daily study/work window; preferred session length; current skill level; and constraints. At least one question must capture the user's normal weekday schedule so the generated roadmap can tell them exactly what to do and when. Return exactly {"questions":[{"id":"string","question":"string","type":"text|number|choice|multiline","required":true,"options":["..."],"placeholder":"..."}]}.\n\nAnswered:\n${answered}\nContext:\n${JSON.stringify(context)}`));
    }

    if (mode === "plan") {
      const result: any = await ask(`Build a genuinely personalized ${category} roadmap from this interview. The roadmap is ${Math.max(1, Number(answers.durationDays) || 30)} days, but use a rolling execution model: create the high-level milestones for the whole roadmap and create a detailed time-blocked schedule for the FIRST 7 DAYS. Every schedule block must have an explicit startTime and endTime and tell the user exactly what to do. Use 30-60 minute focused blocks, short breaks where useful, and never schedule over fixed commitments. The first block should be realistic for day 1. The schedule should use the user's actual wake/sleep and school/work constraints, not generic times.

Return exactly {"plan":{"title":"string","summary":"string","durationDays":number,"difficulty":"string","assumptions":["string"],"milestones":[{"day":number,"title":"string","outcome":"string","actions":[{"title":"string","instructions":"string","estimatedMinutes":number,"taskType":"practice|review|assessment|reflection|break","methodologyTags":["active_recall"],"resources":[{"title":"string","url":"string","note":"string"}],"spacedRepetitionDay":number|null,"successCriteria":"string"}]}],"dailySchedule":[{"day":number,"startTime":"HH:MM","endTime":"HH:MM","title":"string","instructions":"step-by-step instructions","taskType":"practice|review|assessment|reflection|break","methodologyTags":["active_recall"],"estimatedMinutes":number,"successCriteria":"string","resources":[{"title":"string","url":"string","note":"string"}]}],"adaptationRule":"string"}}. Generate at least 5 useful schedule blocks per available day and cover days 1 through 7 when the user's availability allows it. Do not fill unavailable hours. If essential information is missing return {"needsMoreInfo":true,"questions":[...]}.\n\nCategory: ${category}\nInterview:\n${JSON.stringify(answers)}`);
      if (result?.needsMoreInfo) return json(res, 200, result);
      validatePlan(result?.plan);
      return json(res, 200, { plan: result.plan });
    }

    const roadmapId = typeof context.roadmapId === "string" ? context.roadmapId : "";
    if (!roadmapId) return json(res, 400, { error: "roadmapId is required for adaptation." });
    const { data: roadmap, error: roadmapError } = await auth.client.from("roadmaps").select("id,title,goal,category,duration_days,questionnaire,generation_metadata").eq("id", roadmapId).eq("user_id", auth.userId).maybeSingle();
    if (roadmapError || !roadmap) return json(res, 404, { error: "Roadmap not found." });
    const { data: tasks } = await auth.client.from("roadmap_tasks").select("id,day_number,title,instructions,estimated_minutes,methodology_tags,start_time,end_time,guidance").eq("roadmap_id", roadmapId).eq("user_id", auth.userId).order("day_number").order("start_time").order("task_order");
    const { data: progress } = await auth.client.from("roadmap_task_progress").select("task_id,status,completed_at,notes").eq("roadmap_id", roadmapId).eq("user_id", auth.userId);
    const { data: logs } = await auth.client.from("roadmap_daily_logs").select("log_date,planned_tasks,completed_tasks,completion_percent,reflection,energy_level,difficulty_rating").eq("roadmap_id", roadmapId).eq("user_id", auth.userId).order("log_date", { ascending: false }).limit(14);
    const nextDay = Math.max(1, Number(context.nextDay) || 1);
    const result: any = await ask(`Analyze tonight's evidence for this roadmap. Never alter completed tasks. Return exactly {"analysis":{"summary":"string","strengths":["string"],"blockers":["string"],"recommendation":"string"},"adapted":boolean,"futureAdjustments":[{"taskId":"string","action":"keep|reduce|split|reschedule|increase","reason":"string"}],"nextDaySchedule":[{"day":number,"startTime":"HH:MM","endTime":"HH:MM","title":"string","instructions":"step-by-step instructions","taskType":"practice|review|assessment|reflection|break","methodologyTags":["active_recall"],"estimatedMinutes":number,"successCriteria":"string","resources":[{"title":"string","url":"string","note":"string"}]}]}. The nextDaySchedule MUST contain at least 5 useful time blocks when the user's availability allows it, use the user's real schedule, and adapt difficulty/volume from today's evidence. Do not schedule over fixed commitments.\n\nRoadmap:\n${JSON.stringify(roadmap)}\nTasks:\n${JSON.stringify(tasks || [])}\nProgress:\n${JSON.stringify(progress || [])}\nDaily logs:\n${JSON.stringify(logs || [])}\nTonight context:\n${JSON.stringify({ ...context, nextDay })}`);
    return json(res, 200, result);
  } catch (error: any) {
    console.error("OUTSTAND roadmap request failed", error);
    return json(res, error?.status === 429 ? 429 : error?.status === 503 ? 503 : 500, { error: error?.message || "Roadmap service failed.", code: error?.code || "ROADMAP_REQUEST_FAILED" });
  }
}
