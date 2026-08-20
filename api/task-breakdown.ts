import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { getAIProvider, modelFor } from "./ai-provider.js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());

function sendJson(res: VercelResponse, status: number, data: unknown) {
  res.status(status).setHeader("Cache-Control", "no-store").json(data);
}

async function authenticate(req: VercelRequest) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key || !token) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("AI returned an invalid task plan.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed." });

  const user = await authenticate(req);
  if (!user) return sendJson(res, 401, { error: "Authentication required." });

  const milestone = typeof req.body?.milestone === "string" ? req.body.milestone.trim() : "";
  const availableMinutes = Number(req.body?.availableMinutes ?? 120);
  if (!milestone || milestone.length < 5 || milestone.length > 2000) return sendJson(res, 400, { error: "Enter a milestone between 5 and 2000 characters." });
  const budget = Number.isFinite(availableMinutes) ? Math.min(240, Math.max(15, Math.round(availableMinutes))) : 120;

  try {
    const provider = await getAIProvider();
    const result = await generateText({
      model: modelFor(provider.name, provider.provider, "roadmap"),
      temperature: 0.2,
      system: `You are OUTSTAND Smart Breakdown. Turn a large productivity milestone into a realistic focus queue. Return ONLY a JSON array. Each item must have exactly: title (string), minutes (integer 5-45). Create 3-8 concrete, independently finishable actions. Prefer 10-30 minute chunks. The total minutes must be <= the user's time budget. Order tasks by dependency. Do not add motivational fluff. Do not invent requirements that are not implied by the milestone.`,
      prompt: `User's milestone:\n${milestone}\n\nAvailable time budget: ${budget} minutes.`,
      maxRetries: 0,
    });

    let raw: unknown;
    try { raw = extractJson(result.text); } catch { return sendJson(res, 502, { error: "The AI returned an unusable task plan. Please try again." }); }
    if (!Array.isArray(raw)) return sendJson(res, 502, { error: "The AI returned an invalid task plan." });

    const tasks = raw.slice(0, 8).map((item: any) => ({
      id: crypto.randomUUID(),
      title: typeof item?.title === "string" ? item.title.trim().slice(0, 160) : "",
      minutes: Math.min(45, Math.max(5, Math.round(Number(item?.minutes) || 15))),
    })).filter((item: any) => item.title.length > 0);

    let total = 0;
    const bounded = tasks.filter((task: any) => { if (total + task.minutes > budget) return false; total += task.minutes; return true; });
    if (!bounded.length) return sendJson(res, 502, { error: "The AI could not create a usable focus queue." });
    return sendJson(res, 200, { tasks: bounded, totalMinutes: total, milestone });
  } catch (error) {
    console.error("Smart task breakdown failed", error);
    return sendJson(res, (error as any)?.status === 503 ? 503 : 500, { error: error instanceof Error ? error.message : "Smart task breakdown failed." });
  }
}
