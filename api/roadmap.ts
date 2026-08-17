import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);
function json(res: VercelResponse, status: number, data: unknown) { res.status(status).setHeader("Cache-Control", "no-store").json(data); }
function getBearer(req: VercelRequest) { const value = req.headers.authorization; return value?.startsWith("Bearer ") ? value.slice(7).trim() : ""; }
async function body(req: VercelRequest) { if (req.body && typeof req.body === "object") return req.body; if (typeof req.body === "string") return JSON.parse(req.body); return {}; }

type AuthSuccess = { client: any; userId: string };
type AuthFailure = { error: { status: number; message: string } };
type AuthResult = AuthSuccess | AuthFailure;

async function authenticate(req: VercelRequest): Promise<AuthResult> {
  const token = getBearer(req);
  if (!token) return { error: { status: 401, message: "Authentication required." } };
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return { error: { status: 500, message: "Supabase server configuration is missing." } };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: { status: 401, message: "Authentication failed." } };
  return { client, userId: data.user.id };
}

function extractJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The AI returned invalid structured data.");
  }
}

const baseRules = `You are OUTSTAND Intelligence, an adaptive personal planning AI. Never invent user facts. Ask for missing information before planning. Plans must be realistic, specific and measurable. Do not give generic advice such as “study maths for 2 hours”. For academics, collect class/grade, board/curriculum, target result, subjects, current level/marks, exam/deadline, available days/time, school/tuition schedule if relevant, weak areas, strong areas, preferred study windows and constraints. For fitness, collect goal, age if relevant, height, weight, training experience, available days/time, equipment, current ability and limitations; do not prescribe unsafe or extreme targets. For business/money, collect current situation, target, timeframe, skills/resources, constraints and risk tolerance. For skill learning, collect current level, target skill/outcome, deadline, available time, resources and preferred learning style. For content creation, collect platform, niche, current audience/status, target, cadence, skills, equipment and time. For sports/chess, collect discipline, current level/rating, competition target, deadline, practice availability and constraints. For habits/productivity, collect current routine, target behavior, frequency, triggers, obstacles and available time. Keep questions concise and only ask what changes the plan. Return JSON only.`;

type AIJsonResult = unknown;

function isRateLimit(status: number, text: string) {
  return status === 429 || /rate.?limit|quota|too many requests|resource.?exhausted/i.test(text);
}

async function askGroq(prompt: string): Promise<AIJsonResult> {
  const apiKey = env("GROQ_API_KEY");
  if (!apiKey) throw Object.assign(new Error("Groq API configuration is missing."), { code: "GROQ_CONFIG_MISSING", status: 503 });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0.2, max_tokens: 3000, response_format: { type: "json_object" }, messages: [{ role: "system", content: baseRules }, { role: "user", content: prompt }] }) });
  const raw = await response.text();
  if (!response.ok) { const error = new Error(`Groq request failed (${response.status}).`); Object.assign(error, { status: response.status, code: isRateLimit(response.status, raw) ? "AI_QUOTA_EXCEEDED" : "GROQ_REQUEST_FAILED" }); throw error; }
  const parsed = JSON.parse(raw); const content = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Groq returned an empty AI response.");
  return extractJson(content);
}

