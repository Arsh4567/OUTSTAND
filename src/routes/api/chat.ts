import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { consumeStream, convertToModelMessages, createIdGenerator, stepCountIs, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { classifyIntent, intentGuidance } from "@/lib/ai-intent";
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
function systemPrompt(appContext: unknown, intentText: string) {
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
  return `You are OUTSTAND Intelligence, a fast, practical productivity agent that can safely operate the user's OUTSTAND data.
User: ${name}
XP: ${xp}
Best streak: ${streak}
Dopamine score: ${score}/100
Habits: ${habitSummary || "none"}
Focus sessions: ${sessions}
Outstand items: ${outstandItems}

TOOLS
- get_memory: retrieve a small set of relevant saved preferences, goals, constraints, strategies, and patterns.
- save_memory: save one explicit, stable, useful non-sensitive fact that can improve future assistance.
- delete_memory: forget one saved memory when the user explicitly asks.
- get_today: authoritative current roadmap, today's tasks, task progress, and habits.
- get_progress: authoritative roadmap history, completion counts, recent daily logs, and habit progress.
- create_roadmap: generate and persist a new real roadmap using the existing OUTSTAND roadmap engine.
- set_task_progress: complete, start, reset, or skip an existing roadmap task.
- mark_habit: complete or undo an existing habit today.
- change_roadmap: safely modify an existing roadmap using the existing roadmap editor.
- set_reminder: create a recurring reminder.

REQUEST CLASSIFICATION
${intentText}

MEMORY POLICY
- Memory is a long-term personalization aid, not a source of current app state.
- Retrieve memory only when personalization materially helps or the user refers to a previous preference, goal, constraint, strategy, or pattern.
- Save memory only when the user explicitly states a stable fact or when a durable preference or strategy is clearly established through the interaction.
- Do not save secrets, authentication data, highly sensitive personal information, temporary details, or facts that are only guesses.
- Never invent memory. Never present memory as current state unless confirmed by tools.

ACTION POLICY
- You are an operator, not a chatbot-only advisor.
- Use the classified intent as routing guidance, then use tools to execute the request safely.
- When a user explicitly asks OUTSTAND to perform an action and a tool supports it, call the tool.
- Do not tell the user how to do an available action manually.
- Never invent ids. Get ids from get_today, get_progress, or current context.
- Current browser context may be stale. Supabase tool results are authoritative.
- For mutations, prefer: read current state -> perform mutation -> use the tool's verification result -> report exact result.
- Only complete or undo a habit when the user explicitly asks.
- Only change or create a roadmap when the user explicitly asks.
- Creating a roadmap requires enough information. If the generator reports missing information, ask the returned question rather than guessing.
- Completing a task means setting its progress to completed when the user clearly refers to an existing task.
- Reopening a task is consequential. Do it only when clearly requested.
- For combined requests, execute the necessary tools in sequence rather than answering only one part.
- Never claim a mutation succeeded unless the tool returned verified success.

PLANNING
- For "what should I do now/today" use get_today first when current state matters.
- For progress or setback questions use get_progress.
- For a new roadmap, create it with create_roadmap after collecting only materially necessary information.
- For a roadmap adjustment, use change_roadmap with the user's exact request and current roadmap id.
- For focus plans, use current roadmap state and make the next concrete action obvious. Keep the plan compact.

RESPONSE STYLE
- Concise, decisive, calm, friendly.
- Plain text with short paragraphs or simple bullets.
- Avoid generic motivational filler and long explanations.
- After an action, say what changed and include the relevant item name or roadmap title.`;
}
function supabaseConfig() { return { url: env("SUPABASE_URL", "VITE_SUPABASE_URL"), key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY") }; }
function getProvider(): ProviderChoice {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) return { name: "groq", model: createGroq({ apiKey: groqKey })(env("GROQ_MODEL") || "openai/gpt-oss-20b") };
  if (geminiKey) return { name: "gemini", model: createGoogleGenerativeAI({ apiKey: geminiKey })(env("GEMINI_MODEL") || "gemini-2.5-flash-lite") };
  const error = new Error("No AI provider is configured on the server."); Object.assign(error, { status: 503, code: "AI_PROVIDER_CONFIG_MISSING" }); throw error;
}
async function authenticate(request: Request): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const token = authorization.slice(7).trim(); if (!token) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const { url, key } = supabaseConfig(); if (!url || !key) return { error: json({ error: "AI service is temporarily unavailable.", code: "SERVICE_UNAVAILABLE" }, 503) };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getClaims(token); const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || !userId) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  return { client, userId, token };
}
function isQuotaError(error: unknown) { const message = error instanceof Error ? error.message : String(error); const candidate = error as { statusCode?: number; status?: number }; return candidate?.statusCode === 429 || candidate?.status === 429 || /429|quota|resource[_ -]?exhausted|rate[_ -]?limit|free[_ -]?tier/i.test(message); }

