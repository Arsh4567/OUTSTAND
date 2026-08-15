import { useEffect, useState } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { Focus, LayoutDashboard, UserCircle, Target, BarChart3 } from "lucide-react";

const actions = [
  { id: "dashboard", label: "Open dashboard", to: "/", icon: LayoutDashboard },
  { id: "focus", label: "Enter focus mode", to: "/focus", icon: Focus },
  { id: "outstand", label: "Open Outstand challenges", to: "/outstand", icon: Target },
  { id: "profile", label: "Open profile", to: "/profile", icon: UserCircle },
  { id: "dopamine", label: "Open dopamine insights", to: "/dopamine", icon: BarChart3 },
] as const;

export function QuickActions() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[80] hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/75 px-3.5 py-2.5 text-xs font-semibold text-slate-300 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-white/20 hover:bg-slate-900 sm:flex"
        aria-label="Open quick actions"
      >
        <Command className="h-3.5 w-3.5 text-cyan-300" />
        <span>Quick actions</span>
        <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Quick actions" description="Jump anywhere in Outstand without leaving your keyboard.">
        <Command>
          <CommandInput placeholder="Search Outstand..." />
          <CommandList>
            <CommandEmpty>No action found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem key={action.id} value={action.label} onSelect={() => run(action.to)}>
                    <Icon className="mr-2 h-4 w-4 text-cyan-300" />
                    <span>{action.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
