import { useMemo, useState } from "react";
import { Check, Flame, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeStreak, lastNDays, todayISO, type Habit } from "@/lib/habits";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: "primary", swatch: "bg-primary" },
  { name: "accent", swatch: "bg-accent" },
  { name: "success", swatch: "bg-success" },
  { name: "warning", swatch: "bg-warning" },
];

const EMOJIS = ["📚", "🧠", "🏃", "📵", "💧", "🧘", "✍️", "🎯", "🌙", "☀️", "💪", "🎧"];

const colorClasses: Record<string, { ring: string; bg: string; text: string }> = {
  primary: { ring: "ring-primary/40", bg: "bg-primary", text: "text-primary" },
  accent: { ring: "ring-accent/40", bg: "bg-accent", text: "text-accent" },
  success: { ring: "ring-success/40", bg: "bg-success", text: "text-success" },
  warning: { ring: "ring-warning/40", bg: "bg-warning", text: "text-warning" },
};

export function HabitCard({
  habit,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  onToggle: () => void;
  onEdit: (data: { name: string; emoji: string; color: string }) => void;
  onDelete: () => void;
}) {
  const today = todayISO();
  const done = habit.history.includes(today);
  const streak = useMemo(() => computeStreak(habit.history), [habit.history]);
  const week = useMemo(() => lastNDays(7), []);
  const setHistory = useMemo(() => new Set(habit.history), [habit.history]);
  const c = colorClasses[habit.color] ?? colorClasses.primary;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(habit.name);
  const [emoji, setEmoji] = useState(habit.emoji);
  const [color, setColor] = useState(habit.color);

  return (
    <div className="glass-card group relative flex flex-col gap-4 p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ring-2",
              c.ring,
              "bg-secondary/60",
            )}
          >
            {habit.emoji}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{habit.name}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className={cn("h-3.5 w-3.5", c.text)} />
              <span>{streak} day streak</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {week.map((d) => {
          const isDone = setHistory.has(d);
          const isToday = d === today;
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-6 w-full rounded-md transition-colors",
                  isDone ? c.bg : "bg-secondary/50",
                  isToday && "ring-2 ring-ring/50",
                )}
              />
              <span className="text-[10px] text-muted-foreground">
                {new Date(d).toLocaleDateString(undefined, { weekday: "narrow" })}
              </span>
            </div>
          );
        })}
      </div>

      <Button
        onClick={onToggle}
        variant={done ? "secondary" : "default"}
        className={cn(
          "w-full justify-center gap-2 transition-all",
          done ? "" : "btn-primary",
        )}
      >
        <Check className={cn("h-4 w-4 transition-transform", done ? "scale-100" : "scale-90")} />
        {done ? "Completed today" : "Mark today"}
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="glass-card border-border/60">
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-md text-lg transition-colors",
                      emoji === e ? "bg-secondary ring-2 ring-ring/60" : "bg-secondary/40 hover:bg-secondary",
                    )}
                    type="button"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((cc) => (
                  <button
                    key={cc.name}
                    onClick={() => setColor(cc.name)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform",
                      cc.swatch,
                      color === cc.name ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/60 scale-110" : "opacity-80",
                    )}
                    type="button"
                    aria-label={cc.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button
              className="btn-primary"
              onClick={() => {
                onEdit({ name: name.trim() || habit.name, emoji, color });
                setEditing(false);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AddHabitDialog({
  onAdd,
  trigger,
}: {
  onAdd: (data: { name: string; emoji: string; color: string }) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState("primary");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-card border-border/60">
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>What will you do daily?</Label>
            <Input
              autoFocus
              placeholder="Read 20 minutes"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  type="button"
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-md text-lg transition-colors",
                    emoji === e ? "bg-secondary ring-2 ring-ring/60" : "bg-secondary/40 hover:bg-secondary",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((cc) => (
                <button
                  key={cc.name}
                  onClick={() => setColor(cc.name)}
                  type="button"
                  aria-label={cc.name}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform",
                    cc.swatch,
                    color === cc.name ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/60 scale-110" : "opacity-80",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="btn-primary"
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ name: name.trim(), emoji, color });
              setName("");
              setEmoji("🎯");
              setColor("primary");
              setOpen(false);
            }}
          >
            Create habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
