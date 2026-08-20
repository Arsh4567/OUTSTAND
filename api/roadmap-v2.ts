import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((n) => process.env[n]).find((v) => typeof v === "string" && v.trim());
const json = (res: VercelResponse, status: number, data: unknown) => res.status(status).setHeader("Cache-Control", "no-store").json(data);
const bearer = (req: VercelRequest) => req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";

async function auth(req: VercelRequest) {
  const token = bearer(req); const url = env("SUPABASE_URL", "VITE_SUPABASE_URL"); const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!token) return { error: [401, "Authentication required."] as const }; if (!url || !key) return { error: [500, "Supabase server configuration is missing."] as const };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token); if (error || !data.user) return { error: [401, "Authentication failed."] as const }; return { client, userId: data.user.id } as const;
}

function parseJson(text: string) { const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim(); try { return JSON.parse(clean); } catch { const a = clean.indexOf("{"); const b = clean.lastIndexOf("}"); if (a >= 0 && b > a) return JSON.parse(clean.slice(a, b + 1)); const c = clean.indexOf("["); const d = clean.lastIndexOf("]"); if (c >= 0 && d > c) return JSON.parse(clean.slice(c, d + 1)); throw new Error("The AI returned invalid structured data."); } }

async function ai(prompt: string) {
  const groq = env("GROQ_API_KEY");
  if (groq) { const r = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0.2, max_tokens: 6000, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You are OUTSTAND Intelligence. Return JSON only. Never invent URLs or claim an unverified resource is curated. Create practical, measurable learning plans." }, { role: "user", content: prompt }] }) }); const raw = await r.text(); if (r.ok) return parseJson(JSON.parse(raw)?.choices?.[0]?.message?.content || ""); }
  const key = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"); if (!key) throw Object.assign(new Error("No AI provider is configured."), { status: 503 });
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `You are OUTSTAND Intelligence. Return JSON only. Never invent URLs or claim an unverified resource is curated.\n\n${prompt}` }] }], generationConfig: { responseMimeType: "application/json" } }) }); const raw = await r.text(); if (!r.ok) throw new Error(`AI request failed (${r.status}).`); return parseJson(JSON.parse(raw)?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") || "");
}

