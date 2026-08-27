import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { consumeStream, convertToModelMessages, createIdGenerator, stepCountIs, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createProductivityTools } from "../../../api/ai-productivity-tools";

const RequestSchema = z.object({ messages: z.array(z.unknown()).min(1).max(40), appContext: z.unknown().optional() });
const MessageSchema = z.object({ id: z.string().optional(), role: z.enum(["user", "assistant", "system"]), parts: z.array(z.object({ type: z.literal("text"), text: z.string() })).optional(), content: z.union([z.string(), z.array(z.object({ type: z.literal("text"), text: z.string() }))]).optional() });
type AuthSuccess = { client: ReturnType<typeof createClient>; userId: string; token: string };
type AuthFailure = { error: Response };
type AuthResult = AuthSuccess | AuthFailure;
type ProviderChoice = { name: "groq" | "gemini"; model: ReturnType<ReturnType<typeof createGroq>> | ReturnType<ReturnType<typeof createGoogleGenerativeAI>> };

function json(data: unknown, status = 200, headers: HeadersInit = {}) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } }); }
function env(...names: string[]) { return names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0)?.trim(); }
function textFromMessage(message: z.infer<typeof MessageSchema>) { if (typeof message.content === "string") return message.content; if (Array.isArray(message.content)) return message.content.map((part) => part.text).join(""); return (message.parts ?? []).map((part) => part.text).join(""); }
function systemPrompt(appContext: unknown) {
  const ctx = appContext && typeof appContext === "object" ? appContext as Record<string, unknown> : {};
  const name = typeof ctx.name === "string" ? ctx.name : "friend";
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const score = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : 50;
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completed = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const sessions = Array.isArray(ctx.sessions) ? ctx.sessions.length : 0;
  const outstandItems = Array.isArray(ctx.outstand) ? ctx.outstand.length : 0;
  const habitSummary = habits.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").slice(0, 12).map((item) => `${typeof item.name === "string" ? item.name : "Habit"}: ${typeof item.id === "string" && completed.includes(item.id) ? "done" : "not done"}`).join(", ");
  return `You are OUTSTAND Intelligence, an action-capable personal productivity assistant that can take real actions inside OUTSTAND.

The assistant has these server-side tools:
- get_today: read fresh roadmap tasks, progress, and habits.
- mark_habit: mark an existing habit done or undone today.
- change_roadmap: execute a concrete change to the existing roadmap.
- set_reminder: create a recurring reminder in the OUTSTAND notification system.

MANDATORY ACTION POLICY
1. Treat this as an operating assistant, not a chatbot-only advisor.
2. If a user asks whether you can make, edit, change, move, retime, simplify, rebalance, or otherwise modify their roadmap, respond by asking what specific change they want unless the request already contains a concrete change. Do not say that you cannot edit the roadmap.
3. If a user gives a concrete roadmap modification, you MUST use change_roadmap. Do not merely explain how to do it and do not claim a limitation that is not true.
4. If a user asks what is on today's roadmap or what to do today, MUST use get_today first.
5. If a user asks to mark a habit done or undone, MUST use mark_habit after resolving the existing habit.
6. If a user explicitly asks for a reminder, MUST use set_reminder. If the time is missing, ask one short question.
7. Never invent ids, tasks, habits, dates, or completion states. Use tools for fresh data.
8. Never claim an action was completed unless the tool returned success.
9. After a successful action, clearly say what changed. Keep the confirmation concise.

CURRENT CONTEXT
User: ${name}
XP: ${xp}
Best streak: ${streak}
Dopamine score: ${score}/100
Habits: ${habitSummary || "none"}
Focus sessions: ${sessions}
Outstand items: ${outstandItems}

Answer immediately and keep simple questions short.

Formatting rules are strict. Never use markdown bold markers. Never use asterisks for emphasis. Never use parentheses. Prefer plain text, short paragraphs, hyphen bullets, and simple headings.`;
}
function supabaseConfig() { return { url: env("SUPABASE_URL", "VITE_SUPABASE_URL"), key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY") }; }
function getProvider(): ProviderChoice {
  const groqKey = env("GROQ_API_KEY"); const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) return { name: "groq", model: createGroq({ apiKey: groqKey })(env("GROQ_MODEL") || "openai/gpt-oss-20b") };
  if (geminiKey) return { name: "gemini", model: createGoogleGenerativeAI({ apiKey: geminiKey })(env("GEMINI_MODEL") || "gemini-2.5-flash-lite") };
  const error = new Error("No AI provider is configured on the server."); Object.assign(error, { status: 503, code: "AI_PROVIDER_CONFIG_MISSING" }); throw error;
}
async function authenticate(request: Request): Promise<AuthResult> {
  const authorization = request.headers.get("authorization"); if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const token = authorization.slice(7).trim(); if (!token) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const { url, key } = supabaseConfig(); if (!url || !key) return { error: json({ error: "AI service is temporarily unavailable.", code: "SERVICE_UNAVAILABLE" }, 503) };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getClaims(token); const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || !userId) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  return { client, userId, token };
}
function isQuotaError(error: unknown) { const message = error instanceof Error ? error.message : String(error); const candidate = error as { statusCode?: number; status?: number }; return candidate?.statusCode === 429 || candidate?.status === 429 || /429|quota|resource[_ -]?exhausted|rate[_ -]?limit|free[_ -]?tier/i.test(message); }