export const Route = createFileRoute("/api/chat")({ server: { handlers: {
  GET: async ({ request }) => { const auth = await authenticate(request); if ("error" in auth) return auth.error; try { const provider = getProvider(); return json({ ok: true, service: "outstand-ai", status: "ready", provider: provider.name, memory: true }); } catch { return json({ ok: false, service: "outstand-ai", status: "unavailable" }, 503); } },
  POST: async ({ request }) => {
    try {
      const auth = await authenticate(request); if ("error" in auth) return auth.error;
      const rawBody = await request.json().catch(() => null); const parsed = RequestSchema.safeParse(rawBody); if (!parsed.success) return json({ error: "Invalid AI request payload.", code: "INVALID_PAYLOAD" }, 400);
      const uiMessages: UIMessage[] = parsed.data.messages.flatMap((raw) => { const parsedMessage = MessageSchema.safeParse(raw); if (!parsedMessage.success) return []; const text = textFromMessage(parsedMessage.data).trim(); if (!text) return []; return [{ id: parsedMessage.data.id ?? crypto.randomUUID(), role: parsedMessage.data.role, parts: [{ type: "text", text }] } as UIMessage]; });
      if (!uiMessages.some((message) => message.role === "user")) return json({ error: "At least one user message is required.", code: "NO_USER_MESSAGE" }, 400);
      const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
      const latestText = latestUser ? textFromMessage(latestUser).trim() : "";
      const intent = classifyIntent(latestText);
      const intentText = `intent=${intent.intent}; confidence=${intent.confidence.toFixed(2)}; needsFreshState=${intent.needsFreshState}; requiresConfirmation=${intent.requiresConfirmation}; target=${intent.target || "none"}; guidance=${intentGuidance(intent)}`;
      const provider = getProvider(); const modelMessages = uiMessages.slice(-12);
      const result = streamText({ model: provider.model, system: systemPrompt(parsed.data.appContext, intentText), messages: await convertToModelMessages(modelMessages), tools: createProductivityTools(auth.client as any, auth.userId, auth.token), stopWhen: stepCountIs(8), maxOutputTokens: 900, maxRetries: 0, abortSignal: request.signal, onError: (error) => { if (isQuotaError(error)) console.warn(`[AI] ${provider.name} quota/rate limit reached.`); else console.error(`[AI] ${provider.name} stream error:`, error); } });
      return result.toUIMessageStreamResponse({
        originalMessages: modelMessages,
        generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
        onFinish: async ({ responseMessage, isAborted }) => {
          if (isAborted) return;
          try {
            const { data: conversation, error: lookupError } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (lookupError) throw lookupError;
            let conversationId = conversation?.id;
            if (!conversationId) { const created = await auth.client.from("chat_conversations").insert({ user_id: auth.userId }).select("id").single(); if (created.error || !created.data) throw created.error ?? new Error("Conversation creation failed"); conversationId = created.data.id; }
            const latestUserMessage = [...uiMessages].reverse().find((message) => message.role === "user"); const latestUserText = latestUserMessage?.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim() ?? "";
            if (latestUserText) { const duplicate = await auth.client.from("chat_messages").select("id").eq("conversation_id", conversationId).eq("user_id", auth.userId).eq("role", "user").eq("content", latestUserText).limit(1).maybeSingle(); if (duplicate.error) throw duplicate.error; if (!duplicate.data) { const inserted = await auth.client.from("chat_messages").insert({ conversation_id: conversationId, user_id: auth.userId, role: "user", content: latestUserText }); if (inserted.error) throw inserted.error; } }
            const assistantText = responseMessage.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim(); if (assistantText) { const saved = await auth.client.from("chat_messages").insert({ conversation_id: conversationId, user_id: auth.userId, role: "assistant", content: assistantText }); if (saved.error) throw saved.error; }
          } catch (error) { console.error("AI assistant persistence failed:", error); }
        },
        onError: (error) => { if (isQuotaError(error)) return "AI is temporarily rate-limited. Please try again after the quota window resets."; console.error("AI provider error:", error); return "AI could not complete that request. Please try again."; },
        consumeSseStream: consumeStream,
        headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" },
      });
    } catch (error) { if (isQuotaError(error)) return json({ error: "AI is temporarily rate-limited. Please try again after the quota window resets.", code: "AI_QUOTA_EXCEEDED" }, 429, { "Retry-After": "20" }); console.error("Outstand AI request failed", error); const status = typeof (error as { status?: unknown })?.status === "number" ? Number((error as { status: number }).status) : 500; return json({ error: status === 503 ? "AI service is temporarily unavailable." : "AI request failed.", code: status === 503 ? "SERVICE_UNAVAILABLE" : "AI_REQUEST_FAILED" }, status === 503 ? 503 : 500); }
  },
  DELETE: async ({ request }) => { try { const auth = await authenticate(request); if ("error" in auth) return auth.error; const removed = await auth.client.from("chat_messages").delete().eq("user_id", auth.userId); if (removed.error) return json({ error: "Could not clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500); return new Response(null, { status: 204 }); } catch (error) { console.error("Failed to clear AI memory:", error); return json({ error: "Failed to clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500); } },
} } });
