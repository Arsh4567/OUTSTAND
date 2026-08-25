export type GoalNodeType = "goal" | "outcome" | "competency" | "task";

export type GoalNodeStatus = "blocked" | "ready" | "in_progress" | "complete";

export type GoalGraphNode = {
  id: string;
  type: GoalNodeType;
  title: string;
  outcome?: string | null;
  status: GoalNodeStatus;
  progress: number;
  dayStart?: number;
  dayEnd?: number;
  impact: number;
  dependencies: string[];
  blockers: string[];
};

export type GoalGraphEdge = {
  from: string;
  to: string;
  relation: "requires" | "supports" | "contains";
};

export type GoalGraph = {
  nodes: GoalGraphNode[];
  edges: GoalGraphEdge[];
  bottleneck?: GoalGraphNode;
};

function normalizeProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function taskStatus(task: any): GoalNodeStatus {
  if (task.progress === "completed") return "complete";
  if (task.progress === "in_progress") return "in_progress";
  return "ready";
}

export function buildGoalGraph(roadmap: any, milestones: any[], tasks: any[]): GoalGraph {
  const nodes: GoalGraphNode[] = [];
  const edges: GoalGraphEdge[] = [];
  const milestoneNodes = new Map<string, GoalGraphNode>();

  const requiredTasks = tasks.filter((task) => task.is_required);
  const totalCompleted = requiredTasks.filter((task) => task.progress === "completed").length;
  const goalProgress = requiredTasks.length ? normalizeProgress((totalCompleted / requiredTasks.length) * 100) : 0;

  nodes.push({
    id: `goal:${roadmap.id}`,
    type: "goal",
    title: String(roadmap.title || roadmap.goal || "Goal"),
    outcome: roadmap.goal || null,
    status: goalProgress >= 100 ? "complete" : goalProgress > 0 ? "in_progress" : "ready",
    progress: goalProgress,
    impact: 100,
    dependencies: [],
    blockers: [],
  });

  for (const milestone of milestones) {
    const milestoneTasks = tasks.filter((task) => task.day_number >= milestone.day_start && task.day_number <= milestone.day_end);
    const required = milestoneTasks.filter((task) => task.is_required);
    const completed = required.filter((task) => task.progress === "completed").length;
    const progress = required.length ? normalizeProgress((completed / required.length) * 100) : 0;
    const node: GoalGraphNode = {
      id: `outcome:${milestone.id}`,
      type: "outcome",
      title: String(milestone.title),
      outcome: milestone.outcome || milestone.description || null,
      status: progress >= 100 ? "complete" : progress > 0 ? "in_progress" : "ready",
      progress,
      dayStart: milestone.day_start,
      dayEnd: milestone.day_end,
      impact: Math.max(1, 100 / Math.max(1, milestones.length)),
      dependencies: [],
      blockers: [],
    };
    milestoneNodes.set(milestone.id, node);
    nodes.push(node);
    edges.push({ from: node.id, to: `goal:${roadmap.id}`, relation: "supports" });

    for (const task of milestoneTasks) {
      const taskNode: GoalGraphNode = {
        id: `task:${task.id}`,
        type: "task",
        title: String(task.title),
        outcome: task.success_criteria || task.instructions || null,
        status: taskStatus(task),
        progress: task.progress === "completed" ? 100 : task.progress === "in_progress" ? 50 : 0,
        dayStart: task.day_number,
        dayEnd: task.day_number,
        impact: task.is_required ? 1 : 0.25,
        dependencies: [],
        blockers: [],
      };
      nodes.push(taskNode);
      edges.push({ from: taskNode.id, to: node.id, relation: "contains" });
    }
  }

  const orderedMilestones = milestones
    .map((milestone) => milestoneNodes.get(milestone.id))
    .filter(Boolean) as GoalGraphNode[];

  for (let index = 1; index < orderedMilestones.length; index += 1) {
    const current = orderedMilestones[index];
    const previous = orderedMilestones[index - 1];
    if (previous.progress < 100) {
      current.dependencies.push(previous.id);
      if (current.progress === 0) current.status = "blocked";
      if (current.progress === 0) current.blockers.push(previous.title);
      edges.push({ from: previous.id, to: current.id, relation: "requires" });
    }
  }

  const bottleneckCandidates = orderedMilestones
    .filter((node) => node.status !== "complete")
    .map((node) => ({
      node,
      score:
        (node.status === "blocked" ? 40 : 0) +
        (100 - node.progress) * 0.5 +
        (node.impact * 0.8) +
        (node.dayEnd && roadmap.duration_days ? Math.max(0, 100 - (node.dayEnd / roadmap.duration_days) * 100) * 0.2 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    nodes,
    edges,
    bottleneck: bottleneckCandidates[0]?.node,
  };
}