async function askGemini(prompt: string): Promise<AIJsonResult> {
  const apiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!apiKey) throw Object.assign(new Error("Gemini API configuration is missing."), { code: "GEMINI_CONFIG_MISSING", status: 503 });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${baseRules}\n\n${prompt}` }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json" } }) });
  const raw = await response.text();
  if (!response.ok) { const error = new Error(`Gemini request failed (${response.status}).`); Object.assign(error, { status: response.status, code: isRateLimit(response.status, raw) ? "AI_QUOTA_EXCEEDED" : "GEMINI_REQUEST_FAILED" }); throw error; }
  const parsed = JSON.parse(raw); const content = parsed?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join("");
  if (typeof content !== "string" || !content.trim()) throw new Error("Gemini returned an empty AI response.");
  return extractJson(content);
}

async function ask(prompt: string) {
  try { return await askGroq(prompt); } catch (error: any) {
    if (isRateLimit(error?.status || 0, error?.message || "") && env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY")) return await askGemini(prompt);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  const auth = await authenticate(req);
  if ("error" in auth) { const failure = auth.error; return json(res, failure.status, { error: failure.message }); }

  try {
    const input = await body(req);
    const mode = input?.mode === "plan" || input?.mode === "adapt" ? input.mode : "questions";
    const category = typeof input?.category === "string" ? input.category : "custom";
    const answers = input?.answers && typeof input.answers === "object" ? input.answers : {};
    const habits = Array.isArray(input?.habits) ? input.habits.slice(0, 30) : [];
    const context = input?.context && typeof input.context === "object" ? input.context : {};

    if (mode === "questions") {
      const answered = Object.entries(answers).map(([key, value]) => `${key}: ${String(value)}`).join("\n") || "No answers yet.";
      const result = await ask(`Create the next 3 to 5 highest-value questions for a ${category} goal. Do not repeat answered information. Universal requirements: collect the exact goal, measurable target, timeline/duration and difficulty preference before planning. For academics, if the target involves Class 10/board exams, you must collect class, board, target percentage/grade, subjects, current marks or baseline, exam date/days remaining, school/tuition schedule, realistic weekday/weekend availability, weak chapters and strong chapters. Ask for study windows if a timetable will depend on them. For fitness, collect the safety and planning details required by the category rules. Return exactly {"questions":[{"id":"string","question":"string","type":"text|number|choice|multiline","required":true,"options":["..."],"placeholder":"..."}].\n\nAlready answered:\n${answered}\nSelected habits:\n${JSON.stringify(habits)}\nUser context:\n${JSON.stringify(context)}`);
      return json(res, 200, result);
    }

    if (mode === "plan") {
      const result = await ask(`Build a genuinely personalized ${category} roadmap from the complete interview below. This is the execution engine, not a motivational template. Return exactly {"plan":{"title":"string","summary":"string","durationDays":number,"difficulty":"string","assumptions":["string"],"milestones":[{"day":number,"title":"string","outcome":"string","actions":["string"]}],"today":["string"],"timetable":[{"label":"string","durationMinutes":number,"task":"string","why":"string"}],"metrics":["string"],"adaptationRule":"string"}}.

Hard requirements:
- The plan must directly serve the user's stated outcome.
- Every action must be concrete, measurable and connected to the goal. Never fill the plan with generic wellness actions such as drinking water, walking, stretching or journaling unless the user explicitly made that part of the goal.
- If the goal is Class 10 exam performance, the roadmap must prioritize the user's actual subjects, chapters/topics, revision, question practice, mock tests, error review and exam strategy. Use the user's target percentage, board, days remaining, baseline and weak areas. Do not invent chapter completion or marks.
- For academic goals, today's actions must name the actual subject/topic or a clearly defined diagnostic/practice task from the user's answers. A generic "study for 2 hours" is invalid.
- The timetable must fit the user's stated school/tuition and available study windows. Use 3 to 6 realistic blocks, with duration in minutes. Do not exceed the available daily time.
- If the interview is missing information required to create a safe or accurate timetable, return {"needsMoreInfo":true,"questions":[...]} instead of guessing.
- Milestones must cover the full duration with meaningful checkpoints. Day 1 must have useful actions because it becomes the user's first instant task set.
- Integrate selected habits only when they support the goal; never let habits replace goal work.
- Keep workload proportional to the selected difficulty.

Category: ${category}\nAnswers:\n${JSON.stringify(answers)}\nSelected habits:\n${JSON.stringify(habits)}\nUser context:\n${JSON.stringify(context)}`);
      return json(res, 200, result);
    }

    const { data: roadmap, error: roadmapError } = await auth.client.from("ai_roadmaps").select("id,plan,title,duration_days,answers").eq("user_id", auth.userId).eq("is_active", true).maybeSingle();
    if (roadmapError) return json(res, 500, { error: "Could not load your active roadmap.", code: roadmapError.code });
    if (!roadmap) return json(res, 404, { error: "No active roadmap found." });
    const { data: progress } = await auth.client.from("ai_roadmap_progress").select("assigned_date,total_missions,completed_missions,completion_pct").eq("roadmap_id", roadmap.id).order("assigned_date", { ascending: false }).limit(14);
    const result = await ask(`Adapt only the FUTURE portion of this roadmap using the real recent progress below. Never rewrite completed work. Keep the user's original goal and constraints. Return exactly {"plan":<full updated plan object>,"adapted":boolean,"reason":"short human-readable reason"}. Future tasks must remain concrete and goal-specific. Never add generic wellness tasks just to fill space.\n\nCurrent plan:\n${JSON.stringify(roadmap.plan)}\nRecent progress:\n${JSON.stringify(progress || [])}`);
    if ((result as any)?.adapted && (result as any)?.plan) {
      const { error: updateError } = await auth.client.from("ai_roadmaps").update({ plan: (result as any).plan }).eq("id", roadmap.id).eq("user_id", auth.userId);
      if (updateError) return json(res, 500, { error: "The AI adapted the plan but it could not be saved.", code: updateError.code });
    }
    return json(res, 200, result);
  } catch (error: any) {
    console.error("OUTSTAND roadmap request failed", error);
    const status = error?.status === 429 || error?.code === "AI_QUOTA_EXCEEDED" ? 429 : error?.status === 503 ? 503 : 500;
    if (status === 429) res.setHeader("Retry-After", "30");
    return json(res, status, { error: error?.message || "AI roadmap service failed.", code: error?.code || "ROADMAP_REQUEST_FAILED" });
  }
}