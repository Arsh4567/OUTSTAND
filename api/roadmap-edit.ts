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

async function callGemini(prompt: string) {
  const google = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!google) throw new Error("Gemini API key is not configured.");
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": google },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 1200 } }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Gemini request failed (${response.status}).`);
  const parsed = JSON.parse(raw);
  const content = parsed?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join("");
  if (!content?.trim()) throw new Error("The AI returned an empty response.");
  return parseJson(content);
}

async function callGroq(prompt: string) {
  const groq = env("GROQ_API_KEY");
  if (!groq) throw new Error("Groq API key is not configured.");
  const model = env("GROQ_MODEL") || "openai/gpt-oss-120b";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.1, max_tokens: 1200, reasoning_effort: "low", response_format: { type: "json_object" }, messages: [{ role: "system", content: "You are OUTSTAND Smart Change. You are a PATCH ENGINE, not a roadmap generator. Never create, delete, or regenerate a roadmap. Never rewrite the whole plan. Only propose small changes to EXISTING incomplete tasks that directly satisfy the user's request. Preserve all completed tasks exactly. Return JSON only and keep it very small." }, { role: "user", content: prompt }] }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Groq request failed (${response.status}).`);
  const parsed = JSON.parse(raw);
  const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("The AI returned an empty response.");
  return parseJson(content);
}

async function callAI(prompt: string) {
  const failures: string[] = [];
  if (env("GROQ_API_KEY")) { try { return await callGroq(prompt); } catch (error) { failures.push(error instanceof Error ? error.message : "Groq failed"); } }
  if (env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) { try { return await callGemini(prompt); } catch (error) { failures.push(error instanceof Error ? error.message : "Gemini failed"); } }
  throw new Error(`AI service is temporarily unavailable. ${failures.join(" | ")}`);
}

const validTime = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const minutesOf = (value: string) => value.split(":").map(Number).reduce((h, m) => h * 60 + m);

function validateSchedule(schedule: any[]) {
  if (!Array.isArray(schedule)) throw new Error("The AI did not return task changes.");
  if (schedule.length > 8) throw new Error("Smart Change is limited to 8 task changes at a time.");
  for (const block of schedule) {
    if (typeof block.taskId !== "string" || !Number.isInteger(block.day) || block.day < 1 || !validTime(block.startTime) || !validTime(block.endTime) || !Number.isInteger(block.estimatedMinutes) || block.estimatedMinutes < 10 || block.estimatedMinutes > 90) throw new Error("The AI returned an invalid task patch.");
    if (minutesOf(block.endTime) <= minutesOf(block.startTime)) throw new Error("The AI returned an invalid time range.");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  try {
    const { client, userId } = await auth(req);
    const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const roadmapId = typeof input.roadmapId === "string" ? input.roadmapId : "";
    const request = typeof input.request === "string" ? input.request.trim().slice(0, 500) : "";
    if (!roadmapId || request.length < 5) return json(res, 400, { error: "A roadmap and a clear smart-change request are required." });

    const { data: roadmap, error: roadmapError } = await client.from("roadmaps").select("id,user_id,title,category,duration_days").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
    if (roadmapError) throw roadmapError;
    if (!roadmap) return json(res, 404, { error: "Roadmap not found." });

    const [{ data: tasks, error: taskError }, { data: progressRows, error: progressError }] = await Promise.all([
      client.from("roadmap_tasks").select("id,day_number,title,estimated_minutes,start_time,end_time,is_required").eq("roadmap_id", roadmapId).eq("user_id", userId).order("day_number").order("task_order"),
      client.from("roadmap_task_progress").select("task_id,status").eq("roadmap_id", roadmapId).eq("user_id", userId),
    ]);
    if (taskError || progressError) throw taskError || progressError;

    const completed = new Set((progressRows || []).filter((row: any) => row.status === "completed").map((row: any) => row.task_id));
    const editableTasks = (tasks || []).map((task: any) => ({ id: task.id, day: task.day_number, title: task.title, minutes: task.estimated_minutes, start: task.start_time, end: task.end_time, required: task.is_required, completed: completed.has(task.id) }));

    const prompt = `You are patching an existing roadmap. Do NOT generate a roadmap. Do NOT create tasks. Do NOT delete tasks. Do NOT change the roadmap title, goal, duration, dates, or milestones. Only move/retime/rename/rewrite EXISTING incomplete tasks when directly required by the request. Completed tasks are immutable. If no safe change is needed, return changed=false.\n\nRoadmap context: ${JSON.stringify({ title: roadmap.title, category: roadmap.category, durationDays: roadmap.duration_days })}\nExisting tasks: ${JSON.stringify(editableTasks)}\nUser request: ${request}\n\nReturn ONLY: {"changed":true|false,"message":"brief","taskChanges":[{"taskId":"existing id","day":1,"startTime":"HH:MM","endTime":"HH:MM","title":"only if needed","instructions":"only if needed","successCriteria":"only if needed","estimatedMinutes":30,"isRequired":true}]}\nRules: taskId MUST come from the supplied list; max 8 changes; omit unchanged fields; never return a new task; never return the full roadmap; keep the response concise.`;

    const result = await callAI(prompt);
    if (result?.changed === false) return json(res, 200, result);
    const scheduleChanges = Array.isArray(result?.taskChanges) ? result.taskChanges : [];
    validateSchedule(scheduleChanges);

    const updates: Array<Promise<unknown>> = [];
    for (const change of scheduleChanges) {
      const original = editableTasks.find((task: any) => task.id === change.taskId);
      if (!original || original.completed) continue;
      const patch: Record<string, unknown> = { day_number: change.day, start_time: change.startTime, end_time: change.endTime, estimated_minutes: change.estimatedMinutes };
      if (typeof change.title === "string" && change.title.trim()) patch.title = change.title.trim().slice(0, 200);
      if (typeof change.instructions === "string" && change.instructions.trim()) patch.instructions = change.instructions.trim().slice(0, 2000);
      if (typeof change.successCriteria === "string" && change.successCriteria.trim()) patch.success_criteria = change.successCriteria.trim().slice(0, 1000);
      if (typeof change.isRequired === "boolean") patch.is_required = change.isRequired;
      updates.push(client.from("roadmap_tasks").update(patch).eq("id", change.taskId).eq("roadmap_id", roadmapId).eq("user_id", userId));
    }

    if (updates.length) {
      const results = await Promise.all(updates);
      const failed = results.find((entry: any) => entry?.error);
      if (failed?.error) throw failed.error;
    }

    return json(res, 200, { changed: updates.length > 0, message: result?.message || (updates.length ? "Smart change applied to existing tasks." : "No safe changes were needed."), changesApplied: updates.length });
  } catch (error) {
    const status = Number((error as any)?.status) || 500;
    console.error("[roadmap-edit]", error);
    return json(res, status, { error: error instanceof Error ? error.message : "Could not apply smart change." });
  }
}
