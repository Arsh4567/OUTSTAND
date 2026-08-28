import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createGoogleGenerativeAI } from "https://esm.sh/@ai-sdk/google@2";
import { createGroq } from "https://esm.sh/@ai-sdk/groq@2";
import { convertToModelMessages, stepCountIs, streamText } from "https://esm.sh/ai@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const env = (...names: string[]) => names.map((name) => Deno.env.get(name)).find((value) => value?.trim());

function getModel() {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) return { name: "groq", model: createGroq({ apiKey: groqKey })(env("GROQ_MODEL") || "openai/gpt-oss-20b") };
  if (geminiKey) return { name: "gemini", model: createGoogleGenerativeAI({ apiKey: geminiKey })(env("GEMINI_MODEL") || "gemini-3.5-flash-lite") };
  throw new Error("No AI provider is configured on the server.");
}

async function authenticate(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { error: json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401) };
  const token = authorization.slice(7).trim();
  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY");
  if (!url || !anonKey) return { error: json({ error: "Supabase AI service is misconfigured.", code: "SUPABASE_CONFIG_MISSING" }, 503) };
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: json({ error: "Authentication failed.", code: "AUTH_INVALID" }, 401) };
  return { client, userId: data.user.id, token };
}

async function roadmapAction(auth: any, action: string, body: any) {
  const { client, userId } = auth;
  if (action === "list_roadmaps") {
    const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,user_id,created_at,updated_at").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return { roadmaps: data || [] };
  }
  if (action === "delete_roadmap") {
    const roadmapId = String(body.roadmapId || "");
    if (!roadmapId) throw new Error("roadmapId is required.");
    const { data, error } = await client.from("roadmaps").delete().eq("id", roadmapId).eq("user_id", userId).select("id").maybeSingle();
    if (error) throw error;
    return { deleted: Boolean(data), roadmapId };
  }
  if (action === "update_roadmap") {
    const roadmapId = String(body.roadmapId || "");
    if (!roadmapId) throw new Error("roadmapId is required.");
    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.goal === "string") patch.goal = body.goal.trim();
    if (!Object.keys(patch).length) throw new Error("No roadmap changes were supplied.");
    const { data, error } = await client.from("roadmaps").update(patch).eq("id", roadmapId).eq("user_id", userId).select("id,title,goal,start_date,target_date,duration_days,status,category,user_id,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Roadmap not found or not owned by this account.");
    return { updated: true, roadmap: data };
  }
  if (action === "smart_change") {
    const roadmapId = String(body.roadmapId || "");
    const request = String(body.request || "").trim();
    if (!roadmapId || !request) throw new Error("roadmapId and request are required.");
    const { data: roadmap, error: roadmapError } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
    if (roadmapError) throw roadmapError;
    if (!roadmap) throw new Error("Roadmap not found or not owned by this account.");
    const lower = request.toLowerCase();
    const titleMatch = request.match(/(?:rename|name)\s+(?:it|roadmap)?\s*(?:to|as)\s+["“]?(.+?)["”]?$/i);
    const goalMatch = request.match(/(?:change|update|set)\s+(?:the\s+)?goal\s+(?:to|as)\s+["“]?(.+?)["”]?$/i);
    if (titleMatch?.[1]) return roadmapAction(auth, "update_roadmap", { roadmapId, title: titleMatch[1].trim() });
    if (goalMatch?.[1]) return roadmapAction(auth, "update_roadmap", { roadmapId, goal: goalMatch[1].trim() });
    if (/\b(rename|name)\b/.test(lower)) throw new Error("I couldn't determine the new roadmap name.");
    throw new Error("This roadmap change needs a specific supported change, such as renaming the roadmap or changing its goal.");
  }
  throw new Error(`Unsupported roadmap action: ${action}`);
}

async function loadAI() {
  const [{ createProductivityTools }] = await Promise.all([import("../../../api/ai-productivity-tools.ts")]);
  return createProductivityTools;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if ("error" in auth) return auth.error;
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
    const uiMessages = messages.map((message: any) => ({ id: typeof message?.id === "string" ? message.id : crypto.randomUUID(), role: message?.role === "assistant" ? "assistant" : "user", parts: [{ type: "text", text: Array.isArray(message?.parts) ? message.parts.filter((part: any) => part?.type === "text").map((part: any) => part.text).join("") : typeof message?.content === "string" ? message.content : "" }] })).filter((message: any) => message.parts[0].text.trim().length > 0);
    if (!uiMessages.some((message: any) => message.role === "user")) return json({ error: "A user message is required.", code: "NO_USER_MESSAGE" }, 400);
    const provider = getModel();
    const createProductivityTools = await loadAI();
    const result = streamText({ model: provider.model, system: "You are OUTSTAND Intelligence. Use tools for explicit actions. Never invent IDs or claim writes succeeded without tool confirmation.", messages: await convertToModelMessages(uiMessages.slice(-12)), tools: createProductivityTools(auth.client as any, auth.userId, auth.token), stopWhen: stepCountIs(5), maxOutputTokens: 700, maxRetries: 0, abortSignal: req.signal });
    return result.toUIMessageStreamResponse({ originalMessages: uiMessages.slice(-12), headers: { ...corsHeaders, "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" }, onError: (error) => { const message = error instanceof Error ? error.message : String(error); return /429|quota|rate[_ -]?limit|resource[_ -]?exhausted/i.test(message) ? "AI provider is temporarily rate-limited. Please retry shortly." : "AI request failed. Please try again."; } });
  } catch (error) {
    console.error("[outstand-ai] request failed", error);
    const message = error instanceof Error ? error.message : "AI request failed.";
    const isRateLimited = /429|quota|rate[_ -]?limit|resource[_ -]?exhausted/i.test(message);
    return json({ error: isRateLimited ? "AI provider is temporarily rate-limited. Please retry shortly." : message, code: isRateLimited ? "AI_QUOTA_EXCEEDED" : "AI_REQUEST_FAILED" }, isRateLimited ? 429 : 500);
  }
});