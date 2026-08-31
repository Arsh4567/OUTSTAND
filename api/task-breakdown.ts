import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());
const RequestSchema = z.object({ milestone: z.string().trim().min(5).max(2000), availableMinutes: z.preprocess((value) => { const parsed = Number(value ?? 120); return Number.isFinite(parsed) ? Math.min(240, Math.max(15, Math.round(parsed))) : 120; }, z.number().int().min(15).max(240)) });
const TaskSchema = z.object({ title: z.string().trim().min(1).max(160), minutes: z.coerce.number().int().min(5).max(45) });
function sendJson(res: VercelResponse, status: number, data: unknown) { res.status(status).setHeader("Cache-Control", "no-store").json(data); }
async function authenticate(req: VercelRequest) { const authorization = req.headers.authorization; if (!authorization?.startsWith("Bearer ")) return null; const token = authorization.slice("Bearer ".length).trim(); if (!token || token.length > 4096) return null; const url = env("SUPABASE_URL", "VITE_SUPABASE_URL"); const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"); if (!url || !key) return null; const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } }); const { data, error } = await client.auth.getUser(token); return error || !data.user ? null : data.user; }
function provider() { const groqKey = env("GROQ_API_KEY"); const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"); if (groqKey) return createGroq({ apiKey: groqKey })(env("GROQ_MODEL") || "openai/gpt-oss-20b"); if (geminiKey) return createGoogleGenerativeAI({ apiKey: geminiKey })(env("GEMINI_MODEL") || "gemini-3.5-flash-lite"); throw new Error("No AI provider is currently available."); }
function extractJson(text: string) { const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim(); const start = cleaned.indexOf("["); const end = cleaned.lastIndexOf("]"); if (start < 0 || end < start) throw new Error("AI returned an invalid task plan."); return JSON.parse(cleaned.slice(start, end + 1)); }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "OPTIONS") return res.status(204).setHeader("Cache-Control", "no-store").end();
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
    const user = await authenticate(req); if (!user) return sendJson(res, 401, { error: "Authentication required.", code: "UNAUTHORIZED" });
    const parsed = RequestSchema.safeParse(req.body ?? {}); if (!parsed.success) return sendJson(res, 400, { error: "Enter a milestone between 5 and 2000 characters and a time budget between 15 and 240 minutes.", code: "INVALID_PAYLOAD" });
    const { milestone, availableMinutes: budget } = parsed.data;
    const result = await generateText({ model: provider(), temperature: 0.2, system: "You are OUTSTAND Smart Breakdown. Return ONLY a JSON array. Each item must have exactly title (string) and minutes (integer 5-45). Create 3-8 concrete, independently finishable actions, ordered by dependency. Total minutes must be <= the user's time budget. Do not add motivational fluff.", prompt: `User's milestone:\n${milestone}\n\nAvailable time budget: ${budget} minutes.`, maxRetries: 0 });
    let raw: unknown; try { raw = extractJson(result.text); } catch { return sendJson(res, 502, { error: "The AI returned an unusable task plan. Please try again.", code: "AI_INVALID_RESPONSE" }); }
    if (!Array.isArray(raw)) return sendJson(res, 502, { error: "The AI returned an invalid task plan.", code: "AI_INVALID_RESPONSE" });
    const validated = z.array(TaskSchema).max(8).safeParse(raw); if (!validated.success) return sendJson(res, 502, { error: "The AI returned an invalid task plan.", code: "AI_INVALID_RESPONSE" });
    let total = 0; const bounded = validated.data.filter((task) => { if (total + task.minutes > budget) return false; total += task.minutes; return true; }).map((task) => ({ id: crypto.randomUUID(), ...task }));
    if (!bounded.length) return sendJson(res, 502, { error: "The AI could not create a usable focus queue.", code: "AI_EMPTY_PLAN" });
    return sendJson(res, 200, { tasks: bounded, totalMinutes: total, milestone });
  } catch (error) { console.error("Smart task breakdown failed", error); const status = (error as { status?: number })?.status; if (status === 429) return sendJson(res, 429, { error: "The AI service is temporarily rate limited. Please try again shortly.", code: "AI_RATE_LIMITED" }); return sendJson(res, 500, { error: "Smart task breakdown failed. Please try again.", code: "INTERNAL_SERVER_ERROR" }); }
}
