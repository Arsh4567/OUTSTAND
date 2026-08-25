import type { RoadmapTask, RoadmapMilestone } from "@/hooks/use-roadmap";

export type RoadmapExecutionSnapshot = {
  completionRate: number;
  requiredCompletionRate: number;
  activeDays: number;
  avgCompletedMinutes: number;
  avgEstimatedMinutes: number;
  estimationRatio: number;
  overdueTaskCount: number;
  skippedTaskCount: number;
  currentDay: number;
  daysRemaining: number;
};

export type RoadmapHealth = {
  score: number;
  trajectory: "on_track" | "watch" | "at_risk";
  workload: "light" | "balanced" | "heavy";
  reasons: string[];
};

export type RoadmapRecommendation = {
  type: "protect_milestone" | "reduce_load" | "recover" | "continue";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function buildExecutionSnapshot(
  tasks: RoadmapTask[],
  startDate: string,
  targetDate: string,
): RoadmapExecutionSnapshot {
  const now = new Date();
  const start = new Date(startDate);
  const target = new Date(targetDate);
  const currentDay = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1);
  const daysRemaining = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
  const required = tasks.filter((task) => task.is_required);
  const completed = required.filter((task) => task.progress === "completed");
  const skipped = tasks.filter((task) => task.progress === "skipped");
  const overdue = tasks.filter((task) => task.day_number < currentDay && task.progress !== "completed" && task.progress !== "skipped");
  const completedMinutes = completed.reduce((sum, task) => sum + (task.estimated_minutes ?? 0), 0);
  const estimatedMinutes = required.reduce((sum, task) => sum + (task.estimated_minutes ?? 0), 0);
  const avgCompletedMinutes = completed.length ? completedMinutes / completed.length : 0;
  const avgEstimatedMinutes = completed.length ? completed.reduce((sum, task) => sum + (task.estimated_minutes ?? 0), 0) / completed.length : 0;

  return {
    completionRate: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    requiredCompletionRate: required.length ? Math.round((completed.length / required.length) * 100) : 0,
    activeDays: new Set(completed.map((task) => task.day_number)).size,
    avgCompletedMinutes,
    avgEstimatedMinutes,
    estimationRatio: avgEstimatedMinutes ? avgCompletedMinutes / avgEstimatedMinutes : 1,
    overdueTaskCount: overdue.length,
    skippedTaskCount: skipped.length,
    currentDay,
    daysRemaining,
  };
}

export function calculateRoadmapHealth(snapshot: RoadmapExecutionSnapshot, milestoneCount: number): RoadmapHealth {
  let score = 100;
  const reasons: string[] = [];

  if (snapshot.requiredCompletionRate < 40) {
    score -= 25;
    reasons.push("Required work is accumulating faster than it is being completed.");
  } else if (snapshot.requiredCompletionRate < 70) {
    score -= 10;
    reasons.push("Execution is below the pace needed for a comfortable finish.");
  }

  if (snapshot.overdueTaskCount > 0) {
    score -= clamp(snapshot.overdueTaskCount * 4, 4, 20);
    reasons.push(`${snapshot.overdueTaskCount} task${snapshot.overdueTaskCount === 1 ? " is" : "s are"} behind schedule.`);
  }

  if (snapshot.estimationRatio > 1.25) {
    score -= 12;
    reasons.push("Recent work is taking longer than estimated.");
  } else if (snapshot.estimationRatio > 1.1) {
    score -= 5;
  }

  if (snapshot.skippedTaskCount > Math.max(2, milestoneCount)) {
    score -= 8;
    reasons.push("Skipped work is becoming a recurring pattern.");
  }

  if (!reasons.length) reasons.push("Your current execution pattern is supporting the roadmap well.");

  const normalized = clamp(Math.round(score), 0, 100);
  const trajectory = normalized >= 80 ? "on_track" : normalized >= 60 ? "watch" : "at_risk";
  const workload = snapshot.estimationRatio > 1.2 || snapshot.overdueTaskCount >= 4 ? "heavy" : snapshot.requiredCompletionRate >= 75 ? "balanced" : "light";

  return { score: normalized, trajectory, workload, reasons };
}

export function recommendNextAction(
  snapshot: RoadmapExecutionSnapshot,
  health: RoadmapHealth,
  tasks: RoadmapTask[],
  milestones: RoadmapMilestone[],
): RoadmapRecommendation {
  const currentTasks = tasks
    .filter((task) => task.day_number === snapshot.currentDay && task.is_required && task.progress !== "completed" && task.progress !== "skipped")
    .sort((a, b) => a.task_order - b.task_order);

  if (health.trajectory === "at_risk" && snapshot.overdueTaskCount > 0) {
    return {
      type: "recover",
      title: "Stabilize the roadmap",
      description: "Protect the highest-impact unfinished work and avoid trying to catch up everything at once.",
      priority: "high",
    };
  }

  const nextTask = currentTasks[0];
  if (nextTask) {
    return {
      type: "protect_milestone",
      title: nextTask.title,
      description: nextTask.success_criteria || "Complete this task before moving to lower-priority work.",
      priority: "high",
    };
  }

  const nextMilestone = milestones.find((milestone) => milestone.day_end >= snapshot.currentDay);
  if (nextMilestone) {
    return {
      type: "continue",
      title: nextMilestone.title,
      description: nextMilestone.outcome || nextMilestone.description || "Keep progressing toward this milestone.",
      priority: "medium",
    };
  }

  return {
    type: "continue",
    title: "Keep the momentum",
    description: "No intervention is required right now. Continue with your current plan.",
    priority: "low",
  };
}
