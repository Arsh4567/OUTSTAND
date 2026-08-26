import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateText } from "ai";
import { getAIProvider, modelFor } from "./ai-provider.js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());
const RequestSchema = z.object({
  milestone: z.string().trim().min(5).max(2000),
  // Preserve the existing endpoint behavior: missing or non-numeric budgets fall back to 120,
  // while numeric values are clamped to the established 15-240 minute range.
  availableMinutes: z.preprocess((value) => {
    const parsed = Number(value ?? 120);
    return Number.isFinite(parsed) ? Math.min(240, Math.max(15, Math.round(parsed))) : 120;
  }, z.number().int().min(15).max(240)),
});
const TaskSchema = z.object({ title: z.string().trim().min(1).max(160), minutes: z.coerce.number().int().min(5).max(45) });

function sendJson(res: VercelResponse, status: number, data: unknown) {
  res.status(status).setHeader("Cache-Control", "no-store").json(data);
}

async function authenticate(req: VercelRequest) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token || token.length > 4096) return null;
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
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
  try {
    if (req.method === "OPTIONS") return res.status(204).setHeader("Cache-Control", "no-store").end();
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });

    const user = await authenticate(req);
    if (!user) return sendJson(res, 401, { error: "Authentication required.", code: "UNAUTHORIZED" });

    const parsedRequest = RequestSchema.safeParse(req.body ?? {});
    if (!parsedRequest.success) return sendJson(res, 400, { error: "Enter a milestone between 5 and 2000 characters and a time budget between 15 and 240 minutes.", code: "INVALID_PAYLOAD" });
    const { milestone, availableMinutes: budget } = parsedRequest.data;

    const provider = await getAIProvider();
    const result = await generateText({
      model: modelFor(provider.name, provider.provider, "roadmap"),
      temperature: 0.2,
      system: `You are OUTSTAND Smart Breakdown. Turn a large productivity milestone into a realistic focus queue. Return ONLY a JSON array. Each item must have exactly: title (string), minutes (integer 5-45). Create 3-8 concrete, independently finishable actions. Prefer 10-30 minute chunks. The total minutes must be <= the user's time budget. Order tasks by dependency. Do not add motivational fluff. Do not invent requirements that are not implied by the milestone.`,
      prompt: `User's milestone:\n${milestone}\n\nAvailable time budget: ${budget} minutes.`,
      maxRetries: 0,
    });

    let raw: unknown;
    try {
      raw = extractJson(result.text);
    } catch (error) {
      console.warn("Smart task breakdown returned malformed JSON", error);
      return sendJson(res, 502, { error: "The AI returned an unusable task plan. Please try again.", code: "AI_INVALID_RESPONSE" });
    }
    if (!Array.isArray(raw)) return sendJson(res, 502, { error: "The AI returned an invalid task plan.", code: "AI_INVALID_RESPONSE" });

    const validated = z.array(TaskSchema).max(8).safeParse(raw);
    if (!validated.success) return sendJson(res, 502, { error: "The AI returned an invalid task plan.", code: "AI_INVALID_RESPONSE" });

    let total = 0;
    const bounded = validated.data.filter((task) => {
      if (total + task.minutes > budget) return false;
      total += task.minutes;
      return true;
    }).map((task) => ({ id: crypto.randomUUID(), ...task }));

    if (!bounded.length) return sendJson(res, 502, { error: "The AI could not create a usable focus queue.", code: "AI_EMPTY_PLAN" });
    return sendJson(res, 200, { tasks: bounded, totalMinutes: total, milestone });
  } catch (error) {
    console.error("Smart task breakdown failed", error);
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) return sendJson(res, 502, { error: "The AI provider rejected the request. Please try again.", code: "AI_PROVIDER_REJECTED" });
    if (status === 429) return sendJson(res, 429, { error: "The AI service is temporarily rate limited. Please try again shortly.", code: "AI_RATE_LIMITED" });
    if (status === 503) return sendJson(res, 503, { error: "No AI provider is currently available.", code: "AI_PROVIDER_UNAVAILABLE" });
    return sendJson(res, 500, { error: "Smart task breakdown failed. Please try again.", code: "INTERNAL_SERVER_ERROR" });
  }
}
