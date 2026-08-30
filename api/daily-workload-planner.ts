export type DailyWorkload = {
  availableMinutes: number;
  bufferMinutes: number;
  plannedMinutes: number;
  utilization: number;
  dayPlans: Array<{ day: number; plannedMinutes: number; taskCount: number }>;
};

type Task = { day?: number; estimatedMinutes?: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function validateDailyWorkload(tasks: Task[], durationDays: number, availableMinutes: number): DailyWorkload {
  const duration = clamp(Math.floor(Number(durationDays) || 0), 7, 180);
  const available = clamp(Math.floor(Number(availableMinutes) || 0), 15, 720);
  const dayTotals = new Map<number, { minutes: number; count: number }>();

  for (const task of tasks) {
    const day = clamp(Math.floor(Number(task?.day) || 1), 1, duration);
    const minutes = clamp(Math.floor(Number(task?.estimatedMinutes) || 0), 5, 240);
    const current = dayTotals.get(day) || { minutes: 0, count: 0 };
    current.minutes += minutes;
    current.count += 1;
    dayTotals.set(day, current);
  }

  const maxPlanned = Math.floor(available * 0.9);
  for (const [day, total] of dayTotals) {
    if (total.minutes > maxPlanned) {
      throw new Error(`Day ${day} plans ${total.minutes} minutes but only ${available} minutes are available. Keep planned work at or below 90% of daily capacity.`);
    }
  }

  const plannedMinutes = [...dayTotals.values()].reduce((sum, day) => sum + day.minutes, 0);
  const bufferMinutes = Math.max(0, available - maxPlanned);
  const dayPlans = Array.from({ length: duration }, (_, index) => {
    const day = index + 1;
    const total = dayTotals.get(day) || { minutes: 0, count: 0 };
    return { day, plannedMinutes: total.minutes, taskCount: total.count };
  });

  return {
    availableMinutes: available,
    bufferMinutes,
    plannedMinutes,
    utilization: available ? plannedMinutes / (available * duration) : 0,
    dayPlans,
  };
}

export function buildDailyWorkloadInstructions(): string {
  return [
    "Plan each day against the user's real available time, not an ideal schedule.",
    "Keep planned work at or below 90% of stated daily capacity so normal interruptions and fatigue have room.",
    "Prefer fewer high-value tasks over many shallow tasks.",
    "Sequence work within a day from prerequisite/retrieval work to focused practice/application and then review or feedback when appropriate.",
    "Do not fill unused time with filler; leave capacity available when the next useful task would exceed the user's limit.",
    "Use estimated minutes for the actual work, not vague calendar duration.",
    "If the target cannot fit within the available time and deadline, flag the feasibility problem rather than hiding it by overpacking days.",
  ].join(" ");
}
