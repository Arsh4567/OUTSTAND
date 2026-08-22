import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type VercelRequest = { method?: string; body?: unknown; headers: Record<string, string | undefined> };
type VercelResponse = { status: (code: number) => VercelResponse; setHeader: (name: string, value: string) => VercelResponse; json: (body: unknown) => VercelResponse; end: () => void };
type Db = SupabaseClient<any, "public", any, any, any>;
const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());
const json = (res: VercelResponse, status: number, body: unknown) => res.status(status).setHeader("Cache-Control", "no-store").json(body);
const tokenOf = (req: VercelRequest) => req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";

async function auth(req: VercelRequest) {
  const token = tokenOf(req);
  if (!token) throw Object.assign(new Error("Authentication required."), { status: 401 });
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw Object.assign(new Error("Supabase server configuration is missing."), { status: 500 });
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } }) as Db;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error("Authentication failed."), { status: 401 });
  return { client, userId: data.user.id };
}

function parseJson(text: string) {
  const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(clean); } catch {
    const start = clean.indexOf("{"); const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error("The AI returned invalid structured data.");
  }
}

const rules = `You are OUTSTAND Intelligence. Your job is execution, not motivational writing. Never invent user facts. Ask for missing information. Prefer a tiny number of high-leverage actions over exhaustive lists. Every task must be concrete, measurable, and finishable in one session. Never schedule over sleep, school, work, meals, or fixed commitments. Do not create generic filler such as stay motivated, research more, keep learning, or work hard. Use active recall, deliberate practice, spaced repetition, error correction, or reflection only when they fit. A user should be able to open OUTSTAND and know exactly what to do next. Return JSON only.`;

async function callGemini(prompt: string) {
  const google = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!google) throw Object.assign(new Error("Gemini API key is not configured."), { status: 503 });
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": google }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${rules}\n\n${prompt}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.15 } }) });
  const raw = await response.text();
  if (!response.ok) throw Object.assign(new Error(`Gemini request failed (${response.status}).`), { status: response.status });
  try { const parsed = JSON.parse(raw); const content = parsed?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join(""); if (!content?.trim()) throw new Error("The AI returned an empty response."); return parseJson(content); } catch (error) { throw error instanceof Error ? error : new Error("The AI returned invalid structured data."); }
}

async function callGroq(prompt: string) {
  const groq = env("GROQ_API_KEY");
  if (!groq) throw Object.assign(new Error("Groq API key is not configured."), { status: 503 });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.15, max_tokens: 5000, response_format: { type: "json_object" }, messages: [{ role: "system", content: rules }, { role: "user", content: prompt }] }) });
  const raw = await response.text();
  if (!response.ok) throw Object.assign(new Error(`Groq request failed (${response.status}).`), { status: response.status });
  try { const parsed = JSON.parse(raw); const content = parsed?.choices?.[0]?.message?.content; if (typeof content !== "string" || !content.trim()) throw new Error("The AI returned an empty response."); return parseJson(content); } catch (error) { throw error instanceof Error ? error : new Error("The AI returned invalid structured data."); }
}

async function callAI(prompt: string) {
  const failures: string[] = [];
  // Groq is intentionally the primary provider. Gemini is fallback only.
  if (env("GROQ_API_KEY")) {
    try { return await callGroq(prompt); }
    catch (error) { failures.push(error instanceof Error ? error.message : "Groq failed"); console.error("[OUTSTAND] Groq provider failed; trying Gemini fallback", error); }
  }
  if (env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) {
    try { return await callGemini(prompt); }
    catch (error) { failures.push(error instanceof Error ? error.message : "Gemini failed"); console.error("[OUTSTAND] Gemini fallback failed", error); }
  }
  throw Object.assign(new Error("AI service is temporarily unavailable. Please try again."), { status: 503, cause: failures });
}

