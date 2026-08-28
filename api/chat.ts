import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, pipeUIMessageStreamToResponse, stepCountIs, streamText, type UIMessage } from "ai";
import { createProductivityTools } from "./ai-productivity-tools.js";
import { getAIProvider, isRateLimitError, modelFor } from "./ai-provider.js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);
function sendJson(res: VercelResponse, status: number, data: unknown) { res.status(status).setHeader("Cache-Control", "no-store").json(data); }
async function getBody(req: VercelRequest): Promise<any> {
  const request = req as unknown as NodeJS.ReadableStream & { readableEnded?: boolean };
  if (request.readableEnded) return null;
  const chunks: Buffer[] = [];
  let size = 0;
  return await new Promise((resolve, reject) => {
    const onData = (chunk: Buffer | string) => { const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += buffer.length; if (size > 1_000_000) { cleanup(); reject(new Error("Request body is too large.")); return; } chunks.push(buffer); };
    const onEnd = () => { cleanup(); if (!chunks.length) return resolve(null); try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new Error("Invalid JSON request body.")); } };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const cleanup = () => { request.removeListener("data", onData); request.removeListener("end", onEnd); request.removeListener("error", onError); };
    request.on("data", onData); request.on("end", onEnd); request.on("error", onError);
  });
}
function textFromMessage(message: any) {
  if (Array.isArray(message?.parts)) return message.parts.filter((part: any) => part?.type === "text" && typeof part.text === "string").map((part: any) => part.text).join("");
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) return message.content.filter((part: any) => part?.type === "text" && typeof part.text === "string").map((part: any) => part.text).join("");
  return "";
}
function buildIntelligenceSystemPrompt(context: unknown) {
  const ctx = context && typeof context === "object" ? context as Record<string, any> : {};
  const name = typeof ctx.name === "string" && ctx.name.trim() ? ctx.name.trim() : "there";
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const score = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : null;
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completed = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const sessions = Array.isArray(ctx.sessions) ? ctx.sessions.length : 0;
  const outstandItems = Array.isArray(ctx.outstand) ? ctx.outstand.length : 0;
  const roadmap = ctx.roadmap && typeof ctx.roadmap === "object" ? ctx.roadmap : null;
  const habitSummary = habits.slice(0, 30).map((item: any) => `${typeof item?.name === "string" ? item.name : "Habit"} ${typeof item?.id === "string" && completed.includes(item.id) ? "(done today)" : "(not done today)"}`).join(", ");
  const completionRate = habits.length ? Math.round((completed.length / habits.length) * 100) : 0;
  const state = completionRate >= 70 && sessions > 0 ? "momentum" : completionRate < 40 || (streak === 0 && sessions === 0) ? "recovery" : "building";
  const priority = state === "momentum" ? "Protect the strongest existing behavior and make the next action small." : state === "recovery" ? "Reduce friction and choose one achievable action that restores momentum." : "Build consistency with one focused action before adding complexity.";
  const scoreLine = score === null ? "Dopamine score: not available" : `Dopamine score: ${score}/100`;
  const roadmapLine = roadmap ? [
    `Active roadmap: ${String(roadmap.title || "Untitled")}`,
    `Roadmap goal: ${String(roadmap.goal || "")}`,
    `Roadmap category: ${String(roadmap.category || "")}`,
    `Roadmap day: ${Number(roadmap.todayDay) || 1} of ${Number(roadmap.durationDays) || 1}`,
    `Milestones: ${Array.isArray(roadmap.milestones) ? roadmap.milestones.slice(0, 8).map((m: any) => `${m.title} (days ${m.dayStart}-${m.dayEnd})${m.outcome ? ` — ${m.outcome}` : ""}`).join(" | ") : "None"}`,
    `Today's roadmap tasks: ${Array.isArray(roadmap.todayTasks) ? roadmap.todayTasks.slice(0, 10).map((t: any) => `${t.title} [${t.progress || "pending"}, ${t.estimatedMinutes || 30} min${t.startTime ? `, ${t.startTime}` : ""}]${t.successCriteria ? ` — done when: ${t.successCriteria}` : ""}`).join(" | ") : "None"}`,
  ].join("\n") : "No active roadmap is available.";
  return `You are OUTSTAND Intelligence, a practical personal productivity agent for ${name}. Your job is to understand the user's request, read authoritative OUTSTAND state when needed, take the correct action, verify the result when a mutation occurs, and then respond briefly.

USER CONTEXT
Name: ${name}
XP: ${xp}
Best streak: ${streak} days
${scoreLine}
Habits today: ${completed.length}/${habits.length} completed (${completionRate}%)
Focus sessions in supplied context: ${sessions}
Outstand items in supplied context: ${outstandItems}
Current state: ${state}
Priority: ${priority}
Habits: ${habitSummary || "None yet"}

ROADMAP CONTEXT
${roadmapLine}

SOURCE OF TRUTH
- Browser appContext is only a convenience snapshot and may be stale.
- Supabase-backed tool results are authoritative for current state and all mutations.
- Never invent ids, tasks, habits, dates, progress, or successful writes.
- When a request depends on current state, prefer get_today before acting.

EXECUTION
- You are action-capable, not chatbot-only.
- When the user explicitly asks to create, change, complete, undo, schedule, or otherwise modify OUTSTAND data, use a tool when one exists.
- Do not explain how the user can perform an action when the action itself is available.
- Use tools in sequence when necessary. You may inspect state, mutate it, then inspect the authoritative state again to verify the mutation.
- Only mark habits when explicitly requested.
- Only change roadmaps when explicitly requested.
- Only create reminders when explicitly requested.
- If a requested action is unavailable in the current tool set, say what you can do now instead of pretending it was completed.
- After a successful mutation, state exactly what changed. Never claim success without a successful tool result.
- If the request is ambiguous but a safe interpretation is obvious, act on that interpretation rather than asking a needless question.
- Ask at most one short clarifying question when missing information materially changes the requested action.

FOCUS PLANS
When asked for a focus plan, make it immediately from current OUTSTAND context. Prefer the first unfinished relevant roadmap task. Keep it 20–60 minutes unless another duration is requested.

STYLE
- Plain text, concise, decisive, calm, friendly.
- Short paragraphs and simple bullets when useful.
- No markdown tables or decorative formatting.
- Avoid generic motivational filler.
- Do not claim to have changed anything unless the tools confirm it.`;
}

