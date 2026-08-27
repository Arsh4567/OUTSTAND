export type ExecutionTask = {
  id: string;
  roadmapId: string;
  title: string;
  instructions: string;
  successCriteria: string | null;
  estimatedMinutes: number;
  startTime: string | null;
  endTime: string | null;
  isRequired: boolean;
  status: "pending" | "in_progress" | "completed" | "skipped";
};

export type ExecutionSummary = {
  task: ExecutionTask | null;
  completed: number;
  required: number;
  completionPct: number;
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isTaskCurrent(task: ExecutionTask, now = new Date()) {
  if (!task.startTime || !task.endTime || task.status === "completed" || task.status === "skipped") return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(task.startTime) && current < toMinutes(task.endTime);
}

export function getExecutionSummary(tasks: ExecutionTask[], now = new Date()): ExecutionSummary {
  const required = tasks.filter((task) => task.isRequired);
  const completed = required.filter((task) => task.status === "completed").length;
  const current = tasks.find((task) => isTaskCurrent(task, now));
  const next = tasks.find((task) => task.status !== "completed" && task.status !== "skipped");
  return {
    task: current || next || null,
    completed,
    required: required.length,
    completionPct: required.length ? Math.round((completed / required.length) * 100) : 0,
  };
}
