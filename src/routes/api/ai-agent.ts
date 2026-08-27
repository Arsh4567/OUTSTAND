import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, jsonSchema, stepCountIs, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createProductivityTools } from "../../../api/ai-productivity-tools";

const RequestSchema = z.object({ messages: z.array(z.unknown()).min(1).max(40), appContext: z.unknown().optional() });
const MessageSchema = z.object({ id: z.string().optional(), role: z.enum(["user", "assistant", "system"]), parts: z.array(z.object({ type: z.literal("text"), text: z.string() })).optional(), content: z.union([z.string(), z.array(z.object({ type: z.literal("text"), text: z.string() }))]).optional() });
const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim())?.trim();
const json = (data: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
const textOf = (message: z.infer<typeof MessageSchema>) => typeof message.content === "string" ? message.content : Array.isArray(message.content) ? message.content.map((p) => p.text).join("") : (message.parts ?? []).map((p) => p.text).join("");

function prompt(context: unknown) {
  const ctx = context && typeof context === "object" ? context as Record<string, any> : {};
  return `You are OUTSTAND Intelligence, an action-capable personal productivity assistant.

The assistant is not a chatbot-only advisor. It has tools that can read and change the user's OUTSTAND data.
Available actions:
- get_today: fetch fresh roadmap tasks and habits.
- mark_habit: mark an existing habit done or undone today.
- change_roadmap: apply a small safe change to an existing roadmap using the user's explicit request.
- set_reminder: create a recurring reminder in OUTSTAND's notification scheduler.

RULES
- Use tools whenever the user asks for an action or fresh state. Do not merely describe how to do an action yourself.
- Never invent tasks, habit ids, roadmap ids, dates, or completion states. Use get_today when needed.
- Only change the roadmap when the user explicitly asks for a roadmap change. The roadmap tool cannot create or delete tasks and completed tasks are protected.
- Only mark a habit when the user explicitly asks to mark it done/undone. Match an existing habit from current context or get_today.
- Only create a reminder when the user explicitly asks for one and a time can be determined. If the time is missing, ask one short question.
- After a successful tool action, clearly state what changed. Never claim success if the tool failed.
- For 'what should I do today', 'what is today's task', or similar, call get_today first so the answer is based on fresh database state.
- Keep responses concise, decisive, and practical.

CURRENT CONTEXT
${JSON.stringify(ctx)}`;
}

async function auth(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) } as const;
  const token = authorization.slice(7).trim();
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL"); const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  if (!url || !key || !token) return { error: json({ error: "AI service is unavailable.", code: "SERVICE_UNAVAILABLE" }, 503) } as const;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) } as const;
  return { client, userId, token } as const;
}

function provider() {
  const groq = env("GROQ_API_KEY");
  if (groq) return createGroq({ apiKey: groq })(env("GROQ_MODEL") || "openai/gpt-oss-20b");
  const gemini = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (gemini) return createGoogleGenerativeAI({ apiKey: gemini })(env("GEMINI_MODEL") || "gemini-2.5-flash-lite");
  throw Object.assign(new Error("No AI provider is configured."), { status: 503 });
}

export const Route = createFileRoute("/api/ai-agent")({ server: { handlers: {
  POST: async ({ request }) => {
    const identity = await auth(request); if ("error" in identity) return identity.error;
    const raw = await request.json().catch(() => null); const parsed = RequestSchema.safeParse(raw); if (!parsed.success) return json({ error: "Invalid AI request payload.", code: "INVALID_PAYLOAD" }, 400);
    const messages: UIMessage[] = parsed.data.messages.flatMap((item) => { const message = MessageSchema.safeParse(item); if (!message.success) return []; const text = textOf(message.data).trim(); return text ? [{ id: message.data.id ?? crypto.randomUUID(), role: message.data.role, parts: [{ type: "text", text }] } as UIMessage] : []; });
    if (!messages.some((message) => message.role === "user")) return json({ error: "A user message is required.", code: "NO_USER_MESSAGE" }, 400);
    try {
      const result = streamText({
        model: provider(),
        system: prompt(parsed.data.appContext),
        messages: await convertToModelMessages(messages.slice(-12)),
        tools: createProductivityTools(identity.client as any, identity.userId, identity.token),
        stopWhen: stepCountIs(4),
        maxOutputTokens: 700,
        maxRetries: 0,
        abortSignal: request.signal,
      });
      return result.toUIMessageStreamResponse({ originalMessages: messages.slice(-12), headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" } });
    } catch (error) {
      console.error("Outstand action agent failed", error);
      const status = Number((error as any)?.status) === 503 ? 503 : 500;
      return json({ error: status === 503 ? "AI service is temporarily unavailable." : "AI request failed.", code: status === 503 ? "SERVICE_UNAVAILABLE" : "AI_REQUEST_FAILED" }, status);
    }
  },
} } });