type AuthSuccess = { client: any; userId: string; token: string };
type AuthFailure = { error: { status: number; body: { error: string; code: string } } };
type AuthResult = AuthSuccess | AuthFailure;
async function getAuth(req: VercelRequest): Promise<AuthResult> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return { error: { status: 401, body: { error: "Authentication required.", code: "AUTH_REQUIRED" } } };
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  if (!url || !key) return { error: { status: 500, body: { error: "Supabase server configuration is missing.", code: "SUPABASE_CONFIG_MISSING" } } };
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return { error: { status: 401, body: { error: "Authentication token is missing.", code: "AUTH_REQUIRED" } } };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: { status: 401, body: { error: "Authentication failed.", code: "AUTH_INVALID" } } };
  return { client, userId: data.user.id, token };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method === "GET") {
    try {
      const provider = await getAIProvider();
      sendJson(res, 200, { ok: true, service: "outstand-ai", provider: provider.name, capabilities: { tools: ["get_today", "mark_habit", "change_roadmap", "set_reminder"], multiStep: true } });
    } catch {
      sendJson(res, 503, { ok: false, service: "outstand-ai" });
    }
    return;
  }
  const auth = await getAuth(req); if ("error" in auth) { sendJson(res, auth.error.status, auth.error.body); return; }
  if (req.method === "DELETE") {
    const { data: conversation, error } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) { sendJson(res, 500, { error: "Could not access your AI conversation.", code: error.code }); return; }
    if (conversation?.id) {
      const removed = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id).eq("user_id", auth.userId);
      if (removed.error) { sendJson(res, 500, { error: "Could not clear AI memory.", code: removed.error.code }); return; }
    }
    res.status(204).end(); return;
  }
  if (req.method !== "POST") { sendJson(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }); return; }
  try {
    const body = await getBody(req);
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    if (!rawMessages.length) { sendJson(res, 400, { error: "At least one chat message is required.", code: "EMPTY_MESSAGES" }); return; }
    const uiMessages: UIMessage[] = rawMessages.map((message: any) => ({ id: typeof message?.id === "string" ? message.id : crypto.randomUUID(), role: message?.role === "assistant" ? "assistant" : "user", parts: [{ type: "text", text: textFromMessage(message).trim() }] })).filter((message: any) => message.parts[0].text.length > 0) as UIMessage[];
    if (!uiMessages.some((message) => message.role === "user")) { sendJson(res, 400, { error: "A user message is required.", code: "NO_USER_MESSAGE" }); return; }

    let { data: conversation, error: conversationError } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (conversationError) { sendJson(res, 500, { error: "Could not access your AI conversation.", code: conversationError.code }); return; }
    if (!conversation) {
      const created = await auth.client.from("chat_conversations").insert({ user_id: auth.userId }).select("id").single();
      if (created.error || !created.data) { sendJson(res, 500, { error: "Could not create your AI conversation.", code: created.error?.code ?? "CONVERSATION_CREATE_FAILED" }); return; }
      conversation = created.data;
    }

    const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
    const latestText = latestUser ? textFromMessage(latestUser).trim() : "";
    if (latestText) {
      const existing = await auth.client.from("chat_messages").select("id").eq("conversation_id", conversation.id).eq("user_id", auth.userId).eq("role", "user").eq("content", latestText).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing.error) { sendJson(res, 500, { error: "Could not validate your message history.", code: existing.error.code }); return; }
      if (!existing.data) {
        const inserted = await auth.client.from("chat_messages").insert({ conversation_id: conversation.id, user_id: auth.userId, role: "user", content: latestText });
        if (inserted.error) { sendJson(res, 500, { error: "Could not save your message.", code: inserted.error.code }); return; }
      }
    }

    const primary = await getAIProvider();
    const messages = uiMessages.slice(-12);
    const result = streamText({
      model: modelFor(primary.name, primary.provider, "chat"),
      system: buildIntelligenceSystemPrompt(body?.appContext),
      messages: await convertToModelMessages(messages),
      tools: createProductivityTools(auth.client, auth.userId, auth.token),
      stopWhen: stepCountIs(4),
      maxOutputTokens: 700,
      maxRetries: 0,
      abortSignal: (req as any).signal,
    });
    const stream = result.toUIMessageStream({
      originalMessages: messages,
      onFinish: async ({ responseMessage }) => {
        const text = responseMessage.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("").trim();
        if (!text) return;
        const saved = await auth.client.from("chat_messages").insert({ conversation_id: conversation!.id, user_id: auth.userId, role: "assistant", content: text });
        if (saved.error) console.error("AI assistant persistence failed:", saved.error.message);
      },
      onError: (error) => {
        if (isRateLimitError(error)) return "AI is temporarily at capacity. Please try again shortly.";
        console.error("AI provider error:", error);
        return error instanceof Error ? error.message : "AI request failed.";
      },
    });
    await pipeUIMessageStreamToResponse({ response: res, stream, headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("Outstand AI request failed", error);
    if (!res.headersSent) {
      const status = isRateLimitError(error) ? 429 : (error as any)?.status === 503 ? 503 : 500;
      sendJson(res, status, { error: isRateLimitError(error) ? "AI is temporarily at capacity. Please try again shortly." : error instanceof Error ? error.message : "AI request failed.", code: isRateLimitError(error) ? "AI_QUOTA_EXCEEDED" : "AI_REQUEST_FAILED" });
    }
  }
}
