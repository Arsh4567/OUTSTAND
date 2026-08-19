import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const ChatRequestSchema = z.object({
  messages: z.array(z.any()),
  appContext: z.any().optional(),
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
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized access. Please log in." }), { 
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: "Server configuration error: Missing Supabase keys." }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: authHeader } },
          });

          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            return new Response(JSON.stringify({ error: "Authentication failed. Session may be expired." }), { 
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          const userId = userData.user.id;

          let body: z.infer<typeof ChatRequestSchema>;
          try {
            const rawBody = await request.json();
            body = ChatRequestSchema.parse(rawBody);
          } catch (zodError: any) {
            return new Response(JSON.stringify({ error: `Invalid request data: ${zodError?.message || "Check format"}` }), { 
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          const { messages, appContext } = body;

          // Load or create conversation safely
          let { data: existingConversation } = await supabase
            .from("chat_conversations")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          let conversationId = existingConversation?.id;
          if (!conversationId) {
            const { data: newConversation, error: createError } = await supabase
              .from("chat_conversations")
              .insert({ user_id: userId })
              .select("id")
              .single();

            if (createError || !newConversation) {
              return new Response(JSON.stringify({ error: "Failed to initialize conversation." }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
              });
            }
            conversationId = newConversation.id;
          }

          // Persist user message safely with fallback for text/parts formatting
          const userMessage = messages[messages.length - 1];
          if (userMessage?.role === "user") {
            let text = "";
            if (Array.isArray(userMessage.parts)) {
              text = userMessage.parts
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("");
            } else if (typeof userMessage.content === "string") {
              text = userMessage.content;
            }

            if (text) {
              await supabase.from("chat_messages").insert({
                conversation_id: conversationId,
                user_id: userId,
                role: "user",
                content: text,
              });
            }
          }

          // Setup Gemini API Key explicitly for Google AI Provider
          const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "Missing Gemini API Key in Vercel settings." }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;

          const result = streamText({
            model: google("gemini-2.5-flash"), // Updated to current stable flash tier
            system: buildSystemPrompt(appContext),
            messages: await convertToModelMessages(messages as UIMessage[]),
            onFinish: async ({ text }: { text: string }) => {
              if (text) {
                try {
                  await supabase.from("chat_messages").insert({
                    conversation_id: conversationId,
                    user_id: userId,
                    role: "assistant",
                    content: text,
                  });
                } catch (dbError) {
                  console.error("Failed to save assistant message:", dbError);
                }
              }
            },
          });

          return result.toUIMessageStreamResponse();
        } catch (error: any) {
          console.error("Critical Chat API POST Error:", error);
          return new Response(JSON.stringify({ error: error?.message || "An unexpected server error occurred." }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      },

      DELETE: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized access." }), { status: 401 });
          }

          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

          const supabase = createClient(supabaseUrl!, supabaseKey!, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: authHeader } },
          });

          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            return new Response(JSON.stringify({ error: "Authentication failed." }), { status: 401 });
          }

          const { data: conversation } = await supabase
            .from("chat_conversations")
            .select("id")
            .eq("user_id", userData.user.id)
            .maybeSingle();

          if (conversation?.id) {
            await supabase.from("chat_messages").delete().eq("conversation_id", conversation.id);
          }

          return new Response(null, { status: 204 });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error?.message || "Error clearing chat." }), { status: 500 });
        }
      },
    },
  },
});
