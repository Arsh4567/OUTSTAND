import { createFileRoute } from "@tanstack/react-router";
import { Plus, Sparkles, TrendingUp } from "lucide-react";
import { AddHabitDialog, HabitCard } from "@/components/habit-card";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { quoteOfTheDay } from "@/lib/quotes";
import { todayISO } from "@/lib/habits";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { habits, toggleToday, addHabit, updateHabit, deleteHabit, xp, bestStreak } = useAppState();
  const today = todayISO();
  const completedToday = habits.filter((h) => h.history.includes(today)).length;
  const total = habits.length;
  const pct = total ? Math.round((completedToday / total) * 100) : 0;
  const q = quoteOfTheDay();

  return (
    <div className="space-y-8">
      <section className="fade-up glass-card relative overflow-hidden p-6 md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">
              Small reps.{" "}
              <span className="gradient-text">Real momentum.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              "{q.text}" <span className="opacity-70">— {q.author}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Today" value={`${completedToday}/${total}`} sub={`${pct}% done`} />
            <Stat label="Streak" value={String(bestStreak)} sub="best active" />
            <Stat label="XP" value={String(xp)} sub="all-time" />
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold md:text-2xl">Today's habits</h2>
            <p className="text-sm text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
              Tap a card to mark it complete. Consistency compounds.
            </p>
          </div>
          <AddHabitDialog
            onAdd={(d) => {
              addHabit(d);
              toast.success("Habit added", { description: d.name });
            }}
            trigger={
              <Button className="btn-primary shrink-0 gap-2">
                <Plus className="h-4 w-4" /> New habit
              </Button>
            }
          />
        </div>

        {habits.length === 0 ? (
          <div className="glass-card mt-6 grid place-items-center p-12 text-center">
            <div className="text-4xl">🌱</div>
            <p className="mt-3 font-medium">No habits yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first daily habit to start a streak.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {habits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={() => {
                  toggleToday(h.id);
                }}
                onEdit={(data) => {
                  updateHabit(h.id, data);
                  toast.success("Habit updated");
                }}
                onDelete={() => {
                  deleteHabit(h.id);
                  toast("Habit removed");
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
