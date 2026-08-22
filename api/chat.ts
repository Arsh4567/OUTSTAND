import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, pipeUIMessageStreamToResponse, streamText, type UIMessage } from "ai";
import { getAIProvider, isRateLimitError, modelFor } from "./ai-provider.js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);
function sendJson(res: VercelResponse, status: number, data: unknown) { res.status(status).setHeader("Cache-Control", "no-store").json(data); }
async function getBody(req: VercelRequest): Promise<any> { const request = req as unknown as NodeJS.ReadableStream & { readableEnded?: boolean }; if (request.readableEnded) return null; const chunks: Buffer[] = []; let size = 0; return await new Promise((resolve, reject) => { const onData = (chunk: Buffer | string) => { const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += buffer.length; if (size > 1_000_000) { cleanup(); reject(new Error("Request body is too large.")); return; } chunks.push(buffer); }; const onEnd = () => { cleanup(); if (!chunks.length) return resolve(null); try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new Error("Invalid JSON request body.")); } }; const onError = (error: Error) => { cleanup(); reject(error); }; const cleanup = () => { request.removeListener("data", onData); request.removeListener("end", onEnd); request.removeListener("error", onError); }; request.on("data", onData); request.on("end", onEnd); request.on("error", onError); }); }
function textFromMessage(message: any) { if (Array.isArray(message?.parts)) return message.parts.filter((part: any) => part?.type === "text" && typeof part.text === "string").map((part: any) => part.text).join(""); if (typeof message?.content === "string") return message.content; return ""; }
function buildIntelligenceSystemPrompt(context: unknown) {
  const ctx = context && typeof context === "object" ? context as Record<string, any> : {};
  const name = typeof ctx.name === "string" && ctx.name.trim() ? ctx.name.trim() : "there";
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const score = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : null;
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completed = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const sessions = Array.isArray(ctx.sessions) ? ctx.sessions.length : 0;
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
  return `You are OUTSTAND Intelligence, a practical personal productivity assistant for ${name}. Your job is to help the user make progress, not to write impressive motivational essays.

USER CONTEXT
Name: ${name}
XP: ${xp}
Best streak: ${streak} days
${scoreLine}
Habits today: ${completed.length}/${habits.length} completed (${completionRate}%)
Focus sessions in supplied context: ${sessions}
Current state: ${state}
Priority: ${priority}
Habits: ${habitSummary || "None yet"}

ROADMAP CONTEXT
${roadmapLine}

PRODUCT RULES
- OUTSTAND follows Goal -> Plan -> Do -> Track -> Improve.
- Use supplied OUTSTAND data as the source of truth.
- Never invent personal data, tasks, deadlines, roadmap progress, or completed work.
- The active roadmap above is real user data. Use it when answering planning, focus, progress, or "what should I do next" requests.
- Roadmap planning lives on /roadmap, but the assistant can use the supplied roadmap context to guide the user's next action.
- Prefer a concrete next action over general advice.
- If the user gives enough information, decide and act instead of asking unnecessary questions.
- Ask at most one short clarifying question only when the missing information materially changes the plan.

FOCUS PLAN MODE
When the user asks for a focus plan, study plan, work plan, or says "make me a focus plan":
- Make a plan immediately.
- Prefer the first unfinished required roadmap task when it matches the user's request or is clearly the most useful next action.
- If the user names a different task, use that task instead.
- If there is no suitable roadmap task, choose the most useful unfinished habit/task that can reasonably be inferred from supplied context; if no task can be inferred, ask one short question: "What do you want to finish?"
- Keep the plan between 20 and 60 minutes unless the user explicitly requests another duration.
- Use 2 to 4 action blocks. Each block must contain a duration and one concrete action.
- Preserve the roadmap's actual task title, instructions, timing, and success criteria when they fit the requested focus session. Do not invent roadmap work.
- Include a clear DONE WHEN condition.
- Include a final START NOW line.
- Do not explain productivity theory, Pomodoro history, dopamine, neuroscience, or why the plan works unless specifically asked.
- Do not give a giant checklist or multi-day roadmap for a focus-plan request.
- Make the plan feel personal by using the user's supplied context when relevant.

FOCUS PLAN FORMAT
Use exactly this compact plain-text structure for a focus plan:
FOCUS PLAN
Goal: [specific outcome]
Time: [total minutes]

[duration] [action]
[duration] [action]
[duration] [action]

DONE WHEN: [observable finish condition]
START NOW: [first action]

WRITING STYLE
- Plain text first. Avoid markdown headings, horizontal rules, tables, and decorative formatting.
- Avoid excessive special characters, emoji, and numbered-list decoration.
- Never use "###", "---", "1️⃣", "2️⃣", "3️⃣", blockquotes, or fake motivational quotes.
- Short paragraphs and short lines are preferred.
- Do not start with "Hey [name]!" unless the user is simply greeting you.
- Do not end with "Let me know how it goes", "Hope this helps", or another generic invitation.
- Sound decisive, calm, friendly, and human.
- Match the user's casual tone without becoming childish.
- Use an emoji only when it adds real value, normally zero or one.

GENERAL RESPONSE BEHAVIOR
For simple questions: answer directly.
For productivity problems: identify the key issue and give one practical next action.
For setbacks: remove shame and make the restart smaller.
For progress: mention the specific win and suggest the next useful move.
For planning: prioritize and reduce complexity.
For analytical requests: use clear structure and actual supplied metrics.

Your success metric is not how much text you generate. It is whether the user knows exactly what to do next.`;
}
type AuthSuccess = { client: any; userId: string }; type AuthFailure = { error: { status: number; body: { error: string; code: string } } }; type AuthResult = AuthSuccess | AuthFailure;
async function getAuth(req: VercelRequest): Promise<AuthResult> { const authorization = req.headers.authorization; if (!authorization?.startsWith("Bearer ")) return { error: { status: 401, body: { error: "Authentication required.", code: "AUTH_REQUIRED" } } }; const url = env("SUPABASE_URL", "VITE_SUPABASE_URL"); const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"); if (!url || !key) return { error: { status: 500, body: { error: "Supabase server configuration is missing.", code: "SUPABASE_CONFIG_MISSING" } } }; const token = authorization.slice("Bearer ".length).trim(); if (!token) return { error: { status: 401, body: { error: "Authentication token is missing.", code: "AUTH_REQUIRED" } } }; const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) return { error: { status: 401, body: { error: "Authentication failed.", code: "AUTH_INVALID" } } }; return { client, userId: data.user.id }; }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method === "GET") { sendJson(res, 200, { ok: Boolean(env("SUPABASE_URL", "VITE_SUPABASE_URL") && env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY") && (env("GROQ_API_KEY") || env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"))), service: "outstand-ai" }); return; }
  const auth = await getAuth(req); if ("error" in auth) { sendJson(res, auth.error.status, auth.error.body); return; }
  if (req.method === "DELETE") { const { data: conversation, error } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (error) { sendJson(res, 500, { error: "Could not access your AI conversation.", code: error.code }); return; } if (conversation?.id) { const removed = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id).eq("user_id", auth.userId); if (removed.error) { sendJson(res, 500, { error: "Could not clear AI memory.", code: removed.error.code }); return; } } res.status(204).end(); return; }
  if (req.method !== "POST") { sendJson(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }); return; }
  try {
    const body = await getBody(req); const rawMessages = Array.isArray(body?.messages) ? body.messages : []; if (!rawMessages.length) { sendJson(res, 400, { error: "At least one chat message is required.", code: "EMPTY_MESSAGES" }); return; }
    const uiMessages: UIMessage[] = rawMessages.map((message: any) => ({ id: typeof message?.id === "string" ? message.id : crypto.randomUUID(), role: message?.role === "assistant" ? "assistant" : "user", parts: [{ type: "text", text: textFromMessage(message).trim() }] })).filter((message: any) => message.parts[0].text.length > 0) as UIMessage[];
    if (!uiMessages.some((message) => message.role === "user")) { sendJson(res, 400, { error: "A user message is required.", code: "NO_USER_MESSAGE" }); return; }
    let { data: conversation, error: conversationError } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (conversationError) { sendJson(res, 500, { error: "Could not access your AI conversation.", code: conversationError.code }); return; }
    if (!conversation) { const created = await auth.client.from("chat_conversations").insert({ user_id: auth.userId }).select("id").single(); if (created.error || !created.data) { sendJson(res, 500, { error: "Could not create your AI conversation.", code: created.error?.code ?? "CONVERSATION_CREATE_FAILED" }); return; } conversation = created.data; }
    const latestUser = [...uiMessages].reverse().find((message) => message.role === "user"); const latestText = latestUser ? textFromMessage(latestUser).trim() : "";
    if (latestText) { const existing = await auth.client.from("chat_messages").select("id").eq("conversation_id", conversation.id).eq("user_id", auth.userId).eq("role", "user").eq("content", latestText).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (existing.error) { sendJson(res, 500, { error: "Could not validate your message history.", code: existing.error.code }); return; } if (!existing.data) { const inserted = await auth.client.from("chat_messages").insert({ conversation_id: conversation.id, user_id: auth.userId, role: "user", content: latestText }); if (inserted.error) { sendJson(res, 500, { error: "Could not save your message.", code: inserted.error.code }); return; } } }
    const primary = await getAIProvider(); const result = streamText({ model: modelFor(primary.name, primary.provider, "chat"), system: buildIntelligenceSystemPrompt(body?.appContext), messages: await convertToModelMessages(uiMessages), maxRetries: 0 });
    const stream = result.toUIMessageStream({ originalMessages: uiMessages, onFinish: async ({ responseMessage }) => { const text = responseMessage.parts.filter((part: any) => part.type === "text").map((part: any) => part.text).join("").trim(); if (!text) return; const saved = await auth.client.from("chat_messages").insert({ conversation_id: conversation!.id, user_id: auth.userId, role: "assistant", content: text }); if (saved.error) console.error("AI assistant persistence failed:", saved.error.message); }, onError: (error) => { if (isRateLimitError(error)) return "AI is temporarily at capacity. Please try again shortly."; return error instanceof Error ? error.message : String(error); } });
    await pipeUIMessageStreamToResponse({ response: res, stream, headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
  } catch (error) { console.error("Outstand AI request failed", error); if (!res.headersSent) { const status = isRateLimitError(error) ? 429 : (error as any)?.status === 503 ? 503 : 500; sendJson(res, status, { error: isRateLimitError(error) ? "AI is temporarily at capacity. Please try again shortly." : error instanceof Error ? error.message : "AI request failed.", code: isRateLimitError(error) ? "AI_QUOTA_EXCEEDED" : "AI_REQUEST_FAILED" }); } }
}
