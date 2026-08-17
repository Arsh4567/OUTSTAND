import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { consumeStream, convertToModelMessages, createIdGenerator, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const MODEL = "gemini-2.5-flash-lite";

const RequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(40),
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

type AuthSuccess = { client: ReturnType<typeof createClient>; userId: string };
type AuthFailure = { error: Response };
type AuthResult = AuthSuccess | AuthFailure;

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function env(...names: string[]) {
  return names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

function textFromMessage(message: z.infer<typeof MessageSchema>) {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) return message.content.map((part) => part.text).join("");
  return (message.parts ?? []).map((part) => part.text).join("");
}

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
  const habitSummary = habits
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .slice(0, 12)
    .map((item) => `${typeof item.name === "string" ? item.name : "Habit"}: ${typeof item.id === "string" && completed.includes(item.id) ? "done" : "not done"}`)
    .join(", ");

  return `You are OUTSTAND Intelligence, a fast, practical productivity companion.
User: ${name}
XP: ${xp}
Best streak: ${streak}
Dopamine score: ${score}/100
Habits: ${habitSummary || "none"}
Focus sessions: ${sessions}
Outstand items: ${outstandItems}

Answer immediately and keep simple questions short. Use the supplied app context as truth. Never invent personal data or claim actions you did not perform. Give one useful next step when appropriate.

Formatting rules are strict. Never use markdown bold markers. Never use asterisks for emphasis. Never use parentheses. Do not add parenthetical asides. Prefer plain text, short paragraphs, hyphen bullets, and simple headings.`;
}

function supabaseConfig() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
  };
}

function geminiApiKey() {
  return env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
}

async function authenticate(request: Request): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  }

  const token = authorization.slice(7).trim();
  if (!token) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };

  const { url, key } = supabaseConfig();
  if (!url || !key) {
    return { error: json({ error: "Supabase server configuration is missing.", code: "SUPABASE_CONFIG_MISSING" }, 500) };
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || !userId) {
    return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  }

  return { client, userId };
}

function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|quota|resource[_ -]?exhausted|rate[_ -]?limit|free[_ -]?tier/i.test(message);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => {
        const { url, key } = supabaseConfig();
        const apiKey = geminiApiKey();
        return json({
          ok: Boolean(url && key && apiKey),
          service: "outstand-ai",
          supabaseConfigured: Boolean(url && key),
          geminiConfigured: Boolean(apiKey),
          model: MODEL,
        });
      },

      POST: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if ("error" in auth) return auth.error;

          const apiKey = geminiApiKey();
          if (!apiKey) {
            console.error("[AI] Missing Gemini API key.");
            return json({ error: "AI service is not configured on the server.", code: "GEMINI_CONFIG_MISSING" }, 503);
          }

          const rawBody = await request.json().catch(() => null);
          const parsed = RequestSchema.safeParse(rawBody);
          if (!parsed.success) return json({ error: "Invalid AI request payload.", code: "INVALID_PAYLOAD" }, 400);

          const uiMessages: UIMessage[] = parsed.data.messages.flatMap((raw) => {
            const parsedMessage = MessageSchema.safeParse(raw);
            if (!parsedMessage.success) return [];
            const text = textFromMessage(parsedMessage.data).trim();
            if (!text) return [];
            return [{ id: parsedMessage.data.id ?? crypto.randomUUID(), role: parsedMessage.data.role, parts: [{ type: "text", text }] } as UIMessage];
          });

          if (!uiMessages.some((message) => message.role === "user")) {
            return json({ error: "At least one user message is required.", code: "NO_USER_MESSAGE" }, 400);
          }

          const modelMessages = uiMessages.slice(-10);
          const google = createGoogleGenerativeAI({ apiKey });
          const result = streamText({
            model: google(MODEL),
            system: systemPrompt(parsed.data.appContext),
            messages: await convertToModelMessages(modelMessages),
            maxOutputTokens: 500,
            maxRetries: 0,
            providerOptions: {
              google: {
                thinkingConfig: {
                  thinkingLevel: "minimal",
                },
              },
            },
            abortSignal: request.signal,
            onError: (error) => {
              if (isQuotaError(error)) {
                console.warn("[AI] Gemini quota/rate limit reached. No retry will be attempted.");
              } else {
                console.error("Outstand AI stream error:", error);
              }
            },
          });

          return result.toUIMessageStreamResponse({
            originalMessages: modelMessages,
            generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
            onFinish: async ({ responseMessage, isAborted }) => {
              if (isAborted) return;

              try {
                const { data: conversation, error: lookupError } = await auth.client
                  .from("chat_conversations")
                  .select("id")
                  .eq("user_id", auth.userId)
                  .order("updated_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (lookupError) throw lookupError;

                let conversationId = conversation?.id;
                if (!conversationId) {
                  const created = await auth.client
                    .from("chat_conversations")
                    .insert({ user_id: auth.userId })
                    .select("id")
                    .single();
                  if (created.error || !created.data) throw created.error ?? new Error("Conversation creation failed");
                  conversationId = created.data.id;
                }

                const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
                const latestText = latestUser?.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim() ?? "";

                if (latestText) {
                  const inserted = await auth.client.from("chat_messages").insert({
                    conversation_id: conversationId,
                    user_id: auth.userId,
                    role: "user",
                    content: latestText,
                  });
                  if (inserted.error) throw inserted.error;
                }

                const assistantText = responseMessage.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim();
                if (assistantText) {
                  const saved = await auth.client.from("chat_messages").insert({
                    conversation_id: conversationId,
                    user_id: auth.userId,
                    role: "assistant",
                    content: assistantText,
                  });
                  if (saved.error) throw saved.error;
                }
              } catch (error) {
                console.error("AI assistant persistence failed:", error);
              }
            },
            onError: (error) => {
              if (isQuotaError(error)) return "AI is temporarily rate-limited. Please try again after the quota window resets.";
              return error instanceof Error ? error.message : String(error);
            },
            consumeSseStream: consumeStream,
            headers: {
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
              "X-Content-Type-Options": "nosniff",
            },
          });

          return result;
        } catch (error) {
          if (isQuotaError(error)) {
            return json({ error: "AI is temporarily rate-limited. Please try again after the quota window resets.", code: "AI_QUOTA_EXCEEDED" }, 429, { "Retry-After": "20" });
          }
          console.error("Outstand AI request failed", error);
          return json({ error: "AI request failed.", code: "AI_REQUEST_FAILED" }, 500);
        }
      },

      DELETE: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if ("error" in auth) return auth.error;
          const { data: conversation, error } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
          if (error) return json({ error: "Could not access your AI conversation.", code: error.code }, 500);
          if (conversation?.id) {
            const removed = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id).eq("user_id", auth.userId);
            if (removed.error) return json({ error: "Could not clear AI memory.", code: removed.error.code }, 500);
          }
          return new Response(null, { status: 204 });
        } catch (error) {
          console.error("Failed to clear AI memory:", error);
          return json({ error: "Failed to clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500);
        }
      },
    },
  },
});
