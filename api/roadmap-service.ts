const ACTIVE_STATUSES = ["active", "paused"];
const today = () => new Date().toISOString().slice(0, 10);

export async function getOwnedRoadmap(client: any, userId: string, roadmapId: string) {
  const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Roadmap not found.");
  return data;
}

export async function listOwnedRoadmaps(client: any, userId: string) {
  const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("user_id", userId).in("status", ACTIVE_STATUSES).order("created_at", { ascending: false }).limit(4);
  if (error) throw error;
  return data || [];
}

export async function updateOwnedRoadmap(client: any, userId: string, roadmapId: string, patch: { title?: string; goal?: string }) {
  const current = await getOwnedRoadmap(client, userId, roadmapId);
  const title = typeof patch.title === "string" ? patch.title.trim().slice(0, 120) : current.title;
  const goal = typeof patch.goal === "string" ? patch.goal.trim().slice(0, 2000) : current.goal;
  if (title.length < 2) throw new Error("Roadmap title is too short.");
  if (goal.length < 5) throw new Error("Roadmap goal is too short.");
  const { error } = await client.from("roadmaps").update({ title, goal }).eq("id", roadmapId).eq("user_id", userId);
  if (error) throw error;
  const updated = await getOwnedRoadmap(client, userId, roadmapId);
  return { updated: true, roadmapId, roadmap: updated, verified: true };
}

export async function deleteOwnedRoadmap(client: any, userId: string, roadmapId: string) {
  const roadmap = await getOwnedRoadmap(client, userId, roadmapId);
  const { data: deleted, error } = await client.rpc("delete_roadmap", { p_roadmap_id: roadmapId });
  if (error) throw error;
  if (deleted !== true) throw new Error("Roadmap deletion could not be completed.");
  const { data: remaining, error: verifyError } = await client.from("roadmaps").select("id").eq("id", roadmapId).eq("user_id", userId).maybeSingle();
  if (verifyError) throw verifyError;
  if (remaining) throw new Error("Roadmap deletion could not be verified.");
  return { deleted: true, roadmapId, title: roadmap.title, verified: true };
}

export async function createBasicRoadmap(client: any, userId: string, category: string, answers: Record<string, unknown>) {
  const goal = typeof answers.goal === "string" ? answers.goal.trim() : "";
  if (!goal) return { needsMoreInfo: true, questions: [{ id: "goal", question: "What result are you aiming for?", type: "multiline", required: true }] };
  const { count, error: countError } = await client.from("roadmaps").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", ACTIVE_STATUSES);
  if (countError) throw countError;
  if ((count ?? 0) >= 4) return { error: "You can have a maximum of 4 active roadmaps." };
  const durationDays = Math.max(7, Math.min(180, Number(answers.durationDays) || 30));
  const title = typeof answers.title === "string" && answers.title.trim() ? answers.title.trim().slice(0, 60) : goal.slice(0, 60) || "My roadmap";
  const startDate = typeof answers.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.start_date) ? answers.start_date : today();
  const targetDate = typeof answers.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(answers.deadline) ? answers.deadline : null;
  const { data, error } = await client.from("roadmaps").insert({ user_id: userId, title, goal, start_date: startDate, target_date: targetDate, duration_days: durationDays, status: "active", category }).select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").single();
  if (error) throw error;
  return { roadmapId: data.id, roadmap: data, created: true, verified: true };
}
