import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createGoogleGenerativeAI } from "https://esm.sh/@ai-sdk/google@2";
import { createGroq } from "https://esm.sh/@ai-sdk/groq@2";
import { convertToModelMessages, stepCountIs, streamText } from "https://esm.sh/ai@5";
import { createProductivityTools } from "../../../api/ai-productivity-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};
const json = (body: unknown, status = 200, extra: HeadersInit = {}) => Response.json(body, { status, headers: { ...corsHeaders, ...extra } });
const env = (...names: string[]) => names.map((name) => Deno.env.get(name)).find((value) => value?.trim());
const today = () => new Date().toISOString().slice(0, 10);

function textFromMessage(message: any) {
  if (Array.isArray(message?.parts)) return message.parts.filter((part: any) => part?.type === "text").map((part: any) => part.text).join("");
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) return message.content.filter((part: any) => part?.type === "text").map((part: any) => part.text).join("");
  return "";
}

function getModel() {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) return { name: "groq", model: createGroq({ apiKey: groqKey })(env("GROQ_MODEL") || "openai/gpt-oss-20b") };
  if (geminiKey) return { name: "gemini", model: createGoogleGenerativeAI({ apiKey: geminiKey })(env("GEMINI_MODEL") || "gemini-2.5-flash-lite") };
  throw new Error("No AI provider is configured on the server.");
}

async function authenticate(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const token = authorization.slice(7).trim();
  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return { error: json({ error: "Supabase AI service is misconfigured.", code: "SUPABASE_CONFIG_MISSING" }, 503) };
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  return { client, userId: data.user.id, token };
}

function buildSystemPrompt(context: unknown) {
  const ctx = context && typeof context === "object" ? context as Record<string, any> : {};
  const name = typeof ctx.name === "string" && ctx.name.trim() ? ctx.name.trim() : "there";
  return `You are OUTSTAND Intelligence, a practical personal productivity agent for ${name}.\n\nCurrent browser context is only a convenience snapshot and may be stale. Supabase-backed tool results are authoritative.\n\nRules:\n- When the user explicitly asks to act, use the appropriate OUTSTAND tool.\n- Never invent ids, current state, or successful writes.\n- Use get_today/get_progress when fresh state is needed.\n- For roadmap customization, use get_today first if current roadmap state is needed, then use change_roadmap.\n- Keep responses concise, decisive, and useful.\n- Never claim a mutation succeeded unless the tool confirmed it.`;
}

async function listRoadmaps(client: any, userId: string) {
  const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(4);
  if (error) throw error;
  return data || [];
}

