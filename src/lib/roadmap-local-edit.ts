import { supabase } from "@/integrations/supabase/client";

export type LocalRoadmapEditResult = { handled: boolean; message?: string };

const clampDays = (value: number) => Math.max(1, Math.min(730, Math.round(value)));
const parseDays = (text: string) => {
  const match = text.match(/\b(?:to|for|in)\s+(\d{1,3})\s*days?\b/i) || text.match(/\b(\d{1,3})\s*days?\b/i);
  return match ? clampDays(Number(match[1])) : null;
};

function addDays(date: string | null | undefined, days: number) {
  const base = date ? new Date(`${date}T00:00:00`) : new Date();
  base.setDate(base.getDate() + days - 1);
  return base.toISOString().slice(0, 10);
}

function parseTime(text: string) {
  const match = text.match(/\b(?:after|from|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

const toMinutes = (value: string | null) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const timeString = (total: number) => {
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};

export async function tryLocalRoadmapEdit(roadmapId: string, request: string): Promise<LocalRoadmapEditResult> {
  const text = request.trim();
  if (!text) return { handled: false };
  if (!roadmapId) throw new Error("A roadmap is required for this edit.");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");

  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .select("id,user_id,title,goal,duration_days,start_date,target_date")
    .eq("id", roadmapId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!roadmap) throw new Error("Roadmap not found or no longer belongs to this account.");

  const rename = text.match(/^(?:rename|change)\s+(?:the\s+)?(?:roadmap\s+)?(?:title|name)\s+(?:to|as)\s+(.+)$/i);
  if (rename?.[1]) {
    const title = rename[1].trim().replace(/[.!?]+$/, "").slice(0, 120);
    if (title.length < 2) return { handled: false };
    const { error: updateError } = await supabase.from("roadmaps").update({ title }).eq("id", roadmapId).eq("user_id", session.user.id);
    if (updateError) throw updateError;
    return { handled: true, message: "Roadmap title updated without using AI." };
  }

  const goal = text.match(/^(?:change|update)\s+(?:the\s+)?goal\s+(?:to|as)\s+(.+)$/i);
  if (goal?.[1]) {
    const nextGoal = goal[1].trim().replace(/[.!?]+$/, "").slice(0, 2000);
    if (nextGoal.length < 5) return { handled: false };
    const { error: updateError } = await supabase.from("roadmaps").update({ goal: nextGoal }).eq("id", roadmapId).eq("user_id", session.user.id);
    if (updateError) throw updateError;
    return { handled: true, message: "Roadmap goal updated without using AI." };
  }

  const duration = parseDays(text);
  if (duration && /\b(?:days?|shorten|extend|length|duration)\b/i.test(text)) {
    const { error: updateError } = await supabase.from("roadmaps").update({ duration_days: duration, target_date: addDays(roadmap.start_date, duration) }).eq("id", roadmapId).eq("user_id", session.user.id);
    if (updateError) throw updateError;
    if (/\b(?:shorten|reduce|make shorter|cut)\b/i.test(text)) {
      const { error: taskError } = await supabase
        .from("roadmap_tasks")
        .update({ is_required: false })
        .eq("roadmap_id", roadmapId)
        .eq("user_id", session.user.id)
        .gt("day_number", duration);
      if (taskError) throw taskError;
    }
    return { handled: true, message: `Roadmap changed to ${duration} days without using AI.` };
  }

  const eveningStart = parseTime(text);
  if (eveningStart && /\b(?:evening|sessions?|study|blocks?|tasks?)\b/i.test(text) && /\b(?:after|from|move|shift)\b/i.test(text)) {
    const { data: tasks, error: taskError } = await supabase
      .from("roadmap_tasks")
      .select("id,start_time,end_time")
      .eq("roadmap_id", roadmapId)
      .eq("user_id", session.user.id)
      .order("day_number")
      .order("task_order");
    if (taskError) throw taskError;

    let cursor = eveningStart;
    for (const task of tasks || []) {
      const start = toMinutes(task.start_time);
      const end = toMinutes(task.end_time);
      if (start === null || end === null || end <= start) continue;
      const durationMinutes = Math.max(10, end - start);
      const { error: updateError } = await supabase
        .from("roadmap_tasks")
        .update({ start_time: timeString(cursor), end_time: timeString(cursor + durationMinutes) })
        .eq("id", task.id)
        .eq("roadmap_id", roadmapId)
        .eq("user_id", session.user.id);
      if (updateError) throw updateError;
      cursor += durationMinutes + 15;
      if (cursor >= 23 * 60 + 30) break;
    }
    return { handled: true, message: `Schedule moved to start after ${timeString(eveningStart)} without using AI.` };
  }

  return { handled: false };
}
