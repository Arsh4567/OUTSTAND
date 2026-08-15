import { useMemo, useState } from "react";
import { Flame, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  { name: "primary", swatch: "bg-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]" },
  { name: "accent", swatch: "bg-indigo-500", glow: "shadow-[0_0_15px_rgba(99,102,241,0.5)]" },
  { name: "success", swatch: "bg-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]" },
  { name: "warning", swatch: "bg-rose-500", glow: "shadow-[0_0_15px_rgba(244,63,94,0.5)]" },
];

const EMOJIS = ["📚", "🧠", "🏃", "📵", "💧", "🧘", "✍️", "🎯", "🌙", "☀️", "💪", "🎧"];

const colorClasses: Record<string, { ring: string; bg: string; text: string; lightBg: string; border: string }> = {
  primary: { ring: "ring-blue-500/40", bg: "bg-blue-500", text: "text-blue-400", lightBg: "bg-blue-500/10", border: "border-blue-400" },
  accent: { ring: "ring-indigo-500/40", bg: "bg-indigo-500", text: "text-indigo-400", lightBg: "bg-indigo-500/10", border: "border-indigo-400" },
  success: { ring: "ring-emerald-500/40", bg: "bg-emerald-500", text: "text-emerald-400", lightBg: "bg-emerald-500/10", border: "border-emerald-400" },
  warning: { ring: "ring-rose-500/40", bg: "bg-rose-500", text: "text-rose-400", lightBg: "bg-rose-500/10", border: "border-rose-400" },
};

