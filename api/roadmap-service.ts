const ACTIVE_STATUSES = ["active", "paused"];
const today = () => new Date().toISOString().slice(0, 10);
const hhmm = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

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

async function ownedTasks(client: any, userId: string, roadmapId: string) {
  const { data, error } = await client.from("roadmap_tasks").select("id,roadmap_id,title,day_number,task_order,start_time,end_time,estimated_minutes,is_required,task_type,instructions,success_criteria").eq("roadmap_id", roadmapId).eq("user_id", userId).order("day_number").order("task_order");
  if (error) throw error;
  return data || [];
}

function parseTimeShift(request: string) {
  const match = request.match(/(?:shift|move|push)\s+(?:all\s+)?(?:tasks?|sessions?)\s+(?:to|by)\s+([+-]?\d{1,2})(?:\s*(?:hours?|hrs?))?/i);
  if (!match) return null;
  const hours = Number(match[1]);
  if (!Number.isFinite(hours) || Math.abs(hours) > 12) throw new Error("Time shifts must be between -12 and +12 hours.");
  return hours * 60;
}

function parseMoveToTime(request: string) {
  const match = request.match(/(?:move|shift)\s+(?:all\s+)?(?:tasks?|sessions?)\s+(?:to|around)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) throw new Error("Invalid target time.");
  return hour * 60 + minute;
}

function parseDayShift(request: string) {
  const match = request.match(/(?:move|shift)\s+(?:all\s+)?(?:tasks?|sessions?)\s+(?:forward|back)\s+(\d+)\s+days?/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return /back/i.test(request) ? -amount : amount;
}

function toMinutes(value: unknown) {
  if (!hhmm(value)) return null;
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export async function smartChangeRoadmap(client: any, userId: string, roadmapId: string, request: string) {
  const roadmap = await getOwnedRoadmap(client, userId, roadmapId);
  const normalized = request.trim();
  if (normalized.length < 5) throw new Error("Describe the change you want to make.");

  const titleMatch = normalized.match(/^(?:rename|name)\s+(?:the\s+)?roadmap\s+(?:to\s+)?["“]?(.+?)["”]?$/i);
  const goalMatch = normalized.match(/^(?:change|update|set)\s+(?:the\s+)?goal\s+(?:to\s+)?["“]?(.+?)["”]?$/i);
  if (titleMatch || goalMatch) return updateOwnedRoadmap(client, userId, roadmapId, titleMatch ? { title: titleMatch[1].trim() } : { goal: goalMatch![1].trim() });

  const tasks = await ownedTasks(client, userId, roadmapId);
  if (!tasks.length) throw new Error("This roadmap has no tasks to reschedule.");
  const timeShift = parseTimeShift(normalized);
  const targetTime = parseMoveToTime(normalized);
  const dayShift = parseDayShift(normalized);
  if (timeShift === null && targetTime === null && dayShift === null) throw new Error("I can currently apply rename/goal changes, move all tasks by hours, move all tasks to a target time, or shift all tasks by days.");

  const updates = tasks.map((task: any) => {
    const patch: Record<string, unknown> = {};
    const start = toMinutes(task.start_time);
    const end = toMinutes(task.end_time);
    if (timeShift !== null && start !== null) patch.start_time = fromMinutes(start + timeShift);
    if (timeShift !== null && end !== null) patch.end_time = fromMinutes(end + timeShift);
    if (targetTime !== null && start !== null) {
      const delta = targetTime - start;
      patch.start_time = fromMinutes(start + delta);
      if (end !== null) patch.end_time = fromMinutes(end + delta);
    }
    if (dayShift !== null) patch.day_number = Math.max(1, Math.min(Number(roadmap.duration_days), Number(task.day_number) + dayShift));
    return { task, patch };
  }).filter((item: any) => Object.keys(item.patch).length > 0);

  if (!updates.length) throw new Error("No scheduled tasks matched that change.");
  for (const { task, patch } of updates) {
    const { error } = await client.from("roadmap_tasks").update(patch).eq("id", task.id).eq("roadmap_id", roadmapId).eq("user_id", userId);
    if (error) throw error;
  }
  const verifiedTasks = await ownedTasks(client, userId, roadmapId);
  const verifiedIds = new Set(verifiedTasks.map((task: any) => task.id));
  if (updates.some(({ task }: any) => !verifiedIds.has(task.id))) throw new Error("Roadmap schedule update could not be verified.");
  return {
    changed: true,
    roadmapId,
    action: timeShift !== null ? "shift_time" : targetTime !== null ? "move_to_time" : "shift_days",
    affectedTasks: updates.length,
    request: normalized,
    verified: true,
  };
}
