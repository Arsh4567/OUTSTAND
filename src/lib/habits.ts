export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  history: string[];
  notificationTime?: string | null;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  durationMin: number;
  completed: boolean;
};

export type OutstandCompletion = {
  id: string;
  title: string;
  xp: number;
  completedAt: string;
};

export type HabitCatalogItem = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
};

export const HABIT_COLORS = ["ink", "slate", "stone", "blue", "emerald", "amber", "violet", "rose"] as const;

export const HABIT_ICON_SET = [
  "📚", "🧠", "🏃", "🧘", "📵", "⚡", "💧", "🥗", "🍎", "🥛", "😴", "🌅", "🌙", "☀️", "🧹",
  "🛏️", "🪥", "🧴", "🚿", "🧼", "📝", "✍️", "🎯", "⏱️", "💻", "📱", "🎨", "🎵", "🎸", "📷",
  "♟️", "🏀", "⚽", "🏐", "🚴", "🏊", "🧗", "🧩", "🎮", "🗣️", "👥", "❤️", "🌳", "🌿", "🧘‍♂️",
  "🙏", "🧘‍♀️", "💪", "🔥", "✨", "⭐", "🚶", "🧘🏻", "☕", "🍵", "🥦", "🍳", "🥜", "🧃", "🫁",
  "🧹", "🗂️", "📅", "💰", "🏦", "🛒", "🧑‍🍳", "🍳", "✈️", "🌍", "🗺️", "📖", "🔬", "🧪", "💡",
  "🎓", "🧑‍💻", "📈", "🛠️", "🪴", "🐕", "🐈", "🧺", "🧽", "🧯", "🔕", "🔔", "🛡️", "🌤️",
] as const;

const rawHabitCatalog: Array<[string, string, string, string]> = [
  ["Read 20 pages", "📚", "Mind", "blue"], ["Read for 10 minutes", "📖", "Mind", "blue"], ["Deep work", "🧠", "Work", "violet"], ["Study a topic", "🎓", "Learning", "violet"],
  ["Journal", "📝", "Mind", "slate"], ["Write 100 words", "✍️", "Mind", "slate"], ["Plan tomorrow", "📅", "Mind", "ink"], ["Review goals", "🎯", "Mind", "ink"],
  ["Meditate", "🧘", "Mind", "violet"], ["Breathing practice", "🫁", "Mind", "violet"], ["Gratitude", "🙏", "Mind", "amber"], ["Digital detox", "📵", "Digital", "stone"],
  ["No phone first hour", "📱", "Digital", "stone"], ["No phone before bed", "🔕", "Digital", "stone"], ["Limit social media", "📵", "Digital", "stone"], ["Clean inbox", "📬", "Digital", "slate"],
  ["Exercise", "🏃", "Fitness", "emerald"], ["Walk 20 minutes", "🚶", "Fitness", "emerald"], ["Stretch", "🤸", "Fitness", "emerald"], ["Strength workout", "💪", "Fitness", "emerald"],
  ["Play basketball", "🏀", "Fitness", "emerald"], ["Play football", "⚽", "Fitness", "emerald"], ["Play volleyball", "🏐", "Fitness", "emerald"], ["Cycle", "🚴", "Fitness", "emerald"],
  ["Swim", "🏊", "Fitness", "blue"], ["Dance", "💃", "Fitness", "violet"], ["Outdoor time", "🌳", "Fitness", "emerald"], ["Cold shower", "⚡", "Fitness", "blue"],
  ["Drink 2L water", "💧", "Health", "blue"], ["Eat fruit", "🍎", "Health", "rose"], ["Eat vegetables", "🥦", "Health", "emerald"], ["Protein-rich meal", "🍳", "Health", "amber"],
  ["Healthy breakfast", "🥗", "Health", "emerald"], ["No sugary drinks", "🧃", "Health", "stone"], ["No junk food", "🍟", "Health", "stone"], ["Take vitamins", "💊", "Health", "violet"],
  ["Sleep 8 hours", "😴", "Health", "blue"], ["Sleep on time", "🌙", "Health", "blue"], ["Wake up on time", "🌅", "Health", "amber"], ["Morning sunlight", "☀️", "Health", "amber"],
  ["Brush teeth", "🪥", "Health", "blue"], ["Skincare", "🧴", "Health", "rose"], ["Make your bed", "🛏️", "Home", "slate"], ["Clean room", "🧹", "Home", "slate"],
  ["Do laundry", "🧺", "Home", "slate"], ["Wash dishes", "🧽", "Home", "slate"], ["Organize desk", "🗂️", "Home", "stone"], ["Water plants", "🪴", "Home", "emerald"],
  ["Practice coding", "💻", "Learning", "violet"], ["Learn Python", "🐍", "Learning", "violet"], ["Practice maths", "🔢", "Learning", "blue"], ["Practice English", "🗣️", "Learning", "blue"],
  ["Learn a language", "🌍", "Learning", "blue"], ["Practice chess", "♟️", "Learning", "slate"], ["Learn an instrument", "🎸", "Creative", "violet"], ["Draw", "🎨", "Creative", "rose"],
  ["Make something", "🛠️", "Creative", "amber"], ["Photography", "📷", "Creative", "violet"], ["Listen to music", "🎵", "Creative", "violet"], ["Create content", "✨", "Creative", "amber"],
  ["Work on a project", "🧑‍💻", "Work", "violet"], ["Clear top priority", "🎯", "Work", "ink"], ["Plan the day", "📅", "Work", "ink"], ["Finish one task", "✅", "Work", "emerald"],
  ["Take a screen break", "⏱️", "Digital", "stone"], ["Declutter files", "🗂️", "Digital", "stone"], ["Check calendar", "📅", "Work", "slate"], ["Track spending", "💰", "Money", "amber"],
  ["Save money", "🏦", "Money", "emerald"], ["Avoid impulse buying", "🛒", "Money", "stone"], ["Cook a meal", "🧑‍🍳", "Home", "amber"], ["Help someone", "❤️", "Social", "rose"],
  ["Talk to family", "👥", "Social", "rose"], ["Message a friend", "💬", "Social", "blue"], ["Be outside", "🌿", "Wellbeing", "emerald"], ["Practice gratitude", "⭐", "Wellbeing", "amber"],
  ["Quiet time", "☕", "Wellbeing", "stone"], ["Tea break", "🍵", "Wellbeing", "emerald"], ["Reflect on the day", "💡", "Wellbeing", "amber"], ["Prepare tomorrow", "🗺️", "Wellbeing", "slate"],
  ["Tidy workspace", "🧹", "Home", "slate"], ["Read before bed", "🌙", "Wellbeing", "blue"], ["Digital sunset", "🔕", "Digital", "stone"], ["Do one brave thing", "🔥", "Growth", "rose"],
];

