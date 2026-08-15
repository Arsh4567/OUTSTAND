import { createClient } from "@supabase/supabase-js";
import { generateText, type ModelMessage } from "ai";
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

const env = (name: string) => process.env[name] || undefined;

function buildPrompt(appContext: unknown): string {
  const ctx = appContext && typeof appContext === "object" ? (appContext as Record<string, unknown>) : {};
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

Give practical, encouraging answers and prefer one clear next step.`;
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

function json(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    res.status(200).send("Outstand AI chat endpoint");
    return;
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).end();
    return;
  }

  const authHeader = req.headers?.authorization as string | undefined;
  if (!authHeader) {
    json(res, 401, { error: "Unauthorized access." });
    return;
  }

  const supabaseUrl = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  const supabaseKey = env("SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY");
  const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_GENERATIVE_AI_API_KEY");

  if (!supabaseUrl || !supabaseKey) {
    json(res, 500, { error: "Missing Supabase server configuration." });
    return;
  }
  if (!apiKey) {
    json(res, 500, { error: "Missing Gemini API key in Vercel." });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      json(res, 401, { error: "Authentication failed." });
      return;
    }

    if (req.method === "DELETE") {
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (conversation?.id) {
        await supabase.from("chat_messages").delete().eq("conversation_id", conversation.id);
      }

      res.status(204).end();
      return;
    }

    const parsed = RequestSchema.safeParse(req.body);
    if (!parsed.success) {
      json(res, 400, { error: "Invalid chat request payload." });
      return;
    }

    const messages = normalizeMessages(parsed.data.messages);
    if (!messages.length) {
      json(res, 400, { error: "At least one valid message is required." });
      return;
    }

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

      if (error || !created) {
        json(res, 500, { error: "Failed to initialize conversation." });
        return;
      }
      conversation = created;
    }

    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    if (latestUser) {
      const content = typeof latestUser.content === "string"
        ? latestUser.content
        : latestUser.content.map((part) => part.text).join("");

      if (content.trim()) {
        const { error } = await supabase.from("chat_messages").insert({
          conversation_id: conversation.id,
          user_id: userData.user.id,
          role: "user",
          content: content.trim(),
        });
        if (error) console.error("Failed to save user message:", error);
      }
    }

    const result = await generateText({
      model: google("gemini-2.5-flash", { apiKey }),
      system: buildPrompt(parsed.data.appContext),
      messages,
      temperature: 0.7,
    });

    const text = result.text || "I couldn't generate a response right now.";
    const { error: saveError } = await supabase.from("chat_messages").insert({
      conversation_id: conversation.id,
      user_id: userData.user.id,
      role: "assistant",
      content: text,
    });
    if (saveError) console.error("Failed to save assistant message:", saveError);

    res.status(200).send(text);
  } catch (error) {
    console.error("AI chat error:", error);
    json(res, 500, { error: error instanceof Error ? error.message : "AI request failed." });
  }
}
