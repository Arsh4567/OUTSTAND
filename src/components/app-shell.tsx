import { Link, Outlet } from "@tanstack/react-router";
import { Activity, Flame, Sparkles, Timer, Trophy, Zap } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: Activity },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/quiet", label: "Quiet", icon: Sparkles },
  { to: "/stats", label: "Stats", icon: Trophy },
  { to: "/outstand", label: "Outstand", icon: Zap },
] as const;

export function AppShell() {
  const { xp, bestStreak } = useAppState();
  const { level, into, need } = levelFromXP(xp);
  const pct = Math.min(100, Math.round((into / need) * 100));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold tracking-tight">
                Ember
              </div>
              <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Habits for students
              </div>
            </div>
          </Link>

          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="group rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
                activeProps={{ "data-status": "active" }}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 sm:flex">
              <Flame className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">{bestStreak}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5">
              <div className="relative h-6 w-6">
                <svg viewBox="0 0 36 36" className="h-6 w-6 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="url(#lvl)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                  />
                  <defs>
                    <linearGradient id="lvl" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.16 245)" />
                      <stop offset="100%" stopColor="oklch(0.72 0.18 285)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold">
                  {level}
                </span>
              </div>
              <div className="text-xs">
                <div className="font-semibold">{xp} XP</div>
                <div className="text-muted-foreground">Lv {level}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors",
                "data-[status=active]:bg-secondary data-[status=active]:text-foreground",
              )}
              activeProps={{ "data-status": "active" }}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Built for students who want to Outstand. Stay quiet. Stay consistent.
      </footer>
    </div>
  );
}
