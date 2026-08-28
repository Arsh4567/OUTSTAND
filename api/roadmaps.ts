import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, "public", any, any>;
const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());

async function auth(req: VercelRequest) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return { error: 401, message: "Authentication required." };
  const token = authorization.slice(7).trim();
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  if (!url || !key || !token) return { error: 401, message: "Authentication is unavailable." };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } }) as Db;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: 401, message: "Authentication failed." };
  return { client, userId: data.user.id };
}

function send(res: VercelResponse, status: number, body: unknown) { res.status(status).setHeader("Cache-Control", "no-store").json(body); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await auth(req);
  if ("error" in session) return send(res, session.error, { error: session.message });
  const { client, userId } = session;

  if (req.method === "GET") {
    const { data, error } = await client.from("roadmaps").select("id,title,goal,category,status,start_date,target_date,duration_days,created_at,updated_at").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(4);
    if (error) return send(res, 500, { error: "Could not load roadmaps.", code: error.code });
    return send(res, 200, { roadmaps: data || [], maxRoadmaps: 4, count: data?.length || 0 });
  }

  if (req.method === "POST") {
    const { count, error: countError } = await client.from("roadmaps").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", ["active", "paused"]);
    if (countError) return send(res, 500, { error: "Could not check roadmap capacity.", code: countError.code });
    if ((count || 0) >= 4) return send(res, 409, { error: "You can have a maximum of 4 active or paused roadmaps.", code: "ROADMAP_LIMIT_REACHED", maxRoadmaps: 4, count });
    const input = req.body && typeof req.body === "object" ? req.body : {};
    if (typeof input.title !== "string" || input.title.trim().length < 2 || typeof input.goal !== "string" || input.goal.trim().length < 5) return send(res, 400, { error: "A roadmap title and goal are required.", code: "INVALID_ROADMAP" });
    const payload = {
      user_id: userId,
      title: input.title.trim().slice(0, 120),
      goal: input.goal.trim().slice(0, 2000),
      category: typeof input.category === "string" ? input.category : "custom",
      questionnaire: input.questionnaire && typeof input.questionnaire === "object" ? input.questionnaire : {},
      generation_metadata: input.generation_metadata && typeof input.generation_metadata === "object" ? input.generation_metadata : {},
      duration_days: Math.max(1, Math.min(730, Number(input.duration_days) || 30)),
      start_date: typeof input.start_date === "string" ? input.start_date : new Date().toISOString().slice(0, 10),
      target_date: typeof input.target_date === "string" ? input.target_date : null,
      status: "active",
    };
    const { data, error } = await client.from("roadmaps").insert(payload).select("id,title,goal,category,status,start_date,target_date,duration_days,created_at,updated_at").single();
    if (error || !data) return send(res, 500, { error: "Roadmap could not be created.", code: error?.code || "ROADMAP_CREATE_FAILED" });
    return send(res, 201, { roadmap: data, maxRoadmaps: 4, count: (count || 0) + 1 });
  }

  if (req.method === "PATCH") {
    const id = typeof req.body?.roadmapId === "string" ? req.body.roadmapId : "";
    const status = typeof req.body?.status === "string" ? req.body.status : "";
    if (!id || !["active", "paused", "archived"].includes(status)) return send(res, 400, { error: "Invalid roadmap update." });
    const { data, error } = await client.from("roadmaps").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).select("id,title,goal,category,status,start_date,target_date,duration_days,created_at,updated_at").single();
    if (error || !data) return send(res, error?.code === "PGRST116" ? 404 : 500, { error: "Roadmap could not be updated.", code: error?.code });
    return send(res, 200, { roadmap: data });
  }

  return send(res, 405, { error: "Method not allowed." });
}
