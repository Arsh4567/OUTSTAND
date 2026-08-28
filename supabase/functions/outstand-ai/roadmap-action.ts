import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const today = () => new Date().toISOString().slice(0, 10);

export async function handleRoadmapAction(client: SupabaseClient, userId: string, action: string, body: any) {
  if (action === "list_roadmaps") {
    const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(4);
    if (error) throw error;
    return { roadmaps: data || [] };
  }
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
    const { data: roadmap, error: lookupError } = await client.from("roadmaps").select("id,title").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
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
    const { count, error: countError } = await client.from("roadmaps").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", ["active", "paused"]);
    if (countError) throw countError;
    if ((count ?? 0) >= 4) return { error: "You can have a maximum of 4 active roadmaps." };
    const durationDays = Number(answers.durationDays) || 30;
    const title = typeof answers.title === "string" && answers.title.trim() ? answers.title.trim().slice(0, 60) : goal.slice(0, 60) || "My roadmap";
    const startDate = typeof answers.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.start_date) ? answers.start_date : today();
    const targetDate = typeof answers.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.deadline) ? answers.deadline : null;
    const { data, error } = await client.from("roadmaps").insert({ user_id: userId, title, goal, start_date: startDate, target_date: targetDate, duration_days: durationDays, status: "active", category }).select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").single();
    if (error) throw error;
    return { roadmapId: data.id, roadmap: data, created: true, verified: true };
  }
  throw new Error(`Unsupported roadmap action: ${action}`);
}
