import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(z.unknown()).max(100),
  appContext: z.unknown().optional(),
});

const UIMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.object({ type: z.literal("text"), text: z.string() })).optional(),
  content: z.union([
    z.string(),
    z.array(z.object({ type: z.literal("text"), text: z.string() })),
  ]).optional(),
});

function jsonError(message: string, status: number, details?: string) {
  return new Response(JSON.stringify({ error: message, ...(details ? { details } : {}) }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

function messageText(message: z.infer<typeof UIMessageSchema>) {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) return message.content.map((part) => part.text).join("");
  return (message.parts ?? []).map((part) => part.text).join("");
}

function buildSystemPrompt(appContext: unknown) {
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

Give practical, encouraging answers. Prefer one clear next step.`;
}

function getSupabaseConfig() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    key: env(
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_ANON_KEY",
    ),
  };
}

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: jsonError("Authentication required. Sign in and try again.", 401) } as const;
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { error: jsonError("Supabase server configuration is missing.", 500) } as const;
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return {
      error: jsonError(
        "Authentication failed.",
        401,
        error?.message ?? "No authenticated Supabase user was returned.",
      ),
    } as const;
  }

  return { client, userId: data.user.id } as const;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => new Response("Outstand AI chat endpoint", {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }),

      POST: async ({ request }) => {
        try {
          const auth = await requireUser(request);
          if ("error" in auth) return auth.error;

          const rawBody = await request.json().catch(() => null);
          const parsed = RequestSchema.safeParse(rawBody);
          if (!parsed.success) {
            return jsonError("Invalid AI request payload.", 400, parsed.error.message);
          }

          const uiMessages: UIMessage[] = parsed.data.messages.flatMap((raw) => {
            const result = UIMessageSchema.safeParse(raw);
            if (!result.success) return [];
            const text = messageText(result.data).trim();
            if (!text) return [];
            return [{
              id: result.data.id ?? crypto.randomUUID(),
              role: result.data.role,
              parts: [{ type: "text", text }],
            } as UIMessage];
          });

          if (uiMessages.length === 0) {
            return jsonError("At least one valid chat message is required.", 400);
          }

          const { data: existingConversation, error: conversationLookupError } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .maybeSingle();

          if (conversationLookupError) {
            console.error("Conversation lookup failed:", conversationLookupError);
            return jsonError("Could not access your AI conversation.", 500, conversationLookupError.message);
          }

          let conversation = existingConversation;
          if (!conversation) {
            const { data: created, error: conversationCreateError } = await auth.client
              .from("chat_conversations")
              .insert({ user_id: auth.userId })
              .select("id")
              .single();

            if (conversationCreateError || !created) {
              console.error("Conversation creation failed:", conversationCreateError);
              return jsonError("Could not create your AI conversation.", 500, conversationCreateError?.message);
            }
            conversation = created;
          }

          const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
          if (latestUser) {
            const content = latestUser.parts
              .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text")
              .map((part) => part.text)
              .join("")
              .trim();

            if (content) {
              const { error: saveUserError } = await auth.client.from("chat_messages").insert({
                conversation_id: conversation.id,
                user_id: auth.userId,
                role: "user",
                content,
              });

              if (saveUserError) {
                console.error("Saving user message failed:", saveUserError);
                return jsonError("Could not save your message.", 500, saveUserError.message);
              }
            }
          }

          const apiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
          if (!apiKey) {
            return jsonError("Gemini API configuration is missing.", 500, "Set GEMINI_API_KEY in Vercel.");
          }

          const result = streamText({
            model: google("gemini-2.5-flash", { apiKey }),
            system: buildSystemPrompt(parsed.data.appContext),
            messages: await convertToModelMessages(uiMessages),
            temperature: 0.7,
          });

          result.text.then(async (text) => {
            if (!text.trim()) return;
            const { error: saveAssistantError } = await auth.client.from("chat_messages").insert({
              conversation_id: conversation.id,
              user_id: auth.userId,
              role: "assistant",
              content: text,
            });
            if (saveAssistantError) console.error("Saving assistant message failed:", saveAssistantError);
          }).catch((error) => console.error("Saving assistant response failed:", error));

          return result.toUIMessageStreamResponse({
            headers: {
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
            },
          });
        } catch (error) {
          console.error("AI chat POST failed:", error);
          return jsonError(
            "AI request failed.",
            500,
            error instanceof Error ? error.message : String(error),
          );
        }
      },

      DELETE: async ({ request }) => {
        try {
          const auth = await requireUser(request);
          if ("error" in auth) return auth.error;

          const { data: conversation, error: lookupError } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .maybeSingle();

          if (lookupError) return jsonError("Could not access your AI conversation.", 500, lookupError.message);

          if (conversation?.id) {
            const { error } = await auth.client
              .from("chat_messages")
              .delete()
              .eq("conversation_id", conversation.id);

            if (error) return jsonError("Could not clear AI memory.", 500, error.message);
          }

          return new Response(null, { status: 204 });
        } catch (error) {
          return jsonError("Failed to clear AI memory.", 500, error instanceof Error ? error.message : String(error));
        }
      },
    },
  },
});
