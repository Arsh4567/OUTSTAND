import { z } from "zod";

export const aiIntentSchema = z.object({
  intent: z.enum(["chat", "read_today", "read_progress", "create_roadmap", "change_roadmap", "complete_task", "update_task", "complete_habit", "undo_habit", "set_reminder"]),
  confidence: z.number().min(0).max(1),
  needsFreshState: z.boolean(),
  requiresConfirmation: z.boolean(),
  target: z.string().optional(),
  rationale: z.string().max(240).optional(),
});

export type AIIntent = z.infer<typeof aiIntentSchema>;

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export function classifyIntent(text: string): AIIntent {
  const value = normalize(text);
  const has = (...terms: string[]) => terms.some((term) => value.includes(term));
  const mentionsRoadmap = has("roadmap", "plan for", "30 day plan", "30-day plan", "study plan");
  const mentionsHabit = has("habit", "habits", "routine");
  const mentionsTask = has("task", "today's", "today", "next", "schedule");
  const undo = has("undo", "uncomplete", "not done", "mark as pending", "reopen");
  const complete = has("done", "complete", "completed", "finished", "finish", "tick", "mark");
  const change = has("change", "edit", "adjust", "move", "reschedule", "simplify", "shift", "rename", "customize", "customise");
  const progress = has("progress", "how am i doing", "performance", "streak", "setback", "behind");
  const reminder = has("remind me", "reminder", "reminders");
  const create = has("create", "make", "build", "generate", "start") && mentionsRoadmap;

  if (reminder) return { intent: "set_reminder", confidence: 0.96, needsFreshState: false, requiresConfirmation: false, target: "reminder" };
  if (create) return { intent: "create_roadmap", confidence: 0.97, needsFreshState: false, requiresConfirmation: false, target: "roadmap" };
  if (mentionsRoadmap && change) return { intent: "change_roadmap", confidence: 0.95, needsFreshState: true, requiresConfirmation: false, target: "roadmap" };
  if (mentionsHabit && undo) return { intent: "undo_habit", confidence: 0.98, needsFreshState: true, requiresConfirmation: false, target: "habit" };
  if (mentionsHabit && complete) return { intent: "complete_habit", confidence: 0.98, needsFreshState: true, requiresConfirmation: false, target: "habit" };
  if (mentionsTask && undo) return { intent: "update_task", confidence: 0.9, needsFreshState: true, requiresConfirmation: true, target: "task" };
  if (mentionsTask && complete) return { intent: "complete_task", confidence: 0.96, needsFreshState: true, requiresConfirmation: false, target: "task" };
  if (progress) return { intent: "read_progress", confidence: 0.94, needsFreshState: true, requiresConfirmation: false };
  if (mentionsTask || has("what should i do", "what do i do now", "what's next")) return { intent: "read_today", confidence: 0.9, needsFreshState: true, requiresConfirmation: false };
  return { intent: "chat", confidence: 0.65, needsFreshState: false, requiresConfirmation: false };
}

export function intentGuidance(intent: AIIntent) {
  switch (intent.intent) {
    case "create_roadmap": return "Create only when both category and goal are known. If either is missing, ask a concise follow-up or use the structured roadmap intake; never call create_roadmap with missing required arguments.";
    case "change_roadmap": return "Read the current roadmap first, then use change_roadmap. Preserve completed work and do not claim a change before the tool succeeds.";
    case "complete_task": return "Read current tasks if needed, identify the exact existing task, then call set_task_progress with completed.";
    case "update_task": return "Treat reopening as consequential: only do it when the user clearly requested undoing completion.";
    case "complete_habit": return "Read current habits when needed, identify the existing habit, then mark it complete.";
    case "undo_habit": return "Read current habits when needed, identify the existing habit, then remove today's completion.";
    case "read_progress": return "Call get_progress instead of relying on stale browser context.";
    case "read_today": return "Call get_today instead of guessing from conversation memory.";
    case "set_reminder": return "Create the reminder only when the requested timing is sufficient and explicit.";
    default: return "Answer directly unless a tool becomes necessary.";
  }
}