async function roadmapAction(auth: any, action: string, body: any) {
  const client = auth.client;
  if (action === "list_roadmaps") return { roadmaps: await listRoadmaps(client, auth.userId) };
  if (action === "roadmap_questions") {
    const category = typeof body.category === "string" ? body.category : "skill_learning";
    const presets: Record<string, any[]> = {
      exam_preparation: [
        { id: "goal", question: "What result are you aiming for?", type: "multiline", required: true, placeholder: "Example: 90%+ in my half-yearly exam." },
        { id: "deadline", question: "When is the exam?", type: "text", required: true, placeholder: "Example: 20 September" },
        { id: "baseline", question: "What is your current level?", type: "multiline", required: true },
        { id: "time", question: "How much time can you study on a normal day?", type: "number", required: true },
      ],
      chess: [
        { id: "goal", question: "What chess result are you targeting?", type: "multiline", required: true, placeholder: "Example: reach 1500 rapid." },
        { id: "baseline", question: "What is your current rating and biggest weakness?", type: "multiline", required: true },
        { id: "time", question: "How many minutes can you train per day?", type: "number", required: true },
      ],
      academics: [
        { id: "goal", question: "What academic result do you want?", type: "multiline", required: true },
        { id: "deadline", question: "When is the deadline or exam?", type: "text", required: true },
        { id: "baseline", question: "Where are you starting from?", type: "multiline", required: true },
      ],
    };
    return { questions: presets[category] || [
      { id: "goal", question: "What result are you aiming for?", type: "multiline", required: true, placeholder: "Describe the destination in concrete terms." },
      { id: "deadline", question: "What deadline are you working toward?", type: "text", required: true },
      { id: "baseline", question: "What is your current starting point?", type: "multiline", required: true },
      { id: "time", question: "How much time can you commit most days?", type: "number", required: true },
    ] };
  }
  if (action === "delete_roadmap") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) return { error: "roadmapId is required." };
    const { data: roadmap, error: lookupError } = await client.from("roadmaps").select("id,title").eq("id", roadmapId).eq("user_id", auth.userId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!roadmap) return { error: "Roadmap not found." };
    const { data: deleted, error: deleteError } = await client.rpc("delete_roadmap", { p_roadmap_id: roadmapId });
    if (deleteError) throw deleteError;
    if (deleted !== true) throw new Error("Roadmap deletion could not be completed.");
    return { deleted: true, roadmapId, title: roadmap.title, verified: true };
  }
  if (action === "generate_roadmap") {
    const category = typeof body.category === "string" ? body.category : "skill_learning";
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const goal = typeof answers.goal === "string" ? answers.goal.trim() : "";
    if (!goal) return { needsMoreInfo: true, questions: [{ id: "goal", question: "What result are you aiming for?", type: "multiline", required: true }] };
    const { count, error: countError } = await client.from("roadmaps").select("id", { count: "exact", head: true }).eq("user_id", auth.userId).in("status", ["active", "paused"]);
    if (countError) throw countError;
    if ((count ?? 0) >= 4) return { error: "You can have a maximum of 4 active roadmaps." };
    const durationDays = Math.max(7, Math.min(180, Number(answers.durationDays) || 30));
    const title = typeof answers.title === "string" && answers.title.trim() ? answers.title.trim().slice(0, 60) : goal.slice(0, 60) || "My roadmap";
    const startDate = typeof answers.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.start_date) ? answers.start_date : today();
    const targetDate = typeof answers.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.deadline) ? answers.deadline : null;
    const { data, error } = await client.from("roadmaps").insert({ user_id: auth.userId, title, goal, start_date: startDate, target_date: targetDate, duration_days: durationDays, status: "active", category }).select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").single();
    if (error) throw error;
    return { roadmapId: data.id, roadmap: data, created: true, verified: true };
  }
  throw new Error(`Unsupported roadmap action: ${action}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authenticate(req);
  if ("error" in auth) return auth.error;
  try {
    if (req.method === "GET") {
      try { const provider = getModel(); return json({ ok: true, service: "outstand-ai", status: "ready", provider: provider.name }); }
      catch (error) { return json({ ok: false, service: "outstand-ai", status: "unavailable", error: error instanceof Error ? error.message : "AI unavailable" }, 503); }
    }
    if (req.method === "DELETE") {
      const { error } = await auth.client.from("chat_messages").delete().eq("user_id", auth.userId);
      if (error) return json({ error: "Could not clear AI memory.", code: "MEMORY_CLEAR_FAILED" }, 500);
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (req.method !== "POST") return json({ error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }, 405);
    const body = await req.json().catch(() => null);
    const internalAction = typeof body?.action === "string" ? body.action : (typeof body?.appContext?.internalAction === "string" ? body.appContext.internalAction : null);
    if (internalAction) {
      const actionBody = body && typeof body === "object" ? { ...body, ...(body.actionPayload || {}), ...(body.appContext?.actionPayload || {}) } : {};
      return json(await roadmapAction(auth, internalAction, actionBody));
    }
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "At least one chat message is required.", code: "EMPTY_MESSAGES" }, 400);
    const uiMessages = messages.map((message: any) => ({ id: typeof message?.id === "string" ? message.id : crypto.randomUUID(), role: message?.role === "assistant" ? "assistant" : "user", parts: [{ type: "text", text: textFromMessage(message).trim() }] })).filter((message: any) => message.parts[0].text.length > 0);
    if (!uiMessages.some((message: any) => message.role === "user")) return json({ error: "A user message is required.", code: "NO_USER_MESSAGE" }, 400);
    const provider = getModel();
    const modelMessages = uiMessages.slice(-12);
    const result = streamText({ model: provider.model, system: buildSystemPrompt(body?.appContext), messages: await convertToModelMessages(modelMessages), tools: createProductivityTools(auth.client as any, auth.userId, auth.token), stopWhen: stepCountIs(5), maxOutputTokens: 700, maxRetries: 0, abortSignal: req.signal, onError: (error) => console.error("[outstand-ai] provider error", error) });
    return result.toUIMessageStreamResponse({ originalMessages: modelMessages, headers: { ...corsHeaders, "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" }, onError: (error) => { console.error("[outstand-ai] stream failure", error); const message = error instanceof Error ? error.message : String(error); if (/429|quota|rate[_ -]?limit|resource[_ -]?exhausted/i.test(message)) return "AI provider is temporarily rate-limited. Please retry shortly."; return "AI request failed. Please try again."; } });
  } catch (error) {
    console.error("[outstand-ai] request failed", error);
    const message = error instanceof Error ? error.message : "AI request failed.";
    const isRateLimited = /429|quota|rate[_ -]?limit|resource[_ -]?exhausted/i.test(message);
    return json({ error: isRateLimited ? "AI provider is temporarily rate-limited. Please retry shortly." : message, code: isRateLimited ? "AI_QUOTA_EXCEEDED" : "AI_REQUEST_FAILED" }, isRateLimited ? 429 : 500);
  }
});