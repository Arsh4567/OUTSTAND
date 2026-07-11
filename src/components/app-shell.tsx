import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, Flame, LogOut, Timer, Zap, Brain, User } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: Activity },
  { to: "/dopamine", label: "Dopamine", icon: Brain },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/outstand", label: "Outstand", icon: Zap },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith("/auth");

  if (isAuthRoute) return <Outlet />;

  return <ShellWithChrome />;
}

function ShellWithChrome() {
  const { xp, bestStreak } = useAppState();
  const { user, profile } = useAuth();
  const { level, into, need } = levelFromXP(xp);
  const pct = Math.min(100, Math.round((into / need) * 100));
  const navigate = useNavigate();
  const name = displayNameOf(user, profile);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-[var(--shadow-glow)]">
  <img
    src="/outstand-logo.png"
    alt="Outstand Logo"
    className="h-full w-full object-cover"
  />
</div>

          
            <div className="min-w-0">
  <div className="truncate font-display text-lg font-bold tracking-tight">
    Outstand
  </div>

  <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
    Focus • Discipline • Growth
  </div>
</div>

          </Link>

          <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
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

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
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
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold">{level}</span>
              </div>
              <div className="hidden text-xs sm:block">
                <div className="font-semibold">{xp} XP</div>
                <div className="text-muted-foreground">Lv {level}</div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-secondary/40 text-sm font-semibold transition-colors hover:bg-secondary">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{name}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 lg:hidden">
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
        Built to help you Outstand. Stay quiet. Stay consistent.
      </footer>
    </div>
  );
}