export const HABIT_CATALOG: HabitCatalogItem[] = rawHabitCatalog.map(([name, emoji, category, color], index) => ({ id: `habit-${index + 1}`, name, emoji, category, color }));

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const lastNDays = (n: number) => {
  const safeN = Number.isInteger(n) && n > 0 && n <= 366 ? n : 7;
  const arr: string[] = [];
  for (let i = safeN - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    arr.push(`${y}-${m}-${day}`);
  }
  return arr;
};

export function computeStreak(history?: string[]): number {
  if (!Array.isArray(history) || history.length === 0) return 0;
  const set = new Set(history);
  const today = todayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;
  let cursor = set.has(today) ? new Date() : set.has(yesterday) ? yesterdayDate : null;
  if (!cursor) return 0;
  let streak = 0;
  while (cursor && streak <= set.size) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!set.has(key)) break;
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const XP_PER_HABIT = 10;
export const XP_PER_FOCUS = 25;
export const XP_PER_OUTSTAND = 20;

export function calculateLocalXp(habits: Habit[], sessions: FocusSession[], outstand: OutstandCompletion[]): number {
  const habitCompletions = habits.reduce((sum, habit) => sum + (Array.isArray(habit.history) ? new Set(habit.history).size : 0), 0);
  const completedFocusSessions = sessions.reduce((sum, session) => sum + (session.completed && Number.isFinite(session.durationMin) && session.durationMin > 0 ? 1 : 0), 0);
  const outstandXp = outstand.reduce((sum, completion) => sum + (Number.isFinite(completion.xp) ? Math.max(0, completion.xp) : 0), 0);
  return habitCompletions * XP_PER_HABIT + completedFocusSessions * XP_PER_FOCUS + outstandXp;
}

export function levelFromXP(xp = 0) {
  const safeXp = Number.isFinite(xp) && xp >= 0 ? xp : 0;
  const a = 25;
  const b = 75;
  const c = -safeXp;
  const discriminant = b * b - 4 * a * c;
  const root = (-b + Math.sqrt(discriminant)) / (2 * a);
  const levelsCompleted = Math.max(0, Math.floor(root));
  const cumulativeXp = (n: number) => 100 * n + 25 * n * (n - 1);
  let completed = levelsCompleted;
  while (cumulativeXp(completed + 1) <= safeXp) completed += 1;
  while (completed > 0 && cumulativeXp(completed) > safeXp) completed -= 1;
  const level = completed + 1;
  const into = safeXp - cumulativeXp(completed);
  const need = 100 + (level - 1) * 50;
  return { level, into, need, progressPct: need > 0 ? Math.min(100, (into / need) * 100) : 0 };
}
