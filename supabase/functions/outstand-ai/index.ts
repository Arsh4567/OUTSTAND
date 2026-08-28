import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return Response.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return Response.json({ error: "Authentication failed." }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    if (body?.action !== "delete_roadmap") return Response.json({ error: "Unsupported action in this function deployment." }, { status: 400, headers: corsHeaders });
    const roadmapId = typeof body?.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) return Response.json({ error: "roadmapId is required." }, { status: 400, headers: corsHeaders });

    const { data: roadmap, error: roadmapError } = await supabase.from("roadmaps").select("id,title,status").eq("id", roadmapId).eq("user_id", user.id).maybeSingle();
    if (roadmapError) throw roadmapError;
    if (!roadmap) return Response.json({ error: "Roadmap not found." }, { status: 404, headers: corsHeaders });

    const { data: deleted, error: deleteError } = await supabase.rpc("delete_roadmap", { p_roadmap_id: roadmapId });
    if (deleteError) throw deleteError;
    if (deleted !== true) throw new Error("Roadmap deletion could not be completed.");
    const { data: verify, error: verifyError } = await supabase.from("roadmaps").select("id").eq("id", roadmapId).eq("user_id", user.id).maybeSingle();
    if (verifyError) throw verifyError;
    if (verify) throw new Error("Roadmap deletion could not be verified.");

    return Response.json({ deleted: true, roadmapId, title: roadmap.title, verified: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Roadmap action failed." }, { status: 500, headers: corsHeaders });
  }
});
