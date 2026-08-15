import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { streamText, type ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(z.unknown()).max(100),
  appContext: z.unknown().optional(),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([
    z.string(),
    z.array(z.object({ type: z.literal("text"), text: z.string() })),
  ]),
});

function env(name: string): string | undefined {
  return process.env[name] || undefined;
}

function buildPrompt(appContext: unknown): string {
  const ctx = appContext && typeof appContext === "object"
    ? (appContext as Record<string, unknown>)
    : {};
  const name = typeof ctx.name === "string" ? ctx.name : "friend";
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const dopamineScore = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : 50;
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completedToday = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];

  const habitSummary = habits
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const id = typeof item.id === "string" ? item.id : "";
      const label = typeof item.name === "string" ? item.name : "Habit";
      return `${label} ${completedToday.includes(id) ? "(done today)" : "(not done today)"}`;
    })
    .join(", ");

  return `You are Outstand Intelligence, a concise and supportive productivity coach.
User: ${name}
XP: ${xp}
Best streak: ${streak} days
Dopamine score: ${dopamineScore}/100
Habits: ${habitSummary || "None yet"}

Give practical, encouraging answers. Prefer one clear next step.`;
}

function normalizeMessages(raw: unknown[]): ModelMessage[] {
  return raw.flatMap((item) => {
    const parsed = MessageSchema.safeParse(item);
    if (!parsed.success) return [];
    const message = parsed.data;
    return [{
      role: message.role,
      content: typeof message.content === "string"
        ? message.content
        : message.content.map((part) => ({ type: "text" as const, text: part.text })),
    } satisfies ModelMessage];
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || "{}");
}

async function main(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Outstand AI chat endpoint");
    return;
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST, DELETE");
    res.end();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return sendJson(res, 401, { error: "Unauthorized access." });

  const supabaseUrl = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  const supabaseKey = env("SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY");
  const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_GENERATIVE_AI_API_KEY");

  if (!supabaseUrl || !supabaseKey) return sendJson(res, 500, { error: "Missing Supabase server configuration." });
  if (!apiKey) return sendJson(res, 500, { error: "Missing Gemini API key in Vercel." });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return sendJson(res, 401, { error: "Authentication failed." });

  if (req.method === "DELETE") {
    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (conversation?.id) await supabase.from("chat_messages").delete().eq("conversation_id", conversation.id);
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const parsed = RequestSchema.safeParse(await readBody(req));
    if (!parsed.success) return sendJson(res, 400, { error: "Invalid chat request payload." });
    const messages = normalizeMessages(parsed.data.messages);
    if (!messages.length) return sendJson(res, 400, { error: "At least one valid message is required." });

    let { data: conversation } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!conversation) {
      const { data: created, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userData.user.id })
        .select("id")
        .single();
      if (error || !created) return sendJson(res, 500, { error: "Failed to initialize conversation." });
      conversation = created;
    }

    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    if (latestUser) {
      const content = typeof latestUser.content === "string"
        ? latestUser.content
        : latestUser.content.map((part) => part.text).join("");
      if (content.trim()) {
        await supabase.from("chat_messages").insert({
          conversation_id: conversation.id,
          user_id: userData.user.id,
          role: "user",
          content: content.trim(),
        });
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash", { apiKey }),
      system: buildPrompt(parsed.data.appContext),
      messages,
      temperature: 0.7,
    });

    const text = await result.text;
    await supabase.from("chat_messages").insert({
      conversation_id: conversation.id,
      user_id: userData.user.id,
      role: "assistant",
      content: text,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.end(text);
  } catch (error) {
    console.error("AI chat error:", error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : "AI request failed." });
  }
}

export default main;