const validTime = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
function validatePlan(plan: any) {
  if (!plan || typeof plan.title !== "string" || !Number.isInteger(plan.durationDays) || !Array.isArray(plan.milestones) || !Array.isArray(plan.dailySchedule)) throw new Error("The AI returned an incomplete plan.");
  if (plan.milestones.length < 3 || plan.milestones.length > 6 || plan.dailySchedule.length < 1) throw new Error("The AI returned an invalid plan size.");
  for (const milestone of plan.milestones) if (!Number.isInteger(milestone.day) || typeof milestone.title !== "string" || typeof milestone.outcome !== "string" || !Array.isArray(milestone.actions) || milestone.actions.length < 1 || milestone.actions.length > 3 || milestone.actions.some((action: unknown) => typeof action !== "string" || !action.trim())) throw new Error("The AI returned an invalid milestone.");
  for (const block of plan.dailySchedule) if (!Number.isInteger(block.day) || block.day < 1 || typeof block.title !== "string" || !validTime(block.startTime) || !validTime(block.endTime) || typeof block.instructions !== "string" || !Number.isInteger(block.estimatedMinutes) || block.estimatedMinutes < 10 || block.estimatedMinutes > 90) throw new Error("The AI returned an invalid schedule block.");
  return plan;
}
function normalizePlan(plan: any) { plan.milestones = plan.milestones.slice(0, 6).map((m: any) => ({ ...m, actions: m.actions.slice(0, 3) })); plan.dailySchedule = plan.dailySchedule.slice(0, Math.max(1, Math.min(plan.durationDays, 90))); plan.today = Array.isArray(plan.today) ? plan.today.slice(0, 3) : plan.dailySchedule.filter((b: any) => b.day === 1).slice(0, 3).map((b: any) => b.title); plan.metrics = Array.isArray(plan.metrics) ? plan.metrics.slice(0, 4) : []; plan.assumptions = Array.isArray(plan.assumptions) ? plan.assumptions.slice(0, 4) : []; return plan; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method === "GET") return json(res, 200, { ok: Boolean(env("GROQ_API_KEY") || env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")), groq: Boolean(env("GROQ_API_KEY")), gemini: Boolean(env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")), service: "outstand-roadmap-ai", primary: "groq", fallback: "gemini" });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  try {
    const { client, userId } = await auth(req); const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const mode = ["questions", "plan", "adapt"].includes(input.mode) ? input.mode : "questions"; const category = typeof input.category === "string" ? input.category : "custom"; const answers = input.answers && typeof input.answers === "object" ? input.answers : {}; const context = input.context && typeof input.context === "object" ? input.context : {};
    if (mode === "questions") { const answered = Object.entries(answers).map(([key, value]) => `${key}: ${String(value)}`).join("\n") || "None yet"; return json(res, 200, await callAI(`Create only the next 3-5 highest-value questions for a ${category} goal. Never repeat answered information. Collect only what is needed to build an executable plan: exact outcome and measurable target, current baseline, deadline, normal weekday availability/fixed commitments, preferred session length, and important constraints. If already known, do not ask again. Return {"questions":[{"id":"string","question":"string","type":"text|number|choice|multiline","required":true,"options":[],"placeholder":""}]} .\n\nAnswered:\n${answered}\nContext:\n${JSON.stringify(context)}`)); }
    if (mode === "plan") { const durationDays = Math.max(7, Math.min(180, Number(answers.durationDays) || 30)); const plan = validatePlan(await callAI(`Build a concise execution plan for this ${category} goal. Duration: ${durationDays} days. User answers: ${JSON.stringify(answers)}. User context: ${JSON.stringify(context)}.\n\nCreate 3-6 meaningful milestones for the whole goal, not a chapter-by-chapter syllabus. Each milestone has 1-3 short action strings. Generate at most 3 schedule blocks per day, only when useful and within the user's real availability. Each block must tell the user exactly what to do and how success is measured. The first day must contain 1-3 actions in a top-level today array. Do not fill empty time with generic tasks. Include at most 4 metrics and one short adaptationRule.\n\nReturn exactly {"title":"","summary":"","durationDays":${durationDays},"difficulty":"","assumptions":[],"milestones":[{"day":1,"title":"","outcome":"","actions":["Do one concrete thing","Practice one concrete thing"]}],"dailySchedule":[{"day":1,"startTime":"18:00","endTime":"18:30","title":"","instructions":"","taskType":"practice","methodologyTags":[],"estimatedMinutes":30,"successCriteria":"","resources":[]}],"today":[""],"metrics":[""],"adaptationRule":""}`)); return json(res, 200, { plan: normalizePlan(plan) }); }
    const { data: saved, error: loadError } = await client.from("ai_roadmaps").select("id,plan").eq("user_id", userId).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (loadError || !saved?.plan) return json(res, 404, { error: "No active AI roadmap found." });
    const adapted = normalizePlan(validatePlan(await callAI(`Adapt this existing OUTSTAND plan using today's progress. Do not redesign the goal or repeat completed work. Simplify tomorrow if the user is falling behind; increase difficulty only after consistent completion. Keep the plan concise and executable.\n\nExisting plan:\n${JSON.stringify(saved.plan)}\n\nToday's progress:\n${JSON.stringify(context)}`))); const changed = JSON.stringify(adapted) !== JSON.stringify(saved.plan); if (changed) { const { error } = await client.from("ai_roadmaps").update({ plan: adapted, updated_at: new Date().toISOString() }).eq("id", saved.id).eq("user_id", userId); if (error) throw Object.assign(new Error(`Could not save the adapted roadmap: ${error.message}`), { status: 500 }); } return json(res, 200, { plan: adapted, changed, reason: changed ? "Your plan was adjusted using today's progress." : "Your current plan still fits your progress." });
  } catch (error: any) { console.error("[OUTSTAND] roadmap error", error); return json(res, Number.isInteger(error?.status) ? error.status : 500, { error: error instanceof Error ? error.message : "Roadmap generation failed." }); }
}
