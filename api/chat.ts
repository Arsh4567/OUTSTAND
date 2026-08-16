import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, pipeUIMessageStreamToResponse, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);

function sendJson(res: VercelResponse, status: number, data: unknown) {
  res.status(status).setHeader("Cache-Control", "no-store").json(data);
}

/** Read the raw Node request stream so Vercel's lazy req.body parser cannot throw "invalid media type". */
async function getBody(req: VercelRequest): Promise<any> {
  const request = req as unknown as NodeJS.ReadableStream & { readableEnded?: boolean };
  if (request.readableEnded) return null;

  const chunks: Buffer[] = [];
  let size = 0;
  const maxBytes = 1_000_000;

  return await new Promise((resolve, reject) => {
    const onData = (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) {
        cleanup();
        reject(new Error("Request body is too large."));
        return;
      }
      chunks.push(buffer);
    };
    const onEnd = () => {
      cleanup();
      if (!chunks.length) return resolve(null);
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new Error("Invalid JSON request body.")); }
    };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const cleanup = () => {
      request.removeListener("data", onData);
      request.removeListener("end", onEnd);
      request.removeListener("error", onError);
    };
    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", onError);
  });
}

function textFromMessage(message: any) {
  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((part: any) => part?.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("");
  }
  if (typeof message?.content === "string") return message.content;
  return "";
}

function systemPrompt(context: unknown) {
  const ctx = context && typeof context === "object" ? context as Record<string, unknown> : {};
  const name = typeof ctx.name === "string" ? ctx.name : "there";
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const score = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : 50;
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completed = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const habitSummary = habits.slice(0, 30)
    .map((item: any) => `${typeof item?.name === "string" ? item.name : "Habit"} ${typeof item?.id === "string" && completed.includes(item.id) ? "(done today)" : "(not done today)"}`)
    .join(", ");

  return `You are Outstand Intelligence, a precise and encouraging productivity coach.
User: ${name}
XP: ${xp}
Best streak: ${streak} days
Dopamine score: ${score}/100
Habits: ${habitSummary || "None yet"}

Rules:
- Be concise but useful.
- Give one clear next action when appropriate.
- Never claim you performed an action unless the app actually exposes that action.
- Do not invent personal data.
- Prefer practical, specific guidance over generic motivation.
- Keep a calm premium tone.`;
}

async function getAuth(req: VercelRequest) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return { error: { status: 401, body: { error: "Authentication required.", code: "AUTH_REQUIRED" } } } as const;
  }

  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    return { error: { status: 500, body: { error: "Supabase server configuration is missing.", code: "SUPABASE_CONFIG_MISSING" } } } as const;
  }

  const token = authorization.slice("Bearer ".length);
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { error: { status: 401, body: { error: "Authentication failed.", code: "AUTH_INVALID" } } } as const;
  }
  return { client, userId: data.user.id } as const;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type")
      .setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
      .end();
    return;
  }

  if (req.method === "GET") {
    const supabaseConfigured = Boolean(env("SUPABASE_URL", "VITE_SUPABASE_URL") && env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"));
    const geminiConfigured = Boolean(env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"));
    sendJson(res, 200, { ok: supabaseConfigured && geminiConfigured, service: "outstand-ai", supabaseConfigured, geminiConfigured });
    return;
  }

  const auth = await getAuth(req);
  if ("error" in auth) {
    sendJson(res, auth.error.status, auth.error.body);
    return;
  }

  if (req.method === "DELETE") {
    const { data: conversation, error } = await auth.client
      .from("chat_conversations")
      .select("id")
      .eq("user_id", auth.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      sendJson(res, 500, { error: "Could not access your AI conversation.", code: error.code });
      return;
    }
    if (conversation?.id) {
      const removed = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id).eq("user_id", auth.userId);
      if (removed.error) {
        sendJson(res, 500, { error: "Could not clear AI memory.", code: removed.error.code });
        return;
      }
    }
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const body = await getBody(req);
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    if (!rawMessages.length) {
      sendJson(res, 400, { error: "At least one chat message is required.", code: "EMPTY_MESSAGES" });
      return;
    }

    const uiMessages: UIMessage[] = rawMessages
      .map((message: any) => ({
        id: typeof message?.id === "string" ? message.id : crypto.randomUUID(),
        role: message?.role === "assistant" ? "assistant" : "user",
        parts: [{ type: "text", text: textFromMessage(message).trim() }],
      }))
      .filter((message: any) => message.parts[0].text.length > 0) as UIMessage[];

    if (!uiMessages.some((message) => message.role === "user")) {
      sendJson(res, 400, { error: "A user message is required.", code: "NO_USER_MESSAGE" });
      return;
    }

    let { data: conversation, error: conversationError } = await auth.client
      .from("chat_conversations")
      .select("id")
      .eq("user_id", auth.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversationError) {
      sendJson(res, 500, { error: "Could not access your AI conversation.", code: conversationError.code });
      return;
    }

    if (!conversation) {
      const created = await auth.client
        .from("chat_conversations")
        .insert({ user_id: auth.userId })
        .select("id")
        .single();
      if (created.error || !created.data) {
        sendJson(res, 500, { error: "Could not create your AI conversation.", code: created.error?.code ?? "CONVERSATION_CREATE_FAILED" });
        return;
      }
      conversation = created.data;
    }

    const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
    const latestText = latestUser ? textFromMessage(latestUser).trim() : "";
    if (latestText) {
      const existing = await auth.client
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", conversation.id)
        .eq("user_id", auth.userId)
        .eq("role", "user")
        .eq("content", latestText)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing.error) {
        sendJson(res, 500, { error: "Could not validate your message history.", code: existing.error.code });
        return;
      }
      if (!existing.data) {
        const inserted = await auth.client.from("chat_messages").insert({
          conversation_id: conversation.id,
          user_id: auth.userId,
          role: "user",
          content: latestText,
        });
        if (inserted.error) {
          sendJson(res, 500, { error: "Could not save your message.", code: inserted.error.code });
          return;
        }
      }
    }

    // Prefer an explicit API key supplied by Vercel. GOOGLE_API_KEY is included
    // as a compatibility fallback for projects that use Google's conventional name.
    const apiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
    if (!apiKey) {
      sendJson(res, 503, {
        error: "Gemini API configuration is missing.",
        code: "GEMINI_CONFIG_MISSING",
        hint: "Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in the Vercel Production environment.",
      });
      return;
    }

    // Instantiate the provider with the resolved key explicitly. This prevents
    // @ai-sdk/google from falling back to its own environment-variable lookup.
    const googleProvider = createGoogleGenerativeAI({ apiKey });
    const result = streamText({
      model: googleProvider("gemini-2.5-flash"),
      system: systemPrompt(body?.appContext),
      messages: await convertToModelMessages(uiMessages),
      temperature: 0.6,
    });

    const stream = result.toUIMessageStream({
      originalMessages: uiMessages,
      onFinish: async ({ responseMessage }) => {
        const text = responseMessage.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("")
          .trim();
        if (!text) return;
        const saved = await auth.client.from("chat_messages").insert({
          conversation_id: conversation!.id,
          user_id: auth.userId,
          role: "assistant",
          content: text,
        });
        if (saved.error) console.error("AI assistant persistence failed:", saved.error.message);
      },
      onError: (error) => error instanceof Error ? error.message : String(error),
    });

    await pipeUIMessageStreamToResponse({
      response: res,
      stream,
      headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
    });
  } catch (error) {
    console.error("Outstand AI request failed", error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        error: "AI request failed.",
        code: "AI_REQUEST_FAILED",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
