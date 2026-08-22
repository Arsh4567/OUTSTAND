import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const BodySchema = z.object({
  logs: z.array(z.object({
    log_date: z.string(),
    score: z.number(),
    positives: z.array(z.string()).default([]),
    negatives: z.array(z.string()).default([]),
  })).max(14),
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

function env(...names: string[]) {
  return names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim())?.trim();
}

function provider() {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) return createGroq({ apiKey: groqKey })("openai/gpt-oss-20b");
  if (geminiKey) return createGoogleGenerativeAI({ apiKey: geminiKey })("gemini-2.5-flash-lite");
  throw new Error("AI provider unavailable");
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  if (!url || !key || !token) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  return error || typeof userId !== "string" ? null : userId;
}

export const Route = createFileRoute("/api/dopamine-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await authenticate(request);
          if (!userId) return json({ error: "Authentication required." }, 401);
          const parsed = BodySchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return json({ error: "Invalid analysis payload." }, 400);

          const { logs } = parsed.data;
          const average = logs.length ? Math.round(logs.reduce((sum, log) => sum + log.score, 0) / logs.length) : 50;
          const best = logs.length ? Math.max(...logs.map((log) => log.score)) : average;
          const worst = logs.length ? Math.min(...logs.map((log) => log.score)) : average;
          const prompt = `Analyze this user's OUTSTAND momentum data. Do not diagnose health conditions and do not claim to measure dopamine. Identify one likely execution pattern, one friction point, and one practical next action. Use only supplied data. Keep it under 140 words.\n\n7-day average score: ${average}/100\nBest day: ${best}/100\nLowest day: ${worst}/100\nDaily logs: ${JSON.stringify(logs)}\n\nFormat:\nPATTERN\n...\nFRICTION\n...\nNEXT MOVE\n...`;

          const result = await generateText({ model: provider(), prompt, maxOutputTokens: 220, maxRetries: 0 });
          return json({ analysis: result.text.trim() });
        } catch (error) {
          console.error("Dopamine analysis failed:", error);
          return json({ error: "AI analysis is temporarily unavailable." }, 503);
        }
      },
    },
  },
});