// Premium Easing for Card
const cardSpring = { type: "spring" as const, stiffness: 300, damping: 20 };
// Hyper-responsive Easing for Tactile Button
const tactileSpring = { type: "spring" as const, stiffness: 500, damping: 15 };

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

  // If streak is 3 or more, the card ignites
  const isOnFire = streak >= 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={cardSpring}
      className={cn(
        "glass-card group relative flex flex-col gap-5 p-6 transition-colors duration-500",
        isOnFire ? "animate-neon-breathe border-[1.5px]" : "border border-white/5 bg-slate-900/40 hover:bg-slate-900/60",
        isOnFire && (habit.color === 'success' ? 'border-emerald-500/40' : habit.color === 'warning' ? 'border-rose-500/40' : habit.color === 'accent' ? 'border-indigo-500/40' : 'border-blue-500/40'),
        done && "bg-slate-900/20 opacity-80 hover:opacity-100"
      )}
    >
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex min-w-0 items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-inner border transition-all duration-500",
              c.lightBg,
              done ? "border-white/5 opacity-50 grayscale" : "border-white/10"
            )}
          >
            {habit.emoji}
          </motion.div>
          <div className="min-w-0">
            <h3 className={cn(
              "truncate font-display text-lg font-bold tracking-tight transition-colors duration-500",
              done ? "text-slate-400 line-through decoration-slate-600/50" : "text-white"
            )}>
              {habit.name}
            </h3>
            
            {/* Frosted Glass Streak Pill */}
            <div className={cn(
              "mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm backdrop-blur-md transition-all duration-500",
              done ? "bg-white/[0.02] border-white/5 text-slate-500" : "bg-white/5 border-white/10 text-slate-300"
            )}>
              <Flame className={cn("h-3.5 w-3.5", isOnFire && !done ? c.text : "text-slate-500")} />
              <span>{streak} Streak</span>
            </div>
          </div>
        </div>

        {/* Hover Controls */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-400 bg-white/5 rounded-xl hover:bg-rose-500/10" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 7-Day Mini Chart Visualizer */}
      <div className="flex items-end justify-between gap-2 mt-2 h-10">
        {week.map((d, index) => {
          const isDone = setHistory.has(d);
          const isToday = d === today;
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4, type: "spring" }}
                className={cn(
                  "w-full rounded-md transition-all duration-500 origin-bottom shadow-inner",
                  isDone ? c.bg : "bg-slate-800/50 hover:bg-slate-700/50 border border-white/5",
                  isToday && !isDone && "ring-2 ring-slate-600/50",
                  isDone ? "h-7" : "h-3",
                  isToday && isDone && "animate-pulse"
                )}
              />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider",
                isToday ? "text-white" : "text-slate-600"
              )}>
                {new Date(d).toLocaleDateString(undefined, { weekday: "narrow" })}
              </span>
            </div>
          );
        })}
      </div>

      {/* The Haptic Action Button */}
      <div className="mt-2 w-full relative">
        <motion.div 
          whileTap={{ scale: 0.92, filter: "brightness(0.8)" }} 
          transition={tactileSpring}
        >
          <Button
            onClick={onToggle}
            className={cn(
              "w-full justify-center gap-2 h-12 rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-300 relative overflow-hidden group",
              done 
                ? "bg-slate-900/50 text-slate-400 border border-white/5 shadow-[inset_0_4px_15px_rgba(0,0,0,0.5)] hover:bg-slate-800/50" 
                : "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg border border-white/10 hover:border-white/20 hover:shadow-xl"
            )}
          >
            {/* Visual Indicator of the Color Signature before completion */}
            {!done && (
               <div className={cn("absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300 bg-gradient-to-r", 
                 c.bg === 'bg-blue-500' ? 'from-blue-600 to-indigo-600' :
                 c.bg === 'bg-indigo-500' ? 'from-indigo-600 to-purple-600' :
                 c.bg === 'bg-emerald-500' ? 'from-emerald-600 to-teal-600' :
                 'from-rose-600 to-orange-600'
               )} />
            )}

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center gap-2 z-10"
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    className={c.text}
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                      d="M20 6 9 17l-5-5"
                    />
                  </motion.svg>
                  Momentum Logged
                </motion.div>
              ) : (
                <motion.div
                  key="undone"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 z-10"
                >
                  <CheckCircle2 className="h-5 w-5 opacity-70 group-hover:scale-110 transition-transform" />
                  Mark Complete
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Volumetric Shockwave Burst on Completion */}
        <AnimatePresence>
          {done && (
            <motion.div
              key="shockwave"
              initial={{ scale: 0.9, opacity: 0.8, borderWidth: 8 }}
              animate={{ scale: 1.3, opacity: 0, borderWidth: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn("absolute inset-0 rounded-xl border pointer-events-none z-0", c.border)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="glass-card border-white/10 bg-slate-950/90 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-black text-white">Refine Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-slate-400 font-bold uppercase tracking-wider text-xs">Directive Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="bg-slate-900 border-white/10 text-white h-12 rounded-xl focus-visible:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 font-bold uppercase tracking-wider text-xs">Identifier (Emoji)</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-xl text-2xl transition-all",
                      emoji === e ? "bg-indigo-500/20 ring-2 ring-indigo-500 shadow-inner" : "bg-slate-900/50 hover:bg-slate-800 border border-white/5"
                    )}
                    type="button"
                  >
                    {e}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 font-bold uppercase tracking-wider text-xs">Vector Color</Label>
              <div className="flex gap-4">
                {COLORS.map((cc) => (
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    key={cc.name}
                    onClick={() => setColor(cc.name)}
                    className={cn(
                      "h-10 w-10 rounded-full transition-all border-2",
                      cc.swatch,
                      color === cc.name ? `border-white scale-110 ${cc.glow}` : "border-transparent opacity-50"
                    )}
                    type="button"
                    aria-label={cc.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl text-slate-400" onClick={() => setEditing(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-white text-black hover:bg-slate-200 font-bold"
              onClick={() => {
                onEdit({ name: name.trim() || habit.name, emoji, color });
                setEditing(false);
              }}
            >
              Sync Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
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
      <DialogContent className="glass-card border-white/10 bg-slate-950/90 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-black text-white">Initialize New Protocol</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-slate-400 font-bold uppercase tracking-wider text-xs">Target Action</Label>
            <Input
              autoFocus
              placeholder="e.g. Read 20 pages"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900 border-white/10 text-white h-12 rounded-xl focus-visible:ring-indigo-500/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 font-bold uppercase tracking-wider text-xs">Visual Anchor</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  key={e}
                  onClick={() => setEmoji(e)}
                  type="button"
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl text-2xl transition-all",
                    emoji === e ? "bg-indigo-500/20 ring-2 ring-indigo-500 shadow-inner" : "bg-slate-900/50 hover:bg-slate-800 border border-white/5"
                  )}
                >
                  {e}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 font-bold uppercase tracking-wider text-xs">Energy Signature</Label>
            <div className="flex gap-4">
              {COLORS.map((cc) => (
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  key={cc.name}
                  onClick={() => setColor(cc.name)}
                  type="button"
                  aria-label={cc.name}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all border-2",
                    cc.swatch,
                    color === cc.name ? `border-white scale-110 ${cc.glow}` : "border-transparent opacity-50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="rounded-xl text-slate-400" onClick={() => setOpen(false)}>Abort</Button>
          <Button
            disabled={!name.trim()}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-blue-400/30"
            onClick={() => {
              onAdd({ name: name.trim(), emoji, color });
              setName("");
              setEmoji("🎯");
              setColor("primary");
              setOpen(false);
            }}
          >
            Deploy Habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
        }
                
