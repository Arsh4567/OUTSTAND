import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText, type ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const ChatRequestSchema = z.object({
  messages: z.array(z.unknown()).max(100),
  appContext: z.unknown().optional(),
});

const MessagePartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(MessagePartSchema)]),
});

type AppMessage = z.infer<typeof MessageSchema>;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(appContext: unknown): string {
  const ctx = appContext && typeof appContext === "object"
    ? (appContext as Record<string, unknown>)
    : {};

  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completedToday = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const sessions = Array.isArray(ctx.sessions) ? ctx.sessions : [];
  const outstand = Array.isArray(ctx.outstand) ? ctx.outstand : [];
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const dopamineScore = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : 50;
  const name = typeof ctx.name === "string" ? ctx.name : "friend";

  const habitSummary = habits
    .filter((habit): habit is Record<string, unknown> => Boolean(habit) && typeof habit === "object")
    .map((habit) => {
      const id = typeof habit.id === "string" ? habit.id : "";
      const habitName = typeof habit.name === "string" ? habit.name : "Habit";
      return `${habitName} ${completedToday.includes(id) ? "(done today)" : "(not done today)"}`;
    })
    .join(", ");

  return `You are the Outstand AI Assistant, a supportive productivity coach inside the Outstand habit and focus tracking app.

Today is ${new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. The user's display name is ${name}.

Current context:
- Total XP: ${xp}
- Best streak: ${streak} days
- Dopamine score: ${dopamineScore}/100
- Habits: ${habitSummary || "None yet"}
- Completed focus sessions: ${sessions.filter((session) => Boolean(session) && typeof session === "object" && session.completed === true).length}
- Completed Outstand challenges: ${outstand.length}

Rules:
- Encourage, never lecture.
- Keep responses concise and actionable.
- Prefer one clear next step.
- Suggest focus techniques, habit adjustments, or a quick achievable challenge based on context.`.trim();
}

function normalizeMessages(rawMessages: unknown[]): ModelMessage[] {
  return rawMessages
    .map((raw): AppMessage | null => {
      const parsed = MessageSchema.safeParse(raw);
      return parsed.success ? parsed.data : null;
    })
    .filter((message): message is AppMessage => message !== null)
    .map((message) => ({
      role: message.role,
      content: typeof message.content === "string"
        ? message.content
        : message.content.map((part) => ({ type: "text" as const, text: part.text })),
    }));
}

async function getAuthenticatedSupabase(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return { error: jsonError("Unauthorized access. Please log in.", 401) } as const;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { error: jsonError("Server configuration error: Missing Supabase keys.", 500) } as const;
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { error: jsonError("Authentication failed. Session may be expired.", 401) } as const;
  }

  return { client, userId: data.user.id } as const;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => new Response("Outstand AI chat endpoint", { status: 200 }),
      POST: async ({ request }) => {
        try {
          const auth = await getAuthenticatedSupabase(request);
          if ("error" in auth) return auth.error;

          const rawBody = await request.json().catch(() => null);
          const parsedBody = ChatRequestSchema.safeParse(rawBody);
          if (!parsedBody.success) return jsonError("Invalid chat request payload.", 400);

          const messages = normalizeMessages(parsedBody.data.messages);
          if (messages.length === 0) return jsonError("At least one valid message is required.", 400);

          let { data: conversation } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .maybeSingle();

          if (!conversation) {
            const { data: created, error: createError } = await auth.client
              .from("chat_conversations")
              .insert({ user_id: auth.userId })
              .select("id")
              .single();

            if (createError || !created) return jsonError("Failed to initialize conversation.", 500);
            conversation = created;
          }

          const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
          if (latestUserMessage) {
            const content = typeof latestUserMessage.content === "string"
              ? latestUserMessage.content
              : latestUserMessage.content.map((part) => part.text).join("");

            if (content.trim()) {
              await auth.client.from("chat_messages").insert({
                conversation_id: conversation.id,
                user_id: auth.userId,
                role: "user",
                content: content.trim(),
              });
            }
          }

          const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          if (!apiKey) return jsonError("Missing Gemini API key. Add GEMINI_API_KEY to the Vercel environment.", 500);

          const result = streamText({
            model: google("gemini-2.5-flash", { apiKey }),
            system: buildSystemPrompt(parsedBody.data.appContext),
            messages,
            temperature: 0.7,
          });

          return result.toTextStreamResponse({
            headers: { "Cache-Control": "no-cache, no-transform" },
            onFinish: async ({ text }) => {
              if (!text.trim()) return;
              const { error } = await auth.client.from("chat_messages").insert({
                conversation_id: conversation.id,
                user_id: auth.userId,
                role: "assistant",
                content: text,
              });
              if (error) console.error("Failed to save assistant message:", error);
            },
          });
        } catch (error) {
          console.error("Critical Chat API POST Error:", error);
          return jsonError(error instanceof Error ? error.message : "An unexpected server error occurred.", 500);
        }
      },
      DELETE: async ({ request }) => {
        try {
          const auth = await getAuthenticatedSupabase(request);
          if ("error" in auth) return auth.error;

          const { data: conversation } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .maybeSingle();

          if (conversation?.id) {
            const { error } = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id);
            if (error) return jsonError("Failed to clear chat history.", 500);
          }

          return new Response(null, { status: 204 });
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : "Error clearing chat.", 500);
        }
      },
    },
  },
});
