import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  getLovableAiGatewayResponseHeaders,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const ChatRequestSchema = z.object({
  messages: z.array(z.any()),
  appContext: z.any(),
});

function buildSystemPrompt(appContext: unknown): string {
  const ctx = appContext as Record<string, unknown> | undefined;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const habits = Array.isArray(ctx?.habits) ? ctx.habits : [];
  const completedToday = Array.isArray(ctx?.completedToday) ? ctx.completedToday : [];
  const sessions = Array.isArray(ctx?.sessions) ? ctx.sessions : [];
  const outstand = Array.isArray(ctx?.outstand) ? ctx.outstand : [];
  const xp = typeof ctx?.xp === "number" ? ctx.xp : 0;
  const bestStreak = typeof ctx?.bestStreak === "number" ? ctx.bestStreak : 0;
  const dopamineScore = typeof ctx?.dopamineScore === "number" ? ctx.dopamineScore : 50;
  const name = typeof ctx?.name === "string" ? ctx.name : "friend";

  return `You are the Outstand AI Assistant, a supportive productivity coach inside the Outstand habit and focus tracking app.

Today is ${today}. The user's display name is ${name}.

Here is the user's current Outstand context:
- Total XP: ${xp}
- Best active streak: ${bestStreak} days
- Dopamine score today: ${dopamineScore}/100
- Habits (${habits.length} total): ${habits.map((h: any) => `${h.name} ${completedToday.includes(h.id) ? "(done today)" : "(not done today)"}`).join(", ") || "None yet"}
- Completed focus sessions: ${sessions.filter((s: any) => s.completed).length}
- Completed Outstand challenges: ${outstand.length}

Your role:
- Encourage, never lecture. Keep responses concise and actionable.
- Suggest the next habit to complete, a focus technique, or a quick challenge based on the context.
- If the dopamine score is low, gently suggest a reset or a small win.
- Use markdown for lists, bold text, and short paragraphs.
- Do not mention the raw context numbers unless helpful.`.trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response("Unauthorized", { status: 401 });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: authHeader } },
          },
        );

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        let body: z.infer<typeof ChatRequestSchema>;
        try {
          body = ChatRequestSchema.parse(await request.json());
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const { messages, appContext } = body;

        // Load or create the user's single conversation.
        const { data: existingConversation, error: conversationError } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (conversationError) {
          console.error("Failed to load conversation:", conversationError);
          return new Response("Failed to load conversation", { status: 500 });
        }

        let conversationId = existingConversation?.id;
        if (!conversationId) {
          const { data: newConversation, error: createError } = await supabase
            .from("chat_conversations")
            .insert({ user_id: userId })
            .select("id")
            .single();

          if (createError || !newConversation) {
            console.error("Failed to create conversation:", createError);
            return new Response("Failed to create conversation", { status: 500 });
          }
          conversationId = newConversation.id;
        }

        // Persist the latest user message.
        const userMessage = messages[messages.length - 1];
        if (userMessage?.role === "user") {
          const text = userMessage.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("");

          const { error: insertError } = await supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            user_id: userId,
            role: "user",
            content: text || "",
          });

          if (insertError) {
            console.error("Failed to persist user message:", insertError);
          }
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing AI configuration", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);
        const model = gateway("openai/gpt-5.5");
        const modelMessages = await convertToModelMessages(messages as UIMessage[]);

        const result = streamText({
          model,
          messages: [{ role: "system", content: buildSystemPrompt(appContext) }, ...modelMessages],
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
          onFinish: async ({ responseMessage }) => {
            const text = responseMessage.parts
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("");

            const { error: assistantInsertError } = await supabase.from("chat_messages").insert({
              conversation_id: conversationId,
              user_id: userId,
              role: "assistant",
              content: text,
            });

            if (assistantInsertError) {
              console.error("Failed to persist assistant message:", assistantInsertError);
            }
          },
        });
      },

      DELETE: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response("Unauthorized", { status: 401 });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: authHeader } },
          },
        );

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { data: conversation } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (conversation?.id) {
          const { error } = await supabase.from("chat_messages").delete().eq("conversation_id", conversation.id);
          if (error) {
            console.error("Failed to clear chat messages:", error);
            return new Response("Failed to clear chat", { status: 500 });
          }
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
