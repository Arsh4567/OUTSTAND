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
  try { return JSON.parse(clean); } catch { const start = clean.indexOf("{"); const end = clean.lastIndexOf("}"); if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1)); throw new Error("The AI returned invalid structured data."); }
}

const rules = `You are OUTSTAND Intelligence. Your job is execution, not motivational writing. Never invent user facts. Ask for missing information. Prefer a tiny number of high-leverage actions over exhaustive lists. Every task must be concrete, measurable, and finishable in one session. Never schedule over sleep, school, work, meals, or fixed commitments. Do not create generic filler such as stay motivated, research more, keep learning, or work hard. Use active recall, deliberate practice, spaced repetition, error correction, or reflection only when they fit. A user should be able to open OUTSTAND and know exactly what to do next. For exam/academic goals, syllabusScope and educationContext are hard constraints: never invent or schedule content outside the declared scope. Return JSON only.`;

async function callGemini(prompt: string) {
  const google = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!google) throw Object.assign(new Error("Gemini API key is not configured."), { status: 503 });
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": google }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${rules}\n\n${prompt}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.15 } }) });
  const raw = await response.text(); if (!response.ok) throw Object.assign(new Error(`Gemini request failed (${response.status}).`), { status: response.status });
  const parsed = JSON.parse(raw); const content = parsed?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join(""); if (!content?.trim()) throw new Error("The AI returned an empty response."); return parseJson(content);
}

