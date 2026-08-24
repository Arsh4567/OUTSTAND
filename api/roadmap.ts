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

async function callGemini(prompt: string, options?: { maxOutputTokens?: number }) {
  const google = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!google) throw Object.assign(new Error("Gemini API key is not configured."), { status: 503 });
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": google }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${rules}\n\n${prompt}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.15, ...(options?.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}) } }) });
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
async function callGroq(prompt: string, options?: { maxTokens?: number }) {
  const groq = env("GROQ_API_KEY"); if (!groq) throw Object.assign(new Error("Groq API key is not configured."), { status: 503 });
  const model = await resolveGroqModel(groq);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, temperature: 0.15, max_tokens: options?.maxTokens || 5000, reasoning_effort: "medium", response_format: { type: "json_object" }, messages: [{ role: "system", content: rules }, { role: "user", content: prompt }] }) });
  const raw = await response.text(); if (!response.ok) { let detail = ""; try { const parsed = JSON.parse(raw); detail = typeof parsed?.error?.message === "string" ? `: ${parsed.error.message}` : ""; } catch {} throw Object.assign(new Error(`Groq request failed (${response.status})${detail}`), { status: response.status }); }
  const parsed = JSON.parse(raw); const content = parsed?.choices?.[0]?.message?.content; if (typeof content !== "string" || !content.trim()) throw new Error("The AI returned an empty response."); return parseJson(content);
}
async function callAI(prompt: string, options?: { maxTokens?: number; maxOutputTokens?: number }) {
  const failures: string[] = [];
  if (env("GROQ_API_KEY")) { try { return await callGroq(prompt, { maxTokens: options?.maxTokens }); } catch (error) { failures.push(error instanceof Error ? error.message : "Groq failed"); } }
  if (env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) { try { return await callGemini(prompt, { maxOutputTokens: options?.maxOutputTokens }); } catch (error) { failures.push(error instanceof Error ? error.message : "Gemini failed"); } }
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
      return json(res, 200, await callAI(`Create only the next 3-5 highest-value questions for a ${category} goal. Never repeat answered information. Collect only what is needed to build an executable plan. ${examMode ? "This is an academic/exam goal. Ask for class/grade, board or exam name, exam date/deadline, and how much syllabus is included. Do NOT ask for the entire syllabus." : "Collect exact outcome and measurable target, current baseline, deadline, normal weekday availability/fixed commitments, preferred session length, and important constraints."} Return {"questions":[{"id":"string","question":"string","type":"text|number|choice|multiline","required":true,"options":[],"placeholder":""}]}\nAnswered:\n${answered}\nContext:\n${JSON.stringify(context)}`, { maxTokens: 1200, maxOutputTokens: 1200 }));
    }

    if (mode === "plan") {
      const durationDays = Math.max(7, Math.min(180, Number(answers.durationDays) || 30));
      const availabilityStart = typeof answers.availabilityStart === "string" ? answers.availabilityStart : typeof answers.startTime === "string" ? answers.startTime : undefined;
      const availabilityEnd = typeof answers.availabilityEnd === "string" ? answers.availabilityEnd : typeof answers.endTime === "string" ? answers.endTime : undefined;
      const plan = validatePlan(await callAI(`Build a concise execution plan for this ${category} goal. Duration: ${durationDays} days. Answers: ${JSON.stringify(answers)}. Context: ${JSON.stringify(context)}.${syllabusPrompt(category, answers)} Create 3-6 meaningful milestones for the whole goal, each with 1-3 short action strings. Generate at most 3 useful schedule blocks per day. The first day must have 1-3 actions in today. Return JSON matching this shape: {"title":"","summary":"","durationDays":${durationDays},"difficulty":"","assumptions":[],"milestones":[{"day":1,"title":"","outcome":"","actions":["Do one concrete thing"]}],"dailySchedule":[{"day":1,"startTime":"18:00","endTime":"18:30","title":"","instructions":"","taskType":"practice","methodologyTags":[],"estimatedMinutes":30,"successCriteria":"","resources":[]}],"today":[],"metrics":[],"adaptationRule":""}`));
      normalizeDayOneSchedule(plan, new Date().getHours() * 60 + new Date().getMinutes(), availabilityStart, availabilityEnd); return json(res, 200, { plan: normalizePlan(plan) });
    }

    if (mode === "edit") {
      const roadmapId = typeof input.roadmapId === "string" ? input.roadmapId : "";
      const request = typeof input.request === "string" ? input.request.trim().slice(0, 300) : "";
      if (!roadmapId || request.length < 5) return json(res, 400, { error: "A roadmap and a meaningful change request are required." });
      const { data: roadmap, error: roadmapError } = await client.from("roadmaps").select("id,title,goal,category,duration_days,questionnaire,user_id").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
      if (roadmapError || !roadmap) return json(res, 404, { error: "Roadmap not found." });

      const lower = request.toLowerCase();
      const current = { title: String(roadmap.title || ""), goal: String(roadmap.goal || ""), durationDays: Number(roadmap.duration_days) || 30 };
      const titleMatch = request.match(/^(?:rename|change|set)\s+(?:the\s+)?(?:roadmap\s+)?(?:title|name)\s+(?:to|as)\s+(.+)$/i);
      const goalMatch = request.match(/^(?:change|update|set)\s+(?:the\s+)?goal\s+(?:to|as)\s+(.+)$/i);
      const daysMatch = request.match(/\b(?:to|for|in)\s+(\d{1,3})\s*days?\b/i) || request.match(/\b(\d{1,3})\s*days?\b/i);

      if (titleMatch?.[1]) {
        const title = titleMatch[1].trim().replace(/[.!?]+$/, "").slice(0, 120);
        const { error } = await client.from("roadmaps").update({ title }).eq("id", roadmapId).eq("user_id", userId);
        if (error) throw error;
        return json(res, 200, { changed: true, message: "Roadmap title updated." });
      }
      if (goalMatch?.[1]) {
        const goal = goalMatch[1].trim().replace(/[.!?]+$/, "").slice(0, 2000);
        const { error } = await client.from("roadmaps").update({ goal }).eq("id", roadmapId).eq("user_id", userId);
        if (error) throw error;
        return json(res, 200, { changed: true, message: "Roadmap goal updated." });
      }
      if (daysMatch && /\b(?:day|days|duration|shorten|extend|longer|shorter)\b/i.test(request)) {
        const durationDays = Math.max(1, Math.min(730, Number(daysMatch[1])));
        const startDate = new Date();
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + durationDays - 1);
        const { error } = await client.from("roadmaps").update({ duration_days: durationDays, target_date: targetDate.toISOString().slice(0, 10) }).eq("id", roadmapId).eq("user_id", userId);
        if (error) throw error;
        if (durationDays < current.durationDays) await client.from("roadmap_tasks").update({ is_required: false }).eq("roadmap_id", roadmapId).eq("user_id", userId).gt("day_number", durationDays);
        return json(res, 200, { changed: true, message: `Roadmap duration changed to ${durationDays} days.` });
      }

      if (/\b(?:after|from|at)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.test(lower) && /\b(?:study|session|sessions|schedule|tasks|blocks|move|shift|evening)\b/i.test(lower)) {
        const time = request.match(/\b(?:after|from|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
        if (time) {
          let hour = Number(time[1]); const minute = Number(time[2] || 0); const meridiem = time[3]?.toLowerCase(); if (meridiem === "pm" && hour < 12) hour += 12; if (meridiem === "am" && hour === 12) hour = 0; const start = hour * 60 + minute;
          const { data: tasks, error: taskError } = await client.from("roadmap_tasks").select("id,start_time,end_time").eq("roadmap_id", roadmapId).eq("user_id", userId).order("day_number").order("task_order");
          if (taskError) throw taskError;
          let cursor = start;
          for (const task of tasks || []) { const s = task.start_time && /^\d{2}:\d{2}$/.test(task.start_time) ? minutesOf(task.start_time) : null; const e = task.end_time && /^\d{2}:\d{2}$/.test(task.end_time) ? minutesOf(task.end_time) : null; if (s === null || e === null || e <= s) continue; const blockMinutes = Math.max(10, e - s); await client.from("roadmap_tasks").update({ start_time: timeString(cursor), end_time: timeString(cursor + blockMinutes) }).eq("id", task.id).eq("user_id", userId); cursor += blockMinutes + 15; if (cursor >= 23 * 60 + 30) break; }
          return json(res, 200, { changed: true, message: `Schedule moved to start after ${timeString(start)}.` });
        }
      }

      const compact = await callAI(`Return the smallest possible structured patch for this roadmap edit. Do not regenerate the roadmap. Do not return milestones, tasks, schedules, or long prose unless absolutely required. Allowed patch fields: title, goal, durationDays, startTime, endTime. Existing: ${JSON.stringify(current)}. User request: ${request}. If the request cannot be applied with those fields alone, return {"changed":false,"reason":"needs_full_plan"}. Otherwise return only changed fields, e.g. {"changed":true,"patch":{"goal":"new goal"},"message":"..."}.`, { maxTokens: 500, maxOutputTokens: 500 });
      if (!compact?.changed || !compact.patch || typeof compact.patch !== "object") return json(res, 200, { changed: false, message: compact?.reason === "needs_full_plan" ? "That change needs a larger roadmap rewrite, so it was not applied." : "No roadmap changes were needed." });
      const patch: Record<string, unknown> = {};
      if (typeof compact.patch.title === "string") patch.title = compact.patch.title.slice(0, 120);
      if (typeof compact.patch.goal === "string") patch.goal = compact.patch.goal.slice(0, 2000);
      if (Number.isFinite(Number(compact.patch.durationDays))) patch.duration_days = Math.max(1, Math.min(730, Number(compact.patch.durationDays)));
      if (!Object.keys(patch).length) return json(res, 200, { changed: false, message: "No safe roadmap fields were changed." });
      if (patch.duration_days) { const startDate = new Date(); const targetDate = new Date(startDate); targetDate.setDate(startDate.getDate() + Number(patch.duration_days) - 1); patch.target_date = targetDate.toISOString().slice(0, 10); }
      const { error: updateError } = await client.from("roadmaps").update(patch).eq("id", roadmapId).eq("user_id", userId);
      if (updateError) throw updateError;
      return json(res, 200, { changed: true, message: typeof compact.message === "string" ? compact.message : "Roadmap updated." });
    }

    const { data: saved, error: loadError } = await client.from("ai_roadmaps").select("id,plan").eq("user_id", userId).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (loadError || !saved?.plan) return json(res, 404, { error: "No active AI roadmap found." });
    const adapted = normalizePlan(validatePlan(await callAI(`Adapt this existing OUTSTAND plan using today's progress. Do not redesign the goal or repeat completed work. Existing plan: ${JSON.stringify(saved.plan)}. Today's progress: ${JSON.stringify(context)}`))); const changed = JSON.stringify(adapted) !== JSON.stringify(saved.plan); if (changed) { const { error } = await client.from("ai_roadmaps").update({ plan: adapted, updated_at: new Date().toISOString() }).eq("id", saved.id).eq("user_id", userId); if (error) throw error; } return json(res, 200, { plan: adapted, changed, reason: changed ? "Your plan was adjusted using today's progress." : "Your current plan still fits your progress." });
  } catch (error: any) { console.error("[OUTSTAND] roadmap error", error); return json(res, Number.isInteger(error?.status) ? error.status : 500, { error: error instanceof Error ? error.message : "Roadmap generation failed." }); }
}
