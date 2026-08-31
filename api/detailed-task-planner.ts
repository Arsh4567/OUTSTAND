export type DetailedTask = {
  title: string;
  objective: string;
  instructions: string;
  estimatedMinutes: number;
  taskType: string;
  methodologyTags: string[];
  resources: string[];
  expectedOutput: string;
  successCriteria: string;
  feedbackCheck: string;
  nextAction: string;
  isRequired: boolean;
};

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export const CLASS_10_MARATHON_RESOURCES = {
  science: "https://www.youtube.com/live/1TPL1Va1HJ4",
  maths: "https://www.youtube.com/live/UosO7XtBd-k",
  socialScience: "https://www.youtube.com/live/cAkAr2bhCoI",
} as const;

export function validateDetailedTask(task: Partial<DetailedTask>): DetailedTask {
  const result: DetailedTask = {
    title: text(task.title, 180),
    objective: text(task.objective, 500),
    instructions: text(task.instructions, 2000),
    estimatedMinutes: Math.max(5, Math.min(240, Math.floor(Number(task.estimatedMinutes) || 0))),
    taskType: text(task.taskType, 40) || "practice",
    methodologyTags: Array.isArray(task.methodologyTags) ? task.methodologyTags.map(v => text(v, 80)).filter(Boolean).slice(0, 6) : [],
    resources: Array.isArray(task.resources) ? task.resources.map(v => text(v, 300)).filter(Boolean).slice(0, 5) : [],
    expectedOutput: text(task.expectedOutput, 500),
    successCriteria: text(task.successCriteria, 500),
    feedbackCheck: text(task.feedbackCheck, 500),
    nextAction: text(task.nextAction, 500),
    isRequired: task.isRequired !== false,
  };

  if (result.title.length < 5 || result.objective.length < 10 || result.instructions.length < 20) throw new Error("Detailed tasks need a clear title, objective, and actionable instructions.");
  if (result.successCriteria.length < 10 || result.expectedOutput.length < 5) throw new Error("Detailed tasks need a measurable success criterion and expected output.");
  return result;
}

export function buildDetailedTaskInstructions(): string {
  return [
    "Every task must be an executable unit that directly advances its milestone and final outcome.",
    "State what the user is trying to accomplish, why it matters now, and exactly what to do in order.",
    "Use the estimated time for actual focused work and keep it within the daily workload budget.",
    "Specify an observable output and a clear success criterion so completion is testable rather than subjective.",
    "Include a feedback or self-check step when the domain benefits from verification, and define the next action when useful.",
    "Use evidence-informed methodology only when appropriate to the domain; never apply learning techniques mechanically.",
    "Avoid vague verbs such as learn, study, improve, or practice unless followed by a concrete observable action and result.",
    "Do not invent resources, citations, scientific claims, or prerequisites that are not justified by the goal context.",
    "For Class 10 exam-preparation roadmaps, external marathon/video resources must be real published URLs from official educator channels; never fabricate, guess, or use placeholder URLs.",
    "For Class 10 exam-preparation roadmaps, use these verified marathon resources when the task subject matches: Science: https://www.youtube.com/live/1TPL1Va1HJ4 ; Maths: https://www.youtube.com/live/UosO7XtBd-k ; Social Science (SST): https://www.youtube.com/live/cAkAr2bhCoI.",
    "When a Class 10 marathon resource is relevant, attach the matching URL to the task resources, make the task a focused viewing block, and require a short active-recall output or exam-question check after viewing.",
  ].join(" ");
}
