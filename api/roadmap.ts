import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);

function json(res: VercelResponse, status: number, data: unknown) {
  res.status(status).setHeader("Cache-Control", "no-store").json(data);
}

function getBearer(req: VercelRequest) {
  const value = req.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function body(req: VercelRequest) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return {};
}

async function authenticate(req: VercelRequest) {
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

function model() {
  const key = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (!key) throw Object.assign(new Error("Gemini API configuration is missing."), { code: "GEMINI_CONFIG_MISSING" });
  return createGoogleGenerativeAI({ apiKey: key })("gemini-2.5-flash-lite");
}

const baseRules = `You are OUTSTAND Intelligence, an adaptive personal planning AI. Never invent user facts. Ask for missing information before planning. Plans must be realistic, specific and measurable. Do not give generic advice such as “study maths for 2 hours”. For academics, collect class/grade, board/curriculum, target result, subjects, current level, exam/deadline, available days/time, weak areas, strong areas and constraints. For fitness, collect goal, age if relevant, height, weight, training experience, available days/time, equipment, current ability and limitations; do not prescribe unsafe or extreme targets. For business/money, collect current situation, target, timeframe, skills/resources, constraints and risk tolerance. For skill learning, collect current level, target skill/outcome, deadline, available time, resources and preferred learning style. For content creation, collect platform, niche, current audience/status, target, cadence, skills, equipment and time. For sports/chess, collect discipline, current level/rating, competition target, deadline, practice availability and constraints. For habits/productivity, collect current routine, target behavior, frequency, triggers, obstacles and available time. Keep questions concise and only ask what changes the plan. Return JSON only.`;

async function ask(prompt: string) {
  try {
    const result = await generateText({ model: model(), system: baseRules, prompt, maxRetries: 0, temperature: 0.2 });
    return extractJson(result.text);
  } catch (error: any) {
    const message = String(error?.message || error);
    const quota = error?.statusCode === 429 || /quota|rate.?limit|resource.?exhausted|too many requests/i.test(message);
    if (quota) throw Object.assign(new Error("AI quota is temporarily full. Please try again after the quota window resets."), { code: "AI_QUOTA_EXCEEDED", status: 429 });
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });

  const auth = await authenticate(req);
  if ("error" in auth) return json(res, auth.error.status, { error: auth.error.message });

  try {
    const input = await body(req);
    const mode = input?.mode === "plan" || input?.mode === "adapt" ? input.mode : "questions";
    const category = typeof input?.category === "string" ? input.category : "custom";
    const answers = input?.answers && typeof input.answers === "object" ? input.answers : {};
    const habits = Array.isArray(input?.habits) ? input.habits.slice(0, 30) : [];
    const context = input?.context && typeof input.context === "object" ? input.context : {};

    if (mode === "questions") {
      const answered = Object.entries(answers).map(([key, value]) => `${key}: ${String(value)}`).join("\n") || "No answers yet.";
      const result = await ask(`Create the next 3 to 5 most useful questions for a ${category} goal. These questions must be based on the answers already given and must not repeat answered information. If this is the first turn, start with the goal, measurable outcome, timeline and the category-specific information that materially changes the plan. Return exactly {"questions":[{"id":"string","question":"string","type":"text|number|choice|multiline","required":true,"options":["..."],"placeholder":"..."}]}.\n\nAlready answered:\n${answered}\nSelected habits:\n${JSON.stringify(habits)}\nUser context:\n${JSON.stringify(context)}`);
      return json(res, 200, result);
    }

    if (mode === "plan") {
      const result = await ask(`Build a personalized ${category} roadmap from the complete interview below. Do not make assumptions about time, ability or target. Use the selected habits only as supporting context. Make milestones specific and measurable. Return exactly {"plan":{"title":"string","summary":"string","durationDays":number,"difficulty":"string","assumptions":["string"],"milestones":[{"day":number,"title":"string","outcome":"string","actions":["string"]}],"today":["string"],"metrics":["string"],"adaptationRule":"string"}}. Keep the roadmap useful rather than enormous; create milestones across the full duration but keep actions realistic.\n\nCategory: ${category}\nAnswers:\n${JSON.stringify(answers)}\nSelected habits:\n${JSON.stringify(habits)}\nUser context:\n${JSON.stringify(context)}`);
      return json(res, 200, result);
    }

    const { data: roadmap, error: roadmapError } = await auth.client.from("ai_roadmaps").select("id,plan,title,duration_days,answers").eq("user_id", auth.userId).eq("is_active", true).maybeSingle();
    if (roadmapError) return json(res, 500, { error: "Could not load your active roadmap.", code: roadmapError.code });
    if (!roadmap) return json(res, 404, { error: "No active roadmap found." });

    const { data: progress } = await auth.client.from("ai_roadmap_progress").select("assigned_date,total_missions,completed_missions,completion_pct").eq("roadmap_id", roadmap.id).order("assigned_date", { ascending: false }).limit(14);
    const result = await ask(`Adapt only the FUTURE portion of this roadmap using the real recent progress below. Never rewrite completed work. If performance is strong, increase specificity or difficulty modestly. If performance is low, reduce/split future workload and carry forward only essential missed outcomes without creating an overwhelming backlog. Return exactly {"plan":<full updated plan object>,"adapted":boolean,"reason":"short human-readable reason"}.\n\nCurrent plan:\n${JSON.stringify(roadmap.plan)}\nRecent progress:\n${JSON.stringify(progress || [])}`);
    if (result?.adapted && result?.plan) {
      const { error: updateError } = await auth.client.from("ai_roadmaps").update({ plan: result.plan }).eq("id", roadmap.id).eq("user_id", auth.userId);
      if (updateError) return json(res, 500, { error: "The AI adapted the plan but it could not be saved.", code: updateError.code });
    }
    return json(res, 200, result);
  } catch (error: any) {
    console.error("OUTSTAND roadmap request failed", error);
    const status = error?.status === 429 || error?.code === "AI_QUOTA_EXCEEDED" ? 429 : error?.code === "GEMINI_CONFIG_MISSING" ? 503 : 500;
    if (status === 429) res.setHeader("Retry-After", "60");
    return json(res, status, { error: error?.message || "AI roadmap service failed.", code: error?.code || "ROADMAP_REQUEST_FAILED" });
  }
}