async function fallbackPlan(client: ReturnType<typeof createClient>, category: string, answers: Record<string, unknown>) {
  const terms = [category, ...Object.values(answers).flatMap((v) => Array.isArray(v) ? v : [v])].filter((v) => typeof v === "string" && v.trim()).join(" ").toLowerCase().split(/[^a-z0-9]+/).filter((v) => v.length >= 3).slice(0, 12);
  const filters = [...new Set(terms)].map((t) => `topic_name.ilike.*${t.replace(/[%_,]/g, "")}*`);
  let resources: any[] = [];
  if (filters.length) { const { data } = await client.from("curated_resources").select("id,topic_name,educator_name,youtube_url,mind_map_url,quick_revision_text").or(filters.join(",")).limit(20); resources = data || []; }
  const context = resources.map((r) => ({ topic_name: r.topic_name, educator_name: r.educator_name, youtube_url: r.youtube_url, mind_map_url: r.mind_map_url, quick_revision_text: r.quick_revision_text }));
  const result: any = await ai(`Build a ${category} learning roadmap from this user interview: ${JSON.stringify(answers)}. Prefer these verified curated resources when they genuinely fit: ${JSON.stringify(context)}. Return exactly {"milestones":[...]}. Create 4-10 milestones. Each milestone must have milestone_title, video_url, mind_map_url, revision_notes, quiz. Quiz must contain 3-5 MCQs, each with question, options (4 strings), correct_answer. If a milestone has a matching curated resource, use its exact topic and let the server fill its database-backed resource fields. If no curated resource matches a topic, create a clearly useful AI-generated milestone but set video_url, mind_map_url, and revision_notes to empty strings. Never invent or guess URLs. Never label an AI-generated resource as curated.`);
  const raw = Array.isArray(result) ? result : result?.milestones; if (!Array.isArray(raw) || !raw.length) throw new Error("The AI returned no roadmap milestones.");
  const byTopic = new Map(resources.map((r) => [String(r.topic_name).trim().toLowerCase(), r]));
  const milestones = raw.map((m: any) => { const title = String(m?.milestone_title || "").trim(); if (!title) throw new Error("A roadmap milestone is missing its title."); const r = byTopic.get(title.toLowerCase()); const quiz = Array.isArray(m.quiz) ? m.quiz.slice(0, 5).map((q: any) => ({ question: String(q.question || "").trim(), options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [], correct_answer: String(q.correct_answer || "").trim() })).filter((q: any) => q.question && q.options.length === 4 && q.options.includes(q.correct_answer)) : []; if (quiz.length < 3) throw new Error(`Milestone "${title}" needs at least 3 valid quiz questions.`); return { milestone_title: r?.topic_name || title, video_url: r?.youtube_url || "", mind_map_url: r?.mind_map_url || "", revision_notes: r?.quick_revision_text || "", quiz }; });
  return { milestones, resourcesUsed: resources.length, mode: resources.length ? "hybrid" : "ai_fallback" };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end(); if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  const a = await auth(req); if ("error" in a) return json(res, a.error[0], { error: a.error[1] });
  try {
    const input = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); const mode = input?.mode || "questions";
    const base = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
    if (mode !== "plan") { const upstream = await fetch(`${base}/api/roadmap-core`, { method: "POST", headers: { Authorization: `Bearer ${bearer(req)}`, "Content-Type": "application/json" }, body: JSON.stringify(input) }); const text = await upstream.text(); return res.status(upstream.status).setHeader("Content-Type", "application/json").send(text); }
    const category = typeof input?.category === "string" ? input.category : "custom"; const answers = input?.answers && typeof input.answers === "object" ? input.answers : {};
    const upstream = await fetch(`${base}/api/roadmap-core`, { method: "POST", headers: { Authorization: `Bearer ${bearer(req)}`, "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const text = await upstream.text(); let payload: any = null; try { payload = JSON.parse(text); } catch {}
    if (upstream.ok || payload?.code !== "NO_CURATED_RESOURCES") return res.status(upstream.status).setHeader("Content-Type", "application/json").send(text);
    const durationDays = Math.max(1, Math.min(730, Number(answers.durationDays) || 30)); const fallback = await fallbackPlan(a.client, category, answers);
    const structuredContent = { version: 1, generatedAt: new Date().toISOString(), category, durationDays, milestones: fallback.milestones, resourceMode: fallback.mode, resourcesUsed: fallback.resourcesUsed };
    const legacy = { title: `${category || "Learning"} Roadmap`, summary: fallback.mode === "hybrid" ? "A learning roadmap combining verified curated resources with AI-generated steps where the library has gaps." : "An AI-generated learning roadmap. Verified curated resources will be used automatically as the library expands.", durationDays, difficulty: "adaptive", assumptions: [], milestones: fallback.milestones.map((m: any, i: number) => ({ day: Math.min(durationDays, i + 1), title: m.milestone_title, outcome: "Complete the lesson and checkpoint quiz.", actions: [{ title: `Study ${m.milestone_title}`, instructions: "Study the lesson, then take the checkpoint quiz.", estimatedMinutes: 45, taskType: "practice", methodologyTags: ["retrieval_practice"], resources: m.video_url ? [{ title: "Verified curated lesson", url: m.video_url, note: "Source from OUTSTAND's curated library." }] : [], spacedRepetitionDay: null, successCriteria: "Pass the checkpoint quiz." }] })), dailySchedule: [], adaptationRule: "Use checkpoint performance and reflection to adapt future learning." };
    return json(res, 200, { plan: legacy, milestones: fallback.milestones, structuredContent, retrieval: { mode: fallback.mode, count: fallback.resourcesUsed }, fallback: fallback.mode === "ai_fallback" });
  } catch (error: any) { console.error("OUTSTAND roadmap hybrid request failed", error); return json(res, error?.status === 503 ? 503 : 500, { error: error?.message || "Roadmap service failed.", code: "ROADMAP_HYBRID_FAILED" }); }
}
