import { createFileRoute } from "@tanstack/react-router";
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
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
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

  const habitSummary = habits
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const id = typeof item.id === "string" ? item.id : "";
      const label = typeof item.name === "string" ? item.name : "Habit";
      return `${label} ${completed.includes(id) ? "(done today)" : "(not done today)"}`;
    })
    .join(", ");

  return `You are Outstand Intelligence, a supportive productivity coach.
User: ${name}
XP: ${xp}
Best streak: ${streak} days
Dopamine score: ${score}/100
Habits: ${habitSummary || "None yet"}

Be concise, practical, encouraging, and give one clear next step.`;
}

function supabaseConfig() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
  };
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) } as const;
  }

  const { url, key } = supabaseConfig();
  if (!url || !key) {
    return {
      error: json({
        error: "Supabase server configuration is missing.",
        code: "SUPABASE_CONFIG_MISSING",
        details: `SUPABASE_URL=${url ? "present" : "missing"}; SUPABASE_KEY=${key ? "present" : "missing"}`,
      }, 500),
    } as const;
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return {
      error: json({
        error: "Authentication failed.",
        code: "AUTH_INVALID",
        details: error?.message ?? "No authenticated user returned by Supabase.",
      }, 401),
    } as const;
  }

  return { client, userId: data.user.id } as const;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => {
        const { url, key } = supabaseConfig();
        const gemini = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
        return json({
          ok: true,
          service: "outstand-ai",
          supabaseConfigured: Boolean(url && key),
          geminiConfigured: Boolean(gemini),
          message: "Outstand AI endpoint is online.",
        });
      },

      POST: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if ("error" in auth) return auth.error;

          const body = await request.json().catch(() => null);
          const parsed = RequestSchema.safeParse(body);
          if (!parsed.success) {
            return json({
              error: "Invalid AI request payload.",
              code: "INVALID_PAYLOAD",
              details: parsed.error.message,
            }, 400);
          }

          const uiMessages: UIMessage[] = parsed.data.messages.flatMap((raw) => {
            const parsedMessage = MessageSchema.safeParse(raw);
            if (!parsedMessage.success) return [];
            const text = textFromMessage(parsedMessage.data).trim();
            if (!text) return [];
            return [{
              id: parsedMessage.data.id ?? crypto.randomUUID(),
              role: parsedMessage.data.role,
              parts: [{ type: "text", text }],
            } as UIMessage];
          });

          if (uiMessages.length === 0) {
            return json({ error: "At least one valid chat message is required.", code: "EMPTY_MESSAGES" }, 400);
          }

          let { data: conversation, error: conversationLookupError } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .maybeSingle();

          if (conversationLookupError) {
            return json({
              error: "Could not access your AI conversation.",
              code: conversationLookupError.code ?? "CONVERSATION_LOOKUP_FAILED",
              details: conversationLookupError.message,
            }, 500);
          }

          if (!conversation) {
            const { data: created, error } = await auth.client
              .from("chat_conversations")
              .insert({ user_id: auth.userId })
              .select("id")
              .single();

            if (error || !created) {
              return json({
                error: "Could not create your AI conversation.",
                code: error?.code ?? "CONVERSATION_CREATE_FAILED",
                details: error?.message,
              }, 500);
            }
            conversation = created;
          }

          const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
          if (latestUser) {
            const content = latestUser.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("")
              .trim();

            if (content) {
              const { error } = await auth.client.from("chat_messages").insert({
                conversation_id: conversation.id,
                user_id: auth.userId,
                role: "user",
                content,
              });

              if (error) {
                return json({
                  error: "Could not save your message.",
                  code: error.code ?? "MESSAGE_SAVE_FAILED",
                  details: error.message,
                }, 500);
              }
            }
          }

          const apiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
          if (!apiKey) {
            return json({
              error: "Gemini API configuration is missing.",
              code: "GEMINI_CONFIG_MISSING",
              details: "Set GEMINI_API_KEY in the Vercel Production environment and redeploy.",
            }, 500);
          }

          const result = streamText({
            model: google("gemini-2.5-flash", { apiKey }),
            system: systemPrompt(parsed.data.appContext),
            messages: await convertToModelMessages(uiMessages),
            temperature: 0.7,
          });

          void result.text.then(async (text) => {
            if (!text.trim()) return;
            const { error } = await auth.client.from("chat_messages").insert({
              conversation_id: conversation.id,
              user_id: auth.userId,
              role: "assistant",
              content: text,
            });
            if (error) console.error("AI assistant message persistence failed", error);
          });

          return result.toUIMessageStreamResponse({
            headers: { "Cache-Control": "no-cache, no-transform" },
          });
        } catch (error) {
          console.error("Outstand AI request failed", error);
          return json({
            error: "AI request failed.",
            code: "AI_REQUEST_FAILED",
            details: error instanceof Error ? error.message : String(error),
          }, 500);
        }
      },

      DELETE: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if ("error" in auth) return auth.error;

          const { data: conversation, error: lookupError } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .maybeSingle();

          if (lookupError) {
            return json({ error: "Could not access your AI conversation.", code: lookupError.code, details: lookupError.message }, 500);
          }

          if (conversation?.id) {
            const { error } = await auth.client
              .from("chat_messages")
              .delete()
              .eq("conversation_id", conversation.id);

            if (error) {
              return json({ error: "Could not clear AI memory.", code: error.code, details: error.message }, 500);
            }
          }

          return new Response(null, { status: 204 });
        } catch (error) {
          return json({ error: "Failed to clear AI memory.", code: "MEMORY_CLEAR_FAILED", details: error instanceof Error ? error.message : String(error) }, 500);
        }
      },
    },
  },
});
