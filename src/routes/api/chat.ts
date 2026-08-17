import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { consumeStream, convertToModelMessages, createIdGenerator, streamText, type UIMessage } from "ai";
import { getAIProvider, isRateLimitError, modelFor } from "@/../api/ai-provider";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(40),
  appContext: z.unknown().optional(),
});

const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.object({ type: z.literal("text"), text: z.string() })).optional(),
  content: z.union([z.string(), z.array(z.object({ type: z.literal("text"), text: z.string() }))]).optional(),
});

type AuthSuccess = { client: ReturnType<typeof createClient>; userId: string };
type AuthFailure = { error: Response };
type AuthResult = AuthSuccess | AuthFailure;

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0)?.trim();

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function supabaseConfig() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
  };
}

function textFromMessage(message: z.infer<typeof MessageSchema>) {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) return message.content.map((part) => part.text).join("");
  return (message.parts ?? []).map((part) => part.text).join("");
}

function systemPrompt(appContext: unknown) {
  const ctx = appContext && typeof appContext === "object" ? appContext as Record<string, unknown> : {};
  const name = typeof ctx.name === "string" && ctx.name.trim() ? ctx.name : "friend";
  const xp = typeof ctx.xp === "number" ? ctx.xp : 0;
  const streak = typeof ctx.bestStreak === "number" ? ctx.bestStreak : 0;
  const score = typeof ctx.dopamineScore === "number" ? ctx.dopamineScore : null;
  const habits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const completed = Array.isArray(ctx.completedToday) ? ctx.completedToday : [];
  const sessions = Array.isArray(ctx.sessions) ? ctx.sessions.length : 0;
  const habitSummary = habits.slice(0, 20).map((item: any) => `${typeof item?.name === "string" ? item.name : "Habit"}: ${typeof item?.id === "string" && completed.includes(item.id) ? "done" : "not done"}`).join(", ");
  return `You are OUTSTAND Intelligence, a fast, practical productivity companion.
User: ${name}
XP: ${xp}
Best streak: ${streak}
Dopamine score: ${score === null ? "not available" : `${score}/100`}
Habits today: ${completed.length}/${habits.length}
Focus sessions: ${sessions}
Habits: ${habitSummary || "none"}

Be warm, concise and useful. Match the user's energy. Never invent personal data or claim actions you did not perform. Prefer one clear next action over a giant checklist. Do not diagnose medical or mental-health conditions. Keep internal reasoning private. Plain text and simple bullets are preferred.`;
}

async function authenticate(request: Request): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const token = authorization.slice(7).trim();
  if (!token) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const { url, key } = supabaseConfig();
  if (!url || !key) return { error: json({ error: "Supabase server configuration is missing.", code: "SUPABASE_CONFIG_MISSING" }, 500) };

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || !userId) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  return { client, userId };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => {
        const { url, key } = supabaseConfig();
        const groqConfigured = Boolean(env("GROQ_API_KEY"));
        const geminiConfigured = Boolean(env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"));
        return json({ ok: Boolean(url && key && (groqConfigured || geminiConfigured)), service: "outstand-ai", providers: { groq: groqConfigured, gemini: geminiConfigured } });
      },

      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if ("error" in auth) return auth.error;

        try {
          const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return json({ error: "Invalid AI request payload.", code: "INVALID_PAYLOAD" }, 400);

          const uiMessages: UIMessage[] = parsed.data.messages.flatMap((raw) => {
            const message = MessageSchema.safeParse(raw);
            if (!message.success) return [];
            const text = textFromMessage(message.data).trim();
            if (!text) return [];
            return [{ id: message.data.id ?? crypto.randomUUID(), role: message.data.role, parts: [{ type: "text", text }] } as UIMessage];
          });
          if (!uiMessages.some((message) => message.role === "user")) return json({ error: "At least one user message is required.", code: "NO_USER_MESSAGE" }, 400);

          const primary = await getAIProvider();
          const model = modelFor(primary.name, primary.provider, "chat");
          console.info(`[OUTSTAND AI] provider=${primary.name} model=${primary.name === "groq" ? "openai/gpt-oss-20b" : "gemini-2.5-flash-lite"}`);

          const result = streamText({
            model,
            system: systemPrompt(parsed.data.appContext),
            messages: await convertToModelMessages(uiMessages.slice(-12)),
            maxOutputTokens: 500,
            maxRetries: 0,
            abortSignal: request.signal,
            onError: (error) => {
              if (isRateLimitError(error)) console.warn(`[OUTSTAND AI] ${primary.name} rate limited`);
              else console.error("[OUTSTAND AI] stream error:", error);
            },
          });

          return result.toUIMessageStreamResponse({
            originalMessages: uiMessages,
            generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
            consumeSseStream: consumeStream,
            onFinish: async ({ responseMessage, isAborted }) => {
              if (isAborted) return;
              try {
                let { data: conversation, error: conversationError } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
                if (conversationError) throw conversationError;
                if (!conversation) {
                  const created = await auth.client.from("chat_conversations").insert({ user_id: auth.userId }).select("id").single();
                  if (created.error || !created.data) throw created.error ?? new Error("Conversation creation failed");
                  conversation = created.data;
                }

                const latestUser = [...uiMessages].reverse().find((message) => message.role === "user");
                const latestText = latestUser?.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim() ?? "";
                if (latestText) {
                  const inserted = await auth.client.from("chat_messages").insert({ conversation_id: conversation.id, user_id: auth.userId, role: "user", content: latestText });
                  if (inserted.error) throw inserted.error;
                }

                const assistantText = responseMessage.parts.filter((part) => part.type === "text").map((part) => part.text).join("").trim();
                if (assistantText) {
                  const saved = await auth.client.from("chat_messages").insert({ conversation_id: conversation.id, user_id: auth.userId, role: "assistant", content: assistantText });
                  if (saved.error) throw saved.error;
                }
              } catch (error) {
                console.error("[OUTSTAND AI] persistence failed:", error);
              }
            },
            onError: (error) => isRateLimitError(error) ? "AI is temporarily rate-limited. Please try again shortly." : error instanceof Error ? error.message : "AI request failed.",
            headers: { "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" },
          });

          return result;
        } catch (error) {
          console.error("[OUTSTAND AI] request failed:", error);
          if (isRateLimitError(error)) return json({ error: "AI is temporarily rate-limited. Please try again shortly.", code: "AI_QUOTA_EXCEEDED" }, 429, { "Retry-After": "20" });
          return json({ error: "AI request failed.", code: "AI_REQUEST_FAILED" }, 500);
        }
      },

      DELETE: async ({ request }) => {
        const auth = await authenticate(request);
        if ("error" in auth) return auth.error;
        const { data: conversation, error } = await auth.client.from("chat_conversations").select("id").eq("user_id", auth.userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (error) return json({ error: "Could not access your AI conversation.", code: error.code }, 500);
        if (conversation?.id) {
          const removed = await auth.client.from("chat_messages").delete().eq("conversation_id", conversation.id).eq("user_id", auth.userId);
          if (removed.error) return json({ error: "Could not clear AI memory.", code: removed.error.code }, 500);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