export const Route = createFileRoute("/api/chat")({ server: { handlers: {
  GET: async ({ request }) => { const auth = await authenticate(request); if ("error" in auth) return auth.error; try { const provider = getProvider(); return json({ ok: true, service: "outstand-ai", status: "ready", provider: provider.name, actionTools: ["get_today", "mark_habit", "change_roadmap", "set_reminder"] }); } catch { return json({ ok: false, service: "outstand-ai", status: "unavailable" }, 503); } },
  POST: async ({ request }) => {
    try {
      const auth = await authenticate(request); if ("error" in auth) return auth.error;
      const rawBody = await request.json().catch(() => null); const parsed = RequestSchema.safeParse(rawBody); if (!parsed.success) return json({ error: "Invalid AI request payload.", code: "INVALID_PAYLOAD" }, 400);
      const uiMessages: UIMessage[] = parsed.data.messages.flatMap((raw) => { const parsedMessage = MessageSchema.safeParse(raw); if (!parsedMessage.success) return []; const text = textFromMessage(parsedMessage.data).trim(); if (!text) return []; return [{ id: parsedMessage.data.id ?? crypto.randomUUID(), role: parsedMessage.data.role, parts: [{ type: "text", text }] } as UIMessage]; });
      if (!uiMessages.some((message) => message.role === "user")) return json({ error: "At least one user message is required.", code: "NO_USER_MESSAGE" }, 400);
      const provider = getProvider(); const modelMessages = uiMessages.slice(-12);
      const result = streamText({ model: provider.model, system: systemPrompt(parsed.data.appContext), messages: await convertToModelMessages(modelMessages), tools: createProductivityTools(auth.client as any, auth.userId, auth.token), stopWhen: stepCountIs(6), maxOutputTokens: 700, maxRetries: 0, abortSignal: request.signal, onError: (error) => { if (isQuotaError(error)) console.warn(`[AI] ${provider.name} quota/rate limit reached.`); else console.error(`[AI] ${provider.name} stream error:`, error); } });
      return result.toUIMessageStreamResponse({ originalMessages: modelMessages, generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }), onFinish: async ({ responseMessage, isAborted }) => { if (isAborted) return; try { const { data: conversation, error: lookupError } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (lookupError) throw lookupError; let conversationId = conversation?.id; if (!conversationId) { const created = await auth.client.from("chat_conversations").insert({ user_id: auth.userId }).select("id").single(); if (created.error || !created.data) throw created.error ?? new Error("Conversation creation failed"); conversationId = created.data.id; } const latestUser = [...uiMessages].reverse().find((message) => message.role === "user"); const latestText = latestUser?.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim() ?? ""; if (latestText) { const duplicate = await auth.client.from("chat_messages").select("id").eq("conversation_id", conversationId).eq("user_id", auth.userId).eq("role", "user").eq("content", latestText).limit(1).maybeSingle(); if (duplicate.error) throw duplicate.error; if (!duplicate.data) { const inserted = await auth.client.from("chat_messages").insert({ conversation_id: conversationId, user_id: auth.userId, role: "user", content: latestText }); if (inserted.error) throw inserted.error; } } const assistantText = responseMessage.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim(); if (assistantText) { const saved = await auth.client.from("chat_messages").insert({ conversation_id: conversationId, user_id: auth.userId, role: "assistant", content: assistantText }); if (saved.error) throw saved.error; } } catch (error) { console.error("AI assistant persistence failed:", error); } }, onError: (error) => { if (isQuotaError(error)) return "AI is temporarily rate-limited. Please try again after the quota window resets."; console.error("AI provider error:", error); return "AI could not complete that request. Please try again."; }, consumeSseStream: consumeStream, headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" } });
    } catch (error) { if (isQuotaError(error)) return json({ error: "AI is temporarily rate-limited. Please try again after the quota window resets.", code: "AI_QUOTA_EXCEEDED" }, 429, { "Retry-After": "20" }); console.error("Outstand AI request failed", error); const status = typeof (error as { status?: unknown })?.status === "number" ? Number((error as { status: number }).status) : 500; return json({ error: status === 503 ? "AI service is temporarily unavailable." : "AI request failed.", code: status === 503 ? "SERVICE_UNAVAILABLE" : "AI_REQUEST_FAILED" }, status === 503 ? 503 : 500); }
  },
  DELETE: async ({ request }) => { try { const auth = await authenticate(request); if ("error" in auth) return auth.error; const removed = await auth.client.from("chat_messages").delete().eq("user_id", auth.userId); if (removed.error) return json({ error: "Could not clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500); return new Response(null, { status: 204 }); } catch (error) { console.error("Failed to clear AI memory:", error); return json({ error: "Failed to clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500); } },
} } });
