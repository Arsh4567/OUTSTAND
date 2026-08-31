import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !anonKey) return json({ error: "Supabase configuration is missing." }, 503);
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const token = authorization.slice(7).trim();
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Authentication failed." }, 401);

  try {
    const body = await req.json();
    const category = typeof body?.category === "string" ? body.category : "custom";
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};
    const goal = typeof answers.goal === "string" ? answers.goal.trim() : "";
    if (!goal) return json({ needsMoreInfo: true, questions: [{ id: "goal", question: "What result are you aiming for?", type: "multiline", required: true }] });
    const { count, error: countError } = await client.from("roadmaps").select("id", { count: "exact", head: true }).eq("user_id", authData.user.id).in("status", ["active", "paused"]);
    if (countError) throw countError;
    if ((count || 0) >= 4) throw new Error("You can have a maximum of 4 active or paused roadmaps.");
    const durationDays = Math.max(7, Math.min(180, Number(answers.durationDays) || 30));
    const title = (typeof answers.title === "string" && answers.title.trim() ? answers.title.trim() : goal.slice(0, 60)).slice(0, 120);
    const startDate = typeof answers.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.start_date) ? answers.start_date : new Date().toISOString().slice(0, 10);
    const exam = category === "exam_preparation" || category === "academics";
    const subjectText = [answers.subjects, answers.baseline, answers.time].filter(Boolean).map(String).join(" ");
    const subjectHints = subjectText.match(/(math(?:s|ematics)?|science|sst|social science|english|hindi|physics|chemistry|biology|history|geography|civics|economics)/gi) ?? [];
    const subjects = [...new Set(subjectHints.map((s) => s.toLowerCase().replace("mathematics", "math").replace("social science", "sst")))].slice(0, 5);
    const subjectList = subjects.length ? subjects : exam ? ["math", "science", "sst"] : [];
    const milestones = Array.from({ length: durationDays }, (_, index) => {
      const day = index + 1;
      const subject = subjectList[index % Math.max(1, subjectList.length)] || "the goal";
      const actions = exam
        ? [`Study ${subject} for the planned session and make concise recall notes.`, `Practice ${subject}: answer questions without notes, then review and correct mistakes.`]
        : [`Work on the highest-value part of: ${goal.slice(0, 180)}.`, `Review today's result, identify one mistake or gap, and apply one correction.`];
      return { day, title: exam ? `Day ${day}: ${subject.toUpperCase()} study` : `Day ${day}: Execute and review`, outcome: `Make measurable progress toward ${goal.slice(0, 160)}.`, actions };
    });
    const plan = { title, summary: goal, durationDays, difficulty: "adaptive", assumptions: [], milestones, today: milestones[0]?.actions ?? [], metrics: ["tasks completed", "practice accuracy", "mistakes corrected"], adaptationRule: "If a day is missed, carry forward the highest-value unfinished task instead of doubling the workload." };
    const { data: roadmapId, error: rpcError } = await client.rpc("create_canonical_roadmap_from_plan", { p_category: category, p_title: title, p_goal: goal, p_questionnaire: answers, p_generation_metadata: { source: "generate-roadmap-edge-function", category, exam, subjects: subjectList }, p_duration_days: durationDays, p_start_date: startDate, p_plan: plan });
    if (rpcError) throw rpcError;
    if (!roadmapId) throw new Error("Roadmap was generated but no roadmap ID was returned.");
    return json({ roadmapId, created: true, verified: true, plan });
  } catch (error) {
    console.error("[generate-roadmap] failed", error);
    return json({ error: error instanceof Error ? error.message : "Could not generate roadmap." }, 500);
  }
});
