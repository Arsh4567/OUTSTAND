import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createGoogleGenerativeAI } from "https://esm.sh/@ai-sdk/google@2";
import { createGroq } from "https://esm.sh/@ai-sdk/groq@2";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "https://esm.sh/ai@5";
import { createProductivityTools } from "../../../api/ai-productivity-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const env = (...names: string[]) => names.map((name) => Deno.env.get(name)).find((value) => value?.trim());
const json = (body: unknown, status = 200, extra: HeadersInit = {}) => Response.json(body, { status, headers: { ...corsHeaders, ...extra } });

function textFromMessage(message: any) {
  if (Array.isArray(message?.parts)) return message.parts.filter((part: any) => part?.type === "text").map((part: any) => part.text).join("");
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) return message.content.filter((part: any) => part?.type === "text").map((part: any) => part.text).join("");
  return "";
}

function getModel() {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) {
    const groq = createGroq({ apiKey: groqKey });
    return { name: "groq", model: groq(env("GROQ_MODEL") || "openai/gpt-oss-20b") };
  }
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return { name: "gemini", model: google(env("GEMINI_MODEL") || "gemini-2.5-flash-lite") };
  }
  throw new Error("No AI provider is configured on the server.");
}

function buildSystemPrompt(context: unknown) {
  const ctx = context && typeof context === "object" ? context as Record<string, any> : {};
  const name = typeof ctx.name === "string" && ctx.name.trim() ? ctx.name.trim() : "there";
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completed = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const roadmap = ctx.roadmap && typeof ctx.roadmap === "object" ? ctx.roadmap : null;
  return `You are OUTSTAND Intelligence, a practical personal productivity agent for ${name}.

Current browser context is only a convenience snapshot and may be stale. Supabase-backed tool results are authoritative.

Habits: ${habits.slice(0, 20).map((h: any) => `${h?.name || "Habit"}${h?.id && completed.includes(h.id) ? " (done today)" : ""}`).join(", ") || "none"}
Roadmap snapshot: ${roadmap ? `${String(roadmap.title || "Untitled")} — ${String(roadmap.goal || "")}` : "none"}

Rules:
- When the user explicitly asks to act, use the appropriate OUTSTAND tool.
- Never invent ids, current state, or successful writes.
- Use get_today/get_progress when fresh state is needed.
- Keep responses concise, decisive, and useful.
- Never claim a mutation succeeded unless the tool confirmed it.`;
}

async function authenticate(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const token = authorization.slice(7).trim();
  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return { error: json({ error: "Supabase AI service is misconfigured.", code: "SUPABASE_CONFIG_MISSING" }, 503) };
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  return { client, userId: data.user.id, token };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authenticate(req);
  if ("error" in auth) return auth.error;

  try {
    if (req.method === "GET") {
      try {
        const provider = getModel();
        return json({ ok: true, service: "outstand-ai", status: "ready", provider: provider.name });
      } catch (error) {
        return json({ ok: false, service: "outstand-ai", status: "unavailable", error: error instanceof Error ? error.message : "AI unavailable" }, 503);
      }
    }

    if (req.method === "DELETE") {
      const { error } = await auth.client.from("chat_messages").delete().eq("user_id", auth.userId);
      if (error) return json({ error: "Could not clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") return json({ error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }, 405);

    const body = await req.json().catch(() => null);
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "At least one chat message is required.", code: "EMPTY_MESSAGES" }, 400);

    const uiMessages: UIMessage[] = messages.map((message: any) => ({
      id: typeof message?.id === "string" ? message.id : crypto.randomUUID(),
      role: message?.role === "assistant" ? "assistant" : "user",
      parts: [{ type: "text", text: textFromMessage(message).trim() }],
    })).filter((message: any) => message.parts[0].text.length > 0) as UIMessage[];

    if (!uiMessages.some((message) => message.role === "user")) return json({ error: "A user message is required.", code: "NO_USER_MESSAGE" }, 400);

    const provider = getModel();
    const modelMessages = uiMessages.slice(-12);
    const result = streamText({
      model: provider.model,
      system: buildSystemPrompt(body?.appContext),
      messages: await convertToModelMessages(modelMessages),
      tools: createProductivityTools(auth.client as any, auth.userId, auth.token),
      stopWhen: stepCountIs(4),
      maxOutputTokens: 700,
      maxRetries: 0,
      abortSignal: req.signal,
      onError: (error) => console.error("[outstand-ai] provider error", error),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: modelMessages,
      headers: { ...corsHeaders, "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
      onError: (error) => {
        console.error("[outstand-ai] stream failure", error);
        return error instanceof Error ? error.message : "AI request failed.";
      },
    });
  } catch (error) {
    console.error("[outstand-ai] request failed", error);
    const message = error instanceof Error ? error.message : "AI request failed.";
    const isRateLimited = /429|quota|rate[_ -]?limit|resource[_ -]?exhausted/i.test(message);
    return json({ error: isRateLimited ? "AI is temporarily rate-limited. Please try again shortly." : message, code: isRateLimited ? "AI_QUOTA_EXCEEDED" : "AI_REQUEST_FAILED" }, isRateLimited ? 429 : 500);
  }
});
