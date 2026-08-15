import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(z.unknown()).max(100),
  appContext: z.unknown().optional(),
});

const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.object({ type: z.literal("text"), text: z.string() })).optional(),
  content: z.union([
    z.string(),
    z.array(z.object({ type: z.literal("text"), text: z.string() })),
  ]).optional(),
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

  return `You are Outstand Intelligence, a concise and supportive productivity coach.\nUser: ${name}\nXP: ${xp}\nBest streak: ${streak} days\nDopamine score: ${dopamineScore}/100\nHabits: ${habitSummary || "None yet"}\n\nGive practical, encouraging answers and prefer one clear next step.`;
}

function textFromMessage(message: z.infer<typeof MessageSchema>): string {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) return message.content.map((part) => part.text).join("");
  return (message.parts ?? []).map((part) => part.text).join("");
}

function json(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

async function sendResponse(res: any, response: Response) {
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) return res.end();

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
    res.end();
  }
}

function describeError(error: unknown): { message: string; code?: string; details?: string } {
  if (error instanceof Error) {
    const candidate = error as Error & { code?: string; cause?: unknown };
    return {
      message: error.message || "Unknown error",
      ...(candidate.code ? { code: candidate.code } : {}),
      ...(candidate.cause instanceof Error ? { details: candidate.cause.message } : {}),
    };
  }
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      message: typeof candidate.message === "string" ? candidate.message : "Unknown error",
      ...(typeof candidate.code === "string" ? { code: candidate.code } : {}),
      ...(typeof candidate.details === "string" ? { details: candidate.details } : {}),
    };
  }
  return { message: String(error) };
}

function sendDetailedError(res: any, status: number, error: unknown, fallback: string) {
  const info = describeError(error);
  console.error("AI API error", { status, ...info, error });
  json(res, status, {
    error: info.message || fallback,
    code: info.code,
    details: info.details,
  });
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
  if (!authHeader?.startsWith("Bearer ")) {
    json(res, 401, { error: "Unauthorized access. Missing Bearer token." });
    return;
  }

  const supabaseUrl = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  const supabaseKey = env("SUPABASE_PUBLISHABLE_KEY") || env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY");
  const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_GENERATIVE_AI_API_KEY");

  if (!supabaseUrl || !supabaseKey) {
    json(res, 500, {
      error: "Missing Supabase server configuration.",
      details: `SUPABASE_URL: ${supabaseUrl ? "present" : "missing"}; SUPABASE_PUBLISHABLE_KEY: ${supabaseKey ? "present" : "missing"}`,
    });
    return;
  }

  if (!apiKey) {
    json(res, 500, {
      error: "Missing Gemini API key in Vercel.",
      details: "Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in the Vercel environment for the current deployment.",
    });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      sendDetailedError(res, 401, userError, "Authentication failed.");
      return;
    }

    if (req.method === "DELETE") {
      const { data: conversation, error: conversationError } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (conversationError) {
        sendDetailedError(res, 500, conversationError, "Could not load chat conversation.");
        return;
      }

      if (conversation?.id) {
        const { error: deleteError } = await supabase.from("chat_messages").delete().eq("conversation_id", conversation.id);
        if (deleteError) {
          sendDetailedError(res, 500, deleteError, "Could not clear chat history.");
          return;
        }
      }

      res.status(204).end();
      return;
    }

    const parsed = RequestSchema.safeParse(req.body);
    if (!parsed.success) {
      json(res, 400, {
        error: "Invalid chat request payload.",
        details: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      });
      return;
    }

    const uiMessages: UIMessage[] = parsed.data.messages.flatMap((item) => {
      const message = MessageSchema.safeParse(item);
      if (!message.success) return [];
      const text = textFromMessage(message.data).trim();
      if (!text) return [];
      return [{
        id: message.data.id || crypto.randomUUID(),
        role: message.data.role,
        parts: [{ type: "text", text }],
      } as UIMessage];
    });

    if (!uiMessages.length) {
      json(res, 400, { error: "At least one valid message is required." });
      return;
    }

    let { data: conversation, error: conversationLookupError } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (conversationLookupError) {
      sendDetailedError(res, 500, conversationLookupError, "Could not load chat conversation.");
      return;
    }

    if (!conversation) {
      const { data: created, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userData.user.id })
        .select("id")
        .single();

      if (error || !created) {
        sendDetailedError(res, 500, error, "Failed to initialize conversation.");
        return;
      }
      conversation = created;
    }

    const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
    if (latestUser) {
      const content = latestUser.parts
        .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text")
        .map((part) => part.text)
        .join("");

      if (content.trim()) {
        const { error } = await supabase.from("chat_messages").insert({
          conversation_id: conversation.id,
          user_id: userData.user.id,
          role: "user",
          content: content.trim(),
        });
        if (error) {
          sendDetailedError(res, 500, error, "Could not save your message.");
          return;
        }
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash", { apiKey }),
      system: buildPrompt(parsed.data.appContext),
      messages: await convertToModelMessages(uiMessages),
      temperature: 0.7,
    });

    void result.text.then(async (text) => {
      if (!text.trim()) return;
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversation!.id,
        user_id: userData.user.id,
        role: "assistant",
        content: text,
      });
      if (error) console.error("Failed to save assistant message:", error);
    }).catch((error) => console.error("Failed to save assistant response:", error));

    await sendResponse(res, result.toUIMessageStreamResponse());
  } catch (error) {
    sendDetailedError(res, 500, error, "AI request failed.");
  }
}
