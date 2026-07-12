 
import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Sparkles, TrendingUp, Timer, Zap, Brain, ArrowRight, Play, RefreshCcw, User } from "lucide-react";
import { toast } from "sonner";

// Components
import { AddHabitDialog, HabitCard } from "@/components/habit-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Hooks & Libs
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";
import { todayISO } from "@/lib/habits";
import { dailyChallenge } from "@/lib/challenges";
import { scoreColor } from "@/lib/dopamine";

export const Route = createFileRoute("/_authenticated/dashboard")({
  
  component: Dashboard,
});

function Dashboard() {
  const { habits, toggleToday, addHabit, updateHabit, deleteHabit, xp, bestStreak } = useAppState();
  const { user, profile } = useAuth();
  const { log } = useDailyLog();
  const navigate = useNavigate();

  const today = todayISO();
  const name = displayNameOf(user, profile);

  // Memoized calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    const completed = habits.filter((h) => h.history.includes(today)).length;
    const total = habits.length;
    return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0 };
  }, [habits, today]);

  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const challenge = dailyChallenge(today);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500 space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-indigo-400">{name}.</span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
  {stats.pct >= 80 
    ? "You're on a roll! Keep that momentum going." 
    : "Let's turn your intentions into action today."}
</p>
          
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={() => navigate({ to: "/dopamine" })}>Log Dopamine</Button>
           <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={() => navigate({ to: "/focus" })}>
             <Play className="mr-2 h-4 w-4" /> Start Focus
           </Button>
        </div>
      </header>

      {/* Hero Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value={`${stats.completed}/${stats.total}`} sub={`${stats.pct}% Complete`} />
        <StatCard label="Streak" value={String(bestStreak)} sub="Best active" />
        <StatCard label="Total XP" value={String(xp)} sub="Lifetime growth" />
        <StatCard label="Dopamine" value={String(score)} sub={color.label} accent={color.hex} />
      </section>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Today's Habits</h2>
            <AddHabitDialog
              onAdd={(d) => { addHabit(d); toast.success("Habit created"); }}
              trigger={<Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Habit</Button>}
            />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
          {/* Only show the first 3 habits, or add a "View All" link if there are more */}
{habits.slice(0, 3).map((h) => (
  <HabitCard 
    key={h.id} 
    habit={h} 
    onToggle={() => toggleToday(h.id)} 
    onEdit={(d) => updateHabit(h.id, d)} 
    onDelete={() => deleteHabit(h.id)} 
  />
))}

{habits.length > 3 && (
  <Button variant="ghost" className="w-full text-slate-400" onClick={() => navigate({ to: "/habits" })}>
    View all {habits.length} habits →
  </Button>
)}
          
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl">
             <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                <Zap className="h-4 w-4" /> Daily Challenge
             </div>
             <h3 className="text-lg font-bold">{challenge.title}</h3>
             <p className="text-sm text-slate-400 my-3">{challenge.description}</p>
             <Button className="w-full" variant="secondary" onClick={() => navigate({ to: "/outstand" })}>View Challenge</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <Card className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-colors">
      <CardContent className="p-5">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</div>
        <div className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</div>
        <div className="text-xs text-slate-400">{sub}</div>
      </CardContent>
    </Card>
  );
}
