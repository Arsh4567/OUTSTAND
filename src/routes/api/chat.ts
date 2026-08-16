import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(60),
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
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function env(...names: string[]) {
  return names.map((name) => process.env[name]).find(Boolean);
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
    .slice(0, 30)
    .map((item) => `${typeof item.name === "string" ? item.name : "Habit"} ${typeof item.id === "string" && completed.includes(item.id) ? "(done today)" : "(not done today)"}`)
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
- Never claim you performed an action unless the app actually exposes that tool/action.
- Do not invent personal data.
- Prefer practical, specific guidance over generic motivation.
- Keep a calm premium tone.`;
}

function supabaseConfig() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
  };
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) } as const;

  const { url, key } = supabaseConfig();
  if (!url || !key) return { error: json({ error: "Supabase server configuration is missing.", code: "SUPABASE_CONFIG_MISSING" }, 500) } as const;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID", details: error?.message ?? "No authenticated user returned by Supabase." }, 401) } as const;
  return { client, userId: data.user.id } as const;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => {
        const { url, key } = supabaseConfig();
        const gemini = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
        return json({ ok: Boolean(url && key && gemini), service: "outstand-ai", supabaseConfigured: Boolean(url && key), geminiConfigured: Boolean(gemini) });
      },

      POST: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if ("error" in auth) return auth.error;

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
          if (!uiMessages.some((message) => message.role === "user")) return json({ error: "At least one user message is required.", code: "NO_USER_MESSAGE" }, 400);

          let { data: conversation, error: lookupError } = await auth.client
            .from("chat_conversations")
            .select("id")
            .eq("user_id", auth.userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lookupError) return json({ error: "Could not access your AI conversation.", code: lookupError.code, details: lookupError.message }, 500);

          if (!conversation) {
            const created = await auth.client.from("chat_conversations").insert({ user_id: auth.userId }).select("id").single();
            if (created.error || !created.data) return json({ error: "Could not create your AI conversation.", code: created.error?.code ?? "CONVERSATION_CREATE_FAILED", details: created.error?.message }, 500);
            conversation = created.data;
          }

          const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
          const latestText = latestUser?.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim() ?? "";
          if (latestText) {
            const existing = await auth.client.from("chat_messages").select("id").eq("conversation_id", conversation.id).eq("user_id", auth.userId).eq("role", "user").eq("content", latestText).order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (existing.error) return json({ error: "Could not validate your message history.", code: existing.error.code, details: existing.error.message }, 500);
            if (!existing.data) {
              const inserted = await auth.client.from("chat_messages").insert({ conversation_id: conversation.id, user_id: auth.userId, role: "user", content: latestText });
              if (inserted.error) return json({ error: "Could not save your message.", code: inserted.error.code, details: inserted.error.message }, 500);
            }
          }

          const apiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
          if (!apiKey) return json({ error: "Gemini API configuration is missing.", code: "GEMINI_CONFIG_MISSING" }, 500);

          const result = streamText({
            model: google("gemini-2.5-flash", { apiKey }),
            system: systemPrompt(parsed.data.appContext),
            messages: await convertToModelMessages(uiMessages),
            temperature: 0.6,
          });

          void result.text.then(async (text) => {
            if (!text.trim()) return;
            const { error } = await auth.client.from("chat_messages").insert({ conversation_id: conversation.id, user_id: auth.userId, role: "assistant", content: text });
            if (error) console.error("AI assistant persistence failed:", error.message);
          });

          return result.toUIMessageStreamResponse({ headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
        } catch (error) {
          console.error("Outstand AI request failed", error);
          return json({ error: "AI request failed.", code: "AI_REQUEST_FAILED", details: error instanceof Error ? error.message : String(error) }, 500);
        }
      },

      DELETE: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if ("error" in auth) return auth.error;
          const { data: conversation, error } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
          if (error) return json({ error: "Could not access your AI conversation.", code: error.code, details: error.message }, 500);
          if (conversation?.id) {
            const removed = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id).eq("user_id", auth.userId);
            if (removed.error) return json({ error: "Could not clear AI memory.", code: removed.error.code, details: removed.error.message }, 500);
          }
          return new Response(null, { status: 204 });
        } catch (error) {
          return json({ error: "Failed to clear AI memory.", code: "MEMORY_CLEAR_FAILED", details: error instanceof Error ? error.message : String(error) }, 500);
        }
      },
    },
  },
});
