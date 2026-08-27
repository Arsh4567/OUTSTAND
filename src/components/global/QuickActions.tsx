import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CheckSquare2,
  Command as CommandIcon,
  Focus,
  LayoutDashboard,
  Map,
  MessageSquare,
  Search,
  Settings2,
  Sparkles,
  Target,
  Trophy,
  UserCircle,
  Users,
  WandSparkles,
} from "lucide-react";

const navigationActions = [
  { id: "dashboard", label: "Open dashboard", to: "/dashboard", icon: LayoutDashboard, keywords: "home overview today" },
  { id: "roadmap", label: "Open roadmap", to: "/roadmap", icon: Map, keywords: "plans goals milestones" },
  { id: "focus", label: "Enter focus mode", to: "/focus", icon: Focus, keywords: "timer deep work" },
  { id: "habits", label: "Manage habits", to: "/habits", icon: CheckSquare2, keywords: "routine streak daily" },
  { id: "outstand", label: "Open Outstand challenges", to: "/outstand", icon: Target, keywords: "challenge xp goals" },
  { id: "intelligence", label: "Open intelligence", to: "/intelligence", icon: Sparkles, keywords: "ai insights analysis" },
  { id: "dopamine", label: "Open dopamine insights", to: "/dopamine", icon: BarChart3, keywords: "analytics attention trends" },
  { id: "league", label: "Open leaderboard", to: "/league", icon: Trophy, keywords: "ranking competition xp" },
  { id: "friends", label: "Open friends", to: "/friends", icon: Users, keywords: "social people" },
  { id: "chat", label: "Open chat", to: "/chat", icon: MessageSquare, keywords: "messages ai intelligence" },
  { id: "profile", label: "Open profile", to: "/profile", icon: UserCircle, keywords: "account me" },
] as const;

const operatorActions = [
  { id: "next", label: "Ask AI: What should I do next?", prompt: "What should I do next?", icon: WandSparkles, keywords: "ai next action task" },
  { id: "focus-plan", label: "Ask AI: Build a focus plan", prompt: "Make me a focus plan", icon: WandSparkles, keywords: "ai focus deep work" },
  { id: "status", label: "Ask AI: How am I doing?", prompt: "How is my progress today?", icon: WandSparkles, keywords: "ai status progress" },
  { id: "recovery", label: "Ask AI: Check recovery", prompt: "Am I falling behind? Check my recovery plan.", icon: WandSparkles, keywords: "ai recovery behind reset" },
] as const;

const utilityActions = [
  { id: "settings", label: "Open settings", to: "/settings", icon: Settings2, keywords: "preferences theme account" },
  { id: "search", label: "Search OUTSTAND", to: "/dashboard", icon: Search, keywords: "find search" },
] as const;

export function QuickActions() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement)?.isContentEditable) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement)?.isContentEditable) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = useMemo(() => [
    { heading: "AI operator", actions: operatorActions },
    { heading: "Workspace", actions: navigationActions },
    { heading: "System", actions: utilityActions },
  ], []);

  const run = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const askAi = (prompt: string) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("outstand:open-ai", { detail: { prompt } }));
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[80] hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/75 px-3.5 py-2.5 text-xs font-semibold text-slate-300 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-white/20 hover:bg-slate-900 sm:flex" aria-label="Open quick actions">
        <CommandIcon className="h-3.5 w-3.5 text-cyan-300" /><span>Command center</span><kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command center" description="Navigate OUTSTAND or ask the intelligence layer to help with your next move.">
        <Command>
          <CommandInput autoFocus placeholder="Search pages, actions, or ask AI..." />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            {groups.map((group, index) => (
              <div key={group.heading}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={group.heading}>
                  {group.actions.map((action) => {
                    const Icon = action.icon;
                    if ("prompt" in action) {
                      return <CommandItem key={action.id} value={`${action.label} ${action.keywords}`} onSelect={() => askAi(action.prompt)}><Icon className="mr-2 h-4 w-4 text-cyan-300" /><span className="flex-1">{action.label}</span><span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/60">Ask</span></CommandItem>;
                    }
                    const active = pathname === action.to || (action.to !== "/dashboard" && pathname.startsWith(action.to));
                    return <CommandItem key={action.id} value={`${action.label} ${action.keywords}`} onSelect={() => run(action.to)}><Icon className="mr-2 h-4 w-4 text-cyan-300" /><span className="flex-1">{action.label}</span>{active ? <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/60">Open</span> : null}</CommandItem>;
                  })}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