const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
const GROQ_ALLOWED_MODELS = new Set([GROQ_DEFAULT_MODEL, GROQ_FALLBACK_MODEL]);
async function resolveGroqModel(groq: string) {
  const configured = env("GROQ_MODEL"); if (configured && GROQ_ALLOWED_MODELS.has(configured)) return configured;
  try { const response = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${groq}` } }); if (response.ok) { const data = await response.json() as { data?: Array<{ id?: string; active?: boolean }> }; const available = new Set((data.data || []).filter((model) => model.active !== false).map((model) => model.id).filter(Boolean)); if (available.has(GROQ_DEFAULT_MODEL)) return GROQ_DEFAULT_MODEL; if (available.has(GROQ_FALLBACK_MODEL)) return GROQ_FALLBACK_MODEL; } } catch (error) { console.warn("[OUTSTAND] Could not resolve Groq model list", error); }
  return GROQ_DEFAULT_MODEL;
}
async function callGroq(prompt: string) {
  const groq = env("GROQ_API_KEY"); if (!groq) throw Object.assign(new Error("Groq API key is not configured."), { status: 503 });
  const model = await resolveGroqModel(groq);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, temperature: 0.15, max_tokens: 5000, reasoning_effort: "medium", response_format: { type: "json_object" }, messages: [{ role: "system", content: rules }, { role: "user", content: prompt }] }) });
  const raw = await response.text(); if (!response.ok) { let detail = ""; try { const parsed = JSON.parse(raw); detail = typeof parsed?.error?.message === "string" ? `: ${parsed.error.message}` : ""; } catch {} throw Object.assign(new Error(`Groq request failed (${response.status})${detail}`), { status: response.status }); }
  const parsed = JSON.parse(raw); const content = parsed?.choices?.[0]?.message?.content; if (typeof content !== "string" || !content.trim()) throw new Error("The AI returned an empty response."); return parseJson(content);
}
async function callAI(prompt: string) {
  const failures: string[] = [];
  if (env("GROQ_API_KEY")) { try { return await callGroq(prompt); } catch (error) { failures.push(error instanceof Error ? error.message : "Groq failed"); } }
  if (env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) { try { return await callGemini(prompt); } catch (error) { failures.push(error instanceof Error ? error.message : "Gemini failed"); } }
  throw Object.assign(new Error(`AI service is temporarily unavailable. ${failures.join(" | ")}`), { status: 503 });
}

const validTime = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
function minutesOf(value: string) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
function timeString(total: number) { const minutes = ((total % 1440) + 1440) % 1440; return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
function normalizeDayOneSchedule(plan: any, currentMinutes: number, availabilityStart?: string, availabilityEnd?: string) {
  const blocks = Array.isArray(plan?.dailySchedule) ? plan.dailySchedule : [];
  const dayOne = blocks.filter((block: any) => Number(block.day) === 1).sort((a: any, b: any) => minutesOf(a.startTime) - minutesOf(b.startTime));
  if (!dayOne.length) return;
  const startFloor = Math.max(currentMinutes + 5, availabilityStart && validTime(availabilityStart) ? minutesOf(availabilityStart) : currentMinutes + 5);
  const endCeiling = availabilityEnd && validTime(availabilityEnd) ? minutesOf(availabilityEnd) : 23 * 60 + 30;
  let cursor = startFloor; const remaining: any[] = [];
  for (const block of dayOne) { const duration = Math.max(10, Number(block.estimatedMinutes) || Math.max(10, minutesOf(block.endTime) - minutesOf(block.startTime))); const originalEnd = minutesOf(block.endTime); if (originalEnd <= currentMinutes) continue; if (cursor + duration > endCeiling) break; block.startTime = timeString(cursor); block.endTime = timeString(cursor + duration); remaining.push(block); cursor += duration + 15; }
  const ids = new Set(remaining); plan.dailySchedule = blocks.filter((block: any) => Number(block.day) !== 1 || ids.has(block)); plan.today = remaining.slice(0, 3).map((block: any) => block.title); if (remaining.length === 0) plan.today = ["Start tomorrow — Day 1 has finished for today."];
}
function validatePlan(plan: any) {
  if (!plan || typeof plan.title !== "string" || !Number.isInteger(plan.durationDays) || !Array.isArray(plan.milestones) || !Array.isArray(plan.dailySchedule)) throw new Error("The AI returned an incomplete plan.");
  if (plan.milestones.length < 3 || plan.milestones.length > 6 || plan.dailySchedule.length < 1) throw new Error("The AI returned an invalid plan size.");
  for (const milestone of plan.milestones) if (!Number.isInteger(milestone.day) || typeof milestone.title !== "string" || typeof milestone.outcome !== "string" || !Array.isArray(milestone.actions) || milestone.actions.length < 1 || milestone.actions.length > 3 || milestone.actions.some((action: unknown) => typeof action !== "string" || !action.trim())) throw new Error("The AI returned an invalid milestone.");
  for (const block of plan.dailySchedule) if (!Number.isInteger(block.day) || block.day < 1 || typeof block.title !== "string" || !validTime(block.startTime) || !validTime(block.endTime) || typeof block.instructions !== "string" || !Number.isInteger(block.estimatedMinutes) || block.estimatedMinutes < 10 || block.estimatedMinutes > 90) throw new Error("The AI returned an invalid schedule block.");
  return plan;
}
function normalizePlan(plan: any) { plan.milestones = plan.milestones.slice(0, 6).map((m: any) => ({ ...m, actions: m.actions.slice(0, 3) })); plan.dailySchedule = plan.dailySchedule.slice(0, Math.max(1, Math.min(plan.durationDays, 90))); plan.today = Array.isArray(plan.today) ? plan.today.slice(0, 3) : plan.dailySchedule.filter((b: any) => b.day === 1).slice(0, 3).map((b: any) => b.title); plan.metrics = Array.isArray(plan.metrics) ? plan.metrics.slice(0, 4) : []; plan.assumptions = Array.isArray(plan.assumptions) ? plan.assumptions.slice(0, 4) : []; return plan; }
function syllabusPrompt(category: string, answers: Record<string, unknown>) { if (!["exam_preparation", "academics"].includes(category)) return ""; return `\n\nEXAM SCOPE CONTRACT:\n- educationContext: ${JSON.stringify({ classOrGrade: answers.classOrGrade || answers.class || answers.grade, boardOrExam: answers.boardOrExam || answers.examName || answers.exam, examDate: answers.examDate || answers.deadline })}\n- syllabusScope: ${JSON.stringify(answers.syllabusScope || answers.examCoverage || answers.coverage)}\nTreat syllabusScope as a hard allow-list/coverage boundary. Never assign content outside it.`; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method === "GET") return json(res, 200, { ok: Boolean(env("GROQ_API_KEY") || env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")), groq: Boolean(env("GROQ_API_KEY")), gemini: Boolean(env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  try {
    const { client, userId } = await auth(req); const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const mode = ["questions", "plan", "adapt", "edit"].includes(input.mode) ? input.mode : "questions";
    const category = typeof input.category === "string" ? input.category : "custom";
    const answers = input.answers && typeof input.answers === "object" ? input.answers : {};
    const context = input.context && typeof input.context === "object" ? input.context : {};

    if (mode === "questions") {
      const answered = Object.entries(answers).map(([key, value]) => `${key}: ${String(value)}`).join("\n") || "None yet";
      const examMode = ["exam_preparation", "academics"].includes(category);
      return json(res, 200, await callAI(`Create only the next 3-5 highest-value questions for a ${category} goal. Never repeat answered information. Collect only what is needed to build an executable plan. ${examMode ? "This is an academic/exam goal. Ask for class/grade, board or exam name, exam date/deadline, and how much syllabus is included. Do NOT ask for the entire syllabus." : "Collect exact outcome and measurable target, current baseline, deadline, normal weekday availability/fixed commitments, preferred session length, and important constraints."} Return {"questions":[{"id":"string","question":"string","type":"text|number|choice|multiline","required":true,"options":[],"placeholder":""}]}\nAnswered:\n${answered}\nContext:\n${JSON.stringify(context)}`));
    }

    if (mode === "plan") {
      const durationDays = Math.max(7, Math.min(180, Number(answers.durationDays) || 30));
      const availabilityStart = typeof answers.availabilityStart === "string" ? answers.availabilityStart : typeof answers.startTime === "string" ? answers.startTime : undefined;
      const availabilityEnd = typeof answers.availabilityEnd === "string" ? answers.availabilityEnd : typeof answers.endTime === "string" ? answers.endTime : undefined;
      const plan = validatePlan(await callAI(`Build a concise execution plan for this ${category} goal. Duration: ${durationDays} days. Answers: ${JSON.stringify(answers)}. Context: ${JSON.stringify(context)}.${syllabusPrompt(category, answers)} Create 3-6 meaningful milestones for the whole goal, each with 1-3 short action strings. Generate at most 3 useful schedule blocks per day. The first day must have 1-3 actions in today. Return JSON matching this shape: {"title":"","summary":"","durationDays":${durationDays},"difficulty":"","assumptions":[],"milestones":[{"day":1,"title":"","outcome":"","actions":["Do one concrete thing"]}],"dailySchedule":[{"day":1,"startTime":"18:00","endTime":"18:30","title":"","instructions":"","taskType":"practice","methodologyTags":[],"estimatedMinutes":30,"successCriteria":"","resources":[]}],"today":[],"metrics":[],"adaptationRule":""}`));
      normalizeDayOneSchedule(plan, new Date().getHours() * 60 + new Date().getMinutes(), availabilityStart, availabilityEnd); return json(res, 200, { plan: normalizePlan(plan) });
    }

    if (mode === "edit") {
      const roadmapId = typeof input.roadmapId === "string" ? input.roadmapId : ""; const request = typeof input.request === "string" ? input.request.trim().slice(0, 500) : "";
      if (!roadmapId || request.length < 5) return json(res, 400, { error: "A roadmap and a meaningful change request are required." });
      const { data: roadmap, error: roadmapError } = await client.from("roadmaps").select("id,title,goal,category,duration_days,questionnaire,user_id").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
      if (roadmapError || !roadmap) return json(res, 404, { error: "Roadmap not found." });
      const edited = validatePlan(await callAI(`A user wants to change their existing OUTSTAND roadmap. Preserve the goal unless the request explicitly changes it. Do not erase completed work. Make the smallest useful changes that satisfy the request. Existing roadmap: ${JSON.stringify(roadmap)}. User request: ${request}. Return a complete valid plan in the same schema and duration as the existing roadmap.`));
      const startDate = new Date(); const targetDate = new Date(startDate); targetDate.setDate(startDate.getDate() + Math.max(1, roadmap.duration_days) - 1);
      const { error: deactivateError } = await client.from("roadmaps").update({ status: "paused" }).eq("id", roadmap.id).eq("user_id", userId); if (deactivateError) throw deactivateError;
      const { data: created, error: createError } = await client.from("roadmaps").insert({ user_id: userId, title: edited.title || roadmap.title, goal: roadmap.goal, category: roadmap.category, questionnaire: roadmap.questionnaire || {}, generation_metadata: { editedFrom: roadmap.id, editRequest: request, generated_plan: edited }, duration_days: roadmap.duration_days, start_date: startDate.toISOString().slice(0,10), target_date: targetDate.toISOString().slice(0,10), status: "active" }).select().single();
      if (createError || !created) throw createError || new Error("Edited roadmap could not be saved.");
      try {
        const milestoneRows: Array<{ id: string; dayStart: number; dayEnd: number }> = [];
        for (let index = 0; index < edited.milestones.length; index += 1) { const milestone = edited.milestones[index]; const dayStart = Math.max(1, Number(milestone.day) || 1); const nextDay = Number(edited.milestones[index + 1]?.day || roadmap.duration_days + 1); const { data: row, error } = await client.from("roadmap_milestones").insert({ roadmap_id: created.id, user_id: userId, milestone_order: index + 1, day_start: dayStart, day_end: Math.max(dayStart, nextDay - 1), title: String(milestone.title), outcome: milestone.outcome || null, description: null, methodology_tags: ["ai_edit"] }).select().single(); if (error || !row) throw error || new Error("Milestone could not be saved."); milestoneRows.push({ id: row.id, dayStart, dayEnd: Math.max(dayStart, nextDay - 1) }); }
        const grouped = new Map<number, any[]>(); for (const block of edited.dailySchedule) { const day = Math.max(1, Number(block.day) || 1); const list = grouped.get(day) || []; list.push(block); grouped.set(day, list); }
        for (const [day, blocks] of grouped.entries()) { const milestone = milestoneRows.find((item) => day >= item.dayStart && day <= item.dayEnd) || milestoneRows[0]; if (!milestone) continue; for (let index = 0; index < blocks.length; index += 1) { const block = blocks[index]; const { error } = await client.from("roadmap_tasks").insert({ roadmap_id: created.id, milestone_id: milestone.id, user_id: userId, day_number: day, task_order: index + 1, title: String(block.title), instructions: String(block.instructions || block.title), estimated_minutes: Number(block.estimatedMinutes) || 30, task_type: String(block.taskType || "practice"), methodology_tags: Array.isArray(block.methodologyTags) ? block.methodologyTags : ["ai_edit"], resources: Array.isArray(block.resources) ? block.resources : [], spaced_repetition_day: null, difficulty: null, success_criteria: String(block.successCriteria || "Complete this block."), is_required: block.taskType !== "break", start_time: String(block.startTime), end_time: String(block.endTime), guidance: { aiEdited: true } }); if (error) throw error; } }
      } catch (error) { await client.from("roadmaps").delete().eq("id", created.id).eq("user_id", userId); await client.from("roadmaps").update({ status: "active" }).eq("id", roadmap.id).eq("user_id", userId); throw error; }
      return json(res, 200, { roadmapId: created.id, changed: true });
    }

    const { data: saved, error: loadError } = await client.from("ai_roadmaps").select("id,plan").eq("user_id", userId).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (loadError || !saved?.plan) return json(res, 404, { error: "No active AI roadmap found." });
    const adapted = normalizePlan(validatePlan(await callAI(`Adapt this existing OUTSTAND plan using today's progress. Do not redesign the goal or repeat completed work. Existing plan: ${JSON.stringify(saved.plan)}. Today's progress: ${JSON.stringify(context)}`))); const changed = JSON.stringify(adapted) !== JSON.stringify(saved.plan); if (changed) { const { error } = await client.from("ai_roadmaps").update({ plan: adapted, updated_at: new Date().toISOString() }).eq("id", saved.id).eq("user_id", userId); if (error) throw error; } return json(res, 200, { plan: adapted, changed, reason: changed ? "Your plan was adjusted using today's progress." : "Your current plan still fits your progress." });
  } catch (error: any) { console.error("[OUTSTAND] roadmap error", error); return json(res, Number.isInteger(error?.status) ? error.status : 500, { error: error instanceof Error ? error.message : "Roadmap generation failed." }); }
}
